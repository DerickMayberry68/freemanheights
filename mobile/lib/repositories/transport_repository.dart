import '../main.dart';
import '../models/enums/enums.dart';

// ---------------------------------------------------------------------------
// View models — lightweight UI-facing objects, no freezed needed here.
// ---------------------------------------------------------------------------

class EventBusSummary {
  final String eventBusId;
  final String eventId;
  final String eventTitle;
  final DateTime eventDate;
  final String? location;
  final String busName;
  final int busCapacity;
  final int boardedCount;
  final bool isCurrentUserAssigned;

  const EventBusSummary({
    required this.eventBusId,
    required this.eventId,
    required this.eventTitle,
    required this.eventDate,
    required this.location,
    required this.busName,
    required this.busCapacity,
    required this.boardedCount,
    required this.isCurrentUserAssigned,
  });
}

class ManifestChild {
  final String childId;
  final String eventRegistrationId;
  final String firstName;
  final String lastName;
  final String? photoUrl;
  final bool hasCriticalAlerts;
  final List<String> alertDescriptions;
  CheckInActionType? lastAction;
  DateTime? lastCheckInTime;

  ManifestChild({
    required this.childId,
    required this.eventRegistrationId,
    required this.firstName,
    required this.lastName,
    this.photoUrl,
    required this.hasCriticalAlerts,
    required this.alertDescriptions,
    this.lastAction,
    this.lastCheckInTime,
  });

  String get fullName => '$firstName $lastName';
  bool get isBoarded => lastAction == CheckInActionType.boarded;
  bool get isReleased => lastAction == CheckInActionType.released;
  bool get isNoShow => lastAction == CheckInActionType.noShow;
  bool get hasCheckedIn => lastAction != null;
}

// ---------------------------------------------------------------------------
// Repository — toggle useMockData to switch between mock and Supabase.
// ---------------------------------------------------------------------------

class TransportRepository {
  static const bool useMockData = false; // ← flip to true to use mock data

  // ── Dashboard ─────────────────────────────────────────────────────────────

  static Future<List<EventBusSummary>> getTodaysEventBuses() async {
    if (useMockData) return _mockEventBuses();

    final userId = supabase.auth.currentUser!.id;
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day).toIso8601String();
    final todayEnd =
        DateTime(now.year, now.month, now.day, 23, 59, 59).toIso8601String();

    final response = await supabase
        .from('events')
        .select('''
          id, title, event_date, location,
          event_buses(
            id,
            buses(id, name, capacity),
            event_bus_staff(user_id, role_type_id)
          )
        ''')
        .eq('has_transport', true)
        .gte('event_date', todayStart)
        .lte('event_date', todayEnd)
        .order('event_date');

