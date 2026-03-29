import 'package:freezed_annotation/freezed_annotation.dart';

import 'bus.dart';
import 'event_bus_staff.dart';
import 'route_stop.dart';

part 'event_bus.freezed.dart';
part 'event_bus.g.dart';

@freezed
class EventBus with _$EventBus {
  const factory EventBus({
    required String id,
    required String eventId,
    required String busId,
    DateTime? departureTime,
    DateTime? estimatedReturn,
    String? notes,
    // Populated when queried with joins
    Bus? bus,
    @Default([]) List<RouteStop> routeStops,
    @Default([]) List<EventBusStaff> eventBusStaff,
  }) = _EventBus;

  factory EventBus.fromJson(Map<String, dynamic> json) =>
      _$EventBusFromJson(json);
}
