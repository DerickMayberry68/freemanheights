enum RegistrationStatusType {
  pending('Pending'),
  approved('Approved'),
  waitlisted('Waitlisted'),
  cancelled('Cancelled');

  const RegistrationStatusType(this.dbValue);
  final String dbValue;

  static RegistrationStatusType fromDbValue(String value) => values.firstWhere(
        (e) => e.dbValue == value,
        orElse: () => RegistrationStatusType.pending,
      );

  String get displayName => switch (this) {
        RegistrationStatusType.pending => 'Pending',
        RegistrationStatusType.approved => 'Approved',
        RegistrationStatusType.waitlisted => 'Waitlisted',
        RegistrationStatusType.cancelled => 'Cancelled',
      };

  bool get isActive => this == pending || this == approved || this == waitlisted;
}
