import 'package:freezed_annotation/freezed_annotation.dart';

part 'church.freezed.dart';
part 'church.g.dart';

@freezed
class Church with _$Church {
  const factory Church({
    required String id,
    required String name,
    String? address,
    String? city,
    String? state,
    String? zip,
    String? phone,
    String? email,
    String? websiteUrl,
    String? logoUrl,
    required bool isActive,
    required DateTime createdAt,
  }) = _Church;

  factory Church.fromJson(Map<String, dynamic> json) => _$ChurchFromJson(json);
}
