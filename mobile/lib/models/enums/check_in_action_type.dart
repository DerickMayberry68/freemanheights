enum CheckInActionType {
  boarded('Boarded'),
  departed('Departed'),
  arrived('Arrived'),
  released('Released'),
  noShow('No_Show');

  const CheckInActionType(this.dbValue);
  final String dbValue;

  static CheckInActionType fromDbValue(String value) =>
      values.firstWhere((e) => e.dbValue == value, orElse: () => CheckInActionType.boarded);

  String get displayName => switch (this) {
        CheckInActionType.boarded => 'Boarded',
        CheckInActionType.departed => 'Departed',
        CheckInActionType.arrived => 'Arrived',
        CheckInActionType.released => 'Released',
        CheckInActionType.noShow => 'No Show',
      };

  /// Actions that represent a child being in active care on the bus.
  bool get isOnBus => this == boarded || this == departed || this == arrived;
}
