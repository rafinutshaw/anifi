/* ---- Soothing background birthday theme — "Happy Birthday to You" (public domain) as a gentle acoustic-guitar waltz, generated with Web Audio API ---- */
const NOTE_FREQ = {
  F2:87.31, G2:98.00, A2:110.00, B2:123.47,
  C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
  C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
  C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00
};
const BPM = 84;
const BEAT = 60 / BPM;

// "Happy Birthday to You" in C major — 1 pickup beat + 7 full bars + a 2-beat final note = 24 beats,
// so the next loop's pickup lands on the last beat of the final bar
const melody = [
  ['G4',0.75],['G4',0.25], ['A4',1],['G4',1],['C5',1], ['B4',2],   // Happy birthday to you
  ['G4',0.75],['G4',0.25], ['A4',1],['G4',1],['D5',1], ['C5',2],   // Happy birthday to you
  ['G4',0.75],['G4',0.25], ['G5',1],['E5',1],['C5',1], ['B4',1],['A4',1], // Happy birthday dear ...
  ['F5',0.75],['F5',0.25], ['E5',1],['C5',1],['D5',1], ['C5',2]    // Happy birthday to you
];

// a single solo guitar picking the tune
const GUITAR = { gain:0.34, warmth:4200, brightness:0.55, pickPos:0.18, damping:0.9965, release:0.18 };

let audioCtx = null;
let masterGain = null;
let guitarBus = null;   // every string plays into this; it adds body resonance and feeds dry + reverb
let musicPlaying = false;
let musicTimer = null;
let nextLoopTime = 0;
let musicManuallyToggled = false;
const pluckCache = new Map();

// Karplus-Strong plucked-string synthesis: a filtered noise burst (the pick) circulates
// through a tuned, slowly damped delay loop (the string). An allpass stage supplies the
// fractional part of the delay so higher notes stay in tune.
function createPluckBuffer(freq, duration, voice){
  const sr = audioCtx.sampleRate;
  const period = sr / freq;
  const N = Math.max(2, Math.floor(period - 0.6));
  const frac = period - 0.5 - N;                 // averaging filter adds half a sample
  const apC = (1 - frac) / (1 + frac);
  const total = Math.max(1, Math.floor(sr * duration));
  const y = new Float32Array(total);

  // pick excitation: softened noise, comb-filtered for where along the string it's plucked
  const L = Math.ceil(period);
  const noise = new Float32Array(L);
  let lp = 0;
  for(let i = 0; i < L; i++){
    lp += voice.brightness * ((Math.random() * 2 - 1) - lp);
    noise[i] = lp;
  }
  const pickGap = Math.max(1, Math.round(voice.pickPos * period));
  const excite = new Float32Array(L);
  let mean = 0, peak = 0;
  for(let i = 0; i < L; i++){
    excite[i] = noise[i] - (i >= pickGap ? noise[i - pickGap] : 0);
    mean += excite[i];
  }
  mean /= L;
  for(let i = 0; i < L; i++){ excite[i] -= mean; peak = Math.max(peak, Math.abs(excite[i])); }
  const norm = peak > 0 ? 0.8 / peak : 1;

  let apIn = 0, apOut = 0;
  for(let n = 0; n < total; n++){
    const a = n >= N ? y[n - N] : 0;
    const b = n > N ? y[n - N - 1] : 0;
    const damped = voice.damping * 0.5 * (a + b);
    const ap = apC * damped + apIn - apC * apOut;
    apIn = damped; apOut = ap;
    y[n] = (n < L ? excite[n] * norm : 0) + ap;
  }

  const buffer = audioCtx.createBuffer(1, total, sr);
  buffer.copyToChannel(y, 0);
  return buffer;
}

// a few pre-rendered variations per note so repeated plucks don't sound identical
function getPluck(note, duration, voice){
  const key = `${note}|${duration.toFixed(3)}|${Math.floor(Math.random() * 3)}`;
  if(!pluckCache.has(key)) pluckCache.set(key, createPluckBuffer(NOTE_FREQ[note], duration, voice));
  return pluckCache.get(key);
}

// one plucked note: rings for its length, then the string is damped by the next note
function playGuitarNote(buffer, startTime, holdDur, gain, voice){
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = voice.warmth;
  filter.Q.value = 0.5;

  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, startTime);
  g.gain.setTargetAtTime(0, startTime + holdDur, voice.release / 3);

  src.connect(filter);
  filter.connect(g);
  g.connect(guitarBus);
  src.start(startTime);
  src.stop(startTime + buffer.duration);
}

// synthesized small-room reverb: stereo noise with an exponential decay
function createReverbImpulse(seconds){
  const sr = audioCtx.sampleRate;
  const len = Math.floor(sr * seconds);
  const ir = audioCtx.createBuffer(2, len, sr);
  for(let ch = 0; ch < 2; ch++){
    const d = ir.getChannelData(ch);
    for(let i = 0; i < len; i++){
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.5);
    }
  }
  return ir;
}

const jitter = amount => (Math.random() * 2 - 1) * amount;

