import { ESP32_PINS } from '../data/esp32Pinout';
import { PassiveComponent, SensorComponent, WireConnection } from '../types/esp32';

export const TOTAL_COLS = 48; // 48 columns fits comfortably with large readable labels
export const UPPER_ROWS = ['a', 'b', 'c', 'd', 'e'] as const;
export const LOWER_ROWS = ['f', 'g', 'h', 'i', 'j'] as const;

export const PITCH = 20; // 20px per breadboard hole for crisp visibility
export const BOARD_ORIGIN_X = 76;
export const BOARD_ORIGIN_Y = 64;

/**
 * 將孔位 ID（例如 'a14', 'h5', 'tp+4', 'bp-12'）轉成 SVG (x, y) 座標
 */
export function getHoleCoords(holeId: string): { x: number; y: number } {
  const clean = holeId.trim();

  // Power rails: tp+1..48, tp-1..48, bp+1..48, bp-1..48
  if (clean.startsWith('tp+') || clean.startsWith('tp-') || clean.startsWith('bp+') || clean.startsWith('bp-')) {
    const prefix = clean.slice(0, 3);
    const col = parseInt(clean.slice(3), 10) || 1;
    const x = BOARD_ORIGIN_X + (col - 1) * PITCH;
    let y = BOARD_ORIGIN_Y;
    if (prefix === 'tp+') y = BOARD_ORIGIN_Y + 0;
    if (prefix === 'tp-') y = BOARD_ORIGIN_Y + PITCH;
    if (prefix === 'bp+') y = BOARD_ORIGIN_Y + 15 * PITCH;
    if (prefix === 'bp-') y = BOARD_ORIGIN_Y + 16 * PITCH;
    return { x, y };
  }

  // Standard terminal holes: a1..j48
  const rowChar = clean[0]?.toLowerCase();
  const col = parseInt(clean.slice(1), 10) || 1;
  const x = BOARD_ORIGIN_X + (col - 1) * PITCH;

  const upperIdx = UPPER_ROWS.indexOf(rowChar as (typeof UPPER_ROWS)[number]);
  if (upperIdx !== -1) {
    // Leave 1.5 pitch gap after top power rail
    const y = BOARD_ORIGIN_Y + (3 + upperIdx) * PITCH;
    return { x, y };
  }

  const lowerIdx = LOWER_ROWS.indexOf(rowChar as (typeof LOWER_ROWS)[number]);
  if (lowerIdx !== -1) {
    // Leave 2 pitch center ravine between e and f
    const y = BOARD_ORIGIN_Y + (9.5 + lowerIdx) * PITCH;
    return { x, y };
  }

  return { x: BOARD_ORIGIN_X, y: BOARD_ORIGIN_Y };
}

/**
 * 取得孔位所屬的「麵包板內部銅片導通群組 ID」
 * - 同一欄 a~e 共用 UPPER_col
 * - 同一欄 f~j 共用 LOWER_col
 * - 電源軌整排共用 TOP_POS / TOP_NEG / BOT_POS / BOT_NEG
 */
export function getStripId(holeId: string): string {
  const clean = holeId.trim();
  if (clean.startsWith('tp+')) return 'RAIL_TOP_POS';
  if (clean.startsWith('tp-')) return 'RAIL_TOP_NEG';
  if (clean.startsWith('bp+')) return 'RAIL_BOT_POS';
  if (clean.startsWith('bp-')) return 'RAIL_BOT_NEG';

  const rowChar = clean[0]?.toLowerCase();
  const col = parseInt(clean.slice(1), 10);
  if (UPPER_ROWS.includes(rowChar as (typeof UPPER_ROWS)[number])) {
    return `STRIP_UPPER_${col}`;
  }
  if (LOWER_ROWS.includes(rowChar as (typeof LOWER_ROWS)[number])) {
    return `STRIP_LOWER_${col}`;
  }
  return clean;
}

/**
 * 取得與指定孔位在麵包板內部「直接銅片導通」的所有孔位清單
 */
