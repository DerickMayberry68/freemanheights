/// Supabase credentials — must match the frontend `.env` values
/// `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, or sign-in may hit the wrong project.
///
/// For release builds, prefer `--dart-define` / CI secrets instead of committing keys.
class AppConfig {
  static const supabaseUrl = 'https://tvvmoftvsibjgdbyzprl.supabase.co';
  static const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dm1vZnR2c2liamdkYnl6cHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzYzOTgsImV4cCI6MjA4NTkxMjM5OH0.SRZwBD2FlGyjjm7QZSjyusnb4JvHB4EU0B3SpZNUHd4';
}
