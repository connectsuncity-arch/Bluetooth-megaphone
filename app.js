/**
 * AeroMix - Dual-Deck Virtual DJ Console & MC Microphone
 * Core Audio Processing, Mixing & UI Handling
 */

// UI Elements
const powerBtn = document.getElementById('power-btn');
const statusBadge = document.getElementById('status-badge');
const inputDeviceSelect = document.getElementById('input-device-select');
const outputDeviceSelect = document.getElementById('output-device-select');
const refreshDevicesBtn = document.getElementById('refresh-devices-btn');
const presetButtons = document.querySelectorAll('.preset-btn');

// Microphone Sliders and Values
const gainSlider = document.getElementById('gain-slider');
const gainVal = document.getElementById('gain-val');
const gateSlider = document.getElementById('gate-slider');
const gateVal = document.getElementById('gate-val');
const delaySlider = document.getElementById('delay-slider');
const delayVal = document.getElementById('delay-val');
const feedbackSlider = document.getElementById('feedback-slider');
const feedbackVal = document.getElementById('feedback-val');
const gateEnableToggle = document.getElementById('gate-enable-toggle');

// Visualizer
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');
const vizWaveBtn = document.getElementById('viz-wave-btn');
const vizFreqBtn = document.getElementById('viz-freq-btn');
const micPromptOverlay = document.getElementById('mic-prompt-overlay');
const meterFill = document.getElementById('meter-fill');
const diagnosticsLog = document.getElementById('diagnostics-log');
const clearLogsBtn = document.getElementById('clear-logs-btn');

// ==========================================
// DJ DECK ELEMENTS
// ==========================================

// Audio elements for Decks
const deckAElement = new Audio();
const deckBElement = new Audio();
deckAElement.crossOrigin = "anonymous";
deckBElement.crossOrigin = "anonymous";

// Ensure looping is off by default
deckAElement.loop = false;
deckBElement.loop = false;

// Deck UI DOM Elements
const deckAFileInput = document.getElementById('deck-a-file-input');
const deckALoadBtn = document.getElementById('deck-a-load-btn');
const deckAPlayBtn = document.getElementById('deck-a-play-btn');
const deckACueBtn = document.getElementById('deck-a-cue-btn');
const deckAPitchSlider = document.getElementById('deck-a-pitch-slider');
const deckAPitchVal = document.getElementById('deck-a-pitch-val');
const deckAPitchReset = document.getElementById('deck-a-pitch-reset');
const deckABpmInput = document.getElementById('deck-a-bpm-input');
const deckABpmDisplay = document.getElementById('deck-a-bpm-display');
const deckASyncBtn = document.getElementById('deck-a-sync-btn');
const deckAVinyl = document.getElementById('deck-a-vinyl');
const deckATrackName = document.getElementById('deck-a-track-name');
const deckATime = document.getElementById('deck-a-time');

const deckAEqHigh = document.getElementById('deck-a-eq-high');
const deckAEqMid = document.getElementById('deck-a-eq-mid');
const deckAEqLow = document.getElementById('deck-a-eq-low');
const deckALoopInBtn = document.getElementById('deck-a-loop-in');
const deckALoopOutBtn = document.getElementById('deck-a-loop-out');
const deckALoopExitBtn = document.getElementById('deck-a-loop-exit');

const deckBFileInput = document.getElementById('deck-b-file-input');
const deckBLoadBtn = document.getElementById('deck-b-load-btn');
const deckBPlayBtn = document.getElementById('deck-b-play-btn');
const deckBCueBtn = document.getElementById('deck-b-cue-btn');
const deckBPitchSlider = document.getElementById('deck-b-pitch-slider');
const deckBPitchVal = document.getElementById('deck-b-pitch-val');
const deckBPitchReset = document.getElementById('deck-b-pitch-reset');
const deckBBpmInput = document.getElementById('deck-b-bpm-input');
const deckBBpmDisplay = document.getElementById('deck-b-bpm-display');
const deckBSyncBtn = document.getElementById('deck-b-sync-btn');
const deckBVinyl = document.getElementById('deck-b-vinyl');
const deckBTrackName = document.getElementById('deck-b-track-name');
const deckBTime = document.getElementById('deck-b-time');

const deckBEqHigh = document.getElementById('deck-b-eq-high');
const deckBEqMid = document.getElementById('deck-b-eq-mid');
const deckBEqLow = document.getElementById('deck-b-eq-low');
const deckBLoopInBtn = document.getElementById('deck-b-loop-in');
const deckBLoopOutBtn = document.getElementById('deck-b-loop-out');
const deckBLoopExitBtn = document.getElementById('deck-b-loop-exit');

const samplerAirhorn = document.getElementById('sampler-airhorn');
const samplerLaser = document.getElementById('sampler-laser');
const samplerScratch = document.getElementById('sampler-scratch');
const samplerDrop = document.getElementById('sampler-drop');

// Mixer Controls
const crossfaderSlider = document.getElementById('crossfader-slider');
const crossfaderVal = document.getElementById('crossfader-val');
const masterVolumeSlider = document.getElementById('master-volume-slider');
const masterVolumeVal = document.getElementById('master-volume-val');

// ==========================================
// AUDIO ENGINE STATE
// ==========================================
let audioContext = null;
let micStream = null;

// Audio Node References
let micSourceNode = null;
let micGainNode = null;
let gateGainNode = null;
let distortionNode = null;
let bandpassFilterNode = null;
let robotOscillatorNode = null;
let robotGainNode = null;
let delayNode = null;
let delayFeedbackNode = null;
let delayFilterNode = null;

let deckASourceNode = null;
let deckBSourceNode = null;
let deckAGainNode = null;
let deckBGainNode = null;

