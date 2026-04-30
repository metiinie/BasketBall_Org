# Migration Guide: Moving from Supabase to NestJS & Neon

This guide provides a detailed walkthrough for migrating your **Basketball Tracking Management System** backend and database while keeping **Supabase Auth**.

## 1. Database Migration (Supabase → Neon)

### Schema Preparation
1.  Sign up at [Neon.tech](https://neon.tech) and create a new project.
2.  In the Neon Console, go to the **SQL Editor**.
3.  Execute the following SQL (adapted from your Supabase schema):

```sql
-- Enums
CREATE TYPE team_gender   AS ENUM ('ወንድ', 'ሴት');
CREATE TYPE round_status  AS ENUM ('Pending', 'Active', 'Completed');
CREATE TYPE match_status  AS ENUM ('Scheduled', 'Completed', 'Forfeited');

-- Tables
CREATE TABLE teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  gender     team_gender NOT NULL,
  logo_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rounds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year  INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  status       round_status NOT NULL DEFAULT 'Pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (season_year, round_number)
);

CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  home_team_id  UUID NOT NULL REFERENCES teams(id),
  away_team_id  UUID NOT NULL REFERENCES teams(id),
  home_score    INTEGER,
  away_score    INTEGER,
  forfeit_side  TEXT,
  status        match_status NOT NULL DEFAULT 'Scheduled',
  venue         TEXT,
  match_date    TIMESTAMPTZ,
  is_ot         BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE round_snapshots (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id                 UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  historical_standings_json JSONB NOT NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (round_id)
);

CREATE TABLE audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID, -- Keep this for Supabase User ID referencing
    action TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB
);
```

## 2. Backend Implementation (NestJS)

### Step 1: Initialize Project
```bash
npx @nestjs/cli new basketball-backend
cd basketball-backend
npm install @prisma/client @nestjs/passport passport passport-jwt jwks-rsa
npx prisma init
```

### Step 2: Configure Prisma
Update `prisma/schema.prisma` to match the tables above. Set your `DATABASE_URL` in `.env` to the Neon connection string.

### Step 3: Auth Integration (Supabase JWT)
Create a `SupabaseStrategy` to validate tokens sent from the frontend:

```typescript
// backend/src/auth/supabase.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SUPABASE_JWT_SECRET', // Found in Supabase Settings -> API
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

## 3. Frontend Changes

### Update `supabase.js`
Modify `src/lib/supabase.js` to only export the client for Auth purposes.

### Create API Client
Create `src/lib/api.js`:
```javascript
import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Your NestJS URL
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
```

### Refactor Stores
In `src/stores/league.js`, replace direct Supabase calls:
```javascript
// BEFORE
const { data } = await supabase.from('teams').select('*');

// AFTER
const { data } = await api.get('/teams');
```

---

## Migration Benefits
1.  **Business Logic Centralization**: Operations like `finalizeRound` now happen on the server, preventing client-side data corruption.
2.  **Scalability**: Neon allows for serverless scaling of your database.
3.  **Security**: Row Level Security (RLS) is now managed by your NestJS controllers, providing more flexible and testable authorization logic.
