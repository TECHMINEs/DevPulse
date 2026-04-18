-- DevPulse Database Schema
-- PostgreSQL 15
-- Created during initial backend setup, iterated on heavily during development
-- TODO: add proper indexes for the analytics queries, some of them are getting slow

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id VARCHAR(50) UNIQUE,
  gitlab_id VARCHAR(50) UNIQUE,
  username VARCHAR(100) NOT NULL,
  display_name VARCHAR(150),
  email VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  company VARCHAR(100),
  access_token TEXT,
  gitlab_access_token TEXT,
  provider VARCHAR(20) DEFAULT 'github',
  is_public_profile BOOLEAN DEFAULT true,
  weekly_digest_enabled BOOLEAN DEFAULT true,
  alert_threshold INTEGER DEFAULT 40,
  alert_email VARCHAR(255),
  slack_webhook_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEAMS
-- ============================================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================================================
-- REPOSITORIES
-- ============================================================================
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repo_external_id VARCHAR(100),
  name VARCHAR(200) NOT NULL,
  full_name VARCHAR(300),
  description TEXT,
  language VARCHAR(50),
  is_private BOOLEAN DEFAULT false,
  provider VARCHAR(20) DEFAULT 'github',
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_commit_at TIMESTAMPTZ,
  UNIQUE(user_id, repo_external_id)
);

-- ============================================================================
-- COMMIT SNAPSHOTS
-- this table grew to be the biggest one, might need partitioning eventually
-- ============================================================================
CREATE TABLE commit_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  commit_sha VARCHAR(40) NOT NULL,
  message TEXT,
  message_length INTEGER,
  committed_at TIMESTAMPTZ NOT NULL,
  hour_of_day SMALLINT CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week SMALLINT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_weekend BOOLEAN DEFAULT false,
  lines_added INTEGER DEFAULT 0,
  lines_removed INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  is_merge_commit BOOLEAN DEFAULT false,
  UNIQUE(user_id, commit_sha)
);

-- ============================================================================
-- WELLNESS SCORES
-- ============================================================================
CREATE TABLE wellness_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  risk_flag VARCHAR(20) DEFAULT 'none' CHECK (risk_flag IN ('none','caution','high')),
  night_commit_pct NUMERIC(5,2),
  weekend_commit_pct NUMERIC(5,2),
  avg_commit_hour NUMERIC(4,2),
  avg_message_length NUMERIC(6,2),
  commits_count INTEGER,
  lines_changed INTEGER,
  streak_days INTEGER DEFAULT 0,
  features_json JSONB,
  UNIQUE(user_id, score_date)
);

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50),
  points INTEGER DEFAULT 10
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- GOALS
-- ============================================================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  goal_type VARCHAR(50) NOT NULL,
  target_value NUMERIC(8,2) NOT NULL,
  current_value NUMERIC(8,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WEEKLY DIGESTS
-- ============================================================================
CREATE TABLE weekly_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  avg_score NUMERIC(5,2),
  total_commits INTEGER,
  top_repo VARCHAR(200),
  ai_summary TEXT,
  ai_recommendations TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SYNC JOBS
-- ============================================================================
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  repos_synced INTEGER DEFAULT 0,
  commits_synced INTEGER DEFAULT 0,
  error_message TEXT
);

-- ============================================================================
-- INDEXES
-- adding these after running some slow queries in development
-- ============================================================================
CREATE INDEX idx_commit_snapshots_user_date ON commit_snapshots(user_id, committed_at DESC);
CREATE INDEX idx_commit_snapshots_repo ON commit_snapshots(repo_id);
CREATE INDEX idx_wellness_scores_user_date ON wellness_scores(user_id, score_date DESC);
CREATE INDEX idx_repositories_user ON repositories(user_id);
CREATE INDEX idx_sync_jobs_user ON sync_jobs(user_id, started_at DESC);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_goals_user ON goals(user_id);

-- ============================================================================
-- SEED ACHIEVEMENTS
-- these are the initial set, planning to add more as features mature
-- ============================================================================
INSERT INTO achievements (slug, name, description, icon, category, points) VALUES
('first_sync', 'Connected', 'Synced GitHub for the first time', '🔌', 'onboarding', 5),
('night_owl', 'Night Owl', '50+ commits between midnight and 4am', '🦉', 'pattern', 15),
('early_bird', 'Early Bird', '50+ commits before 7am', '🐦', 'pattern', 15),
('streak_7', '7-Day Streak', 'Committed every day for 7 days', '🔥', 'streak', 20),
('streak_30', '30-Day Streak', 'Committed every day for 30 days', '💎', 'streak', 50),
('wellness_90', 'Balanced Dev', 'Maintained wellness score above 90 for 7 days', '🌿', 'wellness', 30),
('centurion', 'Centurion', 'Made 100 commits in a single month', '💯', 'volume', 25),
('polyglot', 'Polyglot', 'Committed to repos in 5+ different languages', '🌐', 'diversity', 20),
('team_player', 'Team Player', 'Joined a DevPulse team', '🤝', 'social', 10);
