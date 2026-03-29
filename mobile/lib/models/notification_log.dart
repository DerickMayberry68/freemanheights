import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';

part 'notification_log.freezed.dart';
part 'notification_log.g.dart';

@freezed
class NotificationLog with _$NotificationLog {
  const factory NotificationLog({
    required String id,
    required String checkInId,
    required String memberId,
    required int channelId,
    required String recipientAddress,   // E.164 phone or email address
    required String messageBody,
    required DateTime sentAt,
    DateTime? deliveredAt,
    String? errorMessage,
  }) = _NotificationLog;

  factory NotificationLog.fromJson(Map<String, dynamic> json) =>
      _$NotificationLogFromJson(json);
}

extension NotificationLogX on NotificationLog {
  NotificationChannel get channel => NotificationChannel.values[channelId - 1];
  bool get wasDelivered => deliveredAt != null;
  bool get hasFailed => errorMessage != null;
}
