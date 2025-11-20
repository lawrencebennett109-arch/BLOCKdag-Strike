// game.js - Enhanced prototype using sprites and cinematic audio (A2 style)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelEl = document.getElementById('level');
const killsEl = document.getElementById('kills');
const healthEl = document.getElementById('health');
const magEl = document.getElementById('mag');
const grenadeCountEl = document.getElementById('grenadeCount');

let level = 1, kills = 0, health = 100, mag = 8, maxMag = 8, grenades = 2, enemies = [], isPlaying = false;
let spawnInterval = 1000;
let spriteImage = new Image(); spriteImage.src = 'assets/soldier_spritesheet.png';
let shootSfx = new Audio('assets/shoot.wav'); let explodeSfx = new Audio('assets/explode.wav'); let music = new Audio('assets/music.wav'); music.loop = true;

class Enemy { constructor(x,y,hp=1,frame=0){ this.x=x; this.y=y; this.hp=hp; this.w=96; this.h=192; this.frame=frame; } draw(){ const fw=256, fh=512; ctx.drawImage(spriteImage, this.frame*fw, 0, fw, fh, this.x, this.y, this.w, this.h); } hit(){ this.hp--; return this.hp<=0; } }

function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); const bg = document.querySelector('.bg-img'); if(bg && bg.complete){ ctx.drawImage(bg,0,0,canvas.width,canvas.height); } else { ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,canvas.width,canvas.height); } enemies.forEach(e=>e.draw()); requestAnimationFrame(()=>{}); }

function spawnEnemy(){ const x = 60 + Math.random()*(canvas.width-160); const y = canvas.height - 260 - Math.random()*40; const frame = Math.floor(Math.random()*8); const hp = (level>=5 && Math.random()<0.25)?2:1; enemies.push(new Enemy(x,y,hp,frame)); }

function gameTick(){ if(!isPlaying) return; if(level<=2){ if(enemies.length<1) spawnEnemy(); } else if(level<=4){ if(enemies.length<4) spawnEnemy(); } else { if(enemies.length<6) spawnEnemy(); } if(Math.random()<0.02){ health -= 2 + level; if(health <= 0){ gameOver(); return; } } updateHud(); setTimeout(gameTick, Math.max(150, spawnInterval - level*100)); }

function updateHud(){ levelEl.textContent = level; killsEl.textContent = kills; healthEl.textContent = Math.max(0, health.toFixed(0)); magEl.textContent = mag; grenadeCountEl.textContent = grenades; }

canvas.addEventListener('pointerdown',(ev)=>{ const rect = canvas.getBoundingClientRect(); const x = ev.clientX - rect.left; const y = ev.clientY - rect.top; if(mag <= 0) return; mag--; shootSfx.currentTime = 0; shootSfx.play(); for(let i=0;i<enemies.length;i++){ const e = enemies[i]; if(Math.abs(e.x - x) < 80 && Math.abs(e.y - y) < 120){ const dead = e.hit(); if(dead){ enemies.splice(i,1); kills++; onKill(); explodeSfx.currentTime = 0; explodeSfx.play(); } break; } } updateHud(); });

document.getElementById('grenade').addEventListener('click', ()=>{ if(grenades <= 0) return; grenades--; const centerX = canvas.width/2; const killed = enemies.filter(e=>Math.abs(e.x - centerX) < 220).slice(0,4); killed.forEach(k=>{ const idx = enemies.indexOf(k); if(idx >= 0) enemies.splice(idx,1); kills++; onKill(); }); updateHud(); });

document.getElementById('reload').addEventListener('click', ()=>{ mag = maxMag; updateHud(); });

function onKill(){ if(level <= 4){ const needed = level <= 2 ? 50 : 100; if(kills >= needed){ level++; enemies = []; mag = maxMag; grenades = 2; health = 100; updateHud(); if(level > 5){ isPlaying = false; music.pause(); alert('Run complete! Report to backend to mint NFT'); reportRun(); } } } else { if(kills > 100){ isPlaying = false; alert('Unbeatable reached.'); gameOver(); } } }

function gameOver(){ isPlaying = false; music.pause(); alert('You died. Run over.'); }

document.getElementById('buyRun').addEventListener('click', async ()=>{ if(!isPlaying){ isPlaying = true; kills = 0; level = 1; health = 100; mag = maxMag; grenades = 2; enemies = []; updateHud(); music.play(); gameTick(); } });

function reportRun(){ if(!signer || !account){ alert('Connect wallet to claim NFT or rewards'); return; } const payload = { player: account, kills: kills, levelsCompleted: 5, timestamp: Date.now() }; signer.signMessage(JSON.stringify(payload)).then(sig=>{ fetch((location.origin) + '/api/run-complete', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({...payload, signature:sig}) }).then(r=>r.json()).then(d=>alert('Server response: ' + (d.message || JSON.stringify(d)))).catch(e=>alert('Failed to report run: ' + e.message)); }).catch(e=>alert('Signing failed: ' + e.message)); }

draw(); updateHud();