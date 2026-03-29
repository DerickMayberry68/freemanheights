import 'package:freezed_annotation/freezed_annotation.dart';

part 'member_profile.freezed.dart';
part 'member_profile.g.dart';

@freezed
class MemberProfile with _$MemberProfile {
  const factory MemberProfile({
    required String id,         // maps to auth.users.id
    required String churchId,
    required String firstName,
    required String lastName,
    String? phone,
    String? photoUrl,
    required bool isActive,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _MemberProfile;

  factory MemberProfile.fromJson(Map<String, dynamic> json) =>
      _$MemberProfileFromJson(json);
}

extension MemberProfileX on MemberProfile {
  String get fullName => '$firstName $lastName';
  String get fullNameLastFirst => '$lastName, $firstName';
}
