import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('🚀 Starting Data Migration...');
  await client.connect();

  // 1. Teams
  console.log('📦 Migrating Teams...');
  const { data: teams } = await supabase.from('teams').select('*');
  for (const team of teams || []) {
    await client.query(
      'INSERT INTO teams (id, name, gender, logo_url, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, gender = $3, logo_url = $4',
      [team.id, team.name, team.gender, team.logo_url, team.created_at]
    );
  }

  // 2. Rounds
  console.log('📦 Migrating Rounds...');
  const { data: rounds } = await supabase.from('rounds').select('*');
  for (const round of rounds || []) {
    await client.query(
      'INSERT INTO rounds (id, season_year, round_number, gender, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET season_year = $2, round_number = $3, gender = $4, status = $5',
      [round.id, round.season_year, round.round_number, round.gender, round.status, round.created_at]
    );
  }

  // 3. Matches
  console.log('📦 Migrating Matches...');
  const { data: matches } = await supabase.from('matches').select('*');
  for (const match of matches || []) {
    await client.query(
      'INSERT INTO matches (id, round_id, home_team_id, away_team_id, home_score, away_score, forfeit_side, status, venue, match_date, is_ot, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO UPDATE SET home_score = $5, away_score = $6, status = $8',
      [match.id, match.round_id, match.home_team_id, match.away_team_id, match.home_score, match.away_score, match.forfeit_side, match.status, match.venue, match.match_date, match.is_ot, match.created_at]
    );
  }

  // 4. Snapshots
  console.log('📦 Migrating Snapshots...');
  const { data: snapshots } = await supabase.from('round_snapshots').select('*');
  for (const snap of snapshots || []) {
    await client.query(
      'INSERT INTO round_snapshots (id, round_id, historical_standings_json, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (round_id) DO UPDATE SET historical_standings_json = $3',
      [snap.id, snap.round_id, JSON.stringify(snap.historical_standings_json), snap.created_at]
    );
  }

  // 5. Audit Logs
  console.log('📦 Migrating Audit Logs (last 500)...');
  const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500);
  for (const log of logs || []) {
    await client.query(
      'INSERT INTO audit_logs (id, created_at, user_id, action, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
      [log.id, log.created_at, log.user_id, log.action, log.entity_id, JSON.stringify(log.details)]
    );
  }

  console.log('✅ Migration Finished!');
}

migrate()
  .catch((e) => {
    console.error('❌ Migration Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
