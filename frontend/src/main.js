import PlayScene from './game/PlayScene.js'
import { Wallet } from './web3/wallet.js'

window.addEventListener('load', async () => {
  document.getElementById('btnPlay').addEventListener('click', ()=> startPlay())
  document.getElementById('btnShop').addEventListener('click', ()=> openShop())
  document.getElementById('btnLeaderboard').addEventListener('click', ()=> openLeaderboard())
  document.getElementById('connectWallet').addEventListener('click', async ()=>{
    await Wallet.connect()
    document.getElementById('walletAddress').textContent = Wallet.address || ''
  })

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: Math.min(window.innerWidth, 1280),
    height: Math.min(window.innerHeight - 112, 720),
    backgroundColor: '#000000',
    scene: [PlayScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  }

  window.game = new Phaser.Game(config)
})

function startPlay(){
  const scene = window.game.scene.getScene('default') || window.game.scene.keys['default']
  if(scene && scene.startRun) scene.startRun()
}

function openShop(){
  const scene = window.game.scene.getScene('default') || window.game.scene.keys['default']
  if(scene && scene.openShop) scene.openShop()
}

function openLeaderboard(){
  alert('Leaderboard - coming soon')
}
