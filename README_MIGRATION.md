# Migration to Vercel-Native Architecture Completed

The application has been migrated from Supabase to a 100% Vercel-native stack.

## New Architecture
- **Database:** Vercel Postgres (via Neon). Managed directly in your Vercel dashboard.
- **Real-time:** Server-Sent Events (SSE). No external login (like Pusher) required.
- **Backend:** Vercel Serverless & Edge Functions in the `api/` directory.

## How to Deploy
1.  **Create Database:** Go to your Vercel Project Dashboard -> **Storage** -> **Create Database** -> **Postgres**.
2.  **Connect:** Follow the prompts to connect the database to your project. This will automatically add the `POSTGRES_URL` and other environment variables.
3.  **Initialize Tables:** Once deployed (or locally if you have the Vercel CLI linked), visit `https://your-deployment.vercel.app/api/db-setup` in your browser. You should see a "Database setup successful" message.
4.  **Enjoy:** The app will now use your own Vercel Postgres instance. It will not pause like Supabase's free tier (it idles but wakes up automatically).

## Files Changed
- `api/`: New directory containing the serverless backend.
- `src/hooks/useSupabase.ts`: Refactored into a general API client.
- `src/hooks/useRealTimeCounters.ts`: Updated to use SSE for real-time updates.
- `package.json`: Removed Supabase dependencies.
- `supabase/`: Removed (no longer needed).
