import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums/enums.dart';

part 'notification_preference.freezed.dart';
part 'notification_preference.g.dart';

@freezed
class NotificationPreference with _$NotificationPreference {
  const factory NotificationPreference({
    required String id,
    required String churchId,
    required String memberId,
    required String childId,
    required int channelId,
    required bool isEnabled,
  }) = _NotificationPreference;

  factory NotificationPreference.fromJson(Map<String, dynamic> json) =>
      _$NotificationPreferenceFromJson(json);
}

extension NotificationPreferenceX on NotificationPreference {
  NotificationChannel get channel => NotificationChannel.values[channelId - 1];
}
