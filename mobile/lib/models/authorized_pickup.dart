import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';

part 'authorized_pickup.freezed.dart';
part 'authorized_pickup.g.dart';

@freezed
class AuthorizedPickup with _$AuthorizedPickup {
  const factory AuthorizedPickup({
    required String id,
    required String childId,
    required String firstName,
    required String lastName,
    String? phone,
    int? relationshipTypeId,
    String? photoUrl,
    String? notes,
    required bool isActive,
    required DateTime createdAt,
  }) = _AuthorizedPickup;

  factory AuthorizedPickup.fromJson(Map<String, dynamic> json) =>
      _$AuthorizedPickupFromJson(json);
}

extension AuthorizedPickupX on AuthorizedPickup {
  String get fullName => '$firstName $lastName';

  RelationshipType? get relationshipType => relationshipTypeId != null
      ? RelationshipType.values[relationshipTypeId! - 1]
      : null;
}
