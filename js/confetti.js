const confettiLayer = document.getElementById('confettiLayer');

// spawns one confetti/sparkle piece from a given origin (percent of the player area)
// and removes itself once its animation finishes — safe to call continuously
function spawnConfettiPiece(originX, originY, big){
  if(!confettiLayer) return;
  const colors = ['#e50914','#ffd27a','#7bbf5e','#59c3ff','#d879c9','#ffffff'];
  const emojis = ['✨','🎉','🎊','💫','🌟','🎂'];
  const el = document.createElement('div');
  el.className = 'confetti-piece';
  el.style.left = (originX != null ? originX : 50) + '%';
  el.style.top = (originY != null ? originY : 42) + '%';
  const angle = Math.random() * Math.PI * 2;
  const distance = (big ? 130 : 60) + Math.random() * (big ? 300 : 160);
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance - (big ? 60 : 30);
  const rot = (Math.random() * 720 - 360) + 'deg';
  const duration = 1000 + Math.random() * 900;
  const delay = Math.random() * 150;
  el.style.setProperty('--tx', tx + 'px');
  el.style.setProperty('--ty', ty + 'px');
  el.style.setProperty('--rot', rot);
  el.style.animationDuration = duration + 'ms';
  el.style.animationDelay = delay + 'ms';
  if(Math.random() < 0.4){
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.fontSize = (13 + Math.random() * (big ? 16 : 10)) + 'px';
  } else {
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = (5 + Math.random() * 4) + 'px';
    el.style.height = (10 + Math.random() * 9) + 'px';
  }
  el.addEventListener('animationend', () => el.remove());
  confettiLayer.appendChild(el);
}

function spawnConfettiBurst(count, originX, originY, big){
  for(let i = 0; i < (count || 12); i++){
    spawnConfettiPiece(originX, originY, big !== false);
  }
}

let confettiInterval = null;

// keeps a light, ongoing sparkle/confetti celebration going for as long as the
// finale letter page is on screen
function startContinuousConfetti(){
  if(confettiInterval) return;
  spawnConfettiBurst(46, 50, 42, true);
  confettiInterval = setInterval(() => {
    const ox = 15 + Math.random() * 70;
    const oy = 10 + Math.random() * 35;
    spawnConfettiBurst(9 + Math.floor(Math.random() * 6), ox, oy, false);
  }, 600);
}

function stopContinuousConfetti(){
  if(confettiInterval){ clearInterval(confettiInterval); confettiInterval = null; }
}
