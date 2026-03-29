enum MedicalAlertType {
  allergy('Allergy'),
  medication('Medication'),
  condition('Condition'),
  dietary('Dietary');

  const MedicalAlertType(this.dbValue);
  final String dbValue;

  static MedicalAlertType fromDbValue(String value) =>
      values.firstWhere((e) => e.dbValue == value, orElse: () => MedicalAlertType.condition);

  String get displayName => switch (this) {
        MedicalAlertType.allergy => 'Allergy',
        MedicalAlertType.medication => 'Medication',
        MedicalAlertType.condition => 'Medical Condition',
        MedicalAlertType.dietary => 'Dietary',
      };
}

/// Alert severity — maps to child_medical_alerts.severity column.
/// Used for UI color coding in the Flutter check-in screen.
enum AlertSeverity {
  info(1),
  warning(2),
  critical(3);

  const AlertSeverity(this.dbValue);
  final int dbValue;

  static AlertSeverity fromDbValue(int value) =>
      values.firstWhere((e) => e.dbValue == value, orElse: () => AlertSeverity.info);
}