function scheduleMelodyLoop(){
  if(!musicPlaying || !audioCtx) return;

  // render every note first, so building buffers never delays the scheduled start
  const events = [];
  let offset = 0;
  melody.forEach(([note, beats]) => {
    const dur = beats * BEAT;
    const accent = beats >= 1 ? 1 : 0.8;   // the quick pickup notes are picked lighter
    events.push({ offset, dur, gain: GUITAR.gain * accent,
      buffer: getPluck(note, dur + GUITAR.release + 0.3, GUITAR) });
    offset += dur;
  });
  const loopLength = offset;

  const start = Math.max(audioCtx.currentTime + 0.1, nextLoopTime);
  nextLoopTime = start + loopLength;
  events.forEach(ev => {
    playGuitarNote(ev.buffer, start + ev.offset + jitter(0.004), ev.dur,
      ev.gain * (0.92 + Math.random() * 0.12), GUITAR);
  });

  musicTimer = setTimeout(scheduleMelodyLoop,
    Math.max(200, (nextLoopTime - audioCtx.currentTime - 0.4) * 1000));
}

function updateMusicBtn(){
  const btn = document.getElementById('musicToggle');
  const hint = document.getElementById('musicHint');
  if(btn){
    btn.textContent = musicPlaying ? '🔊' : '🔇';
    btn.classList.toggle('playing', musicPlaying);
    btn.title = musicPlaying ? 'Pause background music' : 'Play background music';
  }
  if(hint){
    hint.classList.toggle('hide', musicPlaying);
  }
}

function startMusic(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;

    // gentle compressor keeps the level even without squashing the soft dynamics
    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.02;
    comp.release.value = 0.3;
    masterGain.connect(comp);
    comp.connect(audioCtx.destination);

    // guitar body: a warm low resonance and a softened top end
    guitarBus = audioCtx.createGain();
    const body = audioCtx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 110;
    body.Q.value = 1.2;
    body.gain.value = 4;
    const air = audioCtx.createBiquadFilter();
    air.type = 'highshelf';
    air.frequency.value = 5000;
    air.gain.value = -5;
    guitarBus.connect(body);
    body.connect(air);

    // dry signal plus a soft room reverb for a sense of space
    const reverb = audioCtx.createConvolver();
    reverb.buffer = createReverbImpulse(2.4);
    const wet = audioCtx.createGain();
    wet.gain.value = 0.28;
    air.connect(masterGain);
    air.connect(reverb);
    reverb.connect(wet);
    wet.connect(masterGain);
  }
  musicPlaying = true;
  updateMusicBtn();
  // only schedule notes once the context is actually running — on iPhone it can stay
  // suspended until a tap it accepts, and notes queued against a frozen clock pile up
  unlockAudio().then(() => {
    if(!musicPlaying || audioCtx.state !== 'running') return;
    if(musicTimer) clearTimeout(musicTimer);
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setTargetAtTime(1.0, audioCtx.currentTime, 1.0);
    scheduleMelodyLoop();
  });
  try{ localStorage.setItem('netflix_bday_music', 'on'); }catch(err){}
}

function stopMusic(){
  musicPlaying = false;
  nextLoopTime = 0;
  if(musicTimer) clearTimeout(musicTimer);
  if(masterGain && audioCtx){
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.4);
  }
  updateMusicBtn();
  try{ localStorage.setItem('netflix_bday_music', 'off'); }catch(err){}
}

function toggleMusic(){
  musicManuallyToggled = true;
  if(musicPlaying) stopMusic(); else startMusic();
}

// resumes the context and plays one silent sample, which is what iOS Safari needs
// (inside a touchend/click) before it lets Web Audio make any sound
function unlockAudio(){
  if(!audioCtx) return Promise.resolve();
  const silent = audioCtx.createBufferSource();
  silent.buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
  silent.connect(audioCtx.destination);
  silent.start(0);
  return audioCtx.state === 'running' ? Promise.resolve() : audioCtx.resume().catch(() => {});
}

function tryAutoStartMusic(){
  if(musicManuallyToggled) return;
  if(!musicPlaying){
    startMusic();
  } else if(audioCtx && audioCtx.state !== 'running'){
    // an earlier gesture didn't count as a valid unlock — retry the start on this one
    startMusic();
  }
}

// play through the iPhone's silent switch, like a video would (iOS 17+ Safari)
try{ if(navigator.audioSession) navigator.audioSession.type = 'playback'; }catch(err){}

// Browsers block audio until the visitor interacts with the page at least once —
// so the music starts itself on the first tap/click/keypress anywhere on the page.
// iOS only accepts touchend/click (not touchstart/pointerdown) as an unlocking
// gesture, and can suspend audio again later, so these stay attached for good.
const UNLOCK_EVENTS = ['touchend','click','keydown'];
function onUnlockGesture(e){
  // the mute button handles itself — starting here would make its click stop the music
  if(e.target && e.target.closest && e.target.closest('#musicToggle')) return;
  if(musicPlaying && audioCtx && audioCtx.state !== 'running'){
    startMusic();
  } else {
    tryAutoStartMusic();
  }
}
UNLOCK_EVENTS.forEach(evt => window.addEventListener(evt, onUnlockGesture, { capture:true, passive:true }));

// iOS suspends/interrupts audio when you switch apps or lock the phone — try to pick
// it back up (if Safari refuses outside a tap, the next tap anywhere resumes it)
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'visible' && musicPlaying && audioCtx && audioCtx.state !== 'running'){
    startMusic();
  }
});
