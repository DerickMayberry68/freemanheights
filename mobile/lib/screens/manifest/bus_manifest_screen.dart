import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/enums/enums.dart';
import '../../repositories/transport_repository.dart';
import '../../services/location_service.dart';

class BusManifestScreen extends StatefulWidget {
  final String eventBusId;
  final String eventTitle;
  final String busName;

  const BusManifestScreen({
    super.key,
    required this.eventBusId,
    required this.eventTitle,
    required this.busName,
  });

  @override
  State<BusManifestScreen> createState() => _BusManifestScreenState();
}

class _BusManifestScreenState extends State<BusManifestScreen> {
  late Future<List<ManifestChild>> _manifestFuture;
  List<ManifestChild> _children = [];
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _manifestFuture = TransportRepository.getBusManifest(widget.eventBusId)
      ..then((kids) {
        if (mounted) setState(() => _children = kids);
      });
  }

  List<ManifestChild> get _filtered {
    if (_search.isEmpty) return _children;
    final q = _search.toLowerCase();
    return _children
        .where((c) => c.fullName.toLowerCase().contains(q))
        .toList();
  }

  int get _boardedCount =>
      _children.where((c) => c.isBoarded).length;

  Future<void> _onChildTap(ManifestChild child) async {
    final action = await showModalBottomSheet<CheckInActionType>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _CheckInSheet(child: child),
    );

    if (action == null) return;

    // Grab GPS in the background — non-blocking; check-in proceeds even if
    // location is unavailable (emulator, denied permission, timeout).
    final location = await LocationService.getCurrentLocation();

    try {
      await TransportRepository.recordCheckIn(
        eventBusId: widget.eventBusId,
        childId: child.childId,
        action: action,
        latitude: location?.latitude,
        longitude: location?.longitude,
        mgrsCoordinate: location?.mgrs8, // 8-digit (10m) stored in DB
      );
      setState(() {
        child.lastAction = action;
        child.lastCheckInTime = DateTime.now();
      });
    } catch (e) {
      debugPrint('CHECK-IN ERROR: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Check-in failed: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.busName,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            Text(
              widget.eventTitle,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            tooltip: 'Scan QR',
            onPressed: () {
              // TODO: wire up mobile_scanner
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('QR scanning coming soon'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: FutureBuilder<List<ManifestChild>>(
        future: _manifestFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting &&
              _children.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError && _children.isEmpty) {
            return Center(
              child: Text(
                'Error loading manifest:\n${snapshot.error}',
                textAlign: TextAlign.center,
              ),
            );
          }

          return Column(
            children: [
              // Stats bar
              _StatsBar(
                total: _children.length,
                boarded: _boardedCount,
              ),

              // Search
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search children...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: colors.surfaceContainerHighest,
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),

              // Child list
              Expanded(
                child: _filtered.isEmpty
                    ? Center(
                        child: Text(
                          _search.isEmpty
                              ? 'No children assigned to this bus'
                              : 'No results for "$_search"',
                          style: theme.textTheme.bodyMedium?.copyWith(
                              color: colors.onSurfaceVariant),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        itemCount: _filtered.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 8),
                        itemBuilder: (_, i) => _ChildCard(
                          child: _filtered[i],
                          onTap: () => _onChildTap(_filtered[i]),
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ── Stats bar ────────────────────────────────────────────────────────────────

class _StatsBar extends StatelessWidget {
  final int total;
  final int boarded;

  const _StatsBar({required this.total, required this.boarded});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final remaining = total - boarded;

    return Container(
      color: colors.primaryContainer.withOpacity(0.4),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _Stat(label: 'Total', value: '$total', color: colors.onSurface),
          _Divider(),
          _Stat(
              label: 'Boarded',
              value: '$boarded',
              color: Colors.green.shade700),
          _Divider(),
          _Stat(
              label: 'Remaining',
              value: '$remaining',
              color: remaining > 0
                  ? colors.primary
                  : Colors.green.shade700),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _Stat(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 22, fontWeight: FontWeight.w700, color: color)),
        Text(label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ],
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
        height: 32, width: 1, color: Theme.of(context).colorScheme.outline);
  }
}

// ── Child card ───────────────────────────────────────────────────────────────

class _ChildCard extends StatelessWidget {
  final ManifestChild child;
  final VoidCallback onTap;

  const _ChildCard({required this.child, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    Color statusColor;
    IconData statusIcon;
    String statusLabel;

    if (child.isBoarded) {
      statusColor = Colors.green.shade600;
      statusIcon = Icons.check_circle_rounded;
      statusLabel =
          'Boarded ${DateFormat('h:mm a').format(child.lastCheckInTime!)}';
    } else if (child.isNoShow) {
      statusColor = colors.error;
      statusIcon = Icons.cancel_rounded;
      statusLabel = 'No Show';
    } else if (child.isReleased) {
      statusColor = colors.secondary;
      statusIcon = Icons.logout_rounded;
      statusLabel =
          'Released ${DateFormat('h:mm a').format(child.lastCheckInTime!)}';
    } else {
      statusColor = colors.onSurfaceVariant;
      statusIcon = Icons.radio_button_unchecked;
      statusLabel = 'Not yet boarded';
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: child.isBoarded
              ? Colors.green.shade300
              : colors.outlineVariant,
          width: child.isBoarded ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 24,
                backgroundColor: colors.primaryContainer,
                backgroundImage: child.photoUrl != null
                    ? NetworkImage(child.photoUrl!)
                    : null,
                child: child.photoUrl == null
                    ? Text(
                        '${child.firstName[0]}${child.lastName[0]}',
                        style: TextStyle(
                          color: colors.onPrimaryContainer,
                          fontWeight: FontWeight.w600,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),

              // Name + status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      child.fullName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(statusIcon, size: 14, color: statusColor),
                        const SizedBox(width: 4),
                        Text(
                          statusLabel,
                          style: theme.textTheme.bodySmall
                              ?.copyWith(color: statusColor),
                        ),
                      ],
                    ),
                    // Medical alerts
                    if (child.alertDescriptions.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 4,
                        children: [
                          Icon(
                            Icons.medical_information_rounded,
                            size: 13,
                            color: child.hasCriticalAlerts
                                ? colors.error
                                : Colors.orange.shade700,
                          ),
                          Text(
                            child.alertDescriptions.first,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: child.hasCriticalAlerts
                                  ? colors.error
                                  : Colors.orange.shade700,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              // Critical alert badge
              if (child.hasCriticalAlerts)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: colors.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.warning_rounded,
                          size: 14, color: colors.error),
                      const SizedBox(width: 2),
                      Text(
                        'ALERT',
                        style: theme.textTheme.labelSmall?.copyWith(
                            color: colors.error,
                            fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Check-in bottom sheet ─────────────────────────────────────────────────────

class _CheckInSheet extends StatelessWidget {
  final ManifestChild child;

  const _CheckInSheet({required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Child info
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: colors.primaryContainer,
                  child: Text(
                    '${child.firstName[0]}${child.lastName[0]}',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: colors.onPrimaryContainer,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        child.fullName,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (child.lastAction != null)
                        Text(
                          'Last: ${child.lastAction!.displayName}',
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: colors.onSurfaceVariant),
                        ),
                    ],
                  ),
                ),
              ],
            ),

            // Medical alerts — shown prominently
            if (child.alertDescriptions.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: child.hasCriticalAlerts
                      ? colors.errorContainer
                      : Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: child.hasCriticalAlerts
                        ? colors.error
                        : Colors.orange.shade300,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.medical_information_rounded,
                          size: 16,
                          color: child.hasCriticalAlerts
                              ? colors.error
                              : Colors.orange.shade700,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          child.hasCriticalAlerts
                              ? 'CRITICAL MEDICAL ALERT'
                              : 'Medical Note',
                          style: theme.textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: child.hasCriticalAlerts
                                ? colors.error
                                : Colors.orange.shade700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ...child.alertDescriptions.map(
                      (a) => Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          '• $a',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: child.hasCriticalAlerts
                                ? colors.onErrorContainer
                                : Colors.orange.shade900,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),
            Text(
              'Record action',
              style: theme.textTheme.labelLarge
                  ?.copyWith(color: colors.onSurfaceVariant),
            ),
            const SizedBox(height: 10),

            // Action buttons
            FilledButton.icon(
              onPressed: () =>
                  Navigator.pop(context, CheckInActionType.boarded),
              icon: const Icon(Icons.directions_bus_rounded),
              label: const Text('Board'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: Colors.green.shade600,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () =>
                  Navigator.pop(context, CheckInActionType.noShow),
              icon: const Icon(Icons.person_off_outlined),
              label: const Text('No Show'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                foregroundColor: colors.error,
                side: BorderSide(color: colors.error),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}
