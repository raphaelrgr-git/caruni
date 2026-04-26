/**
 * Location privacy utilities.
 *
 * The backend stores real GPS coordinates. The frontend must NEVER display the
 * exact location of a user's home / departure point. Instead it shows:
 *   - An anonymized point within a 500 m radius (deterministic per route)
 *   - A dashed uncertainty circle (500 m radius) on the map
 *   - A clipped polyline that starts/ends near the edge of that circle
 *
 * Determinism: the same route always gets the same offset so that repeat visits
 * don't reveal information through changing positions.
 */

// ---------------------------------------------------------------------------
// Seeded PRNG (xorshift32 on a string hash)
// ---------------------------------------------------------------------------

function seededRandom(seed: string): () => number {
  // FNV-1a-inspired 32-bit hash over the seed string
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // xorshift32
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h = h >>> 0; // keep unsigned
    return h / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Haversine distance in metres
// ---------------------------------------------------------------------------

export function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);
  const haversine =
    sinDlat * sinDlat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinDlng * sinDlng;
  return 2 * R * Math.asin(Math.sqrt(haversine));
}

// ---------------------------------------------------------------------------
// Anonymize a coordinate pair
// ---------------------------------------------------------------------------

/**
 * Returns a deterministic point within `radiusM` metres of (lat, lng).
 * The same `seed` always produces the same offset.
 */
export function anonymizePoint(
  lat: number,
  lng: number,
  seed: string,
  radiusM = 500,
): [number, number] {
  const rand = seededRandom(seed);
  const angle = rand() * 2 * Math.PI;
  // Use a random radius between 150 m and radiusM so the offset is meaningful
  const distance = 150 + rand() * (radiusM - 150);
  // Convert metres to degrees (approximation valid for small distances)
  const dLat = (distance / 111_111) * Math.cos(angle);
  const dLng = (distance / (111_111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
  return [lat + dLat, lng + dLng];
}

// ---------------------------------------------------------------------------
// Clip polyline ends near sensitive endpoints
// ---------------------------------------------------------------------------

/**
 * Removes polyline points that are within `clipRadiusM` metres of either
 * endpoint (origin or destination). This prevents the polyline from visually
 * pointing at the exact home address.
 *
 * If the path is too short to clip (all points within the radius), the
 * original path is returned unchanged.
 */
export function clipPolylineEnds(
  path: [number, number][],
  clipRadiusM = 400,
): [number, number][] {
  if (path.length < 3) return path;

  const origin = path[0];
  const dest = path[path.length - 1];

  // Find first point that is far enough from origin
  let startIdx = 0;
  for (let i = 1; i < path.length - 1; i++) {
    if (haversineM(origin, path[i]) >= clipRadiusM) {
      startIdx = i;
      break;
    }
  }

  // Find last point that is far enough from destination
  let endIdx = path.length - 1;
  for (let i = path.length - 2; i > startIdx; i--) {
    if (haversineM(dest, path[i]) >= clipRadiusM) {
      endIdx = i;
      break;
    }
  }

  if (startIdx >= endIdx) return path; // path too short, keep as-is
  return path.slice(startIdx, endIdx + 1);
}
