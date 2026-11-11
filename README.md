# ⚡ Learn ESP32 — 互動式全圖形麵包板學習工作台

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-esp32/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-%E9%BB%9E%E6%AD%A4%E7%9B%B4%E6%8E%A5%E9%96%8B%E5%95%9F%E7%B7%9A%E4%B8%8A%E9%BA%B5%E5%8C%85%E6%9D%BF-06b6d4?style=for-the-badge" alt="Live Demo" />
  </a>
  <a href="https://github.com/DuRuofu/ESP32-Guide">
    <img src="https://img.shields.io/badge/Reference-DuRuofu%2FESP32--Guide-3b82f6?style=for-the-badge" alt="ESP32-Guide" />
  </a>
</p>

---

> [!IMPORTANT]
> ### 🤖 免責與創作聲明 (Vibe Coding Disclaimer)
> - **🇹🇼 中文**：本專案 **100% 完全由 Google Antigravity 以 Vibe Coding 方式自動生成**，純供本人自學 ESP32 接線與感測器使用——**本人其實一竅不通** 😄！歡迎拿去邊看邊照著接線或練習，但實際通電前請務必再次確認正負極（VCC/GND），燒板子本人不負責任喔！
> - **🇺🇸 English**: This project was **100% Vibe Coded using Google Antigravity** for my own personal ESP32 learning—**I actually have no idea what I'm doing!** 😄 Feel free to play with the interactive breadboard or follow the wiring diagrams, but please double-check your VCC/GND before powering on real hardware!
> - **🇯🇵 日本語**：このプロジェクトは個人的なESP32学習のために **Google Antigravity の Vibe Coding で100%自動生成されたもの** であり、**作者本人は全くの素人（ちんぷんかんぷん）です** 😄！ブラウザ上で自由に遊んだり配線の参考にしたりできますが、実機に電源を入れる前は必ずVCC/GNDを再確認してください。
> - **🇰🇷 한국어**: 이 프로젝트는 개인적인 ESP32 학습을 위해 **Google Antigravity의 Vibe Coding으로 100% 제작**되었으며, **사실 제작자 본인은 아무것도 모르는 초보자입니다** 😄! 웹에서 자유롭게 브레드보드 배선을 따라 해보실 수 있지만, 실제 전원을 연결하기 전에는 반드시 VCC/GND를 다시 확인해 주세요!

---

## 🌐 線上直接玩 (Online Interactive Workbench)

👉 **直接點擊開啟：[https://lottogt.github.io/learn-esp32/](https://lottogt.github.io/learn-esp32/)**  
*(免安裝任何軟體、免下載，電腦與平板瀏覽器點開即可直接看接線、拉滑桿模擬、或進行自由接線測驗！)*

---

## ✨ 核心功能 (Features)

| 功能模組 | 說明 |
| :--- | :--- |
| **🧩 中間全圖形 SVG 麵包板** | 內建標準 **30-Pin ESP32-WROOM-32 DevKitC** 與 48 欄麵包板（含正負電源軌 `+`/`-`、中央凹槽、A~J 列與欄號座標），所有腳位絲印與電阻色碼清楚可見。 |
| **💡 5 孔銅片導通高亮** | 滑鼠移到任意孔位、ESP32 接腳或杜邦線時，**麵包板內部同一排導通的 5 個孔位（`a~e` 或 `f~j`）會同步發光**，一眼搞懂為什麼插在同一排就能導通。 |
| **🎛️ 感測器物理量動態模擬器** | 拉動下方滑桿（溫度、濕度、照度、距離、舵機角度、陀螺儀傾角、RGB 色相、GPS 衛星數）或點擊麵包板上的微動按鈕，畫面上的 LED、SG90 舵機轉臂、OLED 螢幕與右下角 `UART0 Serial Monitor` 會即時反應。 |
| **⚡ 自由接線練習 / 測驗模式** | 切換至「練習模式」會拔除範例線材，讓你自己點擊麵包板孔位拉杜邦線；內建 **Breadboard Netlist 圖論解算器**，只要插在同一排 5 孔導通範圍內都算正確！還可點 **「🔗 分享目前接線」** 把你接好的網址傳給朋友看。 |
| **💻 雙框架程式碼一鍵複製** | 每個範例皆同時提供 **ESP-IDF (C 語言 v5.x，對齊 [DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide) 教程)** 與 **Arduino C++** 雙版本程式碼。 |

---

## 📚 收錄的 9 大經典外設與感測器範例 (Included Lessons)

1. **`4.1.1 GPIO 與外部中斷`**：5mm 紅光 LED + 220Ω 限流電阻 + 四腳微動按鈕（跨中央凹槽接法 + 內部上拉電阻）
2. **`4.1.6 LED PWM 與伺服馬達`**：LEDC 5kHz 呼吸燈調光 + SG90 伺服馬達（50Hz 角度控制 + 5V VIN 獨立供電與共地）
3. **`4.1.4 ADC 類比數位轉換`**：10kΩ 旋鈕可變電阻 + 光敏電阻照度模組（示範選用 `ADC1` GPIO34/32 避開 Wi-Fi `ADC2` 衝突）
4. **`4.2 單總線溫濕度`**：DHT11 / DHT22 溫濕度感測器 + **4.7kΩ DATA 上拉電阻** 跨接實務
5. **`4.1.3 定時器與脈寬測距`**：HC-SR04 超音波測距模組（`Trig` 10us 觸發 + `Echo` 回波時間換算距離）
6. **`4.1.7 I2C 雙線匯流排並聯`**：0.96" SSD1306 OLED (`0x3C`) + MPU6050 六軸姿態模組 (`0x68`) 共用 `GPIO21(SDA)/GPIO22(SCL)` 並聯示範
7. **`4.1.8 SPI 高速匯流排`**：MicroSD 卡讀寫模組（標準四線 VSPI `CS=5, SCK=18, MISO=19, MOSI=23` 同名直連）
8. **`4.1.9 RMT 智慧全彩燈珠`**：WS2812B 8 顆 RGB 燈環（利用 ESP32 RMT 外設輸出 800kHz GRB 單線定址訊號）
9. **`4.1.2 UART 序列埠交叉通訊`**：NEO-6M GPS 衛星定位模組（視覺化強調 **TX2 接模組 RX、RX2 接模組 TX** 交叉接線）

---

## 🛠️ 本機執行與後續擴充新接法 (Local Setup & Extending)

### 1. 本機啟動
- **免安裝直接開**：下載本專案後，直接用瀏覽器打開 [`standalone.html`](./standalone.html) 即可離線使用全部功能。
- **開發者模式**：
  ```bash
  npm install
  npm run dev
  ```

### 2. 如何新增更多感測器接法？
所有感測器與接線座標皆集中在 [`src/data/lessons.ts`](./src/data/lessons.ts)，只需在 `LESSONS` 陣列中新增一筆物件（或直接請 AI 幫你寫入），執行 `git push` 後 GitHub Actions 就會自動重新編譯並發布至 GitHub Pages！
