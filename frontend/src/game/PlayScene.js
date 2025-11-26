export default class PlayScene extends Phaser.Scene {
  constructor(){ super({ key: 'default' })
    this.round = 1
    this.kills = 0
    this.maxRounds = 5
    this.enemiesAlive = 0
    this.roundConfig = {
      1:{spawnMax:1, count:50, interval:1200},
      2:{spawnMax:1, count:50, interval:1000},
      3:{spawnMax:4, count:100, interval:800},
      4:{spawnMax:4, count:100, interval:600},
      5:{spawnMax:4, count:9999999, interval:450}
    }
    this.totalSpawnedThisRound = 0
  }

  preload(){
    this.load.image('bg','../assets/background_train_station.jpg')
    this.load.image('handgun','../assets/handgun.png')
    this.load.spritesheet('enemy','../assets/enemy_spritesheet.png',{ frameWidth:64, frameHeight:64 })
  }
  create(){
    this.add.image(this.scale.width/2, this.scale.height/2, 'bg').setDisplaySize(this.scale.width, this.scale.height)
    this.createUI()
    this.enemies = this.physics.add.group()
    this.input.on('pointerdown', this.handlePointerDown.bind(this))
    this.showStartRoundUI()
  }

  createUI(){
    const reloadBtn = this.add.text(20,this.scale.height-80,'Reload',{fontSize:'18px', backgroundColor:'#333', padding:8}).setInteractive()
    reloadBtn.on('pointerdown', ()=> { this.reloadWeapon() })
    const gren = this.add.text(140,this.scale.height-80,'Grenade x2',{fontSize:'18px', backgroundColor:'#333', padding:8}).setInteractive()
    gren.on('pointerdown', ()=> { this.throwGrenade() })
    this.hudKills = this.add.text(20,20,'Kills: 0',{fontSize:'20px', color:'#fff'})
    this.hudRound = this.add.text(200,20,'Round: 1',{fontSize:'20px', color:'#fff'})
    // paid run button
    this.paidBtn = document.createElement('button')
    this.paidBtn.innerText = 'Start Paid Run (2 USDT)'
    this.paidBtn.style.position = 'absolute'
    this.paidBtn.style.left = '12px'
    this.paidBtn.style.top = '60px'
    document.body.appendChild(this.paidBtn)
    this.paidBtn.addEventListener('click', ()=> this.startPaidRun())
  }

  showStartRoundUI(){
    const start = this.add.text(this.scale.width/2,this.scale.height/2,'Start Round\nTap to begin',{fontSize:'28px',color:'#fff',align:'center'}).setOrigin(0.5).setInteractive()
    start.on('pointerdown', ()=> {
      start.destroy()
      this.startRound()
    })
  }

  startRound(){
    this.totalSpawnedThisRound = 0
    this.enemiesAlive = 0
    this.roundKills = 0
    this.roundCfg = this.roundConfig[this.round]
    this.hudRound.setText('Round: ' + this.round)
    this.spawnTimer = this.time.addEvent({
      delay: this.roundCfg.interval,
      loop: true,
      callback: this.spawnWave,
      callbackScope: this
    })
  }

  spawnWave(){
    if(this.roundCfg && this.totalSpawnedThisRound >= this.roundCfg.count && this.round < 5){
      this.spawnTimer.remove()
      this.roundComplete()
      return
    }
    let toSpawn = Phaser.Math.Between(1, this.roundCfg.spawnMax)
    for(let i=0;i<toSpawn;i++){
      if(this.roundCfg && this.totalSpawnedThisRound >= this.roundCfg.count && this.round < 5) break
      this.spawnEnemy()
      this.totalSpawnedThisRound++
    }
  }

  spawnEnemy(){
    const zone = Phaser.Math.RND.pick(['near','mid','far'])
    let x,y
    const yBase = this.scale.height/2 + 80
    if(zone==='near'){ x = Phaser.Math.Between(80, this.scale.width-80); y = yBase+120 }
    else if(zone==='mid'){ x = Phaser.Math.Between(80, this.scale.width-80); y = yBase }
    else { x = Phaser.Math.Between(80, this.scale.width-80); y = yBase-120 }
    const e = this.enemies.create(x,y,'enemy')
    e.setInteractive()
    e.hp = 1 + Math.floor(this.round/2)
    e.on('pointerdown', ()=> this.enemyHit(e))
    this.enemiesAlive++
    e.alpha = 0
    this.tweens.add({targets:e,alpha:1,duration:200})
  }

  enemyHit(enemy){
    enemy.destroy()
    this.kills++
    this.roundKills++
    this.enemiesAlive = Math.max(0,this.enemiesAlive-1)
    this.hudKills.setText('Kills: ' + this.kills)
    if(this.round===5 && this.totalSpawnedThisRound > 100){
      // increased difficulty could be applied here
    }
  }

  roundComplete(){
    this.round++
    if(this.round > this.maxRounds){
      this.runComplete()
    } else {
      this.showStartRoundUI()
    }
  }

  runComplete(){
    alert('Run complete! Kills: ' + this.kills)
    this.round = 1
    this.kills = 0
    this.hudKills.setText('Kills: 0')
    this.hudRound.setText('Round: 1')
  }

  handlePointerDown(pointer){
    const enemy = this.enemies.getChildren().find(e => e.getBounds().contains(pointer.x,pointer.y))
    if(enemy) this.enemyHit(enemy)
  }

  reloadWeapon(){ console.log('Reloading...') }
  throwGrenade(){ console.log('Grenade thrown') }

  async startPaidRun(){
    // Payment flow: pay 2 USDT to GameTreasury (frontend triggers token approval + deposit)
    try {
      if(!window.Wallet || !Wallet || !Wallet.signer) { alert('Connect wallet first'); return; }
      // the frontend will call the contract methods; placeholder here
      alert('Simulate payment of 2 USDT to GameTreasury before starting paid run.')
      this.showStartRoundUI()
    } catch(e){ console.error(e); alert('Payment failed') }
  }

  openShop(){ const modal = document.createElement('div'); modal.style.cssText='position:fixed;left:10%;top:10%;width:80%;height:80%;background:#111;color:#fff;padding:16px;z-index:9999;pointer-events:auto;overflow:auto'; modal.innerHTML='<h2>Shop</h2><p>Buy items (USDT)</p><button id="closeShop">Close</button>'; document.body.appendChild(modal); modal.querySelector('#closeShop').addEventListener('click', ()=> modal.remove()) }
}
