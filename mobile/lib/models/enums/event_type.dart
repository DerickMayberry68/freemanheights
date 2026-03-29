enum EventType {
  general('General'),
  awana('AWANA'),
  sundayService('Sunday_Service'),
  campTrip('Camp_Trip'),
  fieldTrip('Field_Trip'),
  youthGroup('Youth_Group'),
  vbs('VBS'),
  other('Other');

  const EventType(this.dbValue);
  final String dbValue;

  static EventType fromDbValue(String value) =>
      values.firstWhere((e) => e.dbValue == value, orElse: () => EventType.other);

  String get displayName => switch (this) {
        EventType.general => 'General',
        EventType.awana => 'AWANA',
        EventType.sundayService => 'Sunday Service',
        EventType.campTrip => 'Camp Trip',
        EventType.fieldTrip => 'Field Trip',
        EventType.youthGroup => 'Youth Group',
        EventType.vbs => 'VBS',
        EventType.other => 'Other',
      };
}
