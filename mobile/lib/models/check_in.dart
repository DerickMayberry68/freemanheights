import 'package:freezed_annotation/freezed_annotation.dart';

import 'authorized_pickup.dart';
import 'child.dart';
import 'enums/enums.dart';
import 'route_stop.dart';

part 'check_in.freezed.dart';
part 'check_in.g.dart';

@freezed
class CheckIn with _$CheckIn {
  const factory CheckIn({
    required String id,
    required String churchId,
    required String eventBusId,
    required String childId,
    required int actionTypeId,
    required String performedBy,
    required DateTime actionTimestamp,
    double? latitude,
    double? longitude,
    String? mgrsCoordinate,        // e.g. '15SWC8274952371' (10-digit, ~1m precision)
    String? routeStopId,
    String? releasedToId,          // FK to authorized_pickups, populated on 'Released'
    String? notes,
    // Populated when queried with joins
    Child? child,
    RouteStop? routeStop,
    AuthorizedPickup? releasedTo,
  }) = _CheckIn;

  factory CheckIn.fromJson(Map<String, dynamic> json) =>
      _$CheckInFromJson(json);
}

extension CheckInX on CheckIn {
  CheckInActionType get actionType =>
      CheckInActionType.values[actionTypeId - 1];

  bool get isRelease => actionType == CheckInActionType.released;
  bool get hasLocation => latitude != null && longitude != null;
}
