/* BlockDAG Strike Frontend (USDT-only) 
   Supports MetaMask (window.ethereum) and WalletConnect (Web3Modal).
   CONFIG: replace contract addresses & backend URL.
*/

const CONFIG = {
  TREASURY_ADDRESS: "REPLACE_TREASURY_ADDRESS",
  NFT_ADDRESS: "REPLACE_NFT_ADDRESS",
  SHOP_ADDRESS: "REPLACE_SHOP_ADDRESS",
  USDT_ADDRESS: "REPLACE_USDT_ADDRESS", // USDT ERC20 address (6 decimals commonly)
  BACKEND_URL: "" // set if backend hosted separately
};

// ABIs (minimal)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const TREASURY_ABI = [
  "function playFee() view returns (uint256)",
  "function collectPlayFee(address payer) external"
];
const NFT_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "function tokenURI(uint256 tokenId) external view returns (string)"
];
const SHOP_ABI = [
  "function redeemNFT(uint256 tokenId) external"
];

// UI
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelSpan = document.getElementById('level');
const killsSpan = document.getElementById('kills');
const healthSpan = document.getElementById('health');
const magSpan = document.getElementById('mag');
const grenadeCountSpan = document.getElementById('grenadeCount');
const connectBtn = document.getElementById('connect');
const wcConnectBtn = document.getElementById('wcConnect');
const approveBtn = document.getElementById('approveToken');
const buyRunBtn = document.getElementById('buyRun');

let provider=null, web3Provider=null, signer=null, account=null;
let treasuryContract=null, usdtContract=null, nftContract=null, shopContract=null;

// WalletConnect/Web3Modal setup
const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider.default,
    options: {
      rpc: {  // user should set RPC mapping if needed, but Web3Modal will show QR for mobile wallets
        1: "https://mainnet.infura.io/v3/",
      }
    }
  }
};
const web3Modal = new window.Web3Modal.default({ cacheProvider: false, providerOptions });

// Game state (same mechanics)
let level=1, kills=0, health=100, mag=8, maxMag=8, grenades=2, enemies=[], isPlaying=false;
let spawnInterval=1200;

class Enemy { constructor(x,y,dist,hp=1){ this.x=x; this.y=y; this.dist=dist; this.hp=hp; this.w=40; this.h=60; } draw(){ ctx.fillStyle='rgba(200,30,30,0.95)'; ctx.fillRect(this.x,this.y,this.w,this.h); } hit(){ this.hp--; return this.hp<=0; } }
const bg = new Image(); bg.src='assets/station_bg.jpg'; bg.onload=()=>draw();
function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(bg,0,0,canvas.width,canvas.height); ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,canvas.height-120,canvas.width,120); enemies.forEach(e=>e.draw()); requestAnimationFrame(()=>{}); }
function spawnEnemy(){ const distances=[10,15,30]; const d=distances[Math.floor(Math.random()*distances.length)]; let x=50+(d===10?Math.random()*200:d===15?200+Math.random()*300:520+Math.random()*300); let y=canvas.height-180-Math.random()*80; let hp=(level>=5 && Math.random()<0.2)?2:1; enemies.push(new Enemy(x,y,d,hp)); }
function gameTick(){ if(!isPlaying) return; if(level<=2){ if(enemies.length<1) spawnEnemy(); } else if(level<=4){ if(enemies.length<4) spawnEnemy(); } else { if(enemies.length<6) spawnEnemy(); } if(Math.random()<0.02){ health -= 2+level; if(health<=0){ gameOver(); return; } } updateHud(); setTimeout(gameTick, Math.max(200, spawnInterval - level*100)); }
function updateHud(){ levelSpan.textContent=level; killsSpan.textContent=kills; healthSpan.textContent=Math.max(0,health.toFixed(0)); magSpan.textContent=mag; grenadeCountSpan.textContent=grenades; }
canvas.addEventListener('pointerdown',(ev)=>{ const rect=canvas.getBoundingClientRect(); const x=ev.clientX-rect.left; const y=ev.clientY-rect.top; if(mag<=0) return; mag--; for(let i=0;i<enemies.length;i++){ const e=enemies[i]; if(Math.abs(e.x-x)<60 && Math.abs(e.y-y)<60){ const dead=e.hit(); if(dead){ enemies.splice(i,1); kills++; onKill(); } break; } } updateHud(); });
document.getElementById('grenade').addEventListener('click', ()=>{ if(grenades<=0) return; grenades--; const centerX=canvas.width/2; const killed = enemies.filter(e=>Math.abs(e.x-centerX)<180).slice(0,3); killed.forEach(k=>{ const idx=enemies.indexOf(k); if(idx>=0) enemies.splice(idx,1); kills++; onKill(); }); updateHud(); });
document.getElementById('reload').addEventListener('click', ()=>{ mag=maxMag; updateHud(); });
function onKill(){ if(level<=4){ const needed = level<=2?50:100; if(kills>=needed){ level++; enemies=[]; mag=maxMag; grenades=2; health=100; updateHud(); if(level>5){ isPlaying=false; alert('Run complete! Sending proof to backend...'); notifyRunComplete(); } } } else { if(kills>100){ isPlaying=false; alert('Unbeatable on Round 5 reached.'); gameOver(); } } }
function gameOver(){ isPlaying=false; alert('You died. Run over.'); }

