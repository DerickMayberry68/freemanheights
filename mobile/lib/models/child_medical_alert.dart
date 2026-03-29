import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';

part 'child_medical_alert.freezed.dart';
part 'child_medical_alert.g.dart';

@freezed
class ChildMedicalAlert with _$ChildMedicalAlert {
  const factory ChildMedicalAlert({
    required String id,
    required String childId,
    required int alertTypeId,
    required int severity,       // 1=Info, 2=Warning, 3=Critical
    required String description,
    String? actionRequired,
    required bool isActive,
    required DateTime createdAt,
  }) = _ChildMedicalAlert;

  factory ChildMedicalAlert.fromJson(Map<String, dynamic> json) =>
      _$ChildMedicalAlertFromJson(json);
}

extension ChildMedicalAlertX on ChildMedicalAlert {
  MedicalAlertType get alertType => MedicalAlertType.values[alertTypeId - 1];
  AlertSeverity get alertSeverity => AlertSeverity.fromDbValue(severity);
  bool get isCritical => severity == 3;
}
