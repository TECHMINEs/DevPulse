-- DevPulse Database Schema (SQLite version)

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  github_id TEXT UNIQUE,
  gitlab_id TEXT UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  company TEXT,
  access_token TEXT,
  gitlab_access_token TEXT,
  provider TEXT DEFAULT 'github',
  is_public_profile BOOLEAN DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT 0,
  weekly_digest_enabled BOOLEAN DEFAULT 1,
  alert_threshold INTEGER DEFAULT 40,
  alert_email TEXT,
  slack_webhook_url TEXT,
  role TEXT DEFAULT 'user',
  focus TEXT,
  token_version INTEGER DEFAULT 1,        -- CRIT-01: JWT revocation counter
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_synced_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TEAMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

-- FEAT-03: Team invite tokens — stored so join can verify and mark used
CREATE TABLE IF NOT EXISTS team_invite_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
  used INTEGER DEFAULT 0
);

-- ============================================================================
-- REPOSITORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  repo_external_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  description TEXT,
  language TEXT,
  is_private BOOLEAN DEFAULT 0,
  provider TEXT DEFAULT 'github',
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_commit_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- FEAT-08
  UNIQUE(user_id, repo_external_id)
);

-- ============================================================================
-- COMMIT SNAPSHOTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS commit_snapshots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  repo_id TEXT REFERENCES repositories(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  message TEXT,
  message_length INTEGER,
  committed_at DATETIME NOT NULL,
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_weekend BOOLEAN DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_removed INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  is_merge_commit BOOLEAN DEFAULT 0,
  UNIQUE(user_id, commit_sha)
);

-- ============================================================================
-- WELLNESS SCORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS wellness_scores (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  risk_flag TEXT DEFAULT 'none' CHECK (risk_flag IN ('none','caution','high')),
  night_commit_pct NUMERIC(5,2),
  weekend_commit_pct NUMERIC(5,2),
  avg_commit_hour NUMERIC(4,2),
  avg_message_length NUMERIC(6,2),
  commits_count INTEGER,
  lines_changed INTEGER,
  streak_days INTEGER DEFAULT 0,
  features_json TEXT,
  UNIQUE(user_id, score_date)
);

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  points INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- GOALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC(8,2) NOT NULL,
  current_value NUMERIC(8,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- FEAT-08
);

-- ============================================================================
-- WEEKLY DIGESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_digests (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  avg_score NUMERIC(5,2),
  total_commits INTEGER,
  top_repo TEXT,
  ai_summary TEXT,
  ai_recommendations TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYNC JOBS
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  started_at DATETIME,
  completed_at DATETIME,
  repos_synced INTEGER DEFAULT 0,
  commits_synced INTEGER DEFAULT 0,
  error_message TEXT
);

-- ============================================================================
-- INDEXES — original set
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_commit_snapshots_user_date ON commit_snapshots(user_id, committed_at);
CREATE INDEX IF NOT EXISTS idx_commit_snapshots_repo ON commit_snapshots(repo_id);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_user_date ON wellness_scores(user_id, score_date);
CREATE INDEX IF NOT EXISTS idx_repositories_user ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user ON sync_jobs(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- FEAT-09: Missing performance indexes
CREATE INDEX IF NOT EXISTS idx_commit_snapshots_hour
  ON commit_snapshots(user_id, hour_of_day);

CREATE INDEX IF NOT EXISTS idx_commit_snapshots_weekend
  ON commit_snapshots(user_id, is_weekend);

CREATE INDEX IF NOT EXISTS idx_wellness_scores_risk
  ON wellness_scores(user_id, risk_flag, score_date);

CREATE INDEX IF NOT EXISTS idx_wellness_scores_user_date_score
  ON wellness_scores(user_id, score_date, score);

CREATE INDEX IF NOT EXISTS idx_users_username
  ON users(username);

CREATE INDEX IF NOT EXISTS idx_team_members_team_user
  ON team_members(team_id, user_id);

-- FEAT-06: Prevent duplicate weekly digests
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_week
  ON weekly_digests(user_id, week_start);

-- ============================================================================
-- TRIGGERS — FEAT-08: auto-update updated_at
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_repositories_updated_at
  AFTER UPDATE ON repositories
  FOR EACH ROW
  BEGIN
    UPDATE repositories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_goals_updated_at
  AFTER UPDATE ON goals
  FOR EACH ROW
  BEGIN
    UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- ============================================================================
-- SEED ACHIEVEMENTS
-- ============================================================================
INSERT OR IGNORE INTO achievements (slug, name, description, icon, category, points) VALUES
('first_sync', 'Connected', 'Synced GitHub for the first time', '🔌', 'onboarding', 5),
('night_owl', 'Night Owl', '50+ commits between midnight and 4am', '🦉', 'pattern', 15),
('early_bird', 'Early Bird', '50+ commits before 7am', '🐦', 'pattern', 15),
('streak_7', '7-Day Streak', 'Committed every day for 7 days', '🔥', 'streak', 20),
('streak_30', '30-Day Streak', 'Committed every day for 30 days', '💎', 'streak', 50),
('wellness_90', 'Balanced Dev', 'Maintained wellness score above 90 for 7 days', '🌿', 'wellness', 30),
('centurion', 'Centurion', 'Made 100 commits in a single month', '💯', 'volume', 25),
('polyglot', 'Polyglot', 'Committed to repos in 5+ different languages', '🌐', 'diversity', 20),
('team_player', 'Team Player', 'Joined a DevPulse team', '🤝', 'social', 10);
