import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';

part 'event_bus_staff.freezed.dart';
part 'event_bus_staff.g.dart';

@freezed
class EventBusStaff with _$EventBusStaff {
  const factory EventBusStaff({
    required String id,
    required String eventBusId,
    required String userId,
    required int roleTypeId,
  }) = _EventBusStaff;

  factory EventBusStaff.fromJson(Map<String, dynamic> json) =>
      _$EventBusStaffFromJson(json);
}

extension EventBusStaffX on EventBusStaff {
  TransportStaffRoleType get roleType =>
      TransportStaffRoleType.values[roleTypeId - 1];

  bool get isDriver => roleType == TransportStaffRoleType.driver;
  bool get isAssistant => roleType == TransportStaffRoleType.assistant;
}
