enum TransportStaffRoleType {
  driver('Driver'),
  assistant('Assistant'),
  coordinator('Coordinator');

  const TransportStaffRoleType(this.dbValue);
  final String dbValue;

  static TransportStaffRoleType fromDbValue(String value) => values.firstWhere(
        (e) => e.dbValue == value,
        orElse: () => TransportStaffRoleType.assistant,
      );

  String get displayName => switch (this) {
        TransportStaffRoleType.driver => 'Driver',
        TransportStaffRoleType.assistant => 'Assistant',
        TransportStaffRoleType.coordinator => 'Coordinator',
      };
}
