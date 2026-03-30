-- ============================================================
-- 029 - Recurring Events
-- ============================================================

-- event_series: defines a recurring event pattern
CREATE TABLE event_series (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  description    TEXT,
  location       TEXT,
  image_url      TEXT,
  is_featured    BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT NOT NULL
                   CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly')),
  day_of_week    SMALLINT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun; used for weekly/biweekly
  month_day      SMALLINT CHECK (month_day BETWEEN 1 AND 31),  -- used for monthly
  start_time     TIME NOT NULL,
  end_time       TIME,
  series_start   DATE NOT NULL,
  series_end     DATE,          -- NULL = rolling window (no hard end)
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event_series"
  ON event_series FOR SELECT USING (true);

CREATE POLICY "Admin write event_series"
  ON event_series FOR ALL TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- Add recurrence columns to events
-- ============================================================
ALTER TABLE events
  ADD COLUMN series_id         UUID REFERENCES event_series(id) ON DELETE CASCADE,
  ADD COLUMN is_cancelled      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN cancellation_note TEXT,
  ADD COLUMN is_overridden     BOOLEAN NOT NULL DEFAULT false;


-- ============================================================
-- Site settings defaults
-- ============================================================
INSERT INTO site_settings (key, value)
  SELECT 'recurring_window_days', '90'
  WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE key = 'recurring_window_days');

INSERT INTO site_settings (key, value)
  SELECT 'church_timezone', 'America/Chicago'
  WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE key = 'church_timezone');

-- ============================================================
-- generate_series_occurrences(p_series_id, p_window_end)
--
-- Inserts occurrence rows for a series up to p_window_end.
-- Skips dates that already have a row (ON CONFLICT DO NOTHING),
-- so it is safe to call repeatedly (idempotent).
-- Returns the number of occurrences attempted.
-- ============================================================
CREATE OR REPLACE FUNCTION generate_series_occurrences(
  p_series_id UUID,
  p_window_end DATE DEFAULT (CURRENT_DATE + INTERVAL '90 days')
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_series    event_series%ROWTYPE;
  v_tz        TEXT;
  v_date      DATE;
  v_end       DATE;
  v_evt_start TIMESTAMPTZ;
  v_evt_end   TIMESTAMPTZ;
  v_count     INTEGER := 0;
  v_next      DATE;
  v_dow_diff  INTEGER;
  v_days_in_mo INTEGER;
BEGIN
  SELECT * INTO v_series
    FROM event_series
   WHERE id = p_series_id AND is_active = true;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Timezone for timestamp generation
  SELECT value INTO v_tz FROM site_settings WHERE key = 'church_timezone';
  v_tz := COALESCE(v_tz, 'America/Chicago');

  -- Effective window end respects an explicit series_end
  v_end  := LEAST(p_window_end, COALESCE(v_series.series_end, p_window_end));
  v_date := GREATEST(v_series.series_start, CURRENT_DATE);

  -- ── Advance v_date to the first valid occurrence ────────────
  IF v_series.recurrence_type IN ('weekly', 'biweekly') THEN
    v_dow_diff := (v_series.day_of_week - EXTRACT(DOW FROM v_date)::INTEGER + 7) % 7;
    v_date := v_date + v_dow_diff;

  ELSIF v_series.recurrence_type = 'monthly' THEN
    -- Try this month's occurrence first
    v_days_in_mo := EXTRACT(DAY FROM
      (DATE_TRUNC('month', v_date) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER;
    v_date := DATE_TRUNC('month', v_date)::DATE
              + (LEAST(v_series.month_day, v_days_in_mo) - 1);

    -- If already past, move to next month
    IF v_date < CURRENT_DATE THEN
      v_next := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
      v_days_in_mo := EXTRACT(DAY FROM
        (v_next + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER;
      v_date := v_next + (LEAST(v_series.month_day, v_days_in_mo) - 1);
    END IF;
  END IF;

  -- ── Generate occurrences ────────────────────────────────────
  WHILE v_date <= v_end LOOP
    v_evt_start := (v_date::TEXT || ' ' || v_series.start_time::TEXT)::TIMESTAMP
                   AT TIME ZONE v_tz;
    v_evt_end   := CASE WHEN v_series.end_time IS NOT NULL
                     THEN (v_date::TEXT || ' ' || v_series.end_time::TEXT)::TIMESTAMP
                          AT TIME ZONE v_tz
                     ELSE NULL
                   END;

    IF NOT EXISTS (
      SELECT 1 FROM events
       WHERE series_id = p_series_id AND event_date = v_evt_start
    ) THEN
      INSERT INTO events (
        series_id, title, description, event_date, end_date,
        location, image_url, is_featured, is_cancelled, is_overridden
      ) VALUES (
        p_series_id, v_series.title, v_series.description,
        v_evt_start, v_evt_end,
        v_series.location, v_series.image_url, v_series.is_featured,
        false, false
      );
    END IF;

    v_count := v_count + 1;

    -- Advance to next occurrence
    IF v_series.recurrence_type = 'weekly' THEN
      v_date := v_date + 7;

    ELSIF v_series.recurrence_type = 'biweekly' THEN
      v_date := v_date + 14;

    ELSIF v_series.recurrence_type = 'monthly' THEN
      v_next := (DATE_TRUNC('month', v_date) + INTERVAL '1 month')::DATE;
      v_days_in_mo := EXTRACT(DAY FROM
        (v_next + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER;
      v_date := v_next + (LEAST(v_series.month_day, v_days_in_mo) - 1);
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================================
-- cleanup_generated_events()
--
-- Removes auto-generated (not overridden, not cancelled) past
-- occurrences older than 7 days to keep the table lean.
-- Cancelled and overridden occurrences are kept permanently.
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_generated_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM events
   WHERE series_id    IS NOT NULL
     AND is_overridden = false
     AND is_cancelled  = false
     AND event_date   < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- refresh_all_series()
--
-- Extends the rolling window for every active series and prunes
-- old auto-generated rows.  Called daily by pg_cron.
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_all_series()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_days INTEGER;
  v_window_end  DATE;
  v_id          UUID;
  v_total       INTEGER := 0;
BEGIN
  SELECT value::INTEGER INTO v_window_days
    FROM site_settings WHERE key = 'recurring_window_days';
  v_window_days := COALESCE(v_window_days, 90);
  v_window_end  := CURRENT_DATE + (v_window_days || ' days')::INTERVAL;

  FOR v_id IN SELECT id FROM event_series WHERE is_active = true LOOP
    v_total := v_total + generate_series_occurrences(v_id, v_window_end);
  END LOOP;

  PERFORM cleanup_generated_events();
  RETURN v_total;
END;
$$;

-- ============================================================
-- pg_cron: daily refresh at 3:00 AM UTC
--
-- To enable:  Database → Extensions → pg_cron  (Supabase dashboard)
-- The DO block below is a no-op if the extension is not installed,
-- so the migration never fails.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'refresh-recurring-events',   -- job name (idempotent re-runs are safe)
      '0 3 * * *',                  -- every day at 03:00 UTC
      $cron$ SELECT refresh_all_series(); $cron$
    );
  END IF;
END;
$$;
