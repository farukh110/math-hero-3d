export interface CrystalSlot {
  x: number;
  z: number;
  group: number;
  leftover: boolean;
}

export interface Plate {
  x: number;
  z: number;
  size: number;
  leftover: boolean;
}

export interface CrystalLayout {
  slots: CrystalSlot[];
  plates: Plate[];
  /** Uniform scale applied so everything fits the field. */
  scale: number;
}

const INNER = 0.42;

/**
 * Arrange `n` crystals into groups of `g`. Full groups sit on plates; crystals that do not
 * fit a full group (n mod g) are placed on a separate "leftover" plate. Pure function.
 */
export function layoutCrystals(n: number, g: number, maxW: number, maxD: number): CrystalLayout {
  const full = Math.floor(n / g);
  const rest = n % g;
  const cells = full + (rest > 0 ? 1 : 0);
  const cols = Math.max(1, Math.ceil(Math.sqrt(g)));
  const cellSize = cols * INNER + 0.5;
  const gcols = Math.max(1, Math.min(cells, Math.ceil(Math.sqrt((cells * maxW) / maxD))));
  const grows = Math.ceil(cells / gcols);
  const scale = Math.min(1, maxW / (gcols * cellSize), maxD / (grows * cellSize));

  const slots: CrystalSlot[] = [];
  const plates: Plate[] = [];
  for (let c = 0; c < cells; c++) {
    const leftover = c >= full;
    const count = leftover ? rest : g;
    const cx = (c % gcols - (gcols - 1) / 2) * cellSize;
    const cz = Math.floor(c / gcols) * cellSize - ((grows - 1) / 2) * cellSize;
    plates.push({ x: cx * scale, z: cz * scale, size: (cellSize - 0.16) * scale, leftover });
    const rowsInner = Math.ceil(count / cols);
    const colsInner = Math.min(cols, count);
    for (let j = 0; j < count; j++) {
      const ic = j % cols;
      const ir = Math.floor(j / cols);
      slots.push({
        x: (cx + (ic - (colsInner - 1) / 2) * INNER) * scale,
        z: (cz + (ir - (rowsInner - 1) / 2) * INNER) * scale,
        group: c,
        leftover,
      });
    }
  }
  return { slots, plates, scale };
}
