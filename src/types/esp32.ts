export type WireColor =
  | 'red'
  | 'black'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'purple'
  | 'cyan'
  | 'white';

export type ProtocolType =
  | 'GPIO'
  | 'PWM'
  | 'ADC'
  | '1-Wire'
  | 'I2C'
  | 'SPI'
  | 'UART'
  | 'Timer';

export interface Esp32PinDef {
  pinNumber: number;
  side: 'top' | 'bottom'; // on horizontal breadboard: top row (row c) vs bottom row (row h)
  col: number; // breadboard column (4..18)
  hole: string; // e.g. 'c4' or 'h4'
  silk: string; // silk label on board e.g. '3V3', 'GND', 'D21'
  gpio: string; // full name e.g. 'GPIO21'
  capabilities: string[];
  inputOnly?: boolean;
  strapping?: boolean;
  adcChannel?: 'ADC1' | 'ADC2';
  note?: string;
}

export interface ComponentPin {
  id: string;
  label: string;
  hole: string; // e.g. 'c32'
  type: 'power' | 'gnd' | 'signal' | 'nc';
  description: string;
  targetNet?: string; // canonical electrical net name for quiz verification e.g. '3V3', 'GND', 'GPIO21'
}

export interface SensorComponent {
  id: string;
  name: string;
  model: string;
  visualType:
    | 'led'
    | 'button'
    | 'potentiometer'
    | 'ldr'
    | 'dht11'
    | 'hcsr04'
    | 'oled_ssd1306'
    | 'mpu6050'
    | 'servo_sg90'
    | 'sdcard_spi'
    | 'uart_gps'
    | 'ws2812_rgb';
  colStart: number;
  colEnd: number;
  rowPlacement: 'upper' | 'lower' | 'bridge' | 'offboard-top' | 'offboard-bottom';
  pins: ComponentPin[];
  ledColor?: string;
}

export interface PassiveComponent {
  id: string;
  type: 'resistor';
  value: string; // e.g. '220Ω', '4.7kΩ', '10kΩ'
  fromHole: string;
  toHole: string;
  purpose: string;
  bands: [string, string, string, string]; // 4-band resistor colors
}

export interface WireConnection {
  id: string;
  fromHole: string;
  toHole: string;
  color: WireColor;
  signalName: string;
  espPin: string;
  sensorPin: string;
  description: string;
  arcOffset?: number; // curve height offset for neat routing
}

export interface SimControl {
  id: string;
  label: string;
  type: 'slider' | 'toggle' | 'button';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue: number;
}

export interface ExampleLesson {
  id: string;
  chapter: string; // e.g. '4.1.1 GPIO'
  title: string;
  subtitle: string;
  difficulty: '入門' | '進階' | '實戰';
  protocols: ProtocolType[];
  guideRef: string; // Reference to DuRuofu/ESP32-Guide section
  summary: string;
  applicationScenes: string[];
  hardwarePrinciples: string[];
  pitfalls: string[]; // Warnings & hardware gotchas
  components: SensorComponent[];
  passives: PassiveComponent[];
  wires: WireConnection[];
  simControls: SimControl[];
  espIdfCode: string;
  arduinoCode: string;
}
