/**
 * AeroMix Cloud Sync System
 * Save and sync presets, mixes, and settings across devices (Premium+)
 */

const CLOUD_CONFIG = {
  API_URL: 'https://aeromix-api.herokuapp.com/api',
  MAX_PRESETS: 50, // Premium: 50, Pro: 200, Lifetime: unlimited
  MAX_MIX_SIZE: 100 // MB
};

let cloudPresets = [];
let cloudMixes = [];
let lastSyncTime = null;

/**
 * Initialize cloud sync
 */
async function initCloudSync() {
  if (!isPremium()) return;
  
  try {
    logToConsole('Syncing with cloud...', 'info');
    await loadCloudPresets();
    await loadCloudMixes();
    logToConsole('Cloud sync complete', 'success');
  } catch (err) {
    logToConsole(`Cloud sync error: ${err.message}`, 'warn');
  }
}

/**
 * Save preset to cloud
 */
async function savePresetToCloud(presetName, presetData) {
  if (!isPremium() || !authToken) {
    showUpgradeModal('Cloud Preset Saving');
    return false;
  }
  
  try {
    logToConsole(`Saving preset: ${presetName}...`, 'info');
    
    // Serialize all current audio settings
    const preset = {
      name: presetName,
      timestamp: new Date().toISOString(),
      settings: {
        // Microphone settings
        micGain: parseFloat(gainSlider.value),
        noiseGate: parseFloat(gateSlider.value),
        delayTime: parseFloat(delaySlider.value),
        delayFeedback: parseFloat(feedbackSlider.value),
        currentPreset: currentPreset,
        
        // Deck settings
        deckA: {
          pitch: parseFloat(deckAPitchSlider.value),
          bpm: parseFloat(deckABpmInput.value),
          eqHigh: parseFloat(deckAEqHigh.value),
          eqMid: parseFloat(deckAEqMid.value),
          eqLow: parseFloat(deckAEqLow.value),
          gain: deckAGainNode ? deckAGainNode.gain.value : 1
        },
        deckB: {
          pitch: parseFloat(deckBPitchSlider.value),
          bpm: parseFloat(deckBBpmInput.value),
          eqHigh: parseFloat(deckBEqHigh.value),
          eqMid: parseFloat(deckBEqMid.value),
          eqLow: parseFloat(deckBEqLow.value),
          gain: deckBGainNode ? deckBGainNode.gain.value : 1
        },
        
        // Mixer settings
        crossfader: parseInt(crossfaderSlider.value),
        masterVolume: parseInt(masterVolumeSlider.value),
        
        // Custom user data
        ...presetData
      }
    };
    
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/save-preset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(preset)
    });
    
    if (!response.ok) throw new Error('Save failed');
    
    const data = await response.json();
    cloudPresets.push(data.preset);
    
    logToConsole(`✓ Preset "${presetName}" saved to cloud`, 'success');
    return true;
  } catch (err) {
    logToConsole(`Preset save error: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Load preset from cloud
 */
async function loadCloudPreset(presetId) {
  if (!isPremium() || !authToken) return false;
  
  try {
    logToConsole('Loading preset...', 'info');
    
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/preset/${presetId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error('Load failed');
    
    const data = await response.json();
    const preset = data.preset.settings;
    
    // Apply preset settings
    gainSlider.value = preset.micGain;
    gainVal.textContent = `${preset.micGain.toFixed(2)}x`;
    
    gateSlider.value = preset.noiseGate;
    gateVal.textContent = `${preset.noiseGate} dB`;
    
    delaySlider.value = preset.delayTime;
    delayVal.textContent = `${preset.delayTime.toFixed(2)}s`;
    
    feedbackSlider.value = preset.delayFeedback;
    feedbackVal.textContent = `${preset.delayFeedback}%`;
    
    // Apply deck A settings
    deckAPitchSlider.value = preset.deckA.pitch;
    deckAPitchVal.textContent = `${preset.deckA.pitch.toFixed(2)}x`;
    deckABpmInput.value = preset.deckA.bpm;
    deckAEqHigh.value = preset.deckA.eqHigh;
    deckAEqMid.value = preset.deckA.eqMid;
    deckAEqLow.value = preset.deckA.eqLow;
    
    // Apply deck B settings
    deckBPitchSlider.value = preset.deckB.pitch;
    deckBPitchVal.textContent = `${preset.deckB.pitch.toFixed(2)}x`;
    deckBBpmInput.value = preset.deckB.bpm;
    deckBEqHigh.value = preset.deckB.eqHigh;
    deckBEqMid.value = preset.deckB.eqMid;
    deckBEqLow.value = preset.deckB.eqLow;
    
    // Apply mixer settings
    crossfaderSlider.value = preset.crossfader;
    updateCrossfader();
    masterVolumeSlider.value = preset.masterVolume;
    updateMasterVolume();
    
    logToConsole(`✓ Preset loaded`, 'success');
    return true;
  } catch (err) {
    logToConsole(`Preset load error: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Load all cloud presets
 */
async function loadCloudPresets() {
  if (!isPremium() || !authToken) return;
  
  try {
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/presets`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error('Load failed');
    
    const data = await response.json();
    cloudPresets = data.presets;
    displayCloudPresets();
  } catch (err) {
    logToConsole(`Load presets error: ${err.message}`, 'error');
  }
}

/**
 * Display cloud presets in UI
 */
function displayCloudPresets() {
  const container = document.querySelector('.cloud-presets-container');
  if (!container) return;
  
  container.innerHTML = cloudPresets.map(preset => `
    <div class="preset-item">
      <h4>${preset.name}</h4>
      <p class="date">${new Date(preset.timestamp).toLocaleDateString()}</p>
      <div class="actions">
        <button onclick="loadCloudPreset('${preset.id}')">Load</button>
        <button onclick="deleteCloudPreset('${preset.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

/**
 * Delete cloud preset
 */
async function deleteCloudPreset(presetId) {
  if (!confirm('Delete this preset?')) return;
  
  try {
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/preset/${presetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error('Delete failed');
    
    cloudPresets = cloudPresets.filter(p => p.id !== presetId);
    displayCloudPresets();
    logToConsole('Preset deleted', 'info');
  } catch (err) {
    logToConsole(`Delete error: ${err.message}`, 'error');
  }
}

/**
 * Save mix to cloud (Pro+ only)
 */
async function saveMixToCloud(mixName, mixData) {
  if (!isPro() || !authToken) {
    showUpgradeModal('Cloud Mix Recording');
    return false;
  }
  
  try {
    logToConsole(`Saving mix: ${mixName}...`, 'info');
    
    const mix = {
      name: mixName,
      duration: mixData.duration,
      timestamp: new Date().toISOString(),
      size: mixData.audioBlob.size,
      audioData: await mixData.audioBlob.arrayBuffer()
    };
    
    const formData = new FormData();
    formData.append('name', mix.name);
    formData.append('duration', mix.duration);
    formData.append('audio', mixData.audioBlob);
    
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/save-mix`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    
    if (!response.ok) throw new Error('Save failed');
    
    logToConsole(`✓ Mix "${mixName}" saved to cloud`, 'success');
    return true;
  } catch (err) {
    logToConsole(`Mix save error: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Load cloud mixes
 */
async function loadCloudMixes() {
  if (!isPro() || !authToken) return;
  
  try {
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/mixes`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error('Load failed');
    
    const data = await response.json();
    cloudMixes = data.mixes;
    displayCloudMixes();
  } catch (err) {
    logToConsole(`Load mixes error: ${err.message}`, 'error');
  }
}

/**
 * Display cloud mixes in UI
 */
function displayCloudMixes() {
  const container = document.querySelector('.cloud-mixes-container');
  if (!container) return;
  
  container.innerHTML = cloudMixes.map(mix => `
    <div class="mix-item">
      <h4>${mix.name}</h4>
      <p class="duration">${Math.floor(mix.duration / 60)}:${(mix.duration % 60).toString().padStart(2, '0')}</p>
      <p class="date">${new Date(mix.timestamp).toLocaleDateString()}</p>
      <div class="actions">
        <button onclick="playCloudMix('${mix.id}')">Play</button>
        <button onclick="downloadCloudMix('${mix.id}', '${mix.name}')">Download</button>
        <button onclick="deleteCloudMix('${mix.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

/**
 * Download mix from cloud
 */
async function downloadCloudMix(mixId, mixName) {
  try {
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/mix/${mixId}/download`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mixName}.wav`;
    a.click();
    
    logToConsole('Mix downloaded', 'success');
  } catch (err) {
    logToConsole(`Download error: ${err.message}`, 'error');
  }
}

/**
 * Delete cloud mix
 */
async function deleteCloudMix(mixId) {
  if (!confirm('Delete this mix?')) return;
  
  try {
    const response = await fetch(`${CLOUD_CONFIG.API_URL}/cloud/mix/${mixId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error('Delete failed');
    
    cloudMixes = cloudMixes.filter(m => m.id !== mixId);
    displayCloudMixes();
    logToConsole('Mix deleted', 'info');
  } catch (err) {
    logToConsole(`Delete error: ${err.message}`, 'error');
  }
}
