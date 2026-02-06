-- Remove placeholder (Rick Astley) video URLs from sermons; real links can be added in Admin.
UPDATE sermons
SET video_url = NULL
WHERE video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
