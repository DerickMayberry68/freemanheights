enum EventStatusType {
  draft('Draft'),
  published('Published'),
  active('Active'),
  completed('Completed'),
  cancelled('Cancelled');

  const EventStatusType(this.dbValue);
  final String dbValue;

  static EventStatusType fromDbValue(String value) =>
      values.firstWhere((e) => e.dbValue == value, orElse: () => EventStatusType.draft);

  String get displayName => switch (this) {
        EventStatusType.draft => 'Draft',
        EventStatusType.published => 'Published',
        EventStatusType.active => 'Active',
        EventStatusType.completed => 'Completed',
        EventStatusType.cancelled => 'Cancelled',
      };

  bool get isEditable => this == draft || this == published;
}
