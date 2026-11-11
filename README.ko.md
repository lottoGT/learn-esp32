# ⚡ Learn ESP32 — 인터랙티브 그래픽 브레드보드 학습 워크벤치

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-esp32/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-%EC%98%A8%EB%9D%BC%EC%9D%B8_%EB%B8%8C%EB%A0%88%EB%93%9C%EB%B3%B4%EB%93%9C_%EC%8B%A4%ED%96%89-06b6d4?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

> [!IMPORTANT]
> ### 🤖 안내 및 면책 조항 (Vibe Coding Disclaimer)
> 이 프로젝트는 개인적인 ESP32 학습을 위해 **Google Antigravity의 Vibe Coding으로 100% 자동 생성된 프로젝트**이며, **사실 제작자 본인은 코딩이나 회로에 대해 아무것도 모르는 왕초보입니다** 😄!
> 친구들과 함께 링크를 열어 배선을 따라 해보거나 연습용으로 자유롭게 사용하실 수 있습니다. 단, 실제 하드웨어에 전원을 연결하기 전에는 반드시 `VCC`와 `GND`를 다시 한번 확인해 주세요!

---

## 🌟 주요 기능

1. **고해상도 SVG 인터랙티브 브레드보드 (30핀 ESP32-WROOM-32)**:
   - 모든 핀 번호, 저항 색상 띠(220Ω, 4.7kΩ 풀업 저항), 점퍼선 연결 위치가 한눈에 보이도록 표시됩니다.
   - **5홀 내부 도통 하이라이트**: 마우스를 브레드보드 구멍이나 점퍼선 위에 올리면 내부적으로 연결된 5개의 구멍(`a~e` 또는 `f~j`)과 전원 레일(`+`/`-`)이 동시에 빛납니다.
2. **실시간 센서 시뮬레이터 & 시리얼 모니터**:
   - 온습도(DHT11), 조도(LDR), 초음파 거리(HC-SR04), 서보모터 각도(SG90), 자이로 기울기(MPU6050), RGB LED(WS2812B) 슬라이더를 조작하면 브레드보드 부품과 하단 `UART0 Serial Monitor`가 실시간으로 반응합니다.
3. **자유 배선 연습 / 퀴즈 모드 & 링크 공유**:
   - '연습 모드'로 전환하면 직접 브레드보드 구멍을 클릭해 점퍼선을 연결해보고 회로가 올바르게 연결되었는지 즉시 확인할 수 있습니다. 또한 내가 연결한 배선 상태를 URL 링크로 복사해 친구에게 공유할 수 있습니다.
4. **ESP-IDF (C) & Arduino C++ 코드 동시 제공**:
   - [DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide) 튜토리얼 기반의 **ESP-IDF (C)** 코드와 **Arduino C++** 코드를 탭 하나로 전환하고 복사할 수 있습니다.

## 🚀 바로 실행하기
- **웹에서 바로 실행**: [https://lottogt.github.io/learn-esp32/](https://lottogt.github.io/learn-esp32/)
- **오프라인 단일 파일 실행**: [`standalone.html`](./standalone.html) 파일을 더블클릭하면 별도 설치 없이 브라우저에서 즉시 실행됩니다.