let masterGainNode = null;
let analyserNode = null;
let compressorNode = null;

let isLive = false;
let currentPreset = 'bypass';
let visualizerMode = 'wave'; // 'wave' or 'freq'

// Noise gate envelope variables
let gateOpen = false;
let currentGateVolume = 0;
const gateAttack = 0.15;
const gateRelease = 0.08;

// Cue Points
let deckACuePoint = 0;
let deckBCuePoint = 0;
let deckAPreviewing = false;
let deckBPreviewing = false;

// Loop Points
let deckALoopIn = -1;
let deckALoopOut = -1;
let deckALoopActive = false;

let deckBLoopIn = -1;
let deckBLoopOut = -1;
let deckBLoopActive = false;

// EQ Nodes
let deckAEqHighNode = null;
let deckAEqMidNode = null;
let deckAEqLowNode = null;

let deckBEqHighNode = null;
let deckBEqMidNode = null;
let deckBEqLowNode = null;

// Diagnostics Console Log
function logToConsole(message, type = 'system') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  if (!diagnosticsLog) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  entry.textContent = `[${timeStr}] ${message}`;
  diagnosticsLog.appendChild(entry);
  diagnosticsLog.scrollTop = diagnosticsLog.scrollHeight;
}

// Window Load setup
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  enumerateDevices();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  logToConsole('AeroMix System Ready. Load tracks or start mixer engine.');

  // Trigger permissions request initially
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      const hasLabels = devices.some(d => d.label !== '');
      if (!hasLabels) {
        logToConsole('Requesting device listing permissions...', 'info');
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            logToConsole('Permissions approved. Hardware labels populated.', 'success');
            enumerateDevices();
          })
          .catch(() => {
            logToConsole('Permissions declined. Master routing default output will still function.', 'warn');
          });
      } else {
        logToConsole(`Detected ${devices.filter(d => d.kind === 'audioinput').length} inputs and ${devices.filter(d => d.kind === 'audiooutput').length} output target options.`, 'success');
      }
    });
  
  // Start regular interval to update track times
  setInterval(updateTrackTimeLabels, 250);
});

// Enumerate audio device profiles
async function enumerateDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    inputDeviceSelect.innerHTML = '<option value="">Default Microphone</option>';
    outputDeviceSelect.innerHTML = '<option value="">System Default Audio Out</option>';
    
    let micCount = 0;
    let speakerCount = 0;

    devices.forEach(device => {
      if (device.kind === 'audioinput') {
        micCount++;
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Microphone ${micCount}`;
        inputDeviceSelect.appendChild(option);
      } else if (device.kind === 'audiooutput') {
        speakerCount++;
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Speaker ${speakerCount}`;
        outputDeviceSelect.appendChild(option);
      }
    });
    
    if (!('setSinkId' in AudioContext.prototype) && !('setSinkId' in HTMLAudioElement.prototype)) {
      const outputLabel = document.querySelector('label[for="output-device-select"]');
      const outputWrapper = outputDeviceSelect.parentElement;
      if (outputLabel) outputLabel.style.display = 'none';
      if (outputWrapper) outputWrapper.style.display = 'none';
      const tipText = document.querySelector('.tip-text');
      if (tipText) tipText.textContent = "Output routing not supported natively in this browser. Sound will route to your system's default audio device (select your Bluetooth speaker in Windows sound settings).";
    }
  } catch (err) {
    logToConsole(`Error scanning devices: ${err.message}`, 'error');
  }
}

// Adjust canvas resolution dynamically
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

// Helper to format track time
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update time text labels
function updateTrackTimeLabels() {
  deckATime.textContent = `${formatTime(deckAElement.currentTime)} / ${formatTime(deckAElement.duration)}`;
  deckBTime.textContent = `${formatTime(deckBElement.currentTime)} / ${formatTime(deckBElement.duration)}`;
  
  // Visual spinning records state
  if (deckAElement.paused) deckAVinyl.classList.remove('playing');
  else deckAVinyl.classList.add('playing');
  
  if (deckBElement.paused) deckBVinyl.classList.remove('playing');
  else deckBVinyl.classList.add('playing');
}

// Initialize user media stream on demand
async function ensureAudioContextStarted() {
  if (!audioContext) {
    const started = await startAudioGraph();
    if (started) {
      isLive = true;
      powerBtn.classList.remove('offline');
      powerBtn.classList.add('online');
      powerBtn.querySelector('.power-text').textContent = 'STOP MIXER ENGINE';
      statusBadge.textContent = 'Mixer Engine Live';
      statusBadge.className = 'status-badge online';
      micPromptOverlay.classList.add('hidden');
    }
    return started;
  } else if (audioContext.state === 'suspended') {
    await audioContext.resume();
    logToConsole("AudioContext resumed.", "info");
  }
  return true;
}

