enum NotificationChannel {
  sms('SMS'),
  email('Email'),
  push('Push');

  const NotificationChannel(this.dbValue);
  final String dbValue;

  static NotificationChannel fromDbValue(String value) =>
      values.firstWhere((e) => e.dbValue == value, orElse: () => NotificationChannel.push);

  String get displayName => switch (this) {
        NotificationChannel.sms => 'Text Message',
        NotificationChannel.email => 'Email',
        NotificationChannel.push => 'Push Notification',
      };
}