    final List<EventBusSummary> result = [];
    for (final event in response as List) {
      for (final eb in (event['event_buses'] as List)) {
        final bus = eb['buses'];
        final staff = (eb['event_bus_staff'] as List);
        final isAssigned = staff.any((s) => s['user_id'] == userId);

        // Count boarded children for this bus
        final boardedResp = await supabase
            .from('check_ins')
            .select('id')
            .eq('event_bus_id', eb['id'])
            .eq('action_type_id', 1); // Boarded

        result.add(EventBusSummary(
          eventBusId: eb['id'],
          eventId: event['id'],
          eventTitle: event['title'],
          eventDate: DateTime.parse(event['event_date']),
          location: event['location'],
          busName: bus['name'],
          busCapacity: bus['capacity'],
          boardedCount: (boardedResp as List).length,
          isCurrentUserAssigned: isAssigned,
        ));
      }
    }
    return result;
  }

  // ── Manifest ──────────────────────────────────────────────────────────────

  static Future<List<ManifestChild>> getBusManifest(String eventBusId) async {
    if (useMockData) return _mockManifest();

    // Query 1: assignments + child data (single round-trip)
    final regResp = await supabase
        .from('child_bus_assignments')
        .select('''
          event_registration_id,
          event_registrations(
            id, child_id,
            children(
              id, first_name, last_name, photo_url,
              child_medical_alerts(severity, description, is_active)
            )
          )
        ''')
        .eq('event_bus_id', eventBusId);

    // Query 2: ALL check-ins for this bus in one shot, ordered newest first.
    // Build childId → latest action map in memory — no N+1.
    final checkInsResp = await supabase
        .from('check_ins')
        .select('child_id, action_type_id, action_timestamp')
        .eq('event_bus_id', eventBusId)
        .order('action_timestamp', ascending: false);

    final Map<String, Map<String, dynamic>> latestCheckIn = {};
    for (final ci in checkInsResp as List) {
      final childId = ci['child_id'] as String;
      latestCheckIn.putIfAbsent(childId, () => ci); // first = newest
    }

    final List<ManifestChild> manifest = [];
    for (final row in regResp as List) {
      final reg = row['event_registrations'];
      final child = reg['children'];
      final alerts = (child['child_medical_alerts'] as List)
          .where((a) => a['is_active'] == true)
          .toList();

      final mc = ManifestChild(
        childId: child['id'],
        eventRegistrationId: reg['id'],
        firstName: child['first_name'],
        lastName: child['last_name'],
        photoUrl: child['photo_url'],
        hasCriticalAlerts: alerts.any((a) => a['severity'] == 3),
        alertDescriptions:
            alerts.map<String>((a) => a['description'] as String).toList(),
      );

      final ci = latestCheckIn[child['id']];
      if (ci != null) {
        mc.lastAction =
            CheckInActionType.values[(ci['action_type_id'] as int) - 1];
        mc.lastCheckInTime = DateTime.parse(ci['action_timestamp'] as String);
      }

      manifest.add(mc);
    }

    manifest.sort((a, b) => a.lastName.compareTo(b.lastName));
    return manifest;
  }

  // ── Check-in ──────────────────────────────────────────────────────────────

  static Future<void> recordCheckIn({
    required String eventBusId,
    required String childId,
    required CheckInActionType action,
    double? latitude,
    double? longitude,
    String? mgrsCoordinate,
    String? routeStopId,
    String? releasedToId,
    String? notes,
  }) async {
    if (useMockData) return; // no-op in mock mode

    final userId = supabase.auth.currentUser!.id;

    // Get church_id from the event_buses → events chain
    final eventBusResp = await supabase
        .from('event_buses')
        .select('events(church_id)')
        .eq('id', eventBusId)
        .single();

    final churchId = eventBusResp['events']['church_id'];

    await supabase.from('check_ins').insert({
      'church_id': churchId,
      'event_bus_id': eventBusId,
      'child_id': childId,
      'action_type_id': action.index + 1,
      'performed_by': userId,
      'latitude': latitude,
      'longitude': longitude,
      'mgrs_coordinate': mgrsCoordinate,
      'route_stop_id': routeStopId,
      'released_to_id': releasedToId,
      'notes': notes,
    });
  }

  // ── Mock data ─────────────────────────────────────────────────────────────

  static List<EventBusSummary> _mockEventBuses() {
    final now = DateTime.now();
    final tonight = DateTime(now.year, now.month, now.day, 18, 30);
    return [
      EventBusSummary(
        eventBusId: 'mock-eb-1',
        eventId: 'mock-event-1',
        eventTitle: 'AWANA Night',
        eventDate: tonight,
        location: 'Freeman Heights Baptist Church',
        busName: 'Bus 1',
        busCapacity: 24,
        boardedCount: 0,
        isCurrentUserAssigned: true,
      ),
      EventBusSummary(
        eventBusId: 'mock-eb-2',
        eventId: 'mock-event-1',
        eventTitle: 'AWANA Night',
        eventDate: tonight,
        location: 'Freeman Heights Baptist Church',
        busName: 'Bus 2',
        busCapacity: 20,
        boardedCount: 0,
        isCurrentUserAssigned: false,
      ),
    ];
  }

  static List<ManifestChild> _mockManifest() {
    return [
      ManifestChild(
        childId: 'mock-child-1',
        eventRegistrationId: 'mock-reg-1',
        firstName: 'Emma',
        lastName: 'Anderson',
        hasCriticalAlerts: false,
        alertDescriptions: [],
      ),
      ManifestChild(
        childId: 'mock-child-2',
        eventRegistrationId: 'mock-reg-2',
        firstName: 'Noah',
        lastName: 'Davis',
        hasCriticalAlerts: true,
        alertDescriptions: ['Severe peanut allergy — EpiPen in backpack'],
      ),
      ManifestChild(
        childId: 'mock-child-3',
        eventRegistrationId: 'mock-reg-3',
        firstName: 'Olivia',
        lastName: 'Garcia',
        hasCriticalAlerts: false,
        alertDescriptions: ['Lactose intolerant'],
      ),
      ManifestChild(
        childId: 'mock-child-4',
        eventRegistrationId: 'mock-reg-4',
        firstName: 'Liam',
        lastName: 'Johnson',
        hasCriticalAlerts: false,
        alertDescriptions: [],
      ),
      ManifestChild(
        childId: 'mock-child-5',
        eventRegistrationId: 'mock-reg-5',
        firstName: 'Sophia',
        lastName: 'Martinez',
        hasCriticalAlerts: false,
        alertDescriptions: [],
      ),
      ManifestChild(
        childId: 'mock-child-6',
        eventRegistrationId: 'mock-reg-6',
        firstName: 'Elijah',
        lastName: 'Smith',
        hasCriticalAlerts: true,
        alertDescriptions: ['Asthma — inhaler required', 'Bee sting allergy'],
      ),
    ];
  }
}
