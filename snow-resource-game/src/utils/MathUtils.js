export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Frame-rate independent exponential smoothing factor result.
 * Returns the interpolated value between current and target.
 */
export function dampValue(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Finds a random open X/Z point inside a rectangular area,
 * respecting circular exclusion zones and an optional set of
 * already occupied points with a minimum separation.
 * Returns { x, z } or null when no spot was found.
 */
export function findOpenPosition(
  area,
  { margin = 0.5, exclusions = [], separation = 1.2, occupied = [], attempts = 40 } = {}
) {
  for (let i = 0; i < attempts; i++) {
    const x = randRange(area.minX + margin, area.maxX - margin);
    const z = randRange(area.minZ + margin, area.maxZ - margin);

    let blocked = false;
    for (let e = 0; e < exclusions.length; e++) {
      const ex = exclusions[e];
      const dx = x - ex.x;
      const dz = z - ex.z;
      if (dx * dx + dz * dz < ex.r * ex.r) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    for (let p = 0; p < occupied.length; p++) {
      const dx = x - occupied[p].x;
      const dz = z - occupied[p].z;
      if (dx * dx + dz * dz < separation * separation) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    return { x, z };
  }
  return null;
}
