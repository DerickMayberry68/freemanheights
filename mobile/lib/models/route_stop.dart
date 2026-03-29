import 'package:freezed_annotation/freezed_annotation.dart';

part 'route_stop.freezed.dart';
part 'route_stop.g.dart';

@freezed
class RouteStop with _$RouteStop {
  const factory RouteStop({
    required String id,
    required String eventBusId,
    required int stopOrder,
    required String stopName,
    String? address,
    DateTime? scheduledTime,
  }) = _RouteStop;

  factory RouteStop.fromJson(Map<String, dynamic> json) =>
      _$RouteStopFromJson(json);
}
