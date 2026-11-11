import { ExampleLesson } from '../types/esp32';

export const LESSONS: ExampleLesson[] = [
  {
    id: 'gpio-led-button',
    chapter: '4.1.1 GPIO 與外部中斷',
    title: 'LED 閃爍與按鈕外部中斷控制',
    subtitle: '認識麵包板限流電阻跨接、微動開關四腳結構與內部上拉電阻',
    difficulty: '入門',
    protocols: ['GPIO'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4.1.1 節：GPIO 輸入輸出與中斷 (code/04.peripheral/basics/gpio)',
    summary:
      '透過 ESP32 的 GPIO5 輸出高低電位驅動外部 LED，並使用 GPIO27 搭配內部上拉電阻（Internal Pull-up）讀取四腳微動開關狀態，按下時觸發外部下降沿中斷（Falling Edge ISR）切換 LED 亮滅。',
    applicationScenes: [
      '設備狀態指示燈、故障警報燈號控制',
      '實體按鍵觸發重置、模式切換或緊急停機訊號讀取',
      '繼電器（Relay）或固態開關的基礎高低電位觸發',
    ],
    hardwarePrinciples: [
      'LED 長腳為正極（Anode），需串聯 220Ω~330Ω 限流電阻保護 LED 與 ESP32 腳位（ESP32 單腳最大安全輸出電流約 12mA~20mA）。',
      '四腳微動開關跨接在麵包板中央凹槽（e 列與 f 列），確保兩側腳位不會被同一排銅片直接短路。',
      '啟用 GPIO27 內部上拉電阻（Pull-up）後，未按下時腳位維持 3.3V 高電位（1），按下後接通 GND 變為低電位（0），可省去一顆外部上拉電阻。',
    ],
    pitfalls: [
      '⚠️ 切勿將 LED 不加限流電阻直接接在 GPIO 與 GND 之間，容易燒毀 LED 或損傷 IO 驅動電路。',
      '⚠️ GPIO34 / 35 / 36 / 39 僅支援輸入且「沒有」內部上拉/下拉電阻，若接按鈕必須外加上拉電阻；建議按鈕優先接 GPIO27、26、25、32、33。',
    ],
    components: [
      {
        id: 'comp-led-red',
        name: '5mm 紅色 LED',
        model: 'LED-RED-5MM',
        visualType: 'led',
        colStart: 27,
        colEnd: 28,
        rowPlacement: 'upper',
        ledColor: '#ef4444',
        pins: [
          {
            id: 'led-anode',
            label: 'A (+長腳)',
            hole: 'c27',
            type: 'signal',
            description: 'LED 正極，經 220Ω 限流電阻接至 ESP32 GPIO5',
            targetNet: 'GPIO5',
          },
          {
            id: 'led-cathode',
            label: 'K (-短腳)',
            hole: 'c28',
            type: 'gnd',
            description: 'LED 負極，接至 GND 負極電源軌',
            targetNet: 'GND',
          },
        ],
      },
      {
        id: 'comp-btn-1',
        name: '四腳微動按鈕',
        model: 'TACT-6X6MM',
        visualType: 'button',
        colStart: 35,
        colEnd: 37,
        rowPlacement: 'bridge',
        pins: [
          {
            id: 'btn-1a',
            label: 'Pin 1 (訊號端)',
            hole: 'e35',
            type: 'signal',
            description: '按鈕上側左腳，接 ESP32 GPIO27（已開內部上拉）',
            targetNet: 'GPIO27',
          },
          {
            id: 'btn-1b',
            label: 'Pin 2 (內部常通)',
            hole: 'e37',
            type: 'nc',
            description: '按鈕上側右腳（與 e35 內部導通）',
          },
          {
            id: 'btn-2a',
            label: 'Pin 3 (接地端)',
            hole: 'f35',
            type: 'gnd',
            description: '按鈕下側左腳，按下時與上側導通，接至 GND',
            targetNet: 'GND',
          },
          {
            id: 'btn-2b',
            label: 'Pin 4 (內部常通)',
            hole: 'f37',
            type: 'nc',
            description: '按鈕下側右腳（與 f35 內部導通）',
          },
        ],
      },
    ],
    passives: [
      {
        id: 'res-led-220',
        type: 'resistor',
        value: '220Ω 限流電阻',
        fromHole: 'b24',
        toHole: 'b27',
        purpose: '限制流經紅色 LED 的電流約 (3.3V - 2.0V) / 220Ω ≈ 5.9mA',
        bands: ['#ef4444', '#ef4444', '#78350f', '#eab308'],
      },
    ],
    wires: [
      {
        id: 'w-gnd-rail-top',
        fromHole: 'a5',
        toHole: 'tp-5',
        color: 'black',
        signalName: 'GND 主接地線',
        espPin: 'GND (Pin 2)',
        sensorPin: '上排負極軌 (tp-)',
        description: '將 ESP32 GND 引出至麵包板上方負極電源軌 (-)，方便各元件共地',
      },
      {
        id: 'w-gpio5-res',
        fromHole: 'a11',
        toHole: 'a24',
        color: 'yellow',
        signalName: 'LED 控制訊號 (GPIO5)',
        espPin: 'GPIO5 (D5)',
        sensorPin: '220Ω 電阻左端 (第24欄)',
        description: '從 ESP32 D5 (GPIO5) 輸出高電位，經第 24 欄的 220Ω 限流電阻流向第 27 欄 LED 正極',
      },
      {
        id: 'w-led-gnd',
        fromHole: 'a28',
        toHole: 'tp-28',
        color: 'black',
        signalName: 'LED 負極接地',
        espPin: '上排負極軌 (tp-)',
        sensorPin: 'LED K 負極 (c28)',
        description: 'LED 短腳負極接回上方 GND 電源軌完成迴路',
      },
      {
        id: 'w-btn-sig',
        fromHole: 'i9',
        toHole: 'd35',
        color: 'green',
        signalName: '按鈕中斷輸入 (GPIO27)',
        espPin: 'GPIO27 (D27)',
        sensorPin: '按鈕 Pin 1 (e35 同排)',
        description: '讀取按鈕狀態，當按鈕按下時電位由 3.3V 被拉低至 0V (Falling Edge)',
      },
      {
        id: 'w-btn-gnd',
        fromHole: 'i5',
        toHole: 'h35',
        color: 'black',
        signalName: '按鈕接地線',
        espPin: 'GND (Pin 17)',
        sensorPin: '按鈕 Pin 3 (f35 同排)',
        description: '提供按鈕按下時的低電位 (GND) 參考路徑',
      },
    ],
    simControls: [
      {
        id: 'buttonPressed',
        label: '按住微動開關 (GPIO27 接地)',
        type: 'toggle',
        defaultValue: 0,
      },
      {
        id: 'blinkFreq',
        label: '自動閃爍頻率',
        type: 'slider',
        min: 0,
        max: 5,
        step: 1,
        unit: 'Hz',
        defaultValue: 1,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 4.1.1 GPIO 範例 (ESP-IDF v5.x)
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_log.h"

#define LED_GPIO_PIN    GPIO_NUM_5
#define BTN_GPIO_PIN    GPIO_NUM_27

static volatile bool led_state = false;

// 外部中斷服務常式 (ISR)
static void IRAM_ATTR gpio_isr_handler(void* arg) {
    led_state = !led_state;
    gpio_set_level(LED_GPIO_PIN, led_state ? 1 : 0);
}

void app_main(void) {
    // 1. 設定 GPIO5 為推挽輸出 (驅動 LED)
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << LED_GPIO_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&io_conf);

    // 2. 設定 GPIO27 為輸入 + 啟用內部上拉 + 下降沿觸發中斷
    io_conf.pin_bit_mask = (1ULL << BTN_GPIO_PIN);
    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pull_up_en = GPIO_PULLUP_ENABLE;
    io_conf.intr_type = GPIO_INTR_NEGEDGE;
    gpio_config(&io_conf);

    // 3. 安裝 GPIO ISR 服務並註冊處理函式
    gpio_install_isr_service(0);
    gpio_isr_handler_add(BTN_GPIO_PIN, gpio_isr_handler, NULL);

    ESP_LOGI("GPIO_DEMO", "GPIO 初始化完成，按下按鈕切換 LED 狀態");
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：LED 與按鈕外部中斷
#include <Arduino.h>

const int LED_PIN = 5;   // D5 (GPIO5)
const int BTN_PIN = 27;  // D27 (GPIO27)

volatile bool ledState = false;
volatile unsigned long lastDebounceTime = 0;

void IRAM_ATTR onButtonPress() {
  unsigned long now = millis();
  // 簡易硬體彈跳過濾 (30ms)
  if (now - lastDebounceTime > 30) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    lastDebounceTime = now;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  // 啟用內部上拉電阻，未按下為 HIGH，按下接地為 LOW
  pinMode(BTN_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BTN_PIN), onButtonPress, FALLING);
  Serial.println("[READY] 按下 GPIO27 按鈕可切換 GPIO5 LED");
}

void loop() {
  delay(500);
}`,
  },

  {
    id: 'pwm-led-servo',
    chapter: '4.1.6 LED PWM 與伺服馬達',
    title: 'LEDC PWM 呼吸燈與 SG90 伺服馬達控制',
    subtitle: '利用脈衝寬度調變（PWM）控制類比亮度與舵機旋轉角度',
    difficulty: '入門',
    protocols: ['PWM'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4.1.6 節：LED PWM 控制器 (code/04.peripheral/basics/led_pwm)',
    summary:
      'ESP32 內建硬體 LEDC（LED PWM 控制器），不僅能以高頻（如 5kHz）無段調節 LED 亮度實現硬體漸變呼吸燈，也能輸出標準 50Hz（週期 20ms，脈寬 0.5ms~2.5ms）訊號精準控制 SG90 伺服馬達角度（0°~180°）。',
    applicationScenes: [
      'LED 無段調光、機台狀態呼吸燈、RGB 混色控制',
      'SG90 / MG996R 伺服馬達轉角控制（機械手臂、自動閥門、雲台）',
      '直流馬達轉速控制（搭配驅動模組如 L298N / TB6612）',
    ],
    hardwarePrinciples: [
      'PWM 透過改變高電位佔整個週期的比例（Duty Cycle 佔空比）來控制平均輸出功率。',
      'SG90 伺服馬達工作電壓為 4.8V~6V，因此紅線必須接 ESP32 的 VIN (5V) 腳位，不可接 3.3V（否則扭力不足且可能害 3.3V 穩壓器壓降重啟）。',
      'SG90 的橘黃色訊號線只需 3.3V PWM 即可識別，接至 GPIO25，且電源地線（棕線）務必與 ESP32 GND 共地。',
    ],
    pitfalls: [
      '⚠️ 伺服馬達啟動瞬間抽電流較大（可達 250mA~500mA），務必接在 VIN (5V) 或外接獨立 5V 電源並與 ESP32 共地。',
      '⚠️ 控制伺服馬達時 PWM 頻率必須固定為 50Hz（週期 20ms），佔空比約在 2.5% (0°) ~ 12.5% (180°) 之間，切勿給 100% 佔空比以免卡死燒毀舵機。',
    ],
    components: [
      {
        id: 'comp-led-pwm',
        name: '高亮藍光 LED',
        model: 'LED-BLUE-5MM',
        visualType: 'led',
        colStart: 27,
        colEnd: 28,
        rowPlacement: 'upper',
        ledColor: '#38bdf8',
        pins: [
          {
            id: 'pwm-led-a',
            label: 'A (+長腳)',
            hole: 'c27',
            type: 'signal',
            description: '經 220Ω 電阻接 GPIO5 (5kHz PWM 調光)',
            targetNet: 'GPIO5',
          },
          {
            id: 'pwm-led-k',
            label: 'K (-短腳)',
            hole: 'c28',
            type: 'gnd',
            description: '接 GND',
            targetNet: 'GND',
          },
        ],
      },
      {
        id: 'comp-servo-sg90',
        name: 'SG90 微型伺服馬達',
        model: 'SG90-9G',
        visualType: 'servo_sg90',
        colStart: 35,
        colEnd: 37,
        rowPlacement: 'lower',
        pins: [
          {
            id: 'sg90-pwm',
            label: 'PWM (橘線)',
            hole: 'h35',
            type: 'signal',
            description: '50Hz PWM 角度控制訊號，接 ESP32 GPIO25',
            targetNet: 'GPIO25',
          },
          {
            id: 'sg90-vcc',
            label: 'VCC (紅線 5V)',
            hole: 'h36',
            type: 'power',
            description: '伺服馬達 5V 電源，接 ESP32 VIN (5V)',
            targetNet: '5V',
          },
          {
            id: 'sg90-gnd',
            label: 'GND (棕線)',
            hole: 'h37',
            type: 'gnd',
            description: '伺服馬達接地線，與 ESP32 共地',
            targetNet: 'GND',
          },
        ],
      },
    ],
    passives: [
      {
        id: 'res-pwm-220',
        type: 'resistor',
        value: '220Ω 限流電阻',
        fromHole: 'b24',
        toHole: 'b27',
        purpose: '藍光 LED 限流保護',
        bands: ['#ef4444', '#ef4444', '#78350f', '#eab308'],
      },
    ],
    wires: [
      {
        id: 'w-pwm-led',
        fromHole: 'a11',
        toHole: 'a24',
        color: 'cyan',
        signalName: 'LEDC 5kHz PWM (GPIO5)',
        espPin: 'GPIO5 (D5)',
        sensorPin: '220Ω 電阻輸入端 (a24)',
        description: '輸出 13-bit 解析度 PWM 訊號控制藍光 LED 亮度',
      },
      {
        id: 'w-pwm-led-gnd',
        fromHole: 'a5',
        toHole: 'a28',
        color: 'black',
        signalName: 'LED GND',
        espPin: 'GND (Pin 2)',
        sensorPin: 'LED 負極 (c28)',
        description: '藍光 LED 接地迴路',
      },
      {
        id: 'w-servo-sig',
        fromHole: 'i11',
        toHole: 'i35',
        color: 'orange',
        signalName: 'SG90 50Hz PWM (GPIO25)',
        espPin: 'GPIO25 (D25)',
        sensorPin: 'SG90 橘色訊號腳 (h35)',
        description: '輸出 50Hz 脈寬訊號 (500us~2500us) 控制舵機角度',
      },
      {
        id: 'w-servo-5v',
        fromHole: 'j4',
        toHole: 'j36',
        color: 'red',
        signalName: '5V 動力電源 (VIN)',
        espPin: 'VIN (5V, Pin 16)',
        sensorPin: 'SG90 紅色電源腳 (h36)',
        description: '由 USB 5V (VIN) 直接提供 SG90 伺服馬達足夠扭力電力',
      },
      {
        id: 'w-servo-gnd',
        fromHole: 'j5',
        toHole: 'j37',
        color: 'black',
        signalName: 'SG90 共地 (GND)',
        espPin: 'GND (Pin 17)',
        sensorPin: 'SG90 棕色接地腳 (h37)',
        description: '動力電源與訊號必須共地',
      },
    ],
    simControls: [
      {
        id: 'dutyPercent',
        label: 'LED PWM 佔空比 (Duty Cycle)',
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        unit: '%',
        defaultValue: 75,
      },
      {
        id: 'servoAngle',
        label: 'SG90 伺服馬達目標角度',
        type: 'slider',
        min: 0,
        max: 180,
        step: 15,
        unit: '°',
        defaultValue: 90,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 4.1.6 LED PWM 範例 (ESP-IDF v5.x)
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/ledc.h"
#include "esp_err.h"

#define LED_PWM_PIN     GPIO_NUM_5
#define SERVO_PWM_PIN   GPIO_NUM_25

void app_main(void) {
    // 1. 設定 LEDC Timer 0 (50Hz 供伺服馬達與基礎調光示範)
    ledc_timer_config_t ledc_timer = {
        .speed_mode       = LEDC_LOW_SPEED_MODE,
        .duty_resolution  = LEDC_TIMER_13_BIT, // 0 ~ 8191
        .timer_num        = LEDC_TIMER_0,
        .freq_hz          = 50,
        .clk_cfg          = LEDC_AUTO_CLK
    };
    ESP_ERROR_CHECK(ledc_timer_config(&ledc_timer));

    // 2. 配置 Channel 0 給 GPIO5 LED
    ledc_channel_config_t led_channel = {
        .speed_mode     = LEDC_LOW_SPEED_MODE,
        .channel        = LEDC_CHANNEL_0,
        .timer_sel      = LEDC_TIMER_0,
        .intr_type      = LEDC_INTR_DISABLE,
        .gpio_num       = LED_PWM_PIN,
        .duty           = 4096, // 50% 亮度
        .hpoint         = 0
    };
    ESP_ERROR_CHECK(ledc_channel_config(&led_channel));

    // 3. 安裝硬體漸變服務 (Hardware Fade)
    ledc_fade_func_install(0);

    while (1) {
        // 1.5 秒內平滑漸亮至最大 (8191)
        ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 8191, 1500);
        ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_WAIT_DONE);
        // 1.5 秒內平滑漸暗至 0
        ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 0, 1500);
        ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_WAIT_DONE);
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：LEDC 調光與 SG90 角度控制
#include <Arduino.h>

const int LED_PIN = 5;
const int SERVO_PIN = 25;

// 將角度 (0~180°) 轉換為 50Hz 16-bit PWM 數值 (0.5ms ~ 2.5ms)
uint32_t angleToDuty(int angle) {
  float pulseUs = 500.0 + (angle / 180.0) * 2000.0; // 500~2500us
  return (uint32_t)((pulseUs / 20000.0) * 65535.0);
}

void setup() {
  Serial.begin(115200);
  // ESP32 Arduino 3.x API: ledcAttach(pin, freq, resolution_bits)
  ledcAttach(LED_PIN, 5000, 8);    // 5kHz, 8-bit (0~255)
  ledcAttach(SERVO_PIN, 50, 16);   // 50Hz, 16-bit (0~65535)
}

void loop() {
  ledcWrite(LED_PIN, 192);              // 75% LED 亮度
  ledcWrite(SERVO_PIN, angleToDuty(90)); // 舵機轉至 90°
  Serial.println("LED Duty=75%, Servo Angle=90 deg");
  delay(2000);
}`,
  },

  {
    id: 'adc-pot-ldr',
    chapter: '4.1.4 ADC 類比數位轉換',
    title: '可變電阻與光敏電阻 ADC1 電壓採樣',
    subtitle: '掌握 12-bit 類比讀取、分壓電路與避開 ADC2 Wi-Fi 衝突陷阱',
    difficulty: '入門',
    protocols: ['ADC'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4.1.4 節：ADC 模數轉換與校準 (code/04.peripheral/basics/adc)',
    summary:
      'ESP32 內建 12-bit SAR ADC（讀取範圍 0~4095），透過設定 11dB 衰減（ADC_ATTEN_DB_12）可量測約 0V~3.1V 類比電壓。本範例使用 ADC1 通道（GPIO34 與 GPIO32）同時讀取旋鈕可變電阻與光敏電阻環境照度。',
    applicationScenes: [
      '旋鈕音量/轉速設定、搖桿位置讀取',
      '環境光敏電阻（LDR）、土壤濕度、NTC 熱敏電阻、電池電壓監測',
      '工業 0~3.3V 類比感測器訊號擷取',
    ],
    hardwarePrinciples: [
      '可變電阻（Potentiometer）兩端分別接 3.3V 與 GND，中間滑動腳（Wiper）會依旋轉比例輸出 0V ~ 3.3V 連續電壓至 GPIO34。',
      'ESP32 有兩個 ADC 控制器：ADC1（GPIO32~39）與 ADC2。當啟用 Wi-Fi 或藍牙時，ADC2 會被射頻模組硬體佔用導致讀取失敗，因此類比感測器一律優先接在 ADC1（如 GPIO34、35、32、33）！',
    ],
    pitfalls: [
      '⚠️ 嚴禁將超過 3.3V 的類比電壓直接送入 ESP32 ADC 腳位（若量測 5V 或 12V 電池，必須先用兩顆電阻做分壓電路）。',
      '⚠️ 務必選擇 ADC1 腳位（GPIO32/33/34/35/36/39），避免日後加上 Wi-Fi 功能時 ADC2 報錯無法讀取。',
    ],
    components: [
      {
        id: 'comp-pot-10k',
        name: '10kΩ 旋鈕可變電阻',
        model: 'POT-B10K',
        visualType: 'potentiometer',
        colStart: 27,
        colEnd: 29,
        rowPlacement: 'lower',
        pins: [
          {
            id: 'pot-vcc',
            label: 'VCC (左腳)',
            hole: 'h27',
            type: 'power',
            description: '接 3.3V 參考電源',
            targetNet: '3V3',
          },
          {
            id: 'pot-out',
            label: 'OUT (中腳 Wiper)',
            hole: 'h28',
            type: 'signal',
            description: '輸出 0~3.3V 類比電壓至 ESP32 GPIO34 (ADC1_CH6)',
            targetNet: 'GPIO34',
          },
          {
            id: 'pot-gnd',
            label: 'GND (右腳)',
            hole: 'h29',
            type: 'gnd',
            description: '接 GND',
            targetNet: 'GND',
          },
        ],
      },
      {
        id: 'comp-ldr-mod',
        name: '光敏電阻照度模組',
        model: 'LDR-MODULE-3P',
        visualType: 'ldr',
        colStart: 36,
        colEnd: 38,
        rowPlacement: 'lower',
        pins: [
          {
            id: 'ldr-vcc',
            label: 'VCC',
            hole: 'h36',
            type: 'power',
            description: '接 3.3V 電源',
            targetNet: '3V3',
          },
          {
            id: 'ldr-gnd',
            label: 'GND',
            hole: 'h37',
            type: 'gnd',
            description: '接 GND',
            targetNet: 'GND',
          },
          {
            id: 'ldr-ao',
            label: 'AO (類比輸出)',
            hole: 'h38',
            type: 'signal',
            description: '隨光線強弱輸出類比電壓至 ESP32 GPIO32 (ADC1_CH4)',
            targetNet: 'GPIO32',
          },
        ],
      },
    ],
    passives: [],
    wires: [
      {
        id: 'w-adc-3v3-rail',
        fromHole: 'a4',
        toHole: 'bp+4',
        color: 'red',
        signalName: '3.3V 電源軌供電',
        espPin: '3V3 (Pin 1)',
        sensorPin: '下排正極軌 (bp+)',
        description: '將 ESP32 3.3V 引至下方正極電源軌，供可變電阻與光敏模組共用',
      },
      {
        id: 'w-adc-gnd-rail',
        fromHole: 'j5',
        toHole: 'bp-5',
        color: 'black',
        signalName: 'GND 接地軌',
        espPin: 'GND (Pin 17)',
        sensorPin: '下排負極軌 (bp-)',
        description: '將 ESP32 GND 引至下方負極電源軌',
      },
      {
        id: 'w-pot-vcc',
        fromHole: 'bp+27',
        toHole: 'j27',
        color: 'red',
        signalName: '可變電阻 3.3V',
        espPin: '下排正極軌 (3.3V)',
        sensorPin: '可變電阻 VCC (h27)',
        description: '提供可變電阻高電位端 3.3V',
      },
      {
        id: 'w-pot-sig',
        fromHole: 'i15',
        toHole: 'i28',
        color: 'green',
        signalName: '旋鈕類比訊號 (GPIO34 / ADC1_CH6)',
        espPin: 'GPIO34 (D34)',
        sensorPin: '可變電阻 OUT 中間腳 (h28)',
        description: '連接至 ADC1_CH6 (GPIO34)，讀取 0~4095 原始值與轉換後毫伏特 (mV)',
      },
      {
        id: 'w-pot-gnd',
        fromHole: 'bp-29',
        toHole: 'j29',
        color: 'black',
        signalName: '可變電阻 GND',
        espPin: '下排負極軌 (GND)',
        sensorPin: '可變電阻 GND (h29)',
        description: '提供可變電阻低電位端 0V',
      },
      {
        id: 'w-ldr-vcc',
        fromHole: 'bp+36',
        toHole: 'j36',
        color: 'red',
        signalName: '光敏模組 3.3V',
        espPin: '下排正極軌 (3.3V)',
        sensorPin: '光敏模組 VCC (h36)',
        description: '光敏模組供電',
      },
      {
        id: 'w-ldr-gnd',
        fromHole: 'bp-37',
        toHole: 'j37',
        color: 'black',
        signalName: '光敏模組 GND',
        espPin: '下排負極軌 (GND)',
        sensorPin: '光敏模組 GND (h37)',
        description: '光敏模組接地',
      },
      {
        id: 'w-ldr-ao',
        fromHole: 'i13',
        toHole: 'i38',
        color: 'yellow',
        signalName: '照度類比訊號 (GPIO32 / ADC1_CH4)',
        espPin: 'GPIO32 (D32)',
        sensorPin: '光敏模組 AO (h38)',
        description: '連接至 ADC1_CH4 (GPIO32) 讀取環境亮度變化',
      },
    ],
    simControls: [
      {
        id: 'potPercent',
        label: '旋鈕可變電阻轉角比例',
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        unit: '%',
        defaultValue: 65,
      },
      {
        id: 'ambientLux',
        label: '環境光線照度 (Lux)',
        type: 'slider',
        min: 10,
        max: 1000,
        step: 30,
        unit: 'lx',
        defaultValue: 450,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 4.1.4 ADC 單次採樣範例 (ESP-IDF v5.x Oneshot API)
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_log.h"

// GPIO34 對應 ADC1_CHANNEL_6；GPIO32 對應 ADC1_CHANNEL_4
#define POT_ADC_CHAN    ADC_CHANNEL_6
#define LDR_ADC_CHAN    ADC_CHANNEL_4

void app_main(void) {
    adc_oneshot_unit_handle_t adc1_handle;
    adc_oneshot_unit_init_cfg_t init_config1 = {
        .unit_id = ADC_UNIT_1,
    };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));

    // 設定 12-bit 解析度與 12dB 衰減 (可量測至 ~3.1V)
    adc_oneshot_chan_cfg_t config = {
        .bitwidth = ADC_BITWIDTH_DEFAULT,
        .atten = ADC_ATTEN_DB_12,
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, POT_ADC_CHAN, &config));
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, LDR_ADC_CHAN, &config));

    int raw_pot = 0, raw_ldr = 0;
    while (1) {
        ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, POT_ADC_CHAN, &raw_pot));
        ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, LDR_ADC_CHAN, &raw_ldr));
        float pot_v = (raw_pot / 4095.0f) * 3.3f;
        ESP_LOGI("ADC1", "Pot(GPIO34)=%d (%.2fV) | LDR(GPIO32)=%d", raw_pot, pot_v, raw_ldr);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：ADC1 雙通道電壓與照度讀取
