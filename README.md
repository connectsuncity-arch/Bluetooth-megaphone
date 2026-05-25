# AeroVox - Real-Time Megaphone & Bluetooth Mic

AeroVox is a high-fidelity, low-latency, real-time megaphone web application that allows you to turn your device's microphone into a live public address system routed directly to Bluetooth speakers or external sound setups. 

Built using the modern **Web Audio API** and stylized with a glassmorphic neon design, AeroVox provides real-time effects and essential safety controls to prevent microphone feedback loop howling.

## 🚀 Key Features

* **Real-Time Transmission**: Connects your device's microphone to your speaker system with sub-millisecond local processing.
* **Intelligent Noise Gate**: Cuts off silent periods and background buzz automatically to prevent acoustic feedback screeching.
* **Peak Limiting Compressor**: Normalizes volume spikes and limits peak amplitudes to protect ears and speakers.
* **Interactive Audio Presets**:
  * **Raw Mic (Bypass)**: High-quality, clean microphone feedback.
  * **Megaphone (Distortion)**: Emulates a traditional public address horn with a bandpass filter and saturation distortion.
  * **Stadium Echo (Delay)**: Connects a recursive delay feedback loop with low-pass absorption filters.
  * **Robot Voice (Ring Modulation)**: Modulates microphone levels with an LFO oscillator for a robotic vocal buzz.
* **Dynamic Neon Visualizer**: Visualizes live voice in either waveform oscilloscope or active frequency bar styles.
* **Audio Input/Output Routing**: Direct output device selection (`setSinkId`) where supported by the browser.

---

## 🛠️ How to Use

1. **Connect Bluetooth Speaker**:
   * Open your Operating System's Bluetooth settings.
   * Pair and connect your Bluetooth speaker.
   * Set the Bluetooth speaker as your system's default audio output.
2. **Launch AeroVox**:
   * Double-click `index.html` to open it in a modern web browser (Google Chrome, Microsoft Edge, or Firefox).
3. **Select Devices**:
   * Use the **Input Source** dropdown to select your primary microphone (e.g., external headset, built-in array).
   * Use the **Output Target** dropdown to route audio (supported in Chrome/Edge).
4. **Start Transmission**:
   * Click the large **Power Switch** in the center panel.
   * Accept the browser microphone access request.
5. **Adjust Parameters**:
   * Speak into your microphone and watch the **Signal Level** meter and **Live Spectrum**.
   * Adjust **Mic Gain** to increase volume boost.
   * Adjust **Noise Gate** threshold to filter background noise when you are not speaking.

---

## ⚡ Mitigating Audio Feedback (Howling)

Acoustic feedback occurs when sound from the speaker is picked up by the microphone, amplified, and sent back to the speaker, causing a high-pitched screech. To prevent this:

1. **Keep Distance**: Place your Bluetooth speaker far away from your microphone, pointing in the opposite direction.
2. **Increase Noise Gate**: Drag the noise gate threshold slider higher (e.g., `-40 dB` to `-30 dB`) to silence the audio pathway during speaking pauses.
3. **Wear Headphones**: If you are using the app for personal monitoring, wear headphones to isolate the output from the mic.
4. **Use Directional Mic**: A lapel mic or headset microphone pointing away from the speaker offers the best isolation.

---

## 🛡️ License

Apache License 2.0. Developed under Google Antigravity ecosystems.
