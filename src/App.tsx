import React, { useState, useMemo, useEffect } from 'react';
import { LESSONS } from './data/lessons';
import { ESP32_PINS } from './data/esp32Pinout';
import {
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  PITCH,
  TOTAL_COLS,
  UPPER_ROWS,
  LOWER_ROWS,
  getHoleCoords,
  getStripId,
  getConductiveHolesInStrip,
  areHolesConnected,
  describeHoleOccupant,
} from './utils/breadboard';
import {
  ExampleLesson,
  SensorComponent,
  WireColor,
  WireConnection,
} from './types/esp32';

const WIRE_HEX: Record<WireColor, string> = {
  red: '#ef4444',
  black: '#475569',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  cyan: '#06b6d4',
  white: '#f8fafc',
};

const WIRE_COLOR_OPTIONS: { color: WireColor; label: string }[] = [
  { color: 'red', label: '紅 (VCC)' },
  { color: 'black', label: '黑 (GND)' },
  { color: 'yellow', label: '黃 (SCL/TRIG)' },
  { color: 'blue', label: '藍 (SDA/MOSI)' },
  { color: 'green', label: '綠 (DATA/MISO)' },
  { color: 'orange', label: '橘 (PWM/TX)' },
  { color: 'cyan', label: '青 (ECHO)' },
  { color: 'purple', label: '紫 (CS)' },
];