// Wallet functions (MetaMask)
connectBtn.addEventListener('click', async ()=>{
  try {
    if(window.ethereum){
      web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      signer = web3Provider.getSigner();
      account = await signer.getAddress();
      document.getElementById('account').textContent = account;
      connectBtn.textContent = 'Connected';
      initContracts();
    } else {
      alert('MetaMask not found. Use WalletConnect or a compatible wallet.');
    }
  } catch(e){ console.error(e); alert('Wallet connect failed: '+e.message); }
});

// WalletConnect connect
wcConnectBtn.addEventListener('click', async ()=>{
  try {
    const externalProvider = await web3Modal.connect();
    web3Provider = new ethers.providers.Web3Provider(externalProvider);
    signer = web3Provider.getSigner();
    account = await signer.getAddress();
    document.getElementById('account').textContent = account;
    connectBtn.textContent = 'Connected (WalletConnect)';
    initContracts();
  } catch(e){ console.error(e); alert('WalletConnect failed: '+e.message); }
});

function initContracts(){
  if(CONFIG.TREASURY_ADDRESS !== 'REPLACE_TREASURY_ADDRESS'){
    treasuryContract = new ethers.Contract(CONFIG.TREASURY_ADDRESS, TREASURY_ABI, signer);
    usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, ERC20_ABI, signer);
    approveBtn.style.display='inline-block';
  }
  if(CONFIG.NFT_ADDRESS !== 'REPLACE_NFT_ADDRESS') nftContract = new ethers.Contract(CONFIG.NFT_ADDRESS, NFT_ABI, signer);
  if(CONFIG.SHOP_ADDRESS !== 'REPLACE_SHOP_ADDRESS') shopContract = new ethers.Contract(CONFIG.SHOP_ADDRESS, SHOP_ABI, signer);
}

// Approve USDT for treasury (plays)
approveBtn.addEventListener('click', async ()=>{
  try {
    // USDT often uses 6 decimals; frontend will query decimals
    const decimals = await usdtContract.decimals();
    const fee = await treasuryContract.playFee(); // on-chain value already in USDT token units
    const tx = await usdtContract.approve(CONFIG.TREASURY_ADDRESS, fee);
    await tx.wait();
    alert('Approved USDT allowance to treasury.');
  } catch(e){ console.error(e); alert('Approve failed: '+e.message); }
});

buyRunBtn.addEventListener('click', async ()=>{
  if(!isPlaying){
    try {
      if(treasuryContract){
        const tx = await treasuryContract.collectPlayFee(account);
        await tx.wait();
        console.log('Play fee collected on-chain');
      }
    } catch(e){ console.error(e); alert('Payment failed: '+e.message); return; }
    isPlaying=true; kills=0; level=1; health=100; mag=maxMag; grenades=2; enemies=[]; updateHud(); gameTick();
  }
});

// Notify backend with signed payload
async function notifyRunComplete(){
  try {
    const payload = { player: account, kills: kills, levelsCompleted: 5, timestamp: Date.now() };
    const signature = await signer.signMessage(JSON.stringify(payload));
    const url = CONFIG.BACKEND_URL || '';
    const resp = await fetch((url?url:'') + '/api/run-complete', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...payload, signature}) });
    const data = await resp.json();
    alert('Backend response: ' + (data.message || JSON.stringify(data)));
  } catch(e){ console.error(e); alert('Failed to notify backend: '+e.message); }
}

// Sample shop items (prices in USDT)
const items = [
  {id:'rifle1', name:'Rifle Lvl1', priceUSDT:0.5},
  {id:'armor1', name:'Body Armour Lvl1', priceUSDT:0.75},
  {id:'grenade', name:'Grenade Pack', priceUSDT:0.5}
];
const itemsEl = document.getElementById('items');
items.forEach(it=>{
  const li = document.createElement('li');
  li.innerHTML = `<strong>${it.name}</strong> - ${it.priceUSDT.toFixed(2)} USDT <button data-id="${it.id}">Buy</button>`;
  itemsEl.appendChild(li);
});

// placeholder for NFTs
const nftsEl = document.getElementById('nfts');
function addNFTStub(i){ const li=document.createElement('li'); li.textContent = `Military NFT #${i} (shop credit: $${(1 + i*0.5).toFixed(2)} USDT)`; nftsEl.appendChild(li); }
addNFTStub(1);
