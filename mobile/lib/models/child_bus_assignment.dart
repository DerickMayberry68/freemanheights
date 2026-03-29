import 'package:freezed_annotation/freezed_annotation.dart';

part 'child_bus_assignment.freezed.dart';
part 'child_bus_assignment.g.dart';

@freezed
class ChildBusAssignment with _$ChildBusAssignment {
  const factory ChildBusAssignment({
    required String id,
    required String eventRegistrationId,
    required String eventBusId,
    int? seatNumber,
    required DateTime assignedAt,
  }) = _ChildBusAssignment;

  factory ChildBusAssignment.fromJson(Map<String, dynamic> json) =>
      _$ChildBusAssignmentFromJson(json);
}
