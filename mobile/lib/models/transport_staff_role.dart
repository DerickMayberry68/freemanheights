import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';

part 'transport_staff_role.freezed.dart';
part 'transport_staff_role.g.dart';

@freezed
class TransportStaffRole with _$TransportStaffRole {
  const factory TransportStaffRole({
    required String id,
    required String churchId,
    required String userId,
    required int roleTypeId,
    required bool isActive,
    required DateTime assignedAt,
  }) = _TransportStaffRole;

  factory TransportStaffRole.fromJson(Map<String, dynamic> json) =>
      _$TransportStaffRoleFromJson(json);
}

extension TransportStaffRoleX on TransportStaffRole {
  /// Resolves the integer FK to the enum. Requires the lookup table
  /// to have been seeded in the canonical order defined in schema.sql.
  TransportStaffRoleType get roleType =>
      TransportStaffRoleType.values[roleTypeId - 1];
}
