import 'package:geolocator/geolocator.dart';

import '../utils/mgrs_converter.dart';

/// Result returned by [LocationService.getCurrentLocation].
class LocationResult {
  final double latitude;
  final double longitude;
  final double? accuracy; // metres
  final String mgrs10; // 10-digit (1m precision)
  final String mgrs8; // 8-digit (10m precision)

  const LocationResult({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    required this.mgrs10,
    required this.mgrs8,
  });
}

class LocationService {
  /// Requests permission if needed, then returns the current position.
  /// Returns null if permission is denied or location is unavailable.
  static Future<LocationResult?> getCurrentLocation() async {
    // Check / request permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return null;
    }
    if (permission == LocationPermission.deniedForever) return null;

    // Check location services enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      return LocationResult(
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        mgrs10: MgrsConverter.toMgrs(pos.latitude, pos.longitude, precision: 5),
        mgrs8: MgrsConverter.toMgrs(pos.latitude, pos.longitude, precision: 4),
      );
    } catch (_) {
      return null;
    }
  }
}
