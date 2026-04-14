-- ============================================================
-- EBF League Management System — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE team_gender   AS ENUM ('ወንድ', 'ሴት');
CREATE TYPE round_status  AS ENUM ('Pending', 'Active', 'Completed');
CREATE TYPE match_status  AS ENUM ('Scheduled', 'Completed', 'Forfeited');

-- ─── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE teams (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  gender     team_gender NOT NULL,
  logo_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rounds (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_year  INTEGER NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 5),
  status       round_status NOT NULL DEFAULT 'Pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (season_year, round_number)
);

CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id      UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  home_team_id  UUID NOT NULL REFERENCES teams(id),
  away_team_id  UUID NOT NULL REFERENCES teams(id),
  home_score    INTEGER CHECK (home_score >= 0),
  away_score    INTEGER CHECK (away_score >= 0),
  forfeit_side  TEXT CHECK (forfeit_side IN ('home', 'away', 'both')),
  status        match_status NOT NULL DEFAULT 'Scheduled',
  venue         TEXT,
  match_date    TIMESTAMPTZ,
  is_ot         BOOLEAN DEFAULT false,        -- overtime flag (required by ScoreInputModal)
  start_date    TIMESTAMPTZ,                  -- round-level dates stored here for legacy support
  end_date      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (home_team_id != away_team_id)
);

-- ─── Migration: run this if the table already exists in Supabase ────────────
-- ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_ot BOOLEAN DEFAULT false;
-- ALTER TABLE rounds  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
-- ALTER TABLE rounds  ADD COLUMN IF NOT EXISTS end_date   TIMESTAMPTZ;


CREATE TABLE round_snapshots (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id                 UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  historical_standings_json JSONB NOT NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (round_id)   -- one snapshot per round
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_matches_round_id    ON matches (round_id);
CREATE INDEX idx_matches_home_team   ON matches (home_team_id);
CREATE INDEX idx_matches_away_team   ON matches (away_team_id);
CREATE INDEX idx_matches_status      ON matches (status);
CREATE INDEX idx_rounds_status       ON rounds (status);
CREATE INDEX idx_rounds_season_year  ON rounds (season_year);
CREATE INDEX idx_teams_gender        ON teams (gender);

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- SECURITY NOTE: The write policies below use auth.role() = 'authenticated',
-- meaning ANY logged-in user can modify data. For production, consider
-- restricting writes to specific admin users via a custom claim or an
-- admin_users lookup table, e.g.:
--   WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users))

ALTER TABLE teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_snapshots ENABLE ROW LEVEL SECURITY;

-- Public can READ all tables (unauthenticated viewers)
CREATE POLICY "Public read teams"           ON teams           FOR SELECT USING (true);
CREATE POLICY "Public read rounds"          ON rounds          FOR SELECT USING (true);
CREATE POLICY "Public read matches"         ON matches         FOR SELECT USING (true);
CREATE POLICY "Public read snapshots"       ON round_snapshots FOR SELECT USING (true);

-- Authenticated users (League Controllers) can WRITE
CREATE POLICY "Auth insert teams"           ON teams           FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update teams"           ON teams           FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete teams"           ON teams           FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert rounds"          ON rounds          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update rounds"          ON rounds          FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert matches"         ON matches         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update matches"         ON matches         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete matches"         ON matches         FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth upsert snapshots"       ON round_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update snapshots"       ON round_snapshots FOR UPDATE USING (auth.role() = 'authenticated');

-- ─── Seed: EBF 2025 Season (5 rounds + Official Teams) ────────────────────────
-- Uncomment to seed initial data

/*
INSERT INTO rounds (season_year, round_number, status) VALUES
  (2025, 1, 'Active'),
  (2025, 2, 'Pending'),
  (2025, 3, 'Pending'),
  (2025, 4, 'Pending'),
  (2025, 5, 'Pending');

-- Seed Official Men's Teams
INSERT INTO teams (name, gender) VALUES
  ('ጋምቤላ ከተማ', 'ወንድ'),
  ('ሸገር ከተማ', 'ወንድ'),
  ('ኢትዮጵያ ስፖርት አካዳሚ', 'ወንድ'),
  ('ሀዋሳ ከተማ', 'ወንድ'),
  ('ወልቂጤ ከተማ', 'ወንድ'),
  ('ፋሲል ከነማ', 'ወንድ');

-- Seed Official Women's Teams
INSERT INTO teams (name, gender) VALUES
  ('ሀዋሳ ከተማ', 'ሴት'),
  ('ኢትዮጵያ ስፖርት አካዳሚ', 'ሴት'),
  ('ወልቂጤ ከተማ', 'ሴት'),
  ('ባህርዳር ከተማ', 'ሴት'),
  ('ጋምቤላ ከተማ', 'ሴት');
*/
