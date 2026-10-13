// High-Intensity Emergency Siren & Alarm Synthesizer
// Pure Web Audio API - Zero external MP3 dependency, works 100% offline and on all mobile/desktop browsers.

let audioCtx = null;
let isPlaying = false;
let loopTimer = null;
let vibrateTimer = null;
let activeNodes = [];

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Ensure audio context is unlocked on first user touch / click
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (_) {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Plays a single urgent dual-tone siren pulse
 */
function playSirenPulse(ctx) {
  if (!isPlaying || !ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Urgent dual-tone siren buzzer (Alternates between 880Hz and 660Hz)
    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Rapid pitch sweep up & down
    osc1.frequency.setValueAtTime(780, now);
    osc1.frequency.linearRampToValueAtTime(960, now + 0.12);
    osc1.frequency.linearRampToValueAtTime(780, now + 0.24);

    osc2.frequency.setValueAtTime(620, now);
    osc2.frequency.linearRampToValueAtTime(740, now + 0.12);
    osc2.frequency.linearRampToValueAtTime(620, now + 0.24);

    // Loud volume envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.75, now + 0.02);
    gainNode.gain.setValueAtTime(0.75, now + 0.20);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.24);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);

    activeNodes.push({ osc1, osc2, gainNode });
    setTimeout(() => {
      activeNodes = activeNodes.filter((n) => n.osc1 !== osc1);
    }, 300);
  } catch (err) {
    console.warn('Audio pulse error:', err);
  }
}

/**
 * Start the continuous loud emergency alarm siren
 */
export function startAlarm() {
  if (isPlaying) return;
  isPlaying = true;

  const ctx = getAudioContext();

  // Play immediately
  playSirenPulse(ctx);

  // Repeat pulses every 260ms (intense rapid emergency siren rhythm)
  loopTimer = setInterval(() => {
    if (!isPlaying) return;
    const c = getAudioContext();
    playSirenPulse(c);
  }, 270);

  // Device vibration pattern for mobile phones
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([400, 150, 400, 150, 400]);
      vibrateTimer = setInterval(() => {
        if (!isPlaying) return;
        navigator.vibrate([400, 150, 400, 150, 400]);
      }, 1600);
    } catch (_) {}
  }
}

/**
 * Stop and immediately silence the alarm
 */
export function stopAlarm() {
  isPlaying = false;

  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }

  if (vibrateTimer) {
    clearInterval(vibrateTimer);
    vibrateTimer = null;
  }

  // Cancel any active vibration
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch (_) {}
  }

  // Immediately stop active oscillator nodes
  activeNodes.forEach(({ osc1, osc2, gainNode }) => {
    try {
      osc1.stop();
      osc2.stop();
      gainNode.disconnect();
    } catch (_) {}
  });
  activeNodes = [];
}

/**
 * Check if alarm is actively sounding
 */
export function isAlarmPlaying() {
  return isPlaying;
}

/**
 * Preview / Test the alarm sound for 3 seconds
 */
export function previewAlarmSound() {
  startAlarm();
  setTimeout(() => {
    stopAlarm();
  }, 3000);
}
