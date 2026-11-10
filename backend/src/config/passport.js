const GitHubStrategy = require('passport-github2').Strategy;
const db = require('../db/pool');
const logger = require('../utils/logger');
const { encrypt } = require('../utils/crypto');

// took me a while to figure out passport-github2 vs passport-github — use v2
// v1 doesn't handle the scope properly for newer GitHub API versions
module.exports = function(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      // CRIT-10: never load access_token into req.user — use explicit columns
      const result = await db.query(
        `SELECT id, github_id, gitlab_id, username, display_name, email,
          avatar_url, bio, location, company, provider, role, focus,
          is_public_profile, onboarding_completed, weekly_digest_enabled,
          alert_threshold, alert_email, slack_webhook_url,
          token_version, created_at, last_synced_at, updated_at
        FROM users WHERE id = $1`,
        [id]
      );
      done(null, result.rows[0] || null);
    } catch (error) {
      done(error, null);
    }
  });

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/auth/github/callback',
      scope: ['user:email', 'read:user', 'repo'],
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // upsert user — insert if new, update if returning
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        const result = await db.query(`
          INSERT INTO users (github_id, username, display_name, email, avatar_url, bio, location, company, access_token, provider)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'github')
          ON CONFLICT (github_id) DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            email = COALESCE(EXCLUDED.email, users.email),
            avatar_url = EXCLUDED.avatar_url,
            bio = EXCLUDED.bio,
            location = EXCLUDED.location,
            company = EXCLUDED.company,
            access_token = EXCLUDED.access_token,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [
          profile.id,
          profile.username,
          profile.displayName || profile.username,
          email,
          profile._json.avatar_url,
          profile._json.bio,
          profile._json.location,
          profile._json.company,
          encrypt(accessToken),
        ]);

        logger.info('GitHub OAuth: user upserted', { username: profile.username });
        return done(null, result.rows[0]);
      } catch (error) {
        logger.error('GitHub OAuth error', { error: error.message });
        return done(error, null);
      }
    }));
  } else {
    logger.warn('GitHub OAuth not configured — GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET missing');
  }
};
