import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

const supabaseUrl     = Constants.expoConfig?.extra?.supabaseUrl     as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

// Gateway/edge statuses that mean the request never reached (or didn't complete
// at) the Supabase origin — a transient Cloudflare↔origin hiccup, NOT a real
// failure. 525 = SSL handshake failed (seen live: a ~1-minute blip rendered the
// raw Cloudflare HTML in-app AND logged users out because the token auto-refresh
// hit it and supabase-js fired SIGNED_OUT). Retry these so a short infra hiccup
// self-heals instead of surfacing as an error or a spurious logout.
const RETRY_STATUSES = new Set([502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530]);

async function resilientFetch(input: any, init?: any): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(input, init);
      if (RETRY_STATUSES.has(res.status) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (e) {
      // Network-level throw (DNS/TLS/connection) — same transient class.
      lastErr = e;
      if (attempt < 2) { await new Promise((r) => setTimeout(r, 500 * (attempt + 1))); continue; }
    }
  }
  throw lastErr;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:           AsyncStorage,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
  global: { fetch: resilientFetch },
});

// ── Keep the session alive across app lifecycle (NEVER auto-logout) ──────────
// Supabase's auto-refresh timer fires on a fixed interval, INCLUDING while iOS
// has the app backgrounded and the JS thread suspended. A refresh that fires on
// a suspended/offline thread can fail or race the rotating refresh token, after
// which supabase-js emits SIGNED_OUT and WIPES the stored session — the user is
// silently logged out and can't recover (they lose lead alerts). The official
// React-Native fix: stop the refresh timer when the app is backgrounded and
// start it (which also refreshes immediately if due) when it returns to the
// foreground, so the token is only ever refreshed on a live thread. Combined
// with the per-request proactive refresh in api.ts, a signed-in user stays
// signed in until they tap Sign Out themselves.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
// Kick it off for the initial (already-foregrounded) launch.
supabase.auth.startAutoRefresh();
