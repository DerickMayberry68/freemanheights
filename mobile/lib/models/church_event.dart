import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';
import 'event_bus.dart';

part 'church_event.freezed.dart';
part 'church_event.g.dart';

// Named ChurchEvent to avoid collision with Flutter/Dart internal event types.
@freezed
class ChurchEvent with _$ChurchEvent {
  const factory ChurchEvent({
    required String id,
    required String churchId,
    String? ministryId,
    int? eventTypeId,
    int? statusId,
    required String title,
    String? description,
    required DateTime eventDate,
    DateTime? endDate,
    String? location,
    String? imageUrl,
    String? registrationUrl,      // external URL — used when requires_registration = false
    required bool isFeatured,
    required bool hasTransport,
    required bool requiresRegistration,
    required bool requiresPermissionSlip,
    int? maxCapacity,
    String? createdBy,
    required DateTime createdAt,
    required DateTime updatedAt,
    // Populated when queried with joins
    @Default([]) List<EventBus> eventBuses,
  }) = _ChurchEvent;

  factory ChurchEvent.fromJson(Map<String, dynamic> json) =>
      _$ChurchEventFromJson(json);
}

extension ChurchEventX on ChurchEvent {
  EventType? get eventType =>
      eventTypeId != null ? EventType.values[eventTypeId! - 1] : null;

  EventStatusType? get status =>
      statusId != null ? EventStatusType.values[statusId! - 1] : null;

  bool get isUpcoming => eventDate.isAfter(DateTime.now());
  bool get isPast => eventDate.isBefore(DateTime.now());
}
