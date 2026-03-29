import 'package:freezed_annotation/freezed_annotation.dart';

import 'child_guardian.dart';
import 'child_medical_alert.dart';

part 'child.freezed.dart';
part 'child.g.dart';

@freezed
class Child with _$Child {
  const factory Child({
    required String id,
    required String churchId,
    required String firstName,
    required String lastName,
    DateTime? dateOfBirth,
    String? photoUrl,
    String? notes,
    required bool isActive,
    required DateTime createdAt,
    required DateTime updatedAt,
    // Populated when queried with joins
    @Default([]) List<ChildGuardian> childGuardians,
    @Default([]) List<ChildMedicalAlert> childMedicalAlerts,
  }) = _Child;

  factory Child.fromJson(Map<String, dynamic> json) => _$ChildFromJson(json);
}

extension ChildX on Child {
  String get fullName => '$firstName $lastName';
  String get fullNameLastFirst => '$lastName, $firstName';

  int? get ageInYears {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    int age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month ||
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
  }

  bool get hasCriticalAlerts => childMedicalAlerts
      .any((a) => a.isActive && a.severity == 3);
}
