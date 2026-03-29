import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';
import 'member_profile.dart';

part 'child_guardian.freezed.dart';
part 'child_guardian.g.dart';

@freezed
class ChildGuardian with _$ChildGuardian {
  const factory ChildGuardian({
    required String id,
    required String childId,
    required String memberId,
    required int relationshipTypeId,
    required bool isPrimaryContact,
    required bool canPickup,
    required DateTime createdAt,
    // Populated when queried with join on member_profiles
    MemberProfile? memberProfile,
  }) = _ChildGuardian;

  factory ChildGuardian.fromJson(Map<String, dynamic> json) =>
      _$ChildGuardianFromJson(json);
}

extension ChildGuardianX on ChildGuardian {
  RelationshipType get relationshipType =>
      RelationshipType.values[relationshipTypeId - 1];
}
