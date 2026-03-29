import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../repositories/transport_repository.dart';
import '../../main.dart';
import '../manifest/bus_manifest_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<List<EventBusSummary>> _eventsFuture;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      _eventsFuture = TransportRepository.getTodaysEventBuses();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final userEmail = supabase.auth.currentUser?.email ?? '';
    final today = DateFormat('EEEE, MMMM d').format(DateTime.now());

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.church_rounded, color: colors.primary, size: 22),
            const SizedBox(width: 8),
            const Text('Freeman Heights'),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: Chip(
              avatar: Icon(Icons.person_outline, size: 16, color: colors.onSecondaryContainer),
              label: Text(
                userEmail.split('@').first,
                style: theme.textTheme.labelSmall,
              ),
              visualDensity: VisualDensity.compact,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () async => supabase.auth.signOut(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _load(),
        child: CustomScrollView(
          slivers: [
            // Date header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                child: Row(
                  children: [
                    Icon(Icons.directions_bus_rounded,
                        color: colors.primary, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      today,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Event bus list
            FutureBuilder<List<EventBusSummary>>(
              future: _eventsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                if (snapshot.hasError) {
                  return SliverFillRemaining(
                    child: _ErrorState(
                      message: snapshot.error.toString(),
                      onRetry: _load,
                    ),
                  );
                }

                final buses = snapshot.data ?? [];

                if (buses.isEmpty) {
                  return const SliverFillRemaining(
                    child: _EmptyState(),
                  );
                }

                // Group by event
                final Map<String, List<EventBusSummary>> byEvent = {};
                for (final b in buses) {
                  byEvent.putIfAbsent(b.eventId, () => []).add(b);
                }

                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final eventId = byEvent.keys.elementAt(index);
                      final eventBuses = byEvent[eventId]!;
                      final first = eventBuses.first;
                      return _EventSection(
                        eventTitle: first.eventTitle,
                        eventDate: first.eventDate,
                        location: first.location,
                        buses: eventBuses,
                        onBusTap: (bus) => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BusManifestScreen(
                              eventBusId: bus.eventBusId,
                              eventTitle: bus.eventTitle,
                              busName: bus.busName,
                            ),
                          ),
                        ),
                      );
                    },
                    childCount: byEvent.length,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Event section ────────────────────────────────────────────────────────────

class _EventSection extends StatelessWidget {
  final String eventTitle;
  final DateTime eventDate;
  final String? location;
  final List<EventBusSummary> buses;
  final void Function(EventBusSummary) onBusTap;

  const _EventSection({
    required this.eventTitle,
    required this.eventDate,
    required this.location,
    required this.buses,
    required this.onBusTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final time = DateFormat('h:mm a').format(eventDate);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Event header
          Row(
            children: [
              Expanded(
                child: Text(
                  eventTitle,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              Icon(Icons.access_time, size: 14, color: colors.onSurfaceVariant),
              const SizedBox(width: 4),
              Text(time, style: theme.textTheme.bodySmall),
              if (location != null) ...[
                const SizedBox(width: 12),
                Icon(Icons.location_on_outlined,
                    size: 14, color: colors.onSurfaceVariant),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    location!,
                    style: theme.textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),

          // Bus cards
          ...buses.map((bus) => _BusCard(bus: bus, onTap: () => onBusTap(bus))),
        ],
      ),
    );
  }
}

// ── Bus card ─────────────────────────────────────────────────────────────────

class _BusCard extends StatelessWidget {
  final EventBusSummary bus;
  final VoidCallback onTap;

  const _BusCard({required this.bus, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final pct = bus.busCapacity > 0
        ? bus.boardedCount / bus.busCapacity
        : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: bus.isCurrentUserAssigned
              ? colors.primary
              : colors.outlineVariant,
          width: bus.isCurrentUserAssigned ? 2 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.directions_bus_rounded,
                    color: bus.isCurrentUserAssigned
                        ? colors.primary
                        : colors.onSurfaceVariant,
                    size: 22,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      bus.busName,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: bus.isCurrentUserAssigned
                            ? colors.primary
                            : colors.onSurface,
                      ),
                    ),
                  ),
                  if (bus.isCurrentUserAssigned)
                    Chip(
                      label: const Text('Your Bus'),
                      labelStyle: theme.textTheme.labelSmall?.copyWith(
                        color: colors.onPrimaryContainer,
                      ),
                      backgroundColor: colors.primaryContainer,
                      padding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                    ),
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right, color: colors.onSurfaceVariant),
                ],
              ),
              const SizedBox(height: 10),

              // Capacity bar
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct,
                        minHeight: 6,
                        backgroundColor: colors.surfaceContainerHighest,
                        valueColor: AlwaysStoppedAnimation(
                          pct > 0.9 ? colors.error : colors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${bus.boardedCount} / ${bus.busCapacity}',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── States ───────────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.directions_bus_outlined,
                size: 64, color: colors.outlineVariant),
            const SizedBox(height: 16),
            Text('No transport events today',
                style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'Pull down to refresh',
              style: theme.textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_rounded, size: 64, color: colors.error),
            const SizedBox(height: 16),
            Text('Could not load events', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              message,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: colors.onSurfaceVariant),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 24),
            FilledButton.tonal(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
