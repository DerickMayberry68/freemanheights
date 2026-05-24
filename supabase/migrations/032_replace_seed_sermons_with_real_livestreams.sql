DELETE FROM sermons
WHERE video_url IS NULL
  AND title IN (
    'Welcome to Freeman Heights',
    'Walking in Faith',
    'The Good Shepherd',
    'Love One Another',
    'Prayer That Moves Mountains',
    'Grace and Truth'
  );

WITH real_sermons (title, speaker, sermon_date, scripture_reference, description, video_url, series, is_featured) AS (
  VALUES
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-17', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/yn627qw?&info=0', NULL, true),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-17', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/jmw3nf8?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-10', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/jqkdhm3?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-03', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/d89y8js?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-03', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/mrncgpg?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-26', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/wm5nwtt?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-26', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/y253y63?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-19', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/cp5cvyb?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-12', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/tsyswtj?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-05', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/9nsnkyz?&info=0', NULL, false),
    ('Sunday Morning Worship Service/ Brother Marty Strough', 'Freeman Heights', DATE '2026-03-29', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/r36btfx?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-22', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/ptdgn3x?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-15', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/5gtn72b?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-08', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/p97jwqh?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-01', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/qxcg57d?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-02-22', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/7n2ys4x?&info=0', NULL, false),
    ('"All that Calvary Implies must be Appropriated"', 'Freeman Heights', DATE '2026-02-15', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/mbx663v?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-02-08', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/h9tvqgw?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-02-01', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/kpwbrfk?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-01-18', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/vys6mnr?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-01-11', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/494nfhr?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-01-04', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/yvs6f57?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2025-12-28', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/rnjpnrh?&info=0', NULL, false),
    ('Sunday Morning Worship Service', 'Freeman Heights', DATE '2025-12-21', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/shhwhvz?&info=0', NULL, false)
)
INSERT INTO sermons (title, speaker, sermon_date, scripture_reference, description, video_url, series, is_featured)
SELECT rs.title, rs.speaker, rs.sermon_date, rs.scripture_reference, rs.description, rs.video_url, rs.series, rs.is_featured
FROM real_sermons rs
WHERE NOT EXISTS (
  SELECT 1
  FROM sermons s
  WHERE s.video_url = rs.video_url
);
