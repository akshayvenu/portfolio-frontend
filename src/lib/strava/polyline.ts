/**
 * Google encoded-polyline codec (precision 5) — the format Strava uses for
 * `map.summary_polyline`. Small enough to own rather than add a dependency.
 */

export type LatLng = readonly [lat: number, lng: number];

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    for (const axis of [0, 1] as const) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

export function encodePolyline(points: readonly LatLng[]): string {
  let output = "";
  let prevLat = 0;
  let prevLng = 0;

  const encodeValue = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    let chunk = "";
    while (v >= 0x20) {
      chunk += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    return chunk + String.fromCharCode(v + 63);
  };

  for (const [latDeg, lngDeg] of points) {
    const lat = Math.round(latDeg * 1e5);
    const lng = Math.round(lngDeg * 1e5);
    output += encodeValue(lat - prevLat) + encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }

  return output;
}

/**
 * Projects a route into an SVG path inside a `size × size` box, keeping the
 * aspect ratio (longitude scaled by cos(latitude) so loops aren't stretched).
 */
export function routeToSvgPath(encoded: string, size: number, padding = 2): string | null {
  const points = decodePolyline(encoded);
  if (points.length < 2) return null;

  const midLat = points.reduce((sum, [lat]) => sum + lat, 0) / points.length;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const xs = points.map(([, lng]) => lng * kx);
  const ys = points.map(([lat]) => -lat);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = (size - padding * 2) / span;
  const offsetX = (size - (maxX - minX) * scale) / 2;
  const offsetY = (size - (maxY - minY) * scale) / 2;

  return xs
    .map((x, i) => {
      const px = (x - minX) * scale + offsetX;
      const py = ((ys[i] ?? 0) - minY) * scale + offsetY;
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join("");
}
