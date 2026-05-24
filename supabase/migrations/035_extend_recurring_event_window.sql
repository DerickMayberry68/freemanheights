UPDATE site_settings
SET value = '365'
WHERE key = 'recurring_window_days';

INSERT INTO site_settings (key, value)
SELECT 'recurring_window_days', '365'
WHERE NOT EXISTS (
  SELECT 1 FROM site_settings WHERE key = 'recurring_window_days'
);
