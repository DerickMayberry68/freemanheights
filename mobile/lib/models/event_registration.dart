import 'package:freezed_annotation/freezed_annotation.dart';

import 'child.dart';
import 'child_bus_assignment.dart';
import 'enums/enums.dart';

part 'event_registration.freezed.dart';
part 'event_registration.g.dart';

@freezed
class EventRegistration with _$EventRegistration {
  const factory EventRegistration({
    required String id,
    required String churchId,
    required String eventId,
    required String childId,
    required String registeredBy,
    required int statusId,
    required bool permissionSlipSigned,
    DateTime? permissionSlipSignedAt,
    String? permissionSlipSignedBy,
    String? notes,
    required DateTime registeredAt,
    // Populated when queried with joins
    Child? child,
    ChildBusAssignment? childBusAssignment,
  }) = _EventRegistration;

  factory EventRegistration.fromJson(Map<String, dynamic> json) =>
      _$EventRegistrationFromJson(json);
}

extension EventRegistrationX on EventRegistration {
  RegistrationStatusType get status =>
      RegistrationStatusType.values[statusId - 1];

  bool get isApproved => status == RegistrationStatusType.approved;
  bool get needsPermissionSlip =>
      !permissionSlipSigned && status == RegistrationStatusType.approved;
}
