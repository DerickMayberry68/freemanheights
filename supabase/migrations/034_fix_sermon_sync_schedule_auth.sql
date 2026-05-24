DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'weekly-sermon-sync'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'weekly-sermon-sync',
  '15 8 * * 1',
  $$
    SELECT net.http_post(
      url := 'https://tvvmoftvsibjgdbyzprl.supabase.co/functions/v1/sync-sermons',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dm1vZnR2c2liamdkYnl6cHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzYzOTgsImV4cCI6MjA4NTkxMjM5OH0.SRZwBD2FlGyjjm7QZSjyusnb4JvHB4EU0B3SpZNUHd4'
      ),
      body := jsonb_build_object('source', 'pg_cron'),
      timeout_milliseconds := 30000
    );
  $$
);
