import 'dart:math';

/// Converts WGS84 latitude/longitude to an MGRS coordinate string.
///
/// Precision controls the number of digits per easting/northing component:
///   4 digits → 10-meter accuracy  (8-digit MGRS)
///   5 digits → 1-meter accuracy   (10-digit MGRS)
///
/// Example output: "15SVA5134231045"  (10-digit, 1m)
///                 "15SVA51313104"    (8-digit, 10m)
///
/// References:
///   DMA Technical Manual 8358.1 — Datums, Ellipsoids, Grids, and Grid
///   Reference Systems (1990); NGA.STND.0037 (2014).
class MgrsConverter {
  // ── WGS84 ellipsoid constants ───────────────────────────────────────────────

  static const double _a = 6378137.0; // semi-major axis (m)
  static const double _f = 1 / 298.257223563; // flattening
  static final double _b = _a * (1 - _f); // semi-minor axis
  static final double _e2 = 1 - (_b * _b) / (_a * _a); // eccentricity²
  static final double _e2p = _e2 / (1 - _e2); // second eccentricity²
  static const double _k0 = 0.9996; // central scale factor

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Returns an MGRS string for [lat]/[lon] in decimal degrees.
  /// [precision] is digits per component: 4 = 10m (8-digit), 5 = 1m (10-digit).
  static String toMgrs(double lat, double lon, {int precision = 5}) {
    assert(precision >= 1 && precision <= 5,
        'precision must be 1–5 (2km → 1m accuracy)');
    assert(lat >= -80 && lat <= 84, 'MGRS is only defined for -80°S to 84°N');

    final zone = _utmZone(lon);
    final band = _latBand(lat);
    final utm = _toUtm(lat, lon, zone);
    final easting = utm[0];
    final northing = utm[1];
    final sq = _hundredKmSquare(zone, easting, northing);

    final eInt = (easting % 100000).round();
    final nInt = (northing % 100000).round();

    // Pad to 5 digits then trim to requested precision
    final eStr = eInt.toString().padLeft(5, '0').substring(0, precision);
    final nStr = nInt.toString().padLeft(5, '0').substring(0, precision);

    return '$zone$band${sq[0]}${sq[1]}$eStr$nStr';
  }

  // ── UTM zone (1–60) from longitude ─────────────────────────────────────────

  static int _utmZone(double lon) {
    // Normalise longitude to [-180, 180)
    final l = ((lon + 180) % 360) - 180;
    return ((l + 180) / 6).floor() + 1;
  }

  // ── Latitude band letter (C–X, skipping I and O) ───────────────────────────

  static String _latBand(double lat) {
    // Bands are 8° each from -80° (C) to 72° (W); X covers 72°–84° (12°).
    const bands = 'CDEFGHJKLMNPQRSTUVWX';
    int i = ((lat + 80) / 8).floor();
    if (i < 0) i = 0;
    if (i > 19) i = 19;
    return bands[i];
  }

  // ── Lat/long → UTM easting & northing ──────────────────────────────────────

  static List<double> _toUtm(double lat, double lon, int zone) {
    final latR = lat * pi / 180;
    final lonR = lon * pi / 180;
    final lon0R = ((zone - 1) * 6 - 180 + 3) * pi / 180; // central meridian

    final sinLat = sin(latR);
    final cosLat = cos(latR);
    final tanLat = tan(latR);

    final N = _a / sqrt(1 - _e2 * sinLat * sinLat);
    final T = tanLat * tanLat;
    final C = _e2p * cosLat * cosLat;
    final A = cosLat * (lonR - lon0R);

    // Meridional arc
    final M = _a *
        ((1 - _e2 / 4 - 3 * _e2 * _e2 / 64 - 5 * _e2 * _e2 * _e2 / 256) *
                latR -
            (3 * _e2 / 8 + 3 * _e2 * _e2 / 32 + 45 * _e2 * _e2 * _e2 / 1024) *
                sin(2 * latR) +
            (15 * _e2 * _e2 / 256 + 45 * _e2 * _e2 * _e2 / 1024) *
                sin(4 * latR) -
            (35 * _e2 * _e2 * _e2 / 3072) * sin(6 * latR));

    final easting = _k0 *
            N *
            (A +
                (1 - T + C) * pow(A, 3) / 6 +
                (5 - 18 * T + T * T + 72 * C - 58 * _e2p) *
                    pow(A, 5) /
                    120) +
        500000;

    double northing = _k0 *
        (M +
            N *
                tanLat *
                (pow(A, 2) / 2 +
                    (5 - T + 9 * C + 4 * C * C) * pow(A, 4) / 24 +
                    (61 - 58 * T + T * T + 600 * C - 330 * _e2p) *
                        pow(A, 6) /
                        720));

    if (lat < 0) northing += 10000000.0; // southern hemisphere false northing

    return [easting, northing];
  }

  // ── 100km square identifier (two letters) ─────────────────────────────────

  /// Returns [columnLetter, rowLetter] for the 100km square.
  static List<String> _hundredKmSquare(
      int zone, double easting, double northing) {
    // Column letters cycle every 3 zones (I and O excluded):
    //   Zones 1,4,7,...  → A B C D E F G H
    //   Zones 2,5,8,...  → J K L M N P Q R
    //   Zones 3,6,9,...  → S T U V W X Y Z
    const colSets = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'];

    // Row letters cycle every 20 rows, alternating between two sequences:
    //   Odd zones  → A B C D E F G H J K L M N P Q R S T U V
    //   Even zones → F G H J K L M N P Q R S T U V A B C D E
    const rowSets = [
      'ABCDEFGHJKLMNPQRSTUV',
      'FGHJKLMNPQRSTUVABCDE',
    ];

    final setIdx = (zone - 1) % 3;
    final colIdx = ((easting / 100000).floor() - 1).clamp(0, 7);
    final rowIdx = ((northing / 100000).floor()) % 20;

    final col = colSets[setIdx][colIdx];
    final row = rowSets[(zone - 1) % 2][rowIdx];

    return [col, row];
  }
}