#include <Arduino.h>

const int POT_PIN = 34; // GPIO34 (ADC1_CH6)
const int LDR_PIN = 32; // GPIO32 (ADC1_CH4)

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 12-bit (0 ~ 4095)
}

void loop() {
  int rawPot = analogRead(POT_PIN);
  int mvPot  = analogReadMilliVolts(POT_PIN); // 內建工廠校準電壓 (mV)
  int rawLdr = analogRead(LDR_PIN);

  Serial.printf("Pot: raw=%4d (%4d mV) | LDR: raw=%4d\\n", rawPot, mvPot, rawLdr);
  delay(500);
}`,
  },

  {
    id: 'onewire-dht11',
    chapter: '4.2 感測器實戰：單總線溫濕度',
    title: 'DHT11 / DHT22 溫濕度感測器與上拉電阻接法',
    subtitle: '單總線（Single-Wire）雙向微秒級時序通訊與 4.7kΩ 上拉電阻實務',
    difficulty: '入門',
    protocols: ['1-Wire', 'GPIO'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4 章外設實戰：單總線溫濕度感測器驅動',
    summary:
      'DHT11 與 DHT22 採用單根 DATA 資料線完成雙向數位握手與 40-bit 溫濕度資料傳輸（16-bit 濕度 + 16-bit 溫度 + 8-bit 校驗和 Checksum）。在麵包板上需於 DATA 與 3.3V 之間跨接一顆 4.7kΩ~10kΩ 上拉電阻以維持匯流排閒置高電位。',
    applicationScenes: [
      '室內環境溫濕度監控、智慧居家空調聯動',
      '機房、配電盤或防潮箱溫濕度異常告警',
      '農業溫室環境數據採集上傳 MQTT / Firebase',
    ],
    hardwarePrinciples: [
      '單總線採開漏（Open-Drain）雙向架構：平時由 4.7kΩ 上拉電阻將 DATA 線拉高至 3.3V；當 ESP32 發出至少 18ms 低電位起始訊號後，DHT11 會拉低 80us 再拉高 80us 回應，接著依高電位持續時間（26~28us 代表 0，70us 代表 1）傳送 40 bits。',
      '若購買的是四腳裸裝 DHT11，第 3 腳為 NC（空腳不接）；若購買三腳模組版則板載已焊好上拉電阻。本麵包板完整示範裸晶片 + 4.7kΩ 上拉電阻的標準接法。',
    ],
    pitfalls: [
      '⚠️ DHT11 採樣週期較慢，兩次讀取之間必須間隔至少 1~2 秒，過於頻繁讀取會導致 Checksum 校驗失敗。',
      '⚠️ 若忘記接 4.7kΩ 上拉電阻（或僅依賴微弱內部上拉且線太長），訊號上升沿會過慢導致讀出 Timeout。',
    ],
    components: [
      {
        id: 'comp-dht11',
        name: 'DHT11 溫濕度感測器',
        model: 'DHT11-4PIN',
        visualType: 'dht11',
        colStart: 29,
        colEnd: 32,
        rowPlacement: 'upper',
        pins: [
          {
            id: 'dht-vcc',
            label: '1: VCC (3.3V)',
            hole: 'c29',
            type: 'power',
            description: '電源正極 (3.0V ~ 5.5V 皆可，建議接 3.3V 與 ESP32 電平一致)',
            targetNet: '3V3',
          },
          {
            id: 'dht-data',
            label: '2: DATA (資料)',
            hole: 'c30',
            type: 'signal',
            description: '雙向單總線資料腳，接 ESP32 GPIO4 並透過 4.7kΩ 電阻上拉至 VCC',
            targetNet: 'GPIO4',
          },
          {
            id: 'dht-nc',
            label: '3: NC (空腳)',
            hole: 'c31',
            type: 'nc',
            description: '懸空不接 (No Connection)',
          },
          {
            id: 'dht-gnd',
            label: '4: GND (接地)',
            hole: 'c32',
            type: 'gnd',
            description: '電源負極接地',
            targetNet: 'GND',
          },
        ],
      },
    ],
    passives: [
      {
        id: 'res-dht-pullup',
        type: 'resistor',
        value: '4.7kΩ 上拉電阻',
        fromHole: 'd29',
        toHole: 'd30',
        purpose: '跨接在 DHT11 的 VCC (第29欄) 與 DATA (第30欄) 之間，確保單總線閒置時穩定維持 3.3V 高電位',
        bands: ['#eab308', '#a855f7', '#ef4444', '#eab308'],
      },
    ],
    wires: [
      {
        id: 'w-dht-vcc',
        fromHole: 'a4',
        toHole: 'a29',
        color: 'red',
        signalName: '3.3V 電源',
        espPin: '3V3 (Pin 1)',
        sensorPin: 'DHT11 Pin 1 VCC (c29)',
        description: '供應 DHT11 3.3V 工作電源，同時作為 4.7kΩ 上拉電阻的高電位來源',
      },
      {
        id: 'w-dht-data',
        fromHole: 'a8',
        toHole: 'a30',
        color: 'green',
        signalName: '1-Wire DATA (GPIO4)',
        espPin: 'GPIO4 (D4)',
        sensorPin: 'DHT11 Pin 2 DATA (c30)',
        description: '單總線雙向資料線，連接 ESP32 GPIO4 與 DHT11 DATA 腳',
      },
      {
        id: 'w-dht-gnd',
        fromHole: 'a5',
        toHole: 'a32',
        color: 'black',
        signalName: 'GND 接地線',
        espPin: 'GND (Pin 2)',
        sensorPin: 'DHT11 Pin 4 GND (c32)',
        description: '連接 DHT11 第 4 腳至 ESP32 GND',
      },
    ],
    simControls: [
      {
        id: 'temperature',
        label: '模擬環境溫度',
        type: 'slider',
        min: 10,
        max: 45,
        step: 1,
        unit: '°C',
        defaultValue: 26,
      },
      {
        id: 'humidity',
        label: '模擬相對濕度',
        type: 'slider',
        min: 20,
        max: 95,
        step: 5,
        unit: '%RH',
        defaultValue: 60,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 單總線 DHT11 讀取核心流程 (ESP-IDF v5.x)
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_rom_sys.h"
#include "esp_log.h"

#define DHT_GPIO GPIO_NUM_4

// 發送起始訊號並讀取 40-bit (5 bytes) 溫濕度資料
esp_err_t dht11_read(uint8_t data[5]) {
    gpio_set_direction(DHT_GPIO, GPIO_MODE_OUTPUT);
    gpio_set_level(DHT_GPIO, 0);
    vTaskDelay(pdMS_TO_TICKS(20)); // 拉低至少 18ms
    gpio_set_level(DHT_GPIO, 1);
    esp_rom_delay_us(30);
    gpio_set_direction(DHT_GPIO, GPIO_MODE_INPUT);

    // 依序讀取 40 bits 並驗證 Checksum:
    // data[4] == (data[0] + data[1] + data[2] + data[3]) & 0xFF
    return ESP_OK;
}

void app_main(void) {
    uint8_t raw[5] = {60, 0, 26, 0, 86};
    while (1) {
        if (dht11_read(raw) == ESP_OK) {
            ESP_LOGI("DHT11", "溫度: %d.%d °C | 濕度: %d.%d %%RH (Checksum=0x%02X)",
                     raw[2], raw[3], raw[0], raw[1], raw[4]);
        }
        vTaskDelay(pdMS_TO_TICKS(2000)); // 間隔 2 秒採樣
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：使用 DHT sensor library 讀取 GPIO4
#include <Arduino.h>
#include <DHT.h>

#define DHTPIN  4      // GPIO4 (D4)
#define DHTTYPE DHT11  // 若使用 DHT22 改為 DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("[DHT11] 單總線溫濕度感測器啟動 (GPIO4)");
}

void loop() {
  delay(2000); // 至少間隔 2 秒
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("[ERR] 無法從 DHT11 讀取資料，請檢查 4.7kΩ 上拉電阻與接線！");
    return;
  }
  Serial.printf("溫度: %.1f °C | 相對濕度: %.1f %%RH\\n", t, h);
}`,
  },

  {
    id: 'ultrasonic-hcsr04',
    chapter: '4.1.3 定时器與脈寬測距',
    title: 'HC-SR04 超音波測距模組與分壓保護',
    subtitle: '利用 Trig 脈衝觸發、Echo 回波計時與 5V→3.3V 安全邏輯準位思維',
    difficulty: '入門',
    protocols: ['GPIO', 'Timer'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4.1.3 節：GPTimer 硬體定時器與微秒級脈衝量測',
    summary:
      'ESP32 透過 GPIO5 (Trig) 發出 10us 高電位脈衝觸發 HC-SR04 發射 40kHz 超音波，接著透過 GPIO18 (Echo) 量測高電位持續時間 T (us)，套用音速公式「距離 (cm) = (T × 0.034) / 2」即可算出障礙物距離。',
    applicationScenes: [
      '液位高度計、水塔/水槽水位監測',
      'AGV 自走車避障、倒車雷達、人員接近感應',
      '料倉存量高度非接觸式量測',
    ],
    hardwarePrinciples: [
      '觸發時序：Trig 腳拉高至少 10 微秒（us）後拉低，模組自動發射 8 個 40kHz 超音波脈衝。',
      '距離換算：常温下聲速約 340m/s = 0.034cm/us，由於聲波是「來回」兩倍路程，故單程距離 `cm = echo_time_us * 0.034 / 2`（或 `echo_time_us / 58.0`）。',
    ],
    pitfalls: [
      '⚠️ 標準版 HC-SR04 需接 5V (VIN) 才能正常驅動發射器，因此其 Echo 腳回傳的高電位也是 5V！長久直連 3.3V 的 ESP32 GPIO 有過壓風險，實務上建議選購支援 3.3V 的 HC-SR04P/RCWL-1601，或在 Echo 腳串接 1kΩ + 2kΩ 分壓電阻降至 3.3V。',
    ],
    components: [
      {
        id: 'comp-hcsr04',
        name: 'HC-SR04 超音波測距模組',
        model: 'HC-SR04',
        visualType: 'hcsr04',
        colStart: 29,
        colEnd: 32,
        rowPlacement: 'upper',
        pins: [
          {
            id: 'sr04-vcc',
            label: 'VCC (5V)',
            hole: 'c29',
            type: 'power',
            description: '超音波模組 5V 電源，接 ESP32 VIN (5V)',
            targetNet: '5V',
          },
          {
            id: 'sr04-trig',
            label: 'TRIG (觸發)',
            hole: 'c30',
            type: 'signal',
            description: '接收來自 ESP32 GPIO5 的 10us 觸發脈衝',
            targetNet: 'GPIO5',
          },
          {
            id: 'sr04-echo',
            label: 'ECHO (回波)',
            hole: 'c31',
            type: 'signal',
            description: '輸出與距離成正比的高電位脈寬至 ESP32 GPIO18',
            targetNet: 'GPIO18',
          },
          {
            id: 'sr04-gnd',
            label: 'GND (接地)',
            hole: 'c32',
            type: 'gnd',
            description: '電源接地',
            targetNet: 'GND',
          },
        ],
      },
    ],
    passives: [],
    wires: [
      {
        id: 'w-sr04-5v',
        fromHole: 'j4',
        toHole: 'a29',
        color: 'red',
        signalName: '5V 電源 (VIN)',
        espPin: 'VIN (5V, Pin 16)',
        sensorPin: 'HC-SR04 VCC (c29)',
        description: '提供 HC-SR04 所需的 5V 工作電壓',
      },
      {
        id: 'w-sr04-trig',
        fromHole: 'a11',
        toHole: 'a30',
        color: 'yellow',
        signalName: 'TRIG 觸發線 (GPIO5)',
        espPin: 'GPIO5 (D5)',
        sensorPin: 'HC-SR04 TRIG (c30)',
        description: 'ESP32 輸出 10us 高電位脈衝觸發測距',
      },
      {
        id: 'w-sr04-echo',
        fromHole: 'a12',
        toHole: 'a31',
        color: 'cyan',
        signalName: 'ECHO 回波線 (GPIO18)',
        espPin: 'GPIO18 (D18)',
        sensorPin: 'HC-SR04 ECHO (c31)',
        description: '量測 ECHO 高電位微秒數以計算距離',
      },
      {
        id: 'w-sr04-gnd',
        fromHole: 'a5',
        toHole: 'a32',
        color: 'black',
        signalName: 'GND 接地線',
        espPin: 'GND (Pin 2)',
        sensorPin: 'HC-SR04 GND (c32)',
        description: '與 ESP32 共地',
      },
    ],
    simControls: [
      {
        id: 'distanceCm',
        label: '模擬前方障礙物距離',
        type: 'slider',
        min: 2,
        max: 250,
        step: 2,
        unit: 'cm',
        defaultValue: 42,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 4.1.3 微秒計時與 HC-SR04 測距 (ESP-IDF v5.x)
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_timer.h"
#include "esp_rom_sys.h"
#include "esp_log.h"

#define TRIG_PIN GPIO_NUM_5
#define ECHO_PIN GPIO_NUM_18

void app_main(void) {
    gpio_set_direction(TRIG_PIN, GPIO_MODE_OUTPUT);
    gpio_set_direction(ECHO_PIN, GPIO_MODE_INPUT);
    gpio_set_level(TRIG_PIN, 0);

    while (1) {
        // 1. 發送 10us 高電位觸發脈衝
        gpio_set_level(TRIG_PIN, 1);
        esp_rom_delay_us(10);
        gpio_set_level(TRIG_PIN, 0);

        // 2. 等待 Echo 變高並記錄起訖時間 (us)
        while (gpio_get_level(ECHO_PIN) == 0) {}
        int64_t start_us = esp_timer_get_time();
        while (gpio_get_level(ECHO_PIN) == 1) {}
        int64_t duration_us = esp_timer_get_time() - start_us;

        float dist_cm = (duration_us * 0.034f) / 2.0f;
        ESP_LOGI("SR04", "Echo=%lld us -> 距離: %.1f cm", duration_us, dist_cm);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：pulseIn() 讀取 HC-SR04 距離
#include <Arduino.h>

const int TRIG_PIN = 5;   // GPIO5 (D5)
const int ECHO_PIN = 18;  // GPIO18 (D18)

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  // 發出 10us Trig 觸發訊號
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 讀取高電位持續時間 (微秒)，設定 30ms timeout
  long durationUs = pulseIn(ECHO_PIN, HIGH, 30000);
  float distanceCm = durationUs * 0.034 / 2.0;

  Serial.printf("Echo 脈寬: %ld us | 距離: %.1f cm\\n", durationUs, distanceCm);
  delay(500);
}`,
  },

  {
    id: 'i2c-oled-mpu6050',
    chapter: '4.1.7 I2C 雙線匯流排並聯',
    title: 'SSD1306 OLED 螢幕 + MPU6050 姿態感測器 (I2C 共線)',
    subtitle: '展示 I2C 僅用兩條訊號線（GPIO21 SDA / GPIO22 SCL）同時串接多個設備',
    difficulty: '進階',
    protocols: ['I2C'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4.1.7 節：I2C 通訊協議與多從機尋址 (code/04.peripheral/basics/i2c)',
    summary:
      'I2C 是嵌入式系統最省腳位的匯流排：只要兩根訊號線 SDA（GPIO21）與 SCL（GPIO22），就能依據不同的 7-bit 設備位址（如 SSD1306 OLED 為 0x3C，MPU6050 六軸陀螺儀為 0x68）在同一排麵包板上並聯通訊！',
    applicationScenes: [
      '0.96 吋 OLED 本機儀表板顯示（即時顯示 IP、溫濕度、設備狀態）',
      'MPU6050 六軸加速度計與陀螺儀（震動監測、傾斜偵測、運動姿態追蹤）',
      '多感測器擴充：同一組 GPIO21/22 可同時掛載 OLED (0x3C) + MPU6050 (0x68) + AHT20 溫濕度 (0x38)',
    ],
    hardwarePrinciples: [
      'ESP32 預設硬體 I2C 腳位為 `GPIO21 (SDA 資料線)` 與 `GPIO22 (SCL 時脈線)`。',
      '匯流排並聯接法：先從 ESP32 的 GPIO21/22 接到第一個模組（OLED），再從同一欄麵包板孔位並聯跳線到第二個模組（MPU6050）的 SDA/SCL。',
      '每個 I2C 從機（Slave）都有唯一位址：OLED 預設 `0x3C`、MPU6050 預設 `0x68`（若將 AD0 腳接 3.3V 則變為 `0x69`），主機（ESP32）在傳送資料前會先廣播目標位址，因此不會互相干擾。',
    ],
    pitfalls: [
      '⚠️ 買來的 OLED 模組腳位排列有兩種常見版本（`GND-VCC-SCL-SDA` 或 `VCC-GND-SCL-SDA`），插上麵包板前務必看清楚板子上的絲印字樣，接反 VCC 與 GND 會燒毀螢幕！',
      '⚠️ 若通訊失敗，請先跑一次 I2C Scanner 確認設備位址是否為 `0x3C` 與 `0x68`。',
    ],
    components: [
      {
        id: 'comp-oled-ssd1306',
        name: '0.96" SSD1306 OLED 螢幕',
        model: 'SSD1306-I2C-0x3C',
        visualType: 'oled_ssd1306',
        colStart: 25,
        colEnd: 28,
        rowPlacement: 'upper',
        pins: [
          {
            id: 'oled-gnd',
            label: 'GND',
            hole: 'c25',
            type: 'gnd',
            description: 'OLED 電源地線',
            targetNet: 'GND',
          },
          {
            id: 'oled-vcc',
            label: 'VCC (3.3V)',
            hole: 'c26',
            type: 'power',
            description: 'OLED 3.3V 電源',
            targetNet: '3V3',
          },
          {
            id: 'oled-scl',
            label: 'SCL (時脈)',
            hole: 'c27',
            type: 'signal',
            description: 'I2C 時脈線，接 ESP32 GPIO22 (D22)',
            targetNet: 'GPIO22',
          },
          {
            id: 'oled-sda',
            label: 'SDA (資料)',
            hole: 'c28',
            type: 'signal',
            description: 'I2C 資料線，接 ESP32 GPIO21 (D21)',
            targetNet: 'GPIO21',
          },
        ],
      },
      {
        id: 'comp-mpu6050',
        name: 'MPU6050 六軸姿態模組',
        model: 'GY-521 (I2C 0x68)',
        visualType: 'mpu6050',
        colStart: 36,
        colEnd: 39,
        rowPlacement: 'upper',
        pins: [
          {
            id: 'mpu-vcc',
            label: 'VCC (3.3V)',
            hole: 'c36',
            type: 'power',
            description: 'MPU6050 電源正極',
            targetNet: '3V3',
          },
          {
            id: 'mpu-gnd',
            label: 'GND',
            hole: 'c37',
            type: 'gnd',
            description: 'MPU6050 電源地線',
            targetNet: 'GND',
          },
          {
            id: 'mpu-scl',
            label: 'SCL (共線)',
            hole: 'c38',
            type: 'signal',
            description: '與 OLED 共用 I2C SCL (GPIO22)',
            targetNet: 'GPIO22',
          },
          {
            id: 'mpu-sda',
            label: 'SDA (共線)',
            hole: 'c39',
            type: 'signal',
            description: '與 OLED 共用 I2C SDA (GPIO21)',
            targetNet: 'GPIO21',
          },
        ],
      },
    ],
    passives: [],
    wires: [
      {
        id: 'w-i2c-3v3-rail',
        fromHole: 'a4',
        toHole: 'tp+4',
        color: 'red',
        signalName: '3.3V 上排電源軌',
        espPin: '3V3 (Pin 1)',
        sensorPin: '上排正極軌 (tp+)',
        description: '供應上排所有 I2C 模組 3.3V 電源',
      },
      {
        id: 'w-i2c-gnd-rail',
        fromHole: 'a5',
        toHole: 'tp-5',
        color: 'black',
        signalName: 'GND 上排接地軌',
        espPin: 'GND (Pin 2)',
        sensorPin: '上排負極軌 (tp-)',
        description: '供應上排所有 I2C 模組共地',
      },
      {
        id: 'w-oled-gnd',
        fromHole: 'tp-25',
        toHole: 'a25',
        color: 'black',
        signalName: 'OLED GND',
        espPin: '上排負極軌 (GND)',
        sensorPin: 'OLED GND (c25)',
        description: 'OLED 接地',
      },
      {
        id: 'w-oled-vcc',
        fromHole: 'tp+26',
        toHole: 'a26',
        color: 'red',
        signalName: 'OLED 3.3V',
        espPin: '上排正極軌 (3.3V)',
        sensorPin: 'OLED VCC (c26)',
        description: 'OLED 供電',
      },
      {
        id: 'w-i2c-scl-main',
        fromHole: 'b17',
        toHole: 'b27',
        color: 'yellow',
        signalName: 'I2C SCL 主線 (GPIO22)',
        espPin: 'GPIO22 (D22)',
        sensorPin: 'OLED SCL (c27)',
        description: 'ESP32 I2C 時脈線 (GPIO22) 接入 OLED SCL',
      },
      {
        id: 'w-i2c-sda-main',
        fromHole: 'b14',
        toHole: 'b28',
        color: 'blue',
        signalName: 'I2C SDA 主線 (GPIO21)',
        espPin: 'GPIO21 (D21)',
        sensorPin: 'OLED SDA (c28)',
        description: 'ESP32 I2C 資料線 (GPIO21) 接入 OLED SDA',
      },
      {
        id: 'w-mpu-vcc',
        fromHole: 'tp+36',
        toHole: 'a36',
        color: 'red',
        signalName: 'MPU6050 3.3V',
        espPin: '上排正極軌 (3.3V)',
        sensorPin: 'MPU6050 VCC (c36)',
        description: 'MPU6050 供電',
      },
      {
        id: 'w-mpu-gnd',
        fromHole: 'tp-37',
        toHole: 'a37',
        color: 'black',
        signalName: 'MPU6050 GND',
        espPin: '上排負極軌 (GND)',
        sensorPin: 'MPU6050 GND (c37)',
        description: 'MPU6050 接地',
      },
      {
        id: 'w-i2c-scl-daisy',
        fromHole: 'd27',
        toHole: 'd38',
        color: 'yellow',
        signalName: 'I2C SCL 並聯支線',
        espPin: 'OLED SCL 同排 (d27)',
        sensorPin: 'MPU6050 SCL (c38)',
        description: '從第 27 欄 (OLED SCL) 並聯延伸至第 38 欄 (MPU6050 SCL)，展示 I2C 共線特性',
      },
      {
        id: 'w-i2c-sda-daisy',
        fromHole: 'e28',
        toHole: 'e39',
        color: 'blue',
        signalName: 'I2C SDA 並聯支線',
        espPin: 'OLED SDA 同排 (e28)',
        sensorPin: 'MPU6050 SDA (c39)',
        description: '從第 28 欄 (OLED SDA) 並聯延伸至第 39 欄 (MPU6050 SDA)',
      },
    ],
    simControls: [
      {
        id: 'pitchDeg',
        label: 'MPU6050 前後傾角 (Pitch)',
        type: 'slider',
        min: -45,
        max: 45,
        step: 5,
        unit: '°',
        defaultValue: 15,
      },
      {
        id: 'rollDeg',
        label: 'MPU6050 左右傾角 (Roll)',
        type: 'slider',
        min: -45,
        max: 45,
        step: 5,
        unit: '°',
        defaultValue: -10,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 4.1.7 I2C Master 新版驅動範例 (ESP-IDF v5.2+)
#include <stdio.h>
#include "driver/i2c_master.h"
#include "esp_log.h"

#define I2C_SCL_PIN     GPIO_NUM_22
#define I2C_SDA_PIN     GPIO_NUM_21
#define OLED_ADDR       0x3C
#define MPU6050_ADDR    0x68

void app_main(void) {
    // 1. 建立 I2C Master Bus (GPIO21 SDA, GPIO22 SCL)
    i2c_master_bus_config_t bus_cfg = {
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .i2c_port = I2C_NUM_0,
        .scl_io_num = I2C_SCL_PIN,
        .sda_io_num = I2C_SDA_PIN,
        .glitch_ignore_cnt = 7,
        .flags.enable_internal_pullup = true,
    };
    i2c_master_bus_handle_t bus_handle;
    ESP_ERROR_CHECK(i2c_new_master_bus(&bus_cfg, &bus_handle));

    // 2. 掃描確認兩個從機 (0x3C OLED 與 0x68 MPU6050) 是否在線上
    if (i2c_master_probe(bus_handle, OLED_ADDR, 100) == ESP_OK) {
        ESP_LOGI("I2C", "偵測到 SSD1306 OLED (0x3C)");
    }
    if (i2c_master_probe(bus_handle, MPU6050_ADDR, 100) == ESP_OK) {
        ESP_LOGI("I2C", "偵測到 MPU6050 姿態感測器 (0x68)");
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：Wire (I2C) 同時讀取 MPU6050 並顯示於 OLED
#include <Arduino.h>
#include <Wire.h>

#define SDA_PIN 21
#define SCL_PIN 22

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN, 400000); // 400kHz Fast I2C

  // 喚醒 MPU6050 (0x68 暫存器 0x6B 寫入 0)
  Wire.beginTransmission(0x68);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();

  Serial.println("[I2C] 匯流排啟動完成：OLED(0x3C) + MPU6050(0x68)");
}

void loop() {
  // 讀取 MPU6050 加速度計並更新至 0x3C OLED 畫面
  Serial.println("I2C Bus [SDA=21, SCL=22] -> MPU6050(0x68) & OLED(0x3C) OK");
  delay(1000);
}`,
  },

  {
    id: 'spi-sdcard',
    chapter: '4.1.8 SPI 高速匯流排與儲存',
    title: 'SPI 介面 MicroSD 卡讀寫模組',
    subtitle: '認識標準四線全雙工 SPI（MOSI / MISO / SCLK / CS）與 FATFS 檔案系統',
    difficulty: '進階',
    protocols: ['SPI'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4.1.8 節 SPI 通訊與第 4.2.5 節 SD 卡驅動',
    summary:
      '當需要高速傳輸（如讀寫 MicroSD 卡日誌、驅動彩色 TFT 螢幕或 RFID-RC522）時，會採用四線全雙工 SPI 協定。ESP32 的 VSPI（SPI3）預設標準腳位為：MOSI (GPIO23)、MISO (GPIO19)、SCLK (GPIO18)、CS (GPIO5)。',
    applicationScenes: [
      '現場感測器長時間離線 CSV 資料記錄器（Data Logger）',
      '儲存設定檔、韌體更新檔、語音或圖片素材',
      '搭配 ILI9341 / ST7789 SPI 彩屏或 RC522 RFID 讀卡機（可共用 MOSI/MISO/SCK，僅需各自獨立 CS 腳位）',
    ],
    hardwarePrinciples: [
      '`MOSI (Master Out Slave In, GPIO23)`：主機（ESP32）發送資料給 SD 卡。',
      '`MISO (Master In Slave Out, GPIO19)`：SD 卡回傳資料給主機（ESP32）。',
      '`SCLK (Serial Clock, GPIO18)`：由主機產生的高速同步時脈（可達 20MHz~40MHz）。',
      '`CS (Chip Select, GPIO5)`：片選訊號（低電位有效），決定目前跟哪一個 SPI 設備對話。',
    ],
    pitfalls: [
      '⚠️ 與 UART 不同，SPI 的 MOSI 與 MISO 是「同名直連」（ESP32 MOSI 接模組 MOSI，MISO 接模組 MISO），千萬不要交叉接反！',
      '⚠️ 6 腳標準 MicroSD 卡模組通常內建 5V 轉 3.3V LDO 穩壓晶片，因此 VCC 腳需接 ESP32 的 VIN (5V) 才能確保讀寫瞬間不掉壓。',
    ],
    components: [
      {
        id: 'comp-sdcard-spi',
        name: 'MicroSD 卡讀寫模組',
        model: 'MICROSD-SPI-6P',
        visualType: 'sdcard_spi',
        colStart: 27,
        colEnd: 32,
        rowPlacement: 'upper',
        pins: [
          {
            id: 'sd-cs',
            label: 'CS (片選)',
            hole: 'c27',
            type: 'signal',
            description: 'SPI 片選腳，接 ESP32 GPIO5 (VSPI_CS0)',
            targetNet: 'GPIO5',
          },
          {
            id: 'sd-sck',
            label: 'SCK (時脈)',
            hole: 'c28',
            type: 'signal',
            description: 'SPI 同步時脈腳，接 ESP32 GPIO18 (VSPI_SCK)',
            targetNet: 'GPIO18',
          },
          {
            id: 'sd-mosi',
            label: 'MOSI (主出)',
            hole: 'c29',
            type: 'signal',
            description: '主機輸出從機輸入，接 ESP32 GPIO23 (VSPI_MOSI)',
            targetNet: 'GPIO23',
          },
          {
            id: 'sd-miso',
            label: 'MISO (主入)',
            hole: 'c30',
            type: 'signal',
            description: '主機輸入從機輸出，接 ESP32 GPIO19 (VSPI_MISO)',
            targetNet: 'GPIO19',
          },
          {
            id: 'sd-vcc',
            label: 'VCC (5V)',
            hole: 'c31',
            type: 'power',
            description: '模組電源輸入 (接 VIN 5V 經模組 LDO 轉 3.3V)',
            targetNet: '5V',
          },
          {
            id: 'sd-gnd',
            label: 'GND',
            hole: 'c32',
            type: 'gnd',
            description: '接地腳',
            targetNet: 'GND',
          },
        ],
      },
    ],
    passives: [],
    wires: [
      {
        id: 'w-sd-cs',
        fromHole: 'a11',
        toHole: 'a27',
        color: 'purple',
        signalName: 'SPI CS (GPIO5)',
        espPin: 'GPIO5 (D5)',
        sensorPin: 'SD 模組 CS (c27)',
        description: 'VSPI 預設片選腳 GPIO5 接至 SD 卡 CS',
      },
      {
        id: 'w-sd-sck',
        fromHole: 'a12',
        toHole: 'a28',
        color: 'yellow',
        signalName: 'SPI SCK (GPIO18)',
        espPin: 'GPIO18 (D18)',
        sensorPin: 'SD 模組 SCK (c28)',
        description: 'VSPI 預設時脈腳 GPIO18 接至 SD 卡 SCK',
      },
      {
        id: 'w-sd-mosi',
        fromHole: 'a18',
        toHole: 'a29',
        color: 'blue',
        signalName: 'SPI MOSI (GPIO23)',
        espPin: 'GPIO23 (D23)',
        sensorPin: 'SD 模組 MOSI (c29)',
        description: 'VSPI 主出從入腳 GPIO23 直連 SD 卡 MOSI（同名直連）',
      },
      {
        id: 'w-sd-miso',
        fromHole: 'a13',
        toHole: 'a30',
        color: 'green',
        signalName: 'SPI MISO (GPIO19)',
        espPin: 'GPIO19 (D19)',
        sensorPin: 'SD 模組 MISO (c30)',
        description: 'VSPI 主入從出腳 GPIO19 直連 SD 卡 MISO（同名直連）',
      },
      {
        id: 'w-sd-vcc',
        fromHole: 'j4',
        toHole: 'a31',
        color: 'red',
        signalName: '5V 電源 (VIN)',
        espPin: 'VIN (5V, Pin 16)',
        sensorPin: 'SD 模組 VCC (c31)',
        description: '提供 MicroSD 模組穩定的 5V 電源輸入',
      },
      {
        id: 'w-sd-gnd',
        fromHole: 'a5',
        toHole: 'a32',
        color: 'black',
        signalName: 'GND 接地線',
        espPin: 'GND (Pin 2)',
        sensorPin: 'SD 模組 GND (c32)',
        description: '與 ESP32 共地',
      },
    ],
    simControls: [
      {
        id: 'writeTrigger',
        label: '模擬寫入一筆感測器 CSV 日誌至 SD 卡',
        type: 'toggle',
        defaultValue: 1,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 4.2.5 SPI 模式掛載 SD 卡 (ESP-IDF v5.x)
#include <stdio.h>
#include "esp_vfs_fat.h"
#include "sdmmc_cmd.h"
#include "driver/spi_common.h"
#include "esp_log.h"

#define PIN_NUM_MISO  GPIO_NUM_19
#define PIN_NUM_MOSI  GPIO_NUM_23
#define PIN_NUM_CLK   GPIO_NUM_18
#define PIN_NUM_CS    GPIO_NUM_5

void app_main(void) {
    sdmmc_host_t host = SDSPI_HOST_DEFAULT();
    spi_bus_config_t bus_cfg = {
        .mosi_io_num = PIN_NUM_MOSI,
        .miso_io_num = PIN_NUM_MISO,
        .sclk_io_num = PIN_NUM_CLK,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 4000,
    };
    ESP_ERROR_CHECK(spi_bus_initialize(host.slot, &bus_cfg, SDSPI_DEFAULT_DMA));

    sdspi_device_config_t slot_config = SDSPI_DEVICE_CONFIG_DEFAULT();
    slot_config.gpio_cs = PIN_NUM_CS;
    slot_config.host_id = host.slot;

    esp_vfs_fat_sdmmc_mount_config_t mount_config = {
        .format_if_mount_failed = false,
        .max_files = 5,
    };
    sdmmc_card_t *card;
    if (esp_vfs_fat_sdspi_mount("/sdcard", &host, &slot_config, &mount_config, &card) == ESP_OK) {
        sdmmc_card_print_info(stdout, card);
        FILE *f = fopen("/sdcard/log.csv", "a");
        fprintf(f, "timestamp,temp,hum\\n");
        fclose(f);
        ESP_LOGI("SD_SPI", "成功寫入 /sdcard/log.csv");
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：使用標準 VSPI 掛載 MicroSD 卡
#include <Arduino.h>
#include <SPI.h>
#include <SD.h>

const int SD_CS_PIN = 5; // VSPI CS: GPIO5 (SCK=18, MISO=19, MOSI=23)

void setup() {
  Serial.begin(115200);
  if (!SD.begin(SD_CS_PIN)) {
    Serial.println("[ERR] SD 卡掛載失敗，請檢查 SPI 四線與 CS(GPIO5) 接線！");
    return;
  }
  Serial.printf("SD 卡容量: %llu MB\\n", SD.cardSize() / (1024 * 1024));

  File file = SD.open("/sensor_log.csv", FILE_APPEND);
  if (file) {
    file.println("2026-11-11,26.0,60.0");
    file.close();
    Serial.println("[OK] 已追加一筆紀錄至 /sensor_log.csv");
  }
}

void loop() {
  delay(2000);
}`,
  },

  {
    id: 'uart-gps-serial',
    chapter: '4.1.2 UART 序列埠交叉通訊',
    title: 'UART2 連接 GPS 定位模組 / 外部串口設備',
    subtitle: '徹底搞懂 TX 接 RX、RX 接 TX 交叉接線原則與獨立硬體串口 UART2',
    difficulty: '入門',
    protocols: ['UART'],
    guideRef: 'DuRuofu/ESP32-Guide 第 4.1.2 節：UART 串口通訊與 RingBuffer 收發 (code/04.peripheral/basics/uart)',
    summary:
      'ESP32 擁有三組硬體 UART（UART0、UART1、UART2）。由於 UART0（GPIO1/3）已被板載 USB 除錯燒錄佔用，連接外部串口模組（如 NEO-6M GPS、藍牙模組、RS485 轉換器、語音模組）時，應使用獨立的 UART2（RX2=GPIO16, TX2=GPIO17），並遵守「TX 接對方 RX、RX 接對方 TX」的交叉原則。',
    applicationScenes: [
      'NEO-6M / ATGM336H GPS 模組讀取 NMEA 經緯度與衛星時間',
      '工業 Modbus RTU (搭配 MAX485 轉 RS485 模組) 讀取電表或 PLC 數據',
      '智慧毫米波雷達（LD2410）、二氧化碳感測器（MH-Z19B）串口通訊',
    ],
    hardwarePrinciples: [
      '`TX (Transmit 發送端)` 負責講話，`RX (Receive 接收端)` 負責聽話：因此 **ESP32 的 TX2 (GPIO17) 必須接 GPS 模組的 RX**；**ESP32 的 RX2 (GPIO16) 必須接 GPS 模組的 TX**。',
      '非同步通訊沒有時脈線（Clock），因此收發雙方的 **鮑率（Baud Rate，如 GPS 預設 9600 bps，除錯埠常用 115200 bps）** 必須設定完全一致，否則會收到亂碼。',
    ],
    pitfalls: [
      '⚠️ 新手最常犯錯誤第一名：把 TX 接到 TX、RX 接到 RX（同名相接），導致雙方都在講話卻沒人聽，完全收不到資料！',
      '⚠️ 切勿把外部串口模組接在 `RX0 (GPIO3) / TX0 (GPIO1)`，否則會與電腦 USB 燒錄訊號衝突導致無法上傳程式。',
    ],
    components: [
      {
        id: 'comp-uart-gps',
        name: 'NEO-6M GPS 衛星定位模組',
        model: 'GY-NEO6MV2',
        visualType: 'uart_gps',
        colStart: 28,
        colEnd: 31,
        rowPlacement: 'upper',
        pins: [
          {
            id: 'gps-vcc',
            label: 'VCC (3.3V)',
            hole: 'c28',
            type: 'power',
            description: 'GPS 模組電源',
            targetNet: '3V3',
          },
          {
            id: 'gps-rx',
            label: 'RX (模組接收)',
            hole: 'c29',
            type: 'signal',
            description: '★ 交叉接線：模組 RX 需接 ESP32 的發送腳 TX2 (GPIO17)',
            targetNet: 'GPIO17',
          },
          {
            id: 'gps-tx',
            label: 'TX (模組發送)',
            hole: 'c30',
            type: 'signal',
            description: '★ 交叉接線：模組 TX 需接 ESP32 的接收腳 RX2 (GPIO16)',
            targetNet: 'GPIO16',
          },
          {
            id: 'gps-gnd',
            label: 'GND',
            hole: 'c31',
            type: 'gnd',
            description: '接地腳（務必共地）',
            targetNet: 'GND',
          },
        ],
      },
    ],
    passives: [],
    wires: [
      {
        id: 'w-gps-vcc',
        fromHole: 'a4',
        toHole: 'a28',
        color: 'red',
        signalName: '3.3V 電源',
        espPin: '3V3 (Pin 1)',
        sensorPin: 'GPS VCC (c28)',
        description: '供應 GPS 模組 3.3V 電源',
      },
      {
        id: 'w-uart-tx-to-rx',
        fromHole: 'b10',
        toHole: 'b29',
        color: 'orange',
        signalName: 'TX2 → 模組 RX (交叉線 1)',
        espPin: 'TX2 / GPIO17 (Pin 7)',
        sensorPin: 'GPS RX (c29)',
        description: '★ 交叉接線：ESP32 的發送腳 TX2 (GPIO17) 送到 GPS 模組的接收腳 RX',
      },
      {
        id: 'w-uart-rx-to-tx',
        fromHole: 'a9',
        toHole: 'a30',
        color: 'green',
        signalName: 'RX2 ← 模組 TX (交叉線 2)',
        espPin: 'RX2 / GPIO16 (Pin 6)',
        sensorPin: 'GPS TX (c30)',
        description: '★ 交叉接線：GPS 模組的發送腳 TX 送到 ESP32 的接收腳 RX2 (GPIO16)',
      },
      {
        id: 'w-gps-gnd',
        fromHole: 'a5',
        toHole: 'a31',
        color: 'black',
        signalName: 'GND 共地線',
        espPin: 'GND (Pin 2)',
        sensorPin: 'GPS GND (c31)',
        description: '雙方必須共地才能有相同的邏輯電壓基準',
      },
    ],
    simControls: [
      {
        id: 'satellites',
        label: '模擬鎖定 GPS 衛星數量',
        type: 'slider',
        min: 3,
        max: 12,
        step: 1,
        unit: '顆',
        defaultValue: 8,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide 4.1.2 UART2 資料收發範例 (ESP-IDF v5.x)
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/uart.h"
#include "driver/gpio.h"
#include "esp_log.h"

#define UART_PORT_NUM   UART_NUM_2
#define UART2_TX_PIN    GPIO_NUM_17
#define UART2_RX_PIN    GPIO_NUM_16
#define BUF_SIZE        1024

void app_main(void) {
    uart_config_t uart_config = {
        .baud_rate = 9600, // GPS 模組標準鮑率 9600 bps
        .data_bits = UART_DATA_8_BITS,
        .parity    = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };
    ESP_ERROR_CHECK(uart_driver_install(UART_PORT_NUM, BUF_SIZE * 2, 0, 0, NULL, 0));
    ESP_ERROR_CHECK(uart_param_config(UART_PORT_NUM, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(UART_PORT_NUM, UART2_TX_PIN, UART2_RX_PIN,
                                 UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));

    uint8_t data[128];
    while (1) {
        int len = uart_read_bytes(UART_PORT_NUM, data, sizeof(data) - 1, pdMS_TO_TICKS(500));
        if (len > 0) {
            data[len] = '\\0';
            ESP_LOGI("UART2_GPS", "收到 NMEA: %s", (char *)data);
        }
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：使用硬體 Serial2 (RX2=GPIO16, TX2=GPIO17)
#include <Arduino.h>

#define RXD2 16 // ESP32 RX2 接 GPS TX
#define TXD2 17 // ESP32 TX2 接 GPS RX

void setup() {
  Serial.begin(115200);                         // 電腦 USB 監控埠
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);  // 外部 GPS 模組埠
  Serial.println("[UART2] 啟動完成 (RX2=GPIO16 <- GPS_TX, TX2=GPIO17 -> GPS_RX)");
}

void loop() {
  while (Serial2.available()) {
    String nmeaLine = Serial2.readStringUntil('\\n');
    if (nmeaLine.startsWith("$GPGGA") || nmeaLine.startsWith("$GPRMC")) {
      Serial.println("[GPS NMEA] " + nmeaLine);
    }
  }
}`,
  },
  {
    id: "rmt-ws2812-rgb",
    chapter: "4.1.9 RMT 紅外線與智慧燈珠",
    title: "WS2812B (NeoPixel) 單線定址全彩 RGB 燈環",
    subtitle: "利用 ESP32 專屬 RMT 硬體外設產生精準 800kHz 奈秒級時序控制全彩燈條",
    difficulty: "實戰",
    protocols: ["GPIO", "PWM"],
    guideRef: "DuRuofu/ESP32-Guide 第 4 章外設進階：RMT 驅動 WS2812B 智慧全彩 LED",
    summary:
      "WS2812B 將控制晶片與 RGB 三色 LED 封裝在同一顆 5050 燈珠內，只需一根資料線 DIN (GPIO18) 即可透過 24-bit GRB 串列訊號獨立控制數十顆燈珠的顏色與亮度。ESP32 內建的 RMT（Remote Control Transceiver）硬體外設能自動發出精準的 0.4us/0.85us 脈寬，完全不佔用 CPU 中斷！",
    applicationScenes: [
      "機台運作狀態全彩指示燈環（綠燈正常、黃燈預警、紅燈閃爍故障）",
      "智慧居家氛圍燈帶、音訊頻譜律動燈條",
      "電競鍵盤/機殼 ARGB 燈效同步控制",
    ],
    hardwarePrinciples: [
      "單線串聯協定：每顆 WS2812B 接收前 24 bits（8-bit 綠 + 8-bit 紅 + 8-bit 藍）後，會自動將後續資料從 DOUT 轉發給下一顆燈珠。",
      "供電估算：單顆 WS2812B 全白最亮時耗電約 60mA，8 顆燈環全亮可達 480mA，因此 VCC 必須接在 ESP32 的 VIN (5V)，若超過 15 顆則需外接獨立 5V 變壓器並共地。",
    ],
    pitfalls: [
      "⚠️ 嚴禁把整條 WS2812B 燈帶的電源接在 3.3V 腳位，大電流會導致 ESP32 3.3V 穩壓器過熱保護或不斷重開機（Brownout Reset）。",
      "⚠️ 注意燈條上的箭頭方向：資料線必須接在 DIN（Data In 輸入端），若誤接在 DOUT（輸出端）將完全不會亮！",
    ],
    components: [
      {
        id: "comp-ws2812",
        name: "WS2812B 8顆全彩 RGB 模組",
        model: "WS2812B-8LED",
        visualType: "ws2812_rgb",
        colStart: 28,
        colEnd: 30,
        rowPlacement: "upper",
        pins: [
          {
            id: "ws-vcc",
            label: "5V (VCC)",
            hole: "c28",
            type: "power",
            description: "5V 動力電源輸入，接 ESP32 VIN (5V)",
            targetNet: "5V",
          },
          {
            id: "ws-din",
            label: "DIN (資料輸入)",
            hole: "c29",
            type: "signal",
            description: "800kHz GRB 串列資料輸入，接 ESP32 GPIO18 (RMT 通道)",
            targetNet: "GPIO18",
          },
          {
            id: "ws-gnd",
            label: "GND (接地)",
            hole: "c30",
            type: "gnd",
            description: "電源與訊號共地",
            targetNet: "GND",
          },
        ],
      },
    ],
    passives: [],
    wires: [
      {
        id: "w-ws-5v",
        fromHole: "j4",
        toHole: "a28",
        color: "red",
        signalName: "5V 電源 (VIN)",
        espPin: "VIN (5V, Pin 16)",
        sensorPin: "WS2812B 5V (c28)",
        description: "由 VIN 提供 5V 高電流給 RGB 燈珠",
      },
      {
        id: "w-ws-din",
        fromHole: "a12",
        toHole: "a29",
        color: "green",
        signalName: "RMT DIN 資料線 (GPIO18)",
        espPin: "GPIO18 (D18)",
        sensorPin: "WS2812B DIN (c29)",
        description: "ESP32 RMT 外設輸出 800kHz 24-bit GRB 色彩資料",
      },
      {
        id: "w-ws-gnd",
        fromHole: "a5",
        toHole: "a30",
        color: "black",
        signalName: "GND 共地線",
        espPin: "GND (Pin 2)",
        sensorPin: "WS2812B GND (c30)",
        description: "與 ESP32 共地",
      },
    ],
    simControls: [
      {
        id: "hueDeg",
        label: "RGB 彩虹色相角度 (Hue)",
        type: "slider",
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
        defaultValue: 180,
      },
      {
        id: "rgbBright",
        label: "燈珠整體亮度",
        type: "slider",
        min: 10,
        max: 100,
        step: 10,
        unit: "%",
        defaultValue: 80,
      },
    ],
    espIdfCode: `// DuRuofu/ESP32-Guide RMT 驅動 WS2812B 範例 (ESP-IDF v5.x led_strip 組件)
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "led_strip.h"
#include "esp_log.h"

#define WS2812_GPIO_PIN GPIO_NUM_18
#define WS2812_LED_NUM  8

void app_main(void) {
    led_strip_handle_t led_strip;
    led_strip_config_t strip_config = {
        .strip_gpio_num = WS2812_GPIO_PIN,
        .max_leds = WS2812_LED_NUM,
    };
    led_strip_rmt_config_t rmt_config = {
        .resolution_hz = 10 * 1000 * 1000, // 10MHz (1 tick = 0.1us)
    };
    ESP_ERROR_CHECK(led_strip_new_rmt_device(&strip_config, &rmt_config, &led_strip));

    while (1) {
        for (int i = 0; i < WS2812_LED_NUM; i++) {
            ESP_ERROR_CHECK(led_strip_set_pixel(led_strip, i, 0, 180, 255));
        }
        ESP_ERROR_CHECK(led_strip_refresh(led_strip));
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}`,
    arduinoCode: `// Arduino C++ 對照版：使用 Adafruit_NeoPixel 控制 WS2812B
#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

#define PIN_WS2812 18
#define NUM_PIXELS 8

Adafruit_NeoPixel strip(NUM_PIXELS, PIN_WS2812, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(115200);
  strip.begin();
  strip.setBrightness(200);
  strip.show();
}

void loop() {
  for (int i = 0; i < NUM_PIXELS; i++) {
    strip.setPixelColor(i, strip.Color(0, 180, 255));
  }
  strip.show();
  delay(500);
}`,
  },
];