export function getConductiveHolesInStrip(holeId: string): string[] {
  const stripId = getStripId(holeId);
  if (stripId === 'RAIL_TOP_POS') {
    return Array.from({ length: TOTAL_COLS }, (_, i) => `tp+${i + 1}`);
  }
  if (stripId === 'RAIL_TOP_NEG') {
    return Array.from({ length: TOTAL_COLS }, (_, i) => `tp-${i + 1}`);
  }
  if (stripId === 'RAIL_BOT_POS') {
    return Array.from({ length: TOTAL_COLS }, (_, i) => `bp+${i + 1}`);
  }
  if (stripId === 'RAIL_BOT_NEG') {
    return Array.from({ length: TOTAL_COLS }, (_, i) => `bp-${i + 1}`);
  }
  if (stripId.startsWith('STRIP_UPPER_')) {
    const col = stripId.replace('STRIP_UPPER_', '');
    return UPPER_ROWS.map((r) => `${r}${col}`);
  }
  if (stripId.startsWith('STRIP_LOWER_')) {
    const col = stripId.replace('STRIP_LOWER_', '');
    return LOWER_ROWS.map((r) => `${r}${col}`);
  }
  return [holeId];
}

/**
 * 檢查兩個孔位在給定杜邦線與電阻下是否處於同一個電氣迴路（用於自由接線練習驗證）
 */
export function areHolesConnected(
  holeA: string,
  holeB: string,
  wires: WireConnection[],
  passives: PassiveComponent[] = [],
  includePassives = false
): boolean {
  const startStrip = getStripId(holeA);
  const targetStrip = getStripId(holeB);
  if (startStrip === targetStrip) return true;

  const adj = new Map<string, Set<string>>();
  const addEdge = (u: string, v: string) => {
    if (!adj.has(u)) adj.set(u, new Set());
    if (!adj.has(v)) adj.set(v, new Set());
    adj.get(u)!.add(v);
    adj.get(v)!.add(u);
  };

  // ESP32 內部兩個 GND 腳位 (c5 與 h5) 彼此共通
  addEdge(getStripId('c5'), getStripId('h5'));

  for (const w of wires) {
    addEdge(getStripId(w.fromHole), getStripId(w.toHole));
  }

  if (includePassives) {
    for (const p of passives) {
      addEdge(getStripId(p.fromHole), getStripId(p.toHole));
    }
  }

  const visited = new Set<string>([startStrip]);
  const queue: string[] = [startStrip];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === targetStrip) return true;
    const neighbors = adj.get(curr);
    if (!neighbors) continue;
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
  }

  return false;
}

/**
 * 查詢某個孔位上插了什麼元件腳位或 ESP32 腳位（用於懸浮提示與練習模式說明）
 */
export function describeHoleOccupant(
  holeId: string,
  components: SensorComponent[]
): { title: string; subtitle: string; badgeColor: string } | null {
  const espPin = ESP32_PINS.find((p) => p.hole === holeId);
  if (espPin) {
    return {
      title: `ESP32 ${espPin.silk} (${espPin.gpio})`,
      subtitle: espPin.note || espPin.capabilities.join(' / '),
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    };
  }

  // Also check if this hole shares a 5-hole strip with an ESP32 pin
  const strip = getStripId(holeId);
  const stripEspPin = ESP32_PINS.find((p) => getStripId(p.hole) === strip);

  for (const comp of components) {
    const cPin = comp.pins.find((p) => p.hole === holeId);
    if (cPin) {
      return {
        title: `${comp.name} - ${cPin.label} 腳位`,
        subtitle: cPin.description,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    }
    const stripCompPin = comp.pins.find((p) => getStripId(p.hole) === strip);
    if (stripCompPin) {
      return {
        title: `導通排：${comp.name} [${stripCompPin.label}] (${holeId})`,
        subtitle: `此孔位與 ${stripCompPin.hole} 同屬一排 5 孔銅片，插此孔即連接 ${comp.name} 的 ${stripCompPin.label}`,
        badgeColor: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
      };
    }
  }

  if (stripEspPin) {
    return {
      title: `導通排：ESP32 ${stripEspPin.silk} / ${stripEspPin.gpio} (${holeId})`,
      subtitle: `此孔位與 ${stripEspPin.hole} 同屬一排 5 孔銅片，插此孔即連接 ESP32 的 ${stripEspPin.gpio}`,
      badgeColor: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30',
    };
  }

  if (strip === 'RAIL_TOP_POS' || strip === 'RAIL_BOT_POS') {
    return {
      title: `正極電源軌 (+) [${holeId}]`,
      subtitle: '整排橫向內部導通，通常接 3.3V 或 5V 供多個感測器共用電源',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    };
  }

  if (strip === 'RAIL_TOP_NEG' || strip === 'RAIL_BOT_NEG') {
    return {
      title: `負極接地軌 (-) [${holeId}]`,
      subtitle: '整排橫向內部導通，通常接 ESP32 GND 供所有感測器共地',
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    };
  }

  return null;
}