// Wire everything up
function setupEventListeners() {
  // Main Mixer Power Toggle
  powerBtn.addEventListener('click', togglePower);

  // Deck A Loader
  deckALoadBtn.addEventListener('click', () => deckAFileInput.click());
  deckAFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      deckAElement.src = fileUrl;
      deckATrackName.textContent = file.name;
      logToConsole(`Loaded Deck A: ${file.name}`, 'info');
      // Mock BPM estimation
      const randomBpm = (Math.random() * 15 + 115).toFixed(1);
      deckABpmInput.value = randomBpm;
      deckABpmDisplay.textContent = `${randomBpm} BPM`;
      ensureAudioContextStarted();
    }
  });

  // Deck B Loader
  deckBLoadBtn.addEventListener('click', () => deckBFileInput.click());
  deckBFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      deckBElement.src = fileUrl;
      deckBTrackName.textContent = file.name;
      logToConsole(`Loaded Deck B: ${file.name}`, 'info');
      // Mock BPM estimation
      const randomBpm = (Math.random() * 15 + 115).toFixed(1);
      deckBBpmInput.value = randomBpm;
      deckBBpmDisplay.textContent = `${randomBpm} BPM`;
      ensureAudioContextStarted();
    }
  });

  // Deck A Play
  deckAPlayBtn.addEventListener('click', async () => {
    await ensureAudioContextStarted();
    if (!deckAElement.src) {
      logToConsole("Deck A: No track loaded.", "warn");
      return;
    }
    if (deckAElement.paused) {
      deckAElement.play();
      deckAPlayBtn.textContent = 'Pause';
      deckAPlayBtn.classList.add('active');
      logToConsole("Deck A: Playing", "info");
    } else {
      deckAElement.pause();
      deckAPlayBtn.textContent = 'Play';
      deckAPlayBtn.classList.remove('active');
      logToConsole("Deck A: Paused", "info");
    }
  });

  // Deck B Play
  deckBPlayBtn.addEventListener('click', async () => {
    await ensureAudioContextStarted();
    if (!deckBElement.src) {
      logToConsole("Deck B: No track loaded.", "warn");
      return;
    }
    if (deckBElement.paused) {
      deckBElement.play();
      deckBPlayBtn.textContent = 'Pause';
      deckBPlayBtn.classList.add('active');
      logToConsole("Deck B: Playing", "info");
    } else {
      deckBElement.pause();
      deckBPlayBtn.textContent = 'Play';
      deckBPlayBtn.classList.remove('active');
      logToConsole("Deck B: Paused", "info");
    }
  });

  // Deck A Cue Handlers (CDJ Style)
  const pressAHandler = async (e) => {
    e.preventDefault();
    await ensureAudioContextStarted();
    if (!deckAElement.src) return;

    if (!deckAElement.paused && !deckAPreviewing) {
      // Pause and jump to cue
      deckAElement.pause();
      deckAElement.currentTime = deckACuePoint;
      deckAPlayBtn.textContent = 'Play';
      deckAPlayBtn.classList.remove('active');
      deckACueBtn.classList.add('active');
      logToConsole("Deck A: Jumped to Cue point", "info");
    } else {
      // Hold to preview
      deckAElement.currentTime = deckACuePoint;
      deckAElement.play();
      deckACueBtn.classList.add('active');
      deckAPreviewing = true;
    }
  };

  const releaseAHandler = (e) => {
    e.preventDefault();
    if (deckAPreviewing) {
      deckAElement.pause();
      deckAElement.currentTime = deckACuePoint;
      deckACueBtn.classList.remove('active');
      deckAPreviewing = false;
    } else {
      deckACueBtn.classList.remove('active');
    }
  };

  deckACueBtn.addEventListener('mousedown', pressAHandler);
  deckACueBtn.addEventListener('mouseup', releaseAHandler);
  deckACueBtn.addEventListener('touchstart', pressAHandler);
  deckACueBtn.addEventListener('touchend', releaseAHandler);
  deckACueBtn.addEventListener('click', () => {
    if (deckAElement.paused && !deckAPreviewing) {
      deckACuePoint = deckAElement.currentTime;
      logToConsole(`Deck A: Cue point set at ${formatTime(deckACuePoint)}`, 'success');
    }
  });

  // Deck B Cue Handlers (CDJ Style)
  const pressBHandler = async (e) => {
    e.preventDefault();
    await ensureAudioContextStarted();
    if (!deckBElement.src) return;

    if (!deckBElement.paused && !deckBPreviewing) {
      deckBElement.pause();
      deckBElement.currentTime = deckBCuePoint;
      deckBPlayBtn.textContent = 'Play';
      deckBPlayBtn.classList.remove('active');
      deckBCueBtn.classList.add('active');
      logToConsole("Deck B: Jumped to Cue point", "info");
    } else {
      deckBElement.currentTime = deckBCuePoint;
      deckBElement.play();
      deckBCueBtn.classList.add('active');
      deckBPreviewing = true;
    }
  };

  const releaseBHandler = (e) => {
    e.preventDefault();
    if (deckBPreviewing) {
      deckBElement.pause();
      deckBElement.currentTime = deckBCuePoint;
      deckBCueBtn.classList.remove('active');
      deckBPreviewing = false;
    } else {
      deckBCueBtn.classList.remove('active');
    }
  };

  deckBCueBtn.addEventListener('mousedown', pressBHandler);
  deckBCueBtn.addEventListener('mouseup', releaseBHandler);
  deckBCueBtn.addEventListener('touchstart', pressBHandler);
  deckBCueBtn.addEventListener('touchend', releaseBHandler);
  deckBCueBtn.addEventListener('click', () => {
    if (deckBElement.paused && !deckBPreviewing) {
      deckBCuePoint = deckBElement.currentTime;
      logToConsole(`Deck B: Cue point set at ${formatTime(deckBCuePoint)}`, 'success');
    }
  });

  // Pitch Sliders
  deckAPitchSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    deckAPitchVal.textContent = `${val.toFixed(2)}x`;
    deckAElement.playbackRate = val;
    
    // Update displayed live BPM
    const baseBpm = parseFloat(deckABpmInput.value) || 120.0;
    const liveBpm = baseBpm * val;
    deckABpmDisplay.textContent = `${liveBpm.toFixed(1)} BPM`;
  });

  deckBPitchSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    deckBPitchVal.textContent = `${val.toFixed(2)}x`;
    deckBElement.playbackRate = val;

    // Update displayed live BPM
    const baseBpm = parseFloat(deckBBpmInput.value) || 120.0;
    const liveBpm = baseBpm * val;
    deckBBpmDisplay.textContent = `${liveBpm.toFixed(1)} BPM`;
  });

  deckAPitchReset.addEventListener('click', () => {
    deckAPitchSlider.value = 1.00;
    deckAPitchVal.textContent = "1.00x";
    deckAElement.playbackRate = 1.00;
    const baseBpm = parseFloat(deckABpmInput.value) || 120.0;
    deckABpmDisplay.textContent = `${baseBpm.toFixed(1)} BPM`;
    logToConsole("Deck A Pitch reset.", "system");
  });

  deckBPitchReset.addEventListener('click', () => {
    deckBPitchSlider.value = 1.00;
    deckBPitchVal.textContent = "1.00x";
    deckBElement.playbackRate = 1.00;
    const baseBpm = parseFloat(deckBBpmInput.value) || 120.0;
    deckBBpmDisplay.textContent = `${baseBpm.toFixed(1)} BPM`;
    logToConsole("Deck B Pitch reset.", "system");
  });

  // Sync Buttons
  deckASyncBtn.addEventListener('click', () => syncDeckTempo('a'));
  deckBSyncBtn.addEventListener('click', () => syncDeckTempo('b'));

  // BPM Input changes update live badge
  deckABpmInput.addEventListener('change', () => {
    const liveBpm = parseFloat(deckABpmInput.value) * parseFloat(deckAPitchSlider.value);
    deckABpmDisplay.textContent = `${liveBpm.toFixed(1)} BPM`;
  });
  deckBBpmInput.addEventListener('change', () => {
    const liveBpm = parseFloat(deckBBpmInput.value) * parseFloat(deckBPitchSlider.value);
    deckBBpmDisplay.textContent = `${liveBpm.toFixed(1)} BPM`;
  });

  // Crossfader and Master Volume
  crossfaderSlider.addEventListener('input', updateCrossfader);
  masterVolumeSlider.addEventListener('input', updateMasterVolume);

  // Voiceover Microphone Sliders
  gainSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value).toFixed(2);
    gainVal.textContent = `${val}x`;
    if (micGainNode) {
      micGainNode.gain.setTargetAtTime(val, audioContext.currentTime, 0.01);
    }
  });

  gateSlider.addEventListener('input', (e) => {
    gateVal.textContent = `${e.target.value} dB`;
  });

  delaySlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value).toFixed(2);
    delayVal.textContent = `${val}s`;
    if (delayNode) {
      delayNode.delayTime.setTargetAtTime(val, audioContext.currentTime, 0.05);
    }
  });

  feedbackSlider.addEventListener('input', (e) => {
    feedbackVal.textContent = `${e.target.value}%`;
    if (delayFeedbackNode) {
      const gainVal = parseFloat(e.target.value) / 100;
      delayFeedbackNode.gain.setTargetAtTime(gainVal, audioContext.currentTime, 0.05);
    }
  });

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      changePreset(btn.dataset.preset);
    });
  });

  vizWaveBtn.addEventListener('click', () => {
    vizWaveBtn.classList.add('active');
    vizFreqBtn.classList.remove('active');
    visualizerMode = 'wave';
  });

  vizFreqBtn.addEventListener('click', () => {
    vizFreqBtn.classList.add('active');
    vizWaveBtn.classList.remove('active');
    visualizerMode = 'freq';
  });

  refreshDevicesBtn.addEventListener('click', () => {
    logToConsole('Refreshing device lists...', 'info');
    enumerateDevices();
  });

  gateEnableToggle.addEventListener('change', (e) => {
    logToConsole(`Voiceover noise gate set to: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 'info');
  });

  inputDeviceSelect.addEventListener('change', async () => {
    if (isLive) {
      logToConsole('Microphone changed while engine running. Re-initializing mic graph...', 'info');
      stopAudioGraph();
      await startAudioGraph();
    }
  });

  outputDeviceSelect.addEventListener('change', async () => {
    if (isLive && audioContext) {
      try {
        const deviceId = outputDeviceSelect.value;
        if (typeof audioContext.setSinkId === 'function') {
          await audioContext.setSinkId(deviceId);
          logToConsole(`Output routed successfully to device: ${deviceId.slice(0,8)}...`, 'success');
        }
      } catch (err) {
        logToConsole(`Output routing error: ${err.message}`, 'error');
      }
    }
  });

  // Deck A EQ
  deckAEqHigh.addEventListener('input', (e) => { if (deckAEqHighNode) deckAEqHighNode.gain.value = parseFloat(e.target.value); });
  deckAEqMid.addEventListener('input', (e) => { if (deckAEqMidNode) deckAEqMidNode.gain.value = parseFloat(e.target.value); });
  deckAEqLow.addEventListener('input', (e) => { if (deckAEqLowNode) deckAEqLowNode.gain.value = parseFloat(e.target.value); });

  // Deck B EQ
  deckBEqHigh.addEventListener('input', (e) => { if (deckBEqHighNode) deckBEqHighNode.gain.value = parseFloat(e.target.value); });
  deckBEqMid.addEventListener('input', (e) => { if (deckBEqMidNode) deckBEqMidNode.gain.value = parseFloat(e.target.value); });
  deckBEqLow.addEventListener('input', (e) => { if (deckBEqLowNode) deckBEqLowNode.gain.value = parseFloat(e.target.value); });

  // Deck A Looping
  deckALoopInBtn.addEventListener('click', () => {
    deckALoopIn = deckAElement.currentTime;
    deckALoopInBtn.classList.add('active');
    logToConsole(`Deck A: Loop In set at ${formatTime(deckALoopIn)}`);
  });
  deckALoopOutBtn.addEventListener('click', () => {
    if (deckALoopIn >= 0 && deckAElement.currentTime > deckALoopIn) {
      deckALoopOut = deckAElement.currentTime;
      deckALoopOutBtn.classList.add('active');
      deckALoopActive = true;
      logToConsole(`Deck A: Loop Out set at ${formatTime(deckALoopOut)}`);
    }
  });
  deckALoopExitBtn.addEventListener('click', () => {
    deckALoopActive = false;
    deckALoopIn = -1;
    deckALoopOut = -1;
    deckALoopInBtn.classList.remove('active');
    deckALoopOutBtn.classList.remove('active');
    logToConsole(`Deck A: Loop exited`);
  });

  // Deck B Looping
  deckBLoopInBtn.addEventListener('click', () => {
    deckBLoopIn = deckBElement.currentTime;
    deckBLoopInBtn.classList.add('active');
    logToConsole(`Deck B: Loop In set at ${formatTime(deckBLoopIn)}`);
  });
  deckBLoopOutBtn.addEventListener('click', () => {
    if (deckBLoopIn >= 0 && deckBElement.currentTime > deckBLoopIn) {
      deckBLoopOut = deckBElement.currentTime;
      deckBLoopOutBtn.classList.add('active');
      deckBLoopActive = true;
      logToConsole(`Deck B: Loop Out set at ${formatTime(deckBLoopOut)}`);
    }
  });
  deckBLoopExitBtn.addEventListener('click', () => {
    deckBLoopActive = false;
    deckBLoopIn = -1;
    deckBLoopOut = -1;
    deckBLoopInBtn.classList.remove('active');
    deckBLoopOutBtn.classList.remove('active');
    logToConsole(`Deck B: Loop exited`);
  });

  // Sampler
  samplerAirhorn.addEventListener('click', playAirhorn);
  samplerLaser.addEventListener('click', playLaser);
  samplerScratch.addEventListener('click', playScratch);
  samplerDrop.addEventListener('click', playDrop);
}

// Master Crossfader calculations (Equal-power curve)
function updateCrossfader() {
  const val = parseInt(crossfaderSlider.value);
  const x = val / 100;
  
  // Constant-power cosine/sine curve
  const gainA = Math.cos(x * Math.PI / 2);
  const gainB = Math.sin(x * Math.PI / 2);
  
  if (deckAGainNode) {
    deckAGainNode.gain.setTargetAtTime(gainA, audioContext.currentTime, 0.01);
  }
  if (deckBGainNode) {
    deckBGainNode.gain.setTargetAtTime(gainB, audioContext.currentTime, 0.01);
  }
  
  if (val === 50) {
    crossfaderVal.textContent = "Center";
  } else if (val < 50) {
    crossfaderVal.textContent = `Deck A ${Math.round((50 - val) * 2)}%`;
  } else {
    crossfaderVal.textContent = `Deck B ${Math.round((val - 50) * 2)}%`;
  }
}

// Master Volume calculations
function updateMasterVolume() {
  const val = parseInt(masterVolumeSlider.value);
  masterVolumeVal.textContent = `${val}%`;
  
  if (masterGainNode) {
    masterGainNode.gain.setTargetAtTime(val / 100, audioContext.currentTime, 0.01);
  }
}

// Tempo Sync
function syncDeckTempo(target) {
  if (target === 'a') {
    // Sync A to B: match A's speed to B's current live BPM
    const bpmB = parseFloat(deckBBpmInput.value) * parseFloat(deckBElement.playbackRate);
    const baseA = parseFloat(deckABpmInput.value);
    if (bpmB && baseA) {
      const pitchFactor = bpmB / baseA;
      deckAPitchSlider.value = pitchFactor.toFixed(3);
      deckAElement.playbackRate = pitchFactor;
      deckAPitchVal.textContent = `${pitchFactor.toFixed(2)}x`;
      deckABpmDisplay.textContent = `${bpmB.toFixed(1)} BPM`;
      logToConsole(`Synced Deck A tempo to Deck B: ${bpmB.toFixed(1)} BPM`, 'success');
    }
  } else {
    // Sync B to A: match B's speed to A's current live BPM
    const bpmA = parseFloat(deckABpmInput.value) * parseFloat(deckAElement.playbackRate);
    const baseB = parseFloat(deckBBpmInput.value);
    if (bpmA && baseB) {
      const pitchFactor = bpmA / baseB;
      deckBPitchSlider.value = pitchFactor.toFixed(3);
      deckBElement.playbackRate = pitchFactor;
      deckBPitchVal.textContent = `${pitchFactor.toFixed(2)}x`;
      deckBBpmDisplay.textContent = `${bpmA.toFixed(1)} BPM`;
      logToConsole(`Synced Deck B tempo to Deck A: ${bpmA.toFixed(1)} BPM`, 'success');
    }
  }
}

// Build Web Audio Context and Node Graph
async function startAudioGraph() {
  try {
    logToConsole("Initializing master audio context...", "info");
    
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass({
        latencyHint: 'interactive'
      });
      
      const outputDeviceId = outputDeviceSelect.value;
      if (outputDeviceId && typeof audioContext.setSinkId === 'function') {
        await audioContext.setSinkId(outputDeviceId);
        logToConsole(`Configured audio output path to: ${outputDeviceId.slice(0,8)}...`, "info");
      }

      // 1. Create Media Sources for music decks (these persist)
      deckASourceNode = audioContext.createMediaElementSource(deckAElement);
      deckBSourceNode = audioContext.createMediaElementSource(deckBElement);
      
      deckAGainNode = audioContext.createGain();
      deckBGainNode = audioContext.createGain();
      
      // Initialize EQ for Deck A
      deckAEqHighNode = audioContext.createBiquadFilter();
      deckAEqHighNode.type = 'highshelf';
      deckAEqHighNode.frequency.value = 3200;
      deckAEqHighNode.gain.value = parseFloat(deckAEqHigh.value);

      deckAEqMidNode = audioContext.createBiquadFilter();
      deckAEqMidNode.type = 'peaking';
      deckAEqMidNode.frequency.value = 1000;
      deckAEqMidNode.Q.value = 0.5;
      deckAEqMidNode.gain.value = parseFloat(deckAEqMid.value);

      deckAEqLowNode = audioContext.createBiquadFilter();
      deckAEqLowNode.type = 'lowshelf';
      deckAEqLowNode.frequency.value = 320;
      deckAEqLowNode.gain.value = parseFloat(deckAEqLow.value);

      deckASourceNode.connect(deckAEqHighNode);
      deckAEqHighNode.connect(deckAEqMidNode);
      deckAEqMidNode.connect(deckAEqLowNode);
      deckAEqLowNode.connect(deckAGainNode);

      // Initialize EQ for Deck B
      deckBEqHighNode = audioContext.createBiquadFilter();
      deckBEqHighNode.type = 'highshelf';
      deckBEqHighNode.frequency.value = 3200;
      deckBEqHighNode.gain.value = parseFloat(deckBEqHigh.value);

      deckBEqMidNode = audioContext.createBiquadFilter();
      deckBEqMidNode.type = 'peaking';
      deckBEqMidNode.frequency.value = 1000;
      deckBEqMidNode.Q.value = 0.5;
      deckBEqMidNode.gain.value = parseFloat(deckBEqMid.value);

      deckBEqLowNode = audioContext.createBiquadFilter();
      deckBEqLowNode.type = 'lowshelf';
      deckBEqLowNode.frequency.value = 320;
      deckBEqLowNode.gain.value = parseFloat(deckBEqLow.value);

      deckBSourceNode.connect(deckBEqHighNode);
      deckBEqHighNode.connect(deckBEqMidNode);
      deckBEqMidNode.connect(deckBEqLowNode);
      deckBEqLowNode.connect(deckBGainNode);

      // Initialize crossfader values
      updateCrossfader();

      // 2. Create Master Volume Nodes
      masterGainNode = audioContext.createGain();
      masterGainNode.gain.value = parseFloat(masterVolumeSlider.value) / 100;

      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 512;

      compressorNode = audioContext.createDynamicsCompressor();
      compressorNode.threshold.setValueAtTime(-12, audioContext.currentTime);
      compressorNode.knee.setValueAtTime(10, audioContext.currentTime);
      compressorNode.ratio.setValueAtTime(12, audioContext.currentTime);
      compressorNode.attack.setValueAtTime(0.003, audioContext.currentTime);
      compressorNode.release.setValueAtTime(0.08, audioContext.currentTime);

      // Connect Music Decks to Master Node
      deckAGainNode.connect(masterGainNode);
      deckBGainNode.connect(masterGainNode);

      // Mic Effects Nodes
      micGainNode = audioContext.createGain();
      micGainNode.gain.value = parseFloat(gainSlider.value);

      gateGainNode = audioContext.createGain();
      gateGainNode.gain.value = 0; // Closed initially

      distortionNode = audioContext.createWaveShaper();
      distortionNode.curve = makeDistortionCurve(40);
      distortionNode.oversample = '4x';

      bandpassFilterNode = audioContext.createBiquadFilter();
      bandpassFilterNode.type = 'bandpass';
      bandpassFilterNode.frequency.value = 1200;
      bandpassFilterNode.Q.value = 1.6;

      delayNode = audioContext.createDelay(2.0);
      delayNode.delayTime.value = parseFloat(delaySlider.value);
      
      delayFeedbackNode = audioContext.createGain();
      delayFeedbackNode.gain.value = parseFloat(feedbackSlider.value) / 100;
      
      delayFilterNode = audioContext.createBiquadFilter();
      delayFilterNode.type = 'lowpass';
      delayFilterNode.frequency.value = 1500;

      // Connect Master Node to Analyzer, Compressor, and Output
      masterGainNode.connect(analyserNode);
      analyserNode.connect(compressorNode);
      compressorNode.connect(audioContext.destination);

    } else if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // 3. Connect voiceover microphone channel
    let micConnected = false;
    try {
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: { ideal: 0.005 }
        },
        video: false
      };
      
      const inputDeviceId = inputDeviceSelect.value;
      if (inputDeviceId) {
        constraints.audio.deviceId = { exact: inputDeviceId };
      }

      micStream = await navigator.mediaDevices.getUserMedia(constraints);
      micConnected = true;
      logToConsole("Microphone input capture successful (low-latency).", "success");
    } catch (err) {
      logToConsole(`Low-latency mic configuration failed: ${err.message}. Retrying with basic constraints...`, "warn");
      try {
        const inputDeviceId = inputDeviceSelect.value;
        const basicConstraints = { audio: true, video: false };
        if (inputDeviceId) {
          basicConstraints.audio = { deviceId: { exact: inputDeviceId } };
        }
        micStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        micConnected = true;
        logToConsole("Microphone input capture successful (standard fallback).", "success");
      } catch (fallbackErr) {
        logToConsole(`Microphone disabled: ${fallbackErr.message}. You can still load and mix music decks.`, "warn");
        micStream = null;
      }
    }

    if (micConnected && micStream) {
      if (micSourceNode) {
        try { micSourceNode.disconnect(); } catch(e) {}
      }
      micSourceNode = audioContext.createMediaStreamSource(micStream);
      
      // Wire Mic Channel to Gate
      micSourceNode.connect(micGainNode);
      micGainNode.connect(gateGainNode);
      
      // Wire Dynamic Mic Effects
      connectMicEffectsGraph();
    }

    // Start render loop
    renderVisualizer();
    
    logToConsole("Audio Mixer Engine Online.", "success");
    return true;
  } catch (err) {
    logToConsole(`Error starting mixer engine: ${err.message}`, "error");
    alert(`Engine failed: ${err.message}`);
    return false;
  }
}

// Route mic effects dynamically
function connectMicEffectsGraph() {
  if (!audioContext || !gateGainNode || !masterGainNode) return;

  // Disconnect mic FX nodes
  gateGainNode.disconnect();
  distortionNode.disconnect();
  bandpassFilterNode.disconnect();
  delayNode.disconnect();
  delayFeedbackNode.disconnect();
  delayFilterNode.disconnect();
  try {
    robotOscillatorNode.stop();
  } catch(e) {}

  // Route to master mix gain node (so it is controlled by Master Volume)
  if (currentPreset === 'bypass') {
    gateGainNode.connect(masterGainNode);
  } 
  else if (currentPreset === 'megaphone') {
    gateGainNode.connect(bandpassFilterNode);
    bandpassFilterNode.connect(distortionNode);
    distortionNode.connect(masterGainNode);
  } 
  else if (currentPreset === 'stadium') {
    gateGainNode.connect(masterGainNode); // Dry
    
    gateGainNode.connect(delayNode); // Wet
    delayNode.connect(delayFilterNode);
    delayFilterNode.connect(masterGainNode);
    
    delayFilterNode.connect(delayFeedbackNode);
    delayFeedbackNode.connect(delayNode);
  }
  else if (currentPreset === 'robot') {
    robotOscillatorNode = audioContext.createOscillator();
    robotOscillatorNode.type = 'sine';
    robotOscillatorNode.frequency.value = 65;
    
    robotGainNode = audioContext.createGain();
    robotGainNode.gain.value = 0.55;
    
    const ringModGain = audioContext.createGain();
    ringModGain.gain.value = 0.5;
    
    gateGainNode.connect(ringModGain);
    ringModGain.connect(masterGainNode);
    
    robotOscillatorNode.connect(robotGainNode);
    robotGainNode.connect(ringModGain.gain);
    
    robotOscillatorNode.start();
  }
}

// Stop Audio Engine
function stopAudioGraph() {
  // Pause track playbacks
  deckAElement.pause();
  deckBElement.pause();
  deckAPlayBtn.textContent = 'Play';
  deckBPlayBtn.textContent = 'Play';
  deckAPlayBtn.classList.remove('active');
  deckBPlayBtn.classList.remove('active');
  deckAVinyl.classList.remove('playing');
  deckBVinyl.classList.remove('playing');

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  
  if (micSourceNode) {
    try { micSourceNode.disconnect(); } catch(e) {}
    micSourceNode = null;
  }
  
  try {
    if (robotOscillatorNode) robotOscillatorNode.stop();
  } catch(e) {}
  
  if (audioContext) {
    audioContext.suspend();
  }
  
  isLive = false;
  logToConsole("Audio Mixer Engine Offline.", "system");
}

// Switch vocal preset
function changePreset(presetName) {
  currentPreset = presetName;
  connectMicEffectsGraph();
  logToConsole(`Vocal preset updated: ${presetName}`, 'info');
}

// Megaphone curve
function makeDistortionCurve(amount) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Toggle global power
async function togglePower() {
  if (isLive) {
    isLive = false;
    powerBtn.classList.remove('online');
    powerBtn.classList.add('offline');
    powerBtn.querySelector('.power-text').textContent = 'START MIXER ENGINE';
    
    statusBadge.textContent = 'Mixer Offline';
    statusBadge.className = 'status-badge offline';
    
    micPromptOverlay.classList.remove('hidden');
    meterFill.style.width = '0%';
    
    stopAudioGraph();
  } else {
    const started = await startAudioGraph();
    if (started) {
      isLive = true;
      powerBtn.classList.remove('offline');
      powerBtn.classList.add('online');
      powerBtn.querySelector('.power-text').textContent = 'STOP MIXER ENGINE';
      
      statusBadge.textContent = 'Mixer Active';
      statusBadge.className = 'status-badge online';
      
      micPromptOverlay.classList.add('hidden');
      
      // Start render loop
      renderVisualizer();
    }
  }
}

// Animation loop
function renderVisualizer() {
  if (!isLive || !analyserNode) return;

  // Deck A Looping Check
  if (deckALoopActive && deckAElement.currentTime >= deckALoopOut) {
    deckAElement.currentTime = deckALoopIn;
  }
  // Deck B Looping Check
  if (deckBLoopActive && deckBElement.currentTime >= deckBLoopOut) {
    deckBElement.currentTime = deckBLoopIn;
  }

  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  requestAnimationFrame(renderVisualizer);

  // Clear Canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Noise gate processing
  const thresholdDb = parseFloat(gateSlider.value);
  const gateEnabled = gateEnableToggle ? gateEnableToggle.checked : true;
  
  // Track master amplitude for level meter
  analyserNode.getByteTimeDomainData(dataArray);
  
  let sumSquares = 0;
  let maxVal = 0;
  for (let i = 0; i < bufferLength; i++) {
    const normVal = (dataArray[i] - 128) / 128;
    sumSquares += normVal * normVal;
    if (Math.abs(normVal) > maxVal) {
      maxVal = Math.abs(normVal);
    }
  }
  
  const rms = Math.sqrt(sumSquares / bufferLength);
  const currentDb = rms > 0 ? 20 * Math.log10(rms) : -100;

  if (micStream && gateGainNode) {
    if (gateEnabled) {
      if (currentDb > thresholdDb) {
        gateOpen = true;
        currentGateVolume = Math.min(1.0, currentGateVolume + gateAttack);
      } else {
        currentGateVolume = Math.max(0.0, currentGateVolume - gateRelease);
        if (currentGateVolume === 0) {
          gateOpen = false;
        }
      }
    } else {
      gateOpen = true;
      currentGateVolume = 1.0;
    }
    gateGainNode.gain.setTargetAtTime(currentGateVolume, audioContext.currentTime, 0.01);
  }

  // Update levels meter (reflects combined output)
  meterFill.style.width = `${Math.min(100, maxVal * 100 * 1.5)}%`;
  
  // Render visualizer details
  if (visualizerMode === 'wave') {
    canvasCtx.lineWidth = 3;
    
    // Gradient wave line
    const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#00f2fe');
    gradient.addColorStop(0.5, '#7c3aed');
    gradient.addColorStop(1, '#ff007f');
    
    canvasCtx.strokeStyle = gradient;
    canvasCtx.shadowBlur = 8;
    canvasCtx.shadowColor = '#00f2fe';
    canvasCtx.beginPath();
    
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      
      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
    canvasCtx.shadowBlur = 0;
  } else {
    // Frequency Bars
    analyserNode.getByteFrequencyData(dataArray);
    
    const barWidth = (canvas.width / (bufferLength * 0.6)) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength * 0.6; i++) {
      barHeight = dataArray[i] * 0.75;
      
      const gradient = canvasCtx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      gradient.addColorStop(0, '#ff007f');
      gradient.addColorStop(0.5, '#7c3aed');
      gradient.addColorStop(1, 'rgba(0, 242, 254, 0.2)');
      
      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
      
      x += barWidth;
    }
  }
}

// ==========================================
// DJ SAMPLER SYNTHESIS
// ==========================================

function playAirhorn() {
  if (!audioContext || !masterGainNode) return;
  const t = audioContext.currentTime;
  
  // Create a complex oscillator for the brassy horn sound
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const osc3 = audioContext.createOscillator();
  const osc4 = audioContext.createOscillator();
  
  osc1.type = 'sawtooth';
  osc2.type = 'square';
  osc3.type = 'sawtooth';
  osc4.type = 'square';
  
  osc1.frequency.setValueAtTime(300, t);
  osc2.frequency.setValueAtTime(300, t);
  osc3.frequency.setValueAtTime(450, t); // Perfect fifth
  osc4.frequency.setValueAtTime(600, t); // Octave
  
  const synthGain = audioContext.createGain();
  synthGain.gain.setValueAtTime(0, t);
  synthGain.gain.linearRampToValueAtTime(0.5, t + 0.05);
  synthGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
  
  osc1.connect(synthGain);
  osc2.connect(synthGain);
  osc3.connect(synthGain);
  osc4.connect(synthGain);
  
  synthGain.connect(masterGainNode);
  
  osc1.start(t);
  osc2.start(t);
  osc3.start(t);
  osc4.start(t);
  
  osc1.stop(t + 0.5);
  osc2.stop(t + 0.5);
  osc3.stop(t + 0.5);
  osc4.stop(t + 0.5);
  
  logToConsole('Sampler: Airhorn played', 'info');
}

function playLaser() {
  if (!audioContext || !masterGainNode) return;
  const t = audioContext.currentTime;
  
  const osc = audioContext.createOscillator();
  osc.type = 'sawtooth';
  
  // Pitch drop envelope
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
  
  const synthGain = audioContext.createGain();
  synthGain.gain.setValueAtTime(0, t);
  synthGain.gain.linearRampToValueAtTime(0.3, t + 0.02);
  synthGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  
  osc.connect(synthGain);
  synthGain.connect(masterGainNode);
  
  osc.start(t);
  osc.stop(t + 0.3);
  
  logToConsole('Sampler: Laser played', 'info');
}

function playScratch() {
  if (!audioContext || !masterGainNode) return;
  const t = audioContext.currentTime;
  
  // White noise buffer
  const bufferSize = audioContext.sampleRate * 0.4; // 0.4 seconds
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, t);
  filter.frequency.linearRampToValueAtTime(4000, t + 0.2);
  filter.frequency.linearRampToValueAtTime(800, t + 0.4);
  filter.Q.value = 5;
  
  const synthGain = audioContext.createGain();
  synthGain.gain.setValueAtTime(0, t);
  synthGain.gain.linearRampToValueAtTime(0.6, t + 0.05);
  synthGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
  
  noise.connect(filter);
  filter.connect(synthGain);
  synthGain.connect(masterGainNode);
  
  noise.start(t);
  
  logToConsole('Sampler: Scratch played', 'info');
}

function playDrop() {
  if (!audioContext || !masterGainNode) return;
  const t = audioContext.currentTime;
  
  const osc = audioContext.createOscillator();
  osc.type = 'sine';
  
  // Deep bass drop
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(10, t + 2.0);
  
  const synthGain = audioContext.createGain();
  synthGain.gain.setValueAtTime(0, t);
  synthGain.gain.linearRampToValueAtTime(0.8, t + 0.1);
  synthGain.gain.linearRampToValueAtTime(0.01, t + 2.0);
  
  // Add some distortion
  const waveShaper = audioContext.createWaveShaper();
  waveShaper.curve = makeDistortionCurve(20);
  
  osc.connect(waveShaper);
  waveShaper.connect(synthGain);
  synthGain.connect(masterGainNode);
  
  osc.start(t);
  osc.stop(t + 2.0);
  
  logToConsole('Sampler: Bass Drop played', 'info');
}
