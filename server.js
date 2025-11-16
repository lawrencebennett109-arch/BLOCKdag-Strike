require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { ethers } = require('ethers');
const { Low, JSONFile } = require('lowdb');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

const adapter = new JSONFile('db.json');
const db = new Low(adapter);

async function init(){ await db.read(); db.data = db.data || { sessions: [], leaderboard: {} }; await db.write(); }
init();

const RPC = process.env.BLOCKDAG_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;

let provider = RPC ? new ethers.providers.JsonRpcProvider(RPC) : null;
let ownerSigner = provider && PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

// Verify signed payload
async function verifySignature(address, payload, signature){
  try {
    const message = JSON.stringify(payload);
    const signer = ethers.utils.verifyMessage(message, signature);
    return signer.toLowerCase() === address.toLowerCase();
  } catch(e){ return false; }
}

// Players submit signed run proof
app.post('/api/run-complete', async (req,res)=>{
  const { player, kills, levelsCompleted, timestamp, signature } = req.body;
  if(!player || typeof kills !== 'number' || !signature) return res.status(400).json({error:'invalid payload'});
  const payload = { player, kills, levelsCompleted, timestamp };
  const ok = await verifySignature(player, payload, signature);
  if(!ok) return res.status(400).json({ error:'signature invalid' });
  await db.read();
  db.data.sessions.push(payload);
  const monthKey = new Date(timestamp).toISOString().slice(0,7);
  db.data.leaderboard[monthKey] = db.data.leaderboard[monthKey] || {};
  db.data.leaderboard[monthKey][player] = (db.data.leaderboard[monthKey][player] || 0) + kills;
  await db.write();
  res.json({ message:'run recorded' });
});

// Get leaderboard for month (YYYY-MM)
app.get('/api/leaderboard/:month', async (req,res)=>{
  await db.read();
  const board = db.data.leaderboard[req.params.month] || {};
  const arr = Object.entries(board).map(([addr,k])=>({address:addr,kills:k})).sort((a,b)=>b.kills-a.kills);
  res.json(arr);
});

// Admin distribution - protected by simple admin token for prototype (set ADMIN_TOKEN in .env)
app.post('/api/distribute', async (req,res)=>{
  const adminToken = req.headers['x-admin-token'];
  if(adminToken !== process.env.ADMIN_TOKEN) return res.status(403).json({ error:'forbidden' });
  if(!ownerSigner) return res.status(500).json({ error:'no provider configured' });
  const { winners, amountsUSDT } = req.body;
  // amountsUSDT: array of numbers in USDT (e.g., 100, 50) - convert to token units (6 decimals)
  try {
    const treasuryAbi = [ 'function distributeRewards(address[] calldata winners, uint256[] calldata amounts, uint256 monthlyCap) external' ];
    const treasury = new ethers.Contract(TREASURY_ADDRESS, treasuryAbi, ownerSigner);
    // compute monthly cap: min(300 USDT, 20% of collected fees) - here caller provides monthlyCapUSDT
    const monthlyCapUSDT = req.body.monthlyCapUSDT || 300;
    const monthlyCap = ethers.utils.parseUnits(monthlyCapUSDT.toString(), 6);
    const amounts = amountsUSDT.map(a => ethers.utils.parseUnits(a.toString(), 6));
    const tx = await treasury.distributeRewards(winners, amounts, monthlyCap);
    const receipt = await tx.wait();
    res.json({ message:'distributed', txHash: receipt.transactionHash });
  } catch(e){ console.error(e); res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Backend listening on', PORT));
