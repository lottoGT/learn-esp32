# ⚡ Learn ESP32 — Interactive Visual Breadboard Workbench

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-esp32/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-Launch_Interactive_Breadboard-06b6d4?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

> [!IMPORTANT]
> ### 🤖 Vibe Coding Disclaimer
> This entire project was **100% Vibe Coded with Google Antigravity** for my own personal ESP32 learning—**I honestly know nothing about coding or electronics myself!** 😄
> Feel free to click the link above to play with the interactive breadboard, practice wiring, or follow along with your physical ESP32 board. Always double-check `VCC` and `GND` before powering up real hardware!

---

## 🌟 Key Features

1. **Interactive SVG Breadboard & 30-Pin ESP32-WROOM-32**:
   - Clear silkscreen pin labels, resistor color bands (`220Ω`, `4.7kΩ`), and color-coded jumper wires.
   - **5-Hole Conductive Strip Highlight**: Hover over any hole, pin, or jumper wire to illuminate all 5 internally connected holes (`a-e` or `f-j`) and power rails (`+`/`-`).
2. **Live Sensor Physics Simulator & Serial Monitor**:
   - Adjust sliders for temperature, humidity, light (Lux), ultrasonic distance (cm), servo angle (`0°-180°`), IMU pitch/roll, RGB hue, or press the tactile switch right on the breadboard—watch the LED, SG90 servo horn, OLED screen, and `UART0 Serial Monitor (115200 bps)` react in real time.
3. **Free Wiring Practice / Quiz Mode & Shareable Links**:
   - Switch to **Practice Mode** to unplug the wires and practice wiring the breadboard yourself. Built-in graph BFS netlist verification checks if your connections are electrically valid across the 5-hole strips. Click **"🔗 分享目前接線"** to copy a shareable URL with your custom wiring!
4. **Dual-Framework Code (ESP-IDF C & Arduino C++)**:
   - Side-by-side **ESP-IDF v5.x (C)** code (aligned with [DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide)) and **Arduino C++** code with one-click copy.

## 🚀 Try It Now
- **Online**: [https://lottogt.github.io/learn-esp32/](https://lottogt.github.io/learn-esp32/)
- **Offline Single File**: Download and double-click [`standalone.html`](./standalone.html) in any browser.
- **Development**:
  ```bash
  npm install
  npm run dev
  ```
