# ⚡ Learn ESP32 — インタラクティブ・ブレッドボード学習ワークベンチ

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-esp32/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-%E3%82%AA%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E3%81%A7%E9%81%8A%E3%81%B6-06b6d4?style=for-the-badge" alt="Live Demo" />
  </a>
  <a href="https://github.com/DuRuofu/ESP32-Guide">
    <img src="https://img.shields.io/badge/Reference-DuRuofu%2FESP32--Guide-3b82f6?style=for-the-badge" alt="ESP32-Guide" />
  </a>
</p>

> [!IMPORTANT]
> ### 🤖 免責事項（Vibe Coding 宣言）
> このプロジェクトは、私個人の ESP32 学習用に **Google Antigravity の Vibe Coding によって 100% 自動生成されたもの** です。**作者本人はプログラミングも電子工作も全くの素人（ちんぷんかんぷん）です** 😄！
> どなたでもブラウザ上で自由に配線を試したり、実際のブレッドボード配線の参考にしたりできますが、実機に電源を入れる前には必ず `VCC` と `GND` の向きを再確認してください！

---

## 🙏 謝辞・参考にしたオープンソースプロジェクト (Credits & References)

原作者およびオープンソースコミュニティへの敬意を表し、本プロジェクトの制作にあたり参考・引用させていただいた GitHub リポジトリを以下に明記いたします：

| リポジトリ | 原作者 / メンテナ | 参考・引用内容 |
| :--- | :--- | :--- |
| **[DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide)** | [@DuRuofu](https://github.com/DuRuofu) | **メインカリキュラム・章構成の参考元**：第4.1章の基本ペリフェラル（GPIO、UART、GPTimer、ADC、LEDC PWM、I2C、SPI）および第4.2章のストレージ・センサー実践の構成と ESP-IDF サンプルコードは、DuRuofu 氏の素晴らしい入門チュートリアル『ESP32从初见到入门』を参考にしています。 |
| **[espressif/esp-idf](https://github.com/espressif/esp-idf)** | [Espressif Systems](https://github.com/espressif) | **公式 ESP-IDF v5.x フレームワーク**：ESP-IDF (C言語) の各ペリフェラル API（`driver/gpio`、`driver/ledc`、`esp_adc/adc_oneshot`、`driver/i2c_master`、`esp_vfs_fat`、`driver/uart`、`espressif/led_strip`）および ESP32-WROOM-32 のピン仕様の参照元。 |
| **[espressif/arduino-esp32](https://github.com/espressif/arduino-esp32)** | [Espressif Systems](https://github.com/espressif) | **Arduino Core for ESP32**：Arduino C++ 対照コードの API リファレンス。 |
| **[adafruit/DHT-sensor-library](https://github.com/adafruit/DHT-sensor-library)** & **[adafruit/Adafruit_NeoPixel](https://github.com/adafruit/Adafruit_NeoPixel)** | [Adafruit Industries](https://github.com/adafruit) | Arduino C++ サンプルにおける DHT11 温湿度センサーおよび WS2812B フルカラー LED 制御ライブラリの参照元。 |
| **[facebook/react](https://github.com/facebook/react)** & **[vitejs/vite](https://github.com/vitejs/vite)** | Meta Open Source & Vite Team | 本アプリケーションのフロントエンド UI 構築およびビルドツール。 |

---

## 🌟 主な機能

1. **フルグラフィック SVG ブレッドボード（PC ＆ スマホ縦画面対応）**：
   - ピン番号、抵抗のカラーコード（220Ω電流制限抵抗、4.7kΩプルアップ抵抗）、ジャンパー線の役割を分かりやすく表示します。
   - **5穴導通ハイライト機能**：穴やピンにマウスを重ねる（またはタップする）と、ブレッドボード内部で導通している縦5穴（`a〜e` または `f〜j`）と電源レール（`+`/`-`）が同時に光ります。
2. **センサー物理量シミュレーター ＆ シリアルモニター**：
   - 温度・湿度（DHT11）、照度（LDR）、超音波距離（HC-SR04）、サーボ角度（SG90）、ジャイロ傾き（MPU6050）、フルカラーLED（WS2812B）のスライダーを動かすと、ブレッドボード上のパーツと `UART0 Serial Monitor` がリアルタイムに連動します。
3. **自由配線練習・クイズモード ＆ URL共有**：
   - 「練習モード」に切り替えると、自分でブレッドボードの穴をクリックしてジャンパー線を引く練習ができ、回路が正しく導通しているか自動判定します。また、自分の配線をURLとして友達にシェアすることも可能です。
4. **ESP-IDF (C言語) ＆ Arduino C++ デュアルコード対応**：
   - [DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide) に準拠した **ESP-IDF (C)** コードと、手軽に試せる **Arduino C++** コードをワンクリックで切り替え・コピーできます。

## 🚀 使い方
- **Webで今すぐ開く**: [https://lottogt.github.io/learn-esp32/](https://lottogt.github.io/learn-esp32/)
- **オフライン単一ファイル版**: [`standalone.html`](./standalone.html) をダブルクリックするだけでサーバー不要で動作します。