export default function App() {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');

  // Interactive Breadboard State
  const [hoveredHole, setHoveredHole] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);
  const [selectedPinHole, setSelectedPinHole] = useState<string | null>(null);
  const [showPinLabels, setShowPinLabels] = useState<boolean>(true);
  const [showConductiveStrips, setShowConductiveStrips] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);

  // Practice / Quiz Mode State
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [userWires, setUserWires] = useState<WireConnection[]>([]);
  const [pendingStartHole, setPendingStartHole] = useState<string | null>(null);
  const [activeWireColor, setActiveWireColor] = useState<WireColor>('green');

  // Right Panel Tabs
  const [rightTab, setRightTab] = useState<'guide' | 'code' | 'pinout'>('guide');
  const [codeFramework, setCodeFramework] = useState<'espidf' | 'arduino'>('espidf');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Simulation Values State
  const [simValues, setSimValues] = useState<Record<string, number>>({});
  const [blinkTick, setBlinkTick] = useState<boolean>(false);

  const currentLesson: ExampleLesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0],
    [selectedLessonId]
  );

  // Reset simulation & practice state when switching lessons
  useEffect(() => {
    const initial: Record<string, number> = {};
    for (const ctrl of currentLesson.simControls) {
      initial[ctrl.id] = ctrl.defaultValue;
    }
    setSimValues(initial);
    setHoveredHole(null);
    setHoveredWireId(null);
    setPendingStartHole(null);
    if (practiceMode) {
      // Keep power rail jumper wires or start completely fresh
      setUserWires([]);
    }
  }, [currentLesson, practiceMode]);

  // Blink timer for GPIO LED simulation
  useEffect(() => {
    const freq = simValues['blinkFreq'] ?? 1;
    if (freq <= 0) {
      setBlinkTick(false);
      return;
    }
    const interval = setInterval(() => {
      setBlinkTick((prev) => !prev);
    }, Math.max(120, Math.round(500 / freq)));
    return () => clearInterval(interval);
  }, [simValues]);

  // Filtered lessons in sidebar
  const filteredLessons = useMemo(() => {
    return LESSONS.filter((lesson) => {
      const matchProto =
        protocolFilter === 'ALL' ||
        lesson.protocols.includes(protocolFilter as any);
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchProto;
      return (
        matchProto &&
        (lesson.title.toLowerCase().includes(q) ||
          lesson.chapter.toLowerCase().includes(q) ||
          lesson.subtitle.toLowerCase().includes(q) ||
          lesson.summary.toLowerCase().includes(q) ||
          lesson.components.some((c) => c.name.toLowerCase().includes(q)))
      );
    });
  }, [searchQuery, protocolFilter]);

  const activeWires = practiceMode ? userWires : currentLesson.wires;

  // Conductive holes highlighted when hovering a hole or wire
  const highlightedHoles = useMemo(() => {
    const set = new Set<string>();
    if (hoveredHole && showConductiveStrips) {
      for (const h of getConductiveHolesInStrip(hoveredHole)) {
        set.add(h);
      }
    }
    if (hoveredWireId) {
      const w = activeWires.find((item) => item.id === hoveredWireId);
      if (w) {
        for (const h of getConductiveHolesInStrip(w.fromHole)) set.add(h);
        for (const h of getConductiveHolesInStrip(w.toHole)) set.add(h);
      }
    }
    if (pendingStartHole) {
      for (const h of getConductiveHolesInStrip(pendingStartHole)) set.add(h);
    }
    return set;
  }, [hoveredHole, hoveredWireId, pendingStartHole, activeWires, showConductiveStrips]);

  // Quiz verification: check each required wire in currentLesson.wires
  const quizResults = useMemo(() => {
    return currentLesson.wires.map((targetWire) => {
      const connected = areHolesConnected(
        targetWire.fromHole,
        targetWire.toHole,
        userWires,
        currentLesson.passives,
        false
      );
      return {
        wire: targetWire,
        connected,
      };
    });
  }, [currentLesson, userWires]);

  const completedQuizCount = quizResults.filter((r) => r.connected).length;

  // Live Serial Monitor output generator based on simulation controls
  const serialLogs = useMemo(() => {
    const logs: string[] = [];
    const id = currentLesson.id;
    if (id === 'gpio-led-button') {
      const btn = simValues['buttonPressed'] === 1;
      const freq = simValues['blinkFreq'] ?? 1;
      const ledOn = btn ? true : freq > 0 ? blinkTick : false;
      logs.push(`I (1024) GPIO_DEMO: GPIO5=OUTPUT, GPIO27=INPUT_PULLUP (ISR NEGEDGE)`);
      logs.push(
        `I (1524) GPIO_DEMO: 按鈕狀態(GPIO27)=${btn ? '0 (按下接地!)' : '1 (上拉3.3V)'} | LED(GPIO5)=${
          ledOn ? 'HIGH (亮起)' : 'LOW (熄滅)'
        }`
      );
    } else if (id === 'pwm-led-servo') {
      const duty = simValues['dutyPercent'] ?? 75;
      const angle = simValues['servoAngle'] ?? 90;
      const pulseUs = Math.round(500 + (angle / 180) * 2000);
      const raw13Bit = Math.round((duty / 100) * 8191);
      logs.push(`I (2010) LEDC_PWM: GPIO5 Duty=${duty}% (13-bit raw=${raw13Bit}/8191)`);
      logs.push(
        `I (2015) SG90_SERVO: GPIO25 50Hz 目標角度=${angle}° -> 脈寬=${pulseUs}us`
      );
    } else if (id === 'adc-pot-ldr') {
      const potPct = simValues['potPercent'] ?? 65;
      const lux = simValues['ambientLux'] ?? 450;
      const rawPot = Math.round((potPct / 100) * 4095);
      const mvPot = Math.round((potPct / 100) * 3300);
      const rawLdr = Math.round((lux / 1000) * 3800);
      logs.push(
        `I (3100) ADC1_CH6(GPIO34): 可變電阻=${potPct}% -> Raw=${rawPot} (${mvPot} mV)`
      );
      logs.push(
        `I (3105) ADC1_CH4(GPIO32): 環境照度=${lux} lx -> Raw=${rawLdr}`
      );
    } else if (id === 'onewire-dht11') {
      const temp = simValues['temperature'] ?? 26;
      const hum = simValues['humidity'] ?? 60;
      const checksum = (hum + 0 + temp + 0) & 0xff;
      logs.push(
        `I (4020) DHT11(GPIO4): 40-bit 讀取成功 [4.7kΩ Pull-up OK]`
      );
      logs.push(
        `I (4022) DHT11(GPIO4): 溫度=${temp}.0 °C | 濕度=${hum}.0 %RH | Checksum=0x${checksum
          .toString(16)
          .toUpperCase()
          .padStart(2, '0')}`
      );
    } else if (id === 'ultrasonic-hcsr04') {
      const dist = simValues['distanceCm'] ?? 42;
      const echoUs = Math.round((dist * 2) / 0.034);
      logs.push(`I (5120) SR04: TRIG(GPIO5) 發送 10us 脈衝`);
      logs.push(
        `I (5125) SR04: ECHO(GPIO18) 高電位脈寬=${echoUs} us -> 計算距離=${dist.toFixed(
          1
        )} cm`
      );
    } else if (id === 'i2c-oled-mpu6050') {
      const pitch = simValues['pitchDeg'] ?? 15;
      const roll = simValues['rollDeg'] ?? -10;
      logs.push(
        `I (6010) I2C_BUS: SDA=GPIO21, SCL=GPIO22 (400kHz) -> 0x3C(OLED) ACK, 0x68(MPU6050) ACK`
      );
      logs.push(
        `I (6050) MPU6050(0x68): Pitch=${pitch}° | Roll=${roll}° -> 已同步繪製至 SSD1306 OLED(0x3C)`
      );
    } else if (id === 'spi-sdcard') {
      const trig = simValues['writeTrigger'] ?? 1;
      logs.push(
        `I (7010) SDSPI: VSPI Mounted (CS=GPIO5, SCK=GPIO18, MISO=GPIO19, MOSI=GPIO23)`
      );
      logs.push(
        `I (7080) FATFS: ${
          trig
            ? '寫入 /sdcard/log.csv -> "2026-11-11,26.0,60.0" (OK)'
            : '待機中，點擊右側按鈕可寫入 CSV 日誌'
        }`
      );
    } else if (id === 'rmt-ws2812-rgb') {
      const hue = simValues['hueDeg'] ?? 180;
      const bright = simValues['rgbBright'] ?? 80;
      logs.push(`I (9010) RMT_WS2812: Channel=GPIO18 (10MHz Tick, 800kHz GRB)`);
      logs.push(`I (9040) LED_STRIP: 8 顆 WS2812B 燈珠更新 -> Hue=${hue}°, Brightness=${bright}%`);
    } else if (id === 'uart-gps-serial') {
      const sats = simValues['satellites'] ?? 8;
      logs.push(
        `I (8010) UART2: 9600 8N1 | ESP32 RX2(GPIO16)<-GPS_TX, TX2(GPIO17)->GPS_RX`
      );
      logs.push(
        `I (8090) NMEA: $GPGGA,091500.00,2237.65,N,12018.12,E,1,${String(
          sats
        ).padStart(2, '0')},0.9,18.2,M*4A`
      );
    }
    return logs;
  }, [currentLesson, simValues, blinkTick]);

  // Handle clicking a breadboard hole
  const handleHoleClick = (holeId: string) => {
    setSelectedPinHole(holeId);
    if (!practiceMode) return;

    if (!pendingStartHole) {
      setPendingStartHole(holeId);
    } else if (pendingStartHole === holeId) {
      setPendingStartHole(null);
    } else {
      const newWire: WireConnection = {
        id: `user-wire-${Date.now()}`,
        fromHole: pendingStartHole,
        toHole: holeId,
        color: activeWireColor,
        signalName: `自訂跳線 (${pendingStartHole} ↔ ${holeId})`,
        espPin: pendingStartHole,
        sensorPin: holeId,
        description: '使用者於練習模式連接之杜邦線',
      };
      setUserWires((prev) => [...prev, newWire]);
      setPendingStartHole(null);
    }
  };

  
  // Load lesson & custom wires from URL hash if present
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const lId = params.get("lesson");
    if (lId && LESSONS.some((l) => l.id === lId)) {
      setSelectedLessonId(lId);
    }
    const wParam = params.get("wires");
    if (wParam) {
      setPracticeMode(true);
      const parsed: WireConnection[] = wParam
        .split(",")
        .map((token, idx) => {
          const [fromHole, toHole, color] = token.split("-");
          if (!fromHole || !toHole) return null;
          return {
            id: `shared-wire-${idx}-${Date.now()}`,
            fromHole,
            toHole,
            color: (color as WireColor) || "green",
            signalName: `分享跳線 (${fromHole} ↔ ${toHole})`,
            espPin: fromHole,
            sensorPin: toHole,
            description: "由網址分享載入之自訂杜邦線",
          };
        })
        .filter(Boolean) as WireConnection[];
      setTimeout(() => setUserWires(parsed), 50);
    }
  }, []);

  const handleShareLink = () => {
    const params = new URLSearchParams();
    params.set("lesson", currentLesson.id);
    if (practiceMode && userWires.length > 0) {
      params.set(
        "wires",
        userWires.map((w) => `${w.fromHole}-${w.toHole}-${w.color}`).join(",")
      );
    }
    const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    window.history.replaceState(null, "", `#${params.toString()}`);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    const text =
      codeFramework === 'espidf'
        ? currentLesson.espIdfCode
        : currentLesson.arduinoCode;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  // Determine hovered hole occupant details
  const activeInspectHole = hoveredHole || selectedPinHole;
  const holeInfo = useMemo(() => {
    if (!activeInspectHole) return null;
    return describeHoleOccupant(activeInspectHole, currentLesson.components);
  }, [activeInspectHole, currentLesson.components]);

  const hoveredWire = useMemo(
    () => activeWires.find((w) => w.id === hoveredWireId) || null,
    [activeWires, hoveredWireId]
  );

  // Render sensor visual body on the SVG breadboard
  const renderSensorComponent = (comp: SensorComponent) => {
    const firstPin = getHoleCoords(comp.pins[0]?.hole || 'c28');
    const lastPin = getHoleCoords(
      comp.pins[comp.pins.length - 1]?.hole || 'c30'
    );
    const centerX = (firstPin.x + lastPin.x) / 2;

    if (comp.visualType === 'led') {
      const isPwm = currentLesson.id === 'pwm-led-servo';
      const btnPressed = simValues['buttonPressed'] === 1;
      const freq = simValues['blinkFreq'] ?? 1;
      const duty = simValues['dutyPercent'] ?? 75;
      const brightness = isPwm
        ? duty / 100
        : btnPressed
        ? 1
        : freq > 0
        ? blinkTick
          ? 1
          : 0.15
        : 0.15;
      const color = comp.ledColor || '#ef4444';
      const bodyY = firstPin.y - 44;

      return (
        <g key={comp.id} className="pointer-events-none">
          {/* Legs */}
          <line
            x1={firstPin.x}
            y1={firstPin.y}
            x2={firstPin.x + 3}
            y2={bodyY + 14}
            stroke="#94a3b8"
            strokeWidth={2.5}
          />
          <line
            x1={lastPin.x}
            y1={lastPin.y}
            x2={lastPin.x - 3}
            y2={bodyY + 14}
            stroke="#94a3b8"
            strokeWidth={2.5}
          />
          {/* Glow */}
          {brightness > 0.2 && (
            <circle
              cx={centerX}
              cy={bodyY}
              r={26 * brightness + 10}
              fill={color}
              opacity={0.35 * brightness}
            />
          )}
          {/* LED Dome */}
          <circle
            cx={centerX}
            cy={bodyY}
            r={14}
            fill={color}
            fillOpacity={0.35 + 0.65 * brightness}
            stroke="#f8fafc"
            strokeWidth={1.5}
          />
          <circle
            cx={centerX - 4}
            cy={bodyY - 4}
            r={4}
            fill="#ffffff"
            opacity={0.6 + 0.4 * brightness}
          />
          <text
            x={centerX}
            y={bodyY - 20}
            textAnchor="middle"
            className="fill-slate-100 text-[11px] font-bold"
          >
            {comp.name} {isPwm ? `(${duty}%)` : brightness > 0.5 ? '(ON)' : '(OFF)'}
          </text>
        </g>
      );
    }

    if (comp.visualType === 'button') {
      const topPin = getHoleCoords(comp.pins[0].hole);
      const botPin = getHoleCoords(comp.pins[2].hole);
      const rightPin = getHoleCoords(comp.pins[1].hole);
      const midX = (topPin.x + rightPin.x) / 2;
      const midY = (topPin.y + botPin.y) / 2;
      const isPressed = simValues['buttonPressed'] === 1;

      return (
        <g
          key={comp.id}
          onClick={() =>
            setSimValues((prev) => ({
              ...prev,
              buttonPressed: prev.buttonPressed === 1 ? 0 : 1,
            }))
          }
          className="cursor-pointer"
        >
          <rect
            x={midX - 24}
            y={midY - 22}
            width={48}
            height={44}
            rx={6}
            fill="#334155"
            stroke={isPressed ? '#22d3ee' : '#94a3b8'}
            strokeWidth={2}
          />
          <circle
            cx={midX}
            cy={midY}
            r={12}
            fill={isPressed ? '#06b6d4' : '#0f172a'}
            stroke="#e2e8f0"
            strokeWidth={1.5}
          />
          <text
            x={midX}
            y={midY - 28}
            textAnchor="middle"
            className="fill-cyan-300 text-[11px] font-bold"
          >
            {comp.name} (點擊按壓)
          </text>
        </g>
      );
    }

    if (comp.visualType === 'servo_sg90') {
      const angle = simValues['servoAngle'] ?? 90;
      const bodyY = firstPin.y + 42;
      return (
        <g key={comp.id} className="pointer-events-none">
          {comp.pins.map((p) => {
            const pt = getHoleCoords(p.hole);
            return (
              <line
                key={p.id}
                x1={pt.x}
                y1={pt.y}
                x2={pt.x}
                y2={bodyY}
                stroke={
                  p.type === 'power'
                    ? '#ef4444'
                    : p.type === 'gnd'
                    ? '#475569'
                    : '#f97316'
                }
                strokeWidth={3}
              />
            );
          })}
          <rect
            x={centerX - 42}
            y={bodyY}
            width={84}
            height={44}
            rx={6}
            fill="#1d4ed8"
            stroke="#60a5fa"
            strokeWidth={2}
          />
          <circle
            cx={centerX - 14}
            cy={bodyY + 22}
            r={14}
            fill="#1e3a8a"
            stroke="#93c5fd"
            strokeWidth={1.5}
          />
          {/* Rotating Servo Horn */}
          <g
            transform={`translate(${centerX - 14}, ${bodyY + 22}) rotate(${
              angle - 90
            })`}
          >
            <rect
              x={-4}
              y={-26}
              width={8}
              height={32}
              rx={4}
              fill="#f8fafc"
              stroke="#475569"
              strokeWidth={1.5}
            />
            <circle cx={0} cy={0} r={3} fill="#ef4444" />
          </g>
          <text
            x={centerX + 18}
            y={bodyY + 20}
            textAnchor="middle"
            className="fill-white text-[10px] font-bold"
          >
            SG90
          </text>
          <text
            x={centerX + 18}
            y={bodyY + 33}
            textAnchor="middle"
            className="fill-amber-300 text-[11px] font-bold"
          >
            {angle}°
          </text>
        </g>
      );
    }

    if (comp.visualType === 'potentiometer' || comp.visualType === 'ldr') {
      const bodyY = firstPin.y + 34;
      const isPot = comp.visualType === 'potentiometer';
      const val = isPot
        ? `${simValues['potPercent'] ?? 65}%`
        : `${simValues['ambientLux'] ?? 450} lx`;
      return (
        <g key={comp.id} className="pointer-events-none">
          {comp.pins.map((p) => {
            const pt = getHoleCoords(p.hole);
            return (
              <line
                key={p.id}
                x1={pt.x}
                y1={pt.y}
                x2={pt.x}
                y2={bodyY}
                stroke="#cbd5e1"
                strokeWidth={2.5}
              />
            );
          })}
          <rect
            x={centerX - 38}
            y={bodyY}
            width={76}
            height={44}
            rx={6}
            fill={isPot ? '#0f766e' : '#1e3a8a'}
            stroke="#5eead4"
            strokeWidth={1.8}
          />
          <text
            x={centerX}
            y={bodyY + 18}
            textAnchor="middle"
            className="fill-white text-[10px] font-bold"
          >
            {comp.name}
          </text>
          <text
            x={centerX}
            y={bodyY + 34}
            textAnchor="middle"
            className="fill-amber-300 text-[11px] font-mono font-bold"
          >
            {val}
          </text>
        </g>
      );
    }

    // Top-mounted rectangular modules: DHT11, HC-SR04, OLED, MPU6050, SDCard, GPS
    const bodyWidth = Math.max(88, (comp.pins.length + 1) * PITCH + 16);
    const bodyHeight = 52;
    const bodyY = firstPin.y - bodyHeight - 24;

    let moduleFill = '#0284c7';
    let badgeText = comp.model;
    if (comp.visualType === 'dht11') {
      moduleFill = '#0ea5e9';
      badgeText = `${simValues['temperature'] ?? 26}°C / ${
        simValues['humidity'] ?? 60
      }%RH`;
    } else if (comp.visualType === 'hcsr04') {
      moduleFill = '#1d4ed8';
      badgeText = `距離: ${simValues['distanceCm'] ?? 42} cm`;
    } else if (comp.visualType === 'oled_ssd1306') {
      moduleFill = '#0f172a';
      badgeText = `I2C 0x3C | P:${simValues['pitchDeg'] ?? 15}° R:${
        simValues['rollDeg'] ?? -10
      }°`;
    } else if (comp.visualType === 'mpu6050') {
      moduleFill = '#047857';
      badgeText = `I2C 0x68 (GY-521)`;
    } else if (comp.visualType === 'sdcard_spi') {
      moduleFill = '#b91c1c';
      badgeText = `VSPI FAT32 Ready`;
    } else if (comp.visualType === 'ws2812_rgb') {
      const hue = simValues['hueDeg'] ?? 180;
      const bright = simValues['rgbBright'] ?? 80;
      moduleFill = `hsl(${hue}, 85%, ${Math.max(25, Math.round(bright * 0.5))}%)`;
      badgeText = `Hue:${hue}° 亮度:${bright}%`;
    } else if (comp.visualType === 'uart_gps') {
      moduleFill = '#4338ca';
      badgeText = `9600bps | 衛星:${simValues['satellites'] ?? 8}顆`;
    }

    return (
      <g key={comp.id} className="pointer-events-none">
        {/* Pin Header Legs */}
        {comp.pins.map((p) => {
          const pt = getHoleCoords(p.hole);
          return (
            <line
              key={p.id}
              x1={pt.x}
              y1={pt.y}
              x2={pt.x}
              y2={bodyY + bodyHeight}
              stroke="#eab308"
              strokeWidth={3}
            />
          );
        })}
        {/* Module PCB */}
        <rect
          x={centerX - bodyWidth / 2}
          y={bodyY}
          width={bodyWidth}
          height={bodyHeight}
          rx={6}
          fill={moduleFill}
          stroke="#e2e8f0"
          strokeWidth={1.8}
        />
        <text
          x={centerX}
          y={bodyY + 20}
          textAnchor="middle"
          className="fill-white text-[11px] font-bold"
        >
          {comp.name}
        </text>
        <rect
          x={centerX - bodyWidth / 2 + 8}
          y={bodyY + 27}
          width={bodyWidth - 16}
          height={18}
          rx={3}
          fill="#020617"
          opacity={0.75}
        />
        <text
          x={centerX}
          y={bodyY + 40}
          textAnchor="middle"
          className="fill-cyan-300 text-[10px] font-mono font-semibold"
        >
          {badgeText}
        </text>
      </g>
    );
  };

  // ESP32 Board visual geometry (straddling columns 4..18 between row c and row h)
  const espLeftX = getHoleCoords('c4').x - 16;
  const espRightX = getHoleCoords('c18').x + 16;
  const espTopY = getHoleCoords('c4').y + 5;
  const espBotY = getHoleCoords('h4').y - 5;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header Bar */}
      <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-cyan-500/20">
            ESP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white">
                ESP32 互動式麵包板學習工作台
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                DuRuofu/ESP32-Guide 實戰對照
              </span>
            </div>
            <p className="text-xs text-slate-400">
              全圖形麵包板接線視覺化 · 5孔銅片導通高亮 · 動態感測器模擬 · ESP-IDF / Arduino 雙框架程式碼
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setPracticeMode(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !practiceMode
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📘 標準教學接線模式
          </button>
          <button
            onClick={() => setPracticeMode(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              practiceMode
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ 自由接線練習 / 測驗模式 ({completedQuizCount}/{currentLesson.wires.length})
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={handleShareLink}
            className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-semibold transition"
            title="複製包含目前範例與自訂接線的分享網址"
          >
            {copiedLink ? "✓ 已複製分享網址" : "🔗 分享目前接線"}
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={showPinLabels}
              onChange={(e) => setShowPinLabels(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            顯示接點標籤
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={showConductiveStrips}
              onChange={(e) => setShowConductiveStrips(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            5孔導通高亮
          </label>
          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
              className="px-2 py-1 hover:bg-slate-700 text-slate-200"
              title="縮小麵包板"
            >
              -
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
              className="px-2 py-1 hover:bg-slate-700 text-slate-200"
              title="放大麵包板"
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* Main Three-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: Chapters & Sensor Examples */}
        <aside className="w-72 shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋感測器、腳位或協定 (如 I2C, DHT11)..."
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex flex-wrap gap-1">
              {['ALL', 'GPIO', 'PWM', 'ADC', '1-Wire', 'I2C', 'SPI', 'UART'].map(
                (proto) => (
                  <button
                    key={proto}
                    onClick={() => setProtocolFilter(proto)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      protocolFilter === proto
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {proto === 'ALL' ? '全部' : proto}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredLessons.map((lesson) => {
              const active = lesson.id === currentLesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/10 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                      {lesson.chapter}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        lesson.difficulty === '入門'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {lesson.difficulty}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 mb-1">
                    {lesson.title}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {lesson.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lesson.protocols.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800/70 text-slate-400 rounded">
                      {lesson.wires.length} 條線
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER WORKSPACE: Interactive Breadboard Canvas + Simulation Bar */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          {/* Top Lesson Banner & Quick Status */}
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  [{currentLesson.chapter}]
                </span>
                <h2 className="text-sm font-bold text-white">
                  {currentLesson.title}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLesson.guideRef}
              </p>
            </div>

            {/* Practice Mode Toolbar */}
            {practiceMode && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-semibold text-amber-300">
                  {pendingStartHole
                    ? `已選起點 [${pendingStartHole}]，請點擊目標孔位完成連線`
                    : '點擊任意兩個麵包板孔位即可拉線：'}
                </span>
                <div className="flex items-center gap-1">
                  {WIRE_COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.color}
                      onClick={() => setActiveWireColor(opt.color)}
                      title={opt.label}
                      className={`w-4 h-4 rounded-full border ${
                        activeWireColor === opt.color
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-70'
                      }`}
                      style={{ backgroundColor: WIRE_HEX[opt.color] }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setUserWires((prev) => prev.slice(0, -1))}
                  disabled={userWires.length === 0}
                  className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-200"
                >
                  復原上一條
                </button>
                <button
                  onClick={() => {
                    setUserWires([]);
                    setPendingStartHole(null);
                  }}
                  className="px-2 py-0.5 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded"
                >
                  清空重接
                </button>
              </div>
            )}
          </div>

          {/* Interactive SVG Breadboard Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
            <div
              className="transition-transform origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              <svg
                width={1090}
                height={470}
                viewBox="0 0 1090 470"
                className="select-none drop-shadow-2xl"
              >
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Breadboard Base Plastic Body */}
                <rect
                  x={28}
                  y={28}
                  width={1034}
                  height={405}
                  rx={16}
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth={3}
                />

                {/* Top & Bottom Power Rail Red/Blue Lines */}
                <line
                  x1={66}
                  y1={BOARD_ORIGIN_Y - 10}
                  x2={1026}
                  y2={BOARD_ORIGIN_Y - 10}
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                <text
                  x={48}
                  y={BOARD_ORIGIN_Y + 4}
                  className="fill-red-600 text-xs font-black font-mono"
                >
                  +
                </text>
                <line
                  x1={66}
                  y1={BOARD_ORIGIN_Y + PITCH + 10}
                  x2={1026}
                  y2={BOARD_ORIGIN_Y + PITCH + 10}
                  stroke="#2563eb"
                  strokeWidth={2}
                />
                <text
                  x={48}
                  y={BOARD_ORIGIN_Y + PITCH + 4}
                  className="fill-blue-600 text-xs font-black font-mono"
                >
                  -
                </text>

                {/* Bottom Power Rail Lines */}
                <line
                  x1={66}
                  y1={BOARD_ORIGIN_Y + 15 * PITCH - 10}
                  x2={1026}
                  y2={BOARD_ORIGIN_Y + 15 * PITCH - 10}
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                <text
                  x={48}
                  y={BOARD_ORIGIN_Y + 15 * PITCH + 4}
                  className="fill-red-600 text-xs font-black font-mono"
                >
                  +
                </text>
                <line
                  x1={66}
                  y1={BOARD_ORIGIN_Y + 16 * PITCH + 10}
                  x2={1026}
                  y2={BOARD_ORIGIN_Y + 16 * PITCH + 10}
                  stroke="#2563eb"
                  strokeWidth={2}
                />
                <text
                  x={48}
                  y={BOARD_ORIGIN_Y + 16 * PITCH + 4}
                  className="fill-blue-600 text-xs font-black font-mono"
                >
                  -
                </text>

                {/* Center DIP Ravine Groove */}
                <rect
                  x={42}
                  y={BOARD_ORIGIN_Y + 7.6 * PITCH}
                  width={1006}
                  height={1.3 * PITCH}
                  rx={4}
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth={1}
                />

                {/* Column Numbers (1..48) */}
                {Array.from({ length: TOTAL_COLS }, (_, i) => {
                  const col = i + 1;
                  const x = BOARD_ORIGIN_X + i * PITCH;
                  const showNum = col === 1 || col % 5 === 0 || col === TOTAL_COLS;
                  if (!showNum) return null;
                  return (
                    <g key={`col-num-${col}`}>
                      <text
                        x={x}
                        y={BOARD_ORIGIN_Y + 2.4 * PITCH}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-mono font-bold"
                      >
                        {col}
                      </text>
                      <text
                        x={x}
                        y={BOARD_ORIGIN_Y + 14.2 * PITCH}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-mono font-bold"
                      >
                        {col}
                      </text>
                    </g>
                  );
                })}

                {/* Row Letters (a..e, f..j) */}
                {UPPER_ROWS.map((r, idx) => {
                  const y = BOARD_ORIGIN_Y + (3 + idx) * PITCH + 4;
                  return (
                    <g key={`row-u-${r}`}>
                      <text
                        x={52}
                        y={y}
                        textAnchor="middle"
                        className="fill-slate-600 text-[11px] font-mono font-bold uppercase"
                      >
                        {r}
                      </text>
                      <text
                        x={1038}
                        y={y}
                        textAnchor="middle"
                        className="fill-slate-600 text-[11px] font-mono font-bold uppercase"
                      >
                        {r}
                      </text>
                    </g>
                  );
                })}
                {LOWER_ROWS.map((r, idx) => {
                  const y = BOARD_ORIGIN_Y + (9.5 + idx) * PITCH + 4;
                  return (
                    <g key={`row-l-${r}`}>
                      <text
                        x={52}
                        y={y}
                        textAnchor="middle"
                        className="fill-slate-600 text-[11px] font-mono font-bold uppercase"
                      >
                        {r}
                      </text>
                      <text
                        x={1038}
                        y={y}
                        textAnchor="middle"
                        className="fill-slate-600 text-[11px] font-mono font-bold uppercase"
                      >
                        {r}
                      </text>
                    </g>
                  );
                })}

                {/* Conductive Strip Highlight Overlay */}
                {showConductiveStrips && highlightedHoles.size > 0 && (
                  <g className="pointer-events-none">
                    {Array.from(highlightedHoles).map((hId) => {
                      const pt = getHoleCoords(hId);
                      return (
                        <circle
                          key={`hl-${hId}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={8}
                          fill="#22d3ee"
                          opacity={0.35}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Render All Breadboard Holes */}
                {Array.from({ length: TOTAL_COLS }, (_, i) => {
                  const col = i + 1;
                  const holesInCol = [
                    `tp+${col}`,
                    `tp-${col}`,
                    ...UPPER_ROWS.map((r) => `${r}${col}`),
                    ...LOWER_ROWS.map((r) => `${r}${col}`),
                    `bp+${col}`,
                    `bp-${col}`,
                  ];
                  return (
                    <g key={`holes-col-${col}`}>
                      {holesInCol.map((hId) => {
                        const pt = getHoleCoords(hId);
                        const isHighlighted = highlightedHoles.has(hId);
                        const isStart = pendingStartHole === hId;
                        return (
                          <g
                            key={hId}
                            onMouseEnter={() => setHoveredHole(hId)}
                            onMouseLeave={() => setHoveredHole(null)}
                            onClick={() => handleHoleClick(hId)}
                            className="cursor-pointer"
                          >
                            <rect
                              x={pt.x - 4.5}
                              y={pt.y - 4.5}
                              width={9}
                              height={9}
                              rx={2}
                              fill={
                                isStart
                                  ? '#f59e0b'
                                  : isHighlighted
                                  ? '#06b6d4'
                                  : '#334155'
                              }
                              stroke={
                                isHighlighted || isStart ? '#0891b2' : '#94a3b8'
                              }
                              strokeWidth={isHighlighted || isStart ? 1.8 : 0.8}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* ESP32-WROOM-32 DevKitC 30-Pin Module */}
                <g>
                  {/* Gold Pin Headers Plugged Into Row c (c4..c18) and Row h (h4..h18) */}
                  {ESP32_PINS.map((pin) => {
                    const pt = getHoleCoords(pin.hole);
                    const isUsed = activeWires.some(
                      (w) =>
                        getStripId(w.fromHole) === getStripId(pin.hole) ||
                        getStripId(w.toHole) === getStripId(pin.hole)
                    );
                    return (
                      <g
                        key={pin.pinNumber}
                        onMouseEnter={() => setHoveredHole(pin.hole)}
                        onMouseLeave={() => setHoveredHole(null)}
                        onClick={() => handleHoleClick(pin.hole)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={pt.x - 5}
                          y={pt.y - 5}
                          width={10}
                          height={10}
                          rx={2}
                          fill={isUsed ? '#eab308' : '#64748b'}
                          stroke={isUsed ? '#fef08a' : '#1e293b'}
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  })}

                  {/* Main Dark PCB Body */}
                  <rect
                    x={espLeftX}
                    y={espTopY}
                    width={espRightX - espLeftX}
                    height={espBotY - espTopY}
                    rx={8}
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth={2}
                  />

                  {/* Micro-USB Port on Left Edge */}
                  <rect
                    x={espLeftX - 10}
                    y={(espTopY + espBotY) / 2 - 16}
                    width={18}
                    height={32}
                    rx={3}
                    fill="#94a3b8"
                    stroke="#475569"
                    strokeWidth={1.5}
                  />

                  {/* Metallic ESP32-WROOM-32 RF Shield Can */}
                  <rect
                    x={espLeftX + 68}
                    y={espTopY + 20}
                    width={155}
                    height={espBotY - espTopY - 40}
                    rx={4}
                    fill="#334155"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                  />
                  <text
                    x={espLeftX + 145}
                    y={(espTopY + espBotY) / 2 - 3}
                    textAnchor="middle"
                    className="fill-slate-200 text-xs font-bold tracking-wider pointer-events-none"
                  >
                    ESP32-WROOM-32
                  </text>
                  <text
                    x={espLeftX + 145}
                    y={(espTopY + espBotY) / 2 + 12}
                    textAnchor="middle"
                    className="fill-cyan-400 text-[10px] font-mono pointer-events-none"
                  >
                    Dual-Core 240MHz · Wi-Fi & BLE
                  </text>

                  {/* Power Red LED on ESP32 */}
                  <circle
                    cx={espLeftX + 32}
                    cy={(espTopY + espBotY) / 2}
                    r={4}
                    fill="#ef4444"
                    filter="url(#glow)"
                  />

                  {/* Crisp Silk Labels for All 30 ESP32 Pins */}
                  {ESP32_PINS.map((pin) => {
                    const pt = getHoleCoords(pin.hole);
                    const isTop = pin.side === 'top';
                    const isUsed = activeWires.some(
                      (w) =>
                        getStripId(w.fromHole) === getStripId(pin.hole) ||
                        getStripId(w.toHole) === getStripId(pin.hole)
                    );
                    const labelY = isTop ? espTopY + 13 : espBotY - 6;
                    return (
                      <text
                        key={`silk-${pin.pinNumber}`}
                        x={pt.x}
                        y={labelY}
                        textAnchor="middle"
                        className={`text-[9px] font-mono font-bold pointer-events-none ${
                          isUsed
                            ? 'fill-amber-300'
                            : pin.silk === '3V3' || pin.silk === 'VIN'
                            ? 'fill-rose-400'
                            : pin.silk === 'GND'
                            ? 'fill-slate-400'
                            : 'fill-slate-300'
                        }`}
                      >
                        {pin.silk}
                      </text>
                    );
                  })}
                </g>

                {/* Render Sensor Modules */}
                {currentLesson.components.map((comp) =>
                  renderSensorComponent(comp)
                )}

                {/* Render Passive Resistors */}
                {currentLesson.passives.map((pas) => {
                  const p1 = getHoleCoords(pas.fromHole);
                  const p2 = getHoleCoords(pas.toHole);
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;
                  const angle =
                    (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
                  return (
                    <g key={pas.id} className="pointer-events-none">
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#94a3b8"
                        strokeWidth={2.5}
                      />
                      <g
                        transform={`translate(${midX}, ${midY}) rotate(${angle})`}
                      >
                        <rect
                          x={-14}
                          y={-5}
                          width={28}
                          height={10}
                          rx={4}
                          fill="#fde68a"
                          stroke="#92400e"
                          strokeWidth={1.2}
                        />
                        {pas.bands.map((bColor, idx) => (
                          <rect
                            key={idx}
                            x={-9 + idx * 5.5}
                            y={-5}
                            width={2.5}
                            height={10}
                            fill={bColor}
                          />
                        ))}
                      </g>
                      {showPinLabels && (
                        <text
                          x={midX}
                          y={midY - 10}
                          textAnchor="middle"
                          className="fill-amber-900 text-[10px] font-bold"
                        >
                          {pas.value}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Render Jumper Wires with Smooth Bezier Curves */}
                {activeWires.map((wire, idx) => {
                  const p1 = getHoleCoords(wire.fromHole);
                  const p2 = getHoleCoords(wire.toHole);
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;
                  // Offset curve so wires don't overlap flatly
                  const curveArc =
                    wire.arcOffset !== undefined
                      ? wire.arcOffset
                      : Math.abs(dy) < 40
                      ? -28 - (idx % 3) * 12
                      : (idx % 2 === 0 ? 1 : -1) * 24;
                  const ctrlX = midX;
                  const ctrlY = midY + curveArc;
                  const pathD = `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`;
                  const strokeHex = WIRE_HEX[wire.color] || '#38bdf8';
                  const isHovered = hoveredWireId === wire.id;

                  return (
                    <g
                      key={wire.id}
                      onMouseEnter={() => setHoveredWireId(wire.id)}
                      onMouseLeave={() => setHoveredWireId(null)}
                      onClick={() => {
                        if (practiceMode) {
                          // Click wire in practice mode to remove it
                          setUserWires((prev) =>
                            prev.filter((w) => w.id !== wire.id)
                          );
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {/* Outer Shadow / Glow on Hover */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isHovered ? '#ffffff' : '#020617'}
                        strokeWidth={isHovered ? 8 : 6.5}
                        strokeLinecap="round"
                        opacity={isHovered ? 0.85 : 0.45}
                      />
                      {/* Colored Insulation Core */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeHex}
                        strokeWidth={isHovered ? 5.5 : 4.2}
                        strokeLinecap="round"
                      />
                      {/* Boot Caps at Both Ends */}
                      <circle
                        cx={p1.x}
                        cy={p1.y}
                        r={4.2}
                        fill={strokeHex}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                      <circle
                        cx={p2.x}
                        cy={p2.y}
                        r={4.2}
                        fill={strokeHex}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />

                      {/* Floating Signal Pill Label */}
                      {(showPinLabels || isHovered) && (
                        <g
                          transform={`translate(${ctrlX}, ${
                             (p1.y + 2 * ctrlY + p2.y) / 4
                          })`}
                          className="pointer-events-none"
                        >
                          <rect
                            x={-68}
                            y={-10}
                            width={136}
                            height={18}
                            rx={9}
                            fill="#0f172a"
                            fillOpacity={0.92}
                            stroke={strokeHex}
                            strokeWidth={1.4}
                          />
                          <text
                            x={0}
                            y={2.5}
                            textAnchor="middle"
                            className="fill-slate-100 text-[9.5px] font-mono font-bold"
                          >
                            {wire.signalName}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Bottom Interactive Simulation & Live Serial Monitor Bar */}
          <div className="h-44 shrink-0 border-t border-slate-800 bg-slate-900/90 grid grid-cols-12 divide-x divide-slate-800">
            {/* Left 4 Cols: Hole / Wire Live Inspector */}
            <div className="col-span-4 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    🔍 接點與導通即時探針
                  </span>
                  {activeInspectHole && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      孔位: {activeInspectHole}
                    </span>
                  )}
                </div>

                {hoveredWire ? (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/40 space-y-1">
                    <div className="text-xs font-bold text-cyan-300">
                      杜邦線：{hoveredWire.signalName}
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono">
                      {hoveredWire.espPin} [{hoveredWire.fromHole}] ↔{' '}
                      {hoveredWire.sensorPin} [{hoveredWire.toHole}]
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {hoveredWire.description}
                    </p>
                  </div>
                ) : holeInfo ? (
                  <div
                    className={`p-2.5 rounded-lg border space-y-1 ${holeInfo.badgeColor}`}
                  >
                    <div className="text-xs font-bold">{holeInfo.title}</div>
                    <p className="text-[11px] opacity-90 leading-snug">
                      {holeInfo.subtitle}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                    將滑鼠移到麵包板上的任意孔位、ESP32 接腳、感測器或杜邦線上，即可檢視該排 5 孔銅片導通關係與電氣說明。
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  紅線: 3.3V/5V 電源
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                  黑線: GND 共地
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  彩線: GPIO/匯流排訊號
                </span>
              </div>
            </div>

            {/* Middle 4 Cols: Interactive Sensor Simulation Sliders */}
            <div className="col-span-4 p-3 flex flex-col justify-between overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  🎛️ 感測器物理量動態模擬器
                </span>
                <span className="text-[10px] text-slate-400">
                  調整數值即時連動麵包板與串口
                </span>
              </div>

              <div className="space-y-2.5 my-auto">
                {currentLesson.simControls.map((ctrl) => {
                  const val = simValues[ctrl.id] ?? ctrl.defaultValue;
                  if (ctrl.type === 'toggle') {
                    return (
                      <div
                        key={ctrl.id}
                        className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800"
                      >
                        <span className="text-xs font-medium text-slate-200">
                          {ctrl.label}
                        </span>
                        <button
                          onClick={() =>
                            setSimValues((prev) => ({
                              ...prev,
                              [ctrl.id]: val === 1 ? 0 : 1,
                            }))
                          }
                          className={`px-3 py-1 rounded text-xs font-bold transition ${
                            val === 1
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {val === 1 ? '已觸發 (ACTIVE)' : '點擊觸發'}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={ctrl.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          {ctrl.label}
                        </span>
                        <span className="font-mono font-bold text-cyan-300">
                          {val} {ctrl.unit || ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step}
                        value={val}
                        onChange={(e) =>
                          setSimValues((prev) => ({
                            ...prev,
                            [ctrl.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 4 Cols: Simulated ESP-IDF / Arduino Serial Monitor */}
            <div className="col-span-4 p-3 bg-slate-950 flex flex-col font-mono">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  UART0 Serial Monitor (115200 bps)
                </span>
                <span className="text-[10px] text-slate-500">ESP32 輸出日誌</span>
              </div>
              <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[11px] text-emerald-300 space-y-1.5 overflow-y-auto">
                {serialLogs.map((line, i) => (
                  <div key={i} className="leading-relaxed break-all">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Wiring Table, Hardware Principles, Pitfalls, and Dual-Framework Code */}
        <aside className="w-[430px] shrink-0 border-l border-slate-800 bg-slate-900/75 flex flex-col">
          {/* Tab Switcher */}
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
            <button
              onClick={() => setRightTab('guide')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                rightTab === 'guide'
                  ? 'bg-slate-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔌 接線表與原理
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                rightTab === 'code'
                  ? 'bg-slate-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💻 範例程式碼
            </button>
            <button
              onClick={() => setRightTab('pinout')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                rightTab === 'pinout'
                  ? 'bg-slate-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📌 ESP32 腳位表
            </button>
          </div>

          {/* Tab 1: Wiring Table, Application & Hardware Notes */}
          {rightTab === 'guide' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Summary */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  範例功能概述
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  {currentLesson.summary}
                </p>
              </section>

              {/* Interactive Wiring Pin-to-Pin Table */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    {practiceMode
                      ? '⚡ 接線測驗檢核表 (同排 5 孔皆可導通)'
                      : '📋 腳位接線對照表 (滑鼠移過可高亮麵包板)'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    共 {currentLesson.wires.length} 條杜邦線
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] text-slate-400">
                        <th className="py-2 px-2.5">訊號 / 線色</th>
                        <th className="py-2 px-2">ESP32 端</th>
                        <th className="py-2 px-2">感測器端</th>
                        {practiceMode && <th className="py-2 px-2">狀態</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {quizResults.map(({ wire, connected }) => (
                        <tr
                          key={wire.id}
                          onMouseEnter={() => setHoveredWireId(wire.id)}
                          onMouseLeave={() => setHoveredWireId(null)}
                          className="hover:bg-slate-800/60 cursor-pointer transition"
                        >
                          <td className="py-2 px-2.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: WIRE_HEX[wire.color],
                                }}
                              />
                              <span>{wire.signalName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-cyan-300">
                            {wire.espPin}
                            <span className="block text-[10px] text-slate-500">
                              孔位 {wire.fromHole}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-emerald-300">
                            {wire.sensorPin}
                            <span className="block text-[10px] text-slate-500">
                              孔位 {wire.toHole}
                            </span>
                          </td>
                          {practiceMode && (
                            <td className="py-2 px-2">
                              {connected ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                  ✓ 導通
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                  未接
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Passive Resistors if any */}
              {currentLesson.passives.length > 0 && (
                <section className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    被動元件（電阻跨接）
                  </h3>
                  {currentLesson.passives.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1"
                    >
                      <div className="font-bold text-amber-300">
                        {p.value}（孔位 {p.fromHole} ↔ {p.toHole}）
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {p.purpose}
                      </p>
                    </div>
                  ))}
                </section>
              )}

              {/* Hardware Principles */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  硬體電路與麵包板導通原理
                </h3>
                <ul className="space-y-2">
                  {currentLesson.hardwarePrinciples.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed flex gap-2"
                    >
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Pitfalls & Safety Warnings */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  常見接錯防呆與硬體注意事項
                </h3>
                <div className="space-y-2">
                  {currentLesson.pitfalls.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-rose-200 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-lg leading-relaxed"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              {/* Real-world Applications */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  實務應用場景
                </h3>
                <ul className="space-y-1.5">
                  {currentLesson.applicationScenes.map((scene, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {scene}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {/* Tab 2: Dual Framework Code (ESP-IDF C vs Arduino C++) */}
          {rightTab === 'code' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setCodeFramework('espidf')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                      codeFramework === 'espidf'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ESP-IDF (C 語言 / 教材原版)
                  </button>
                  <button
                    onClick={() => setCodeFramework('arduino')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                      codeFramework === 'arduino'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Arduino C++ (快速實作對照)
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                >
                  {copiedCode ? '✓ 已複製' : '複製程式碼'}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800">
                {codeFramework === 'espidf'
                  ? '對應 DuRuofu/ESP32-Guide (ESP-IDF v5.x) 官方驅動寫法，適合深入理解 FreeRTOS 與硬體外設暫存器設定。'
                  : '對應 Arduino-ESP32 框架寫法，適合快速驗證感測器接線與原型開發。'}
              </div>

              <pre className="flex-1 overflow-auto p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11.5px] font-mono leading-relaxed text-slate-200 select-all">
                <code>
                  {codeFramework === 'espidf'
                    ? currentLesson.espIdfCode
                    : currentLesson.arduinoCode}
                </code>
              </pre>
            </div>
          )}

          {/* Tab 3: Complete 30-Pin ESP32 Reference Table */}
          {rightTab === 'pinout' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
                點擊或將滑鼠移到下方任一腳位，中間的麵包板會同步高亮該腳位所在的 5 孔銅片導通位置（a~e 或 f~j 列）。
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-[11px] text-slate-400">
                      <th className="py-2 px-2">絲印 / 孔位</th>
                      <th className="py-2 px-2">GPIO</th>
                      <th className="py-2 px-2">功能與注意事項</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {ESP32_PINS.map((pin) => (
                      <tr
                        key={pin.pinNumber}
                        onMouseEnter={() => setHoveredHole(pin.hole)}
                        onMouseLeave={() => setHoveredHole(null)}
                        className="hover:bg-slate-800/60 cursor-pointer transition"
                      >
                        <td className="py-2 px-2 font-mono font-bold text-amber-300">
                          {pin.silk}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            麵包板 {pin.hole}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-mono text-[11px] text-cyan-300">
                          {pin.gpio}
                          {pin.inputOnly && (
                            <span className="block text-[10px] text-rose-400">
                              僅輸入
                            </span>
                          )}
                          {pin.adcChannel && (
                            <span className="block text-[10px] text-emerald-400">
                              {pin.adcChannel}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-[11px] text-slate-300 leading-snug">
                          <div className="font-medium text-slate-200">
                            {pin.capabilities.join(' · ')}
                          </div>
                          {pin.note && (
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              {pin.note}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
