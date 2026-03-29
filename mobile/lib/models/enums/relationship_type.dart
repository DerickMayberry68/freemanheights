enum RelationshipType {
  father('Father'),
  mother('Mother'),
  stepparent('Stepparent'),
  grandparent('Grandparent'),
  fosterParent('Foster_Parent'),
  guardian('Guardian'),
  sibling('Sibling'),
  other('Other');

  const RelationshipType(this.dbValue);
  final String dbValue;

  static RelationshipType fromDbValue(String value) =>
      values.firstWhere((e) => e.dbValue == value, orElse: () => RelationshipType.other);

  String get displayName => switch (this) {
        RelationshipType.father => 'Father',
        RelationshipType.mother => 'Mother',
        RelationshipType.stepparent => 'Stepparent',
        RelationshipType.grandparent => 'Grandparent',
        RelationshipType.fosterParent => 'Foster Parent',
        RelationshipType.guardian => 'Guardian',
        RelationshipType.sibling => 'Sibling',
        RelationshipType.other => 'Other',
      };
}
