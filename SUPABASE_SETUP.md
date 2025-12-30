# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Wait for the database to be provisioned

## 2. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **Run** to execute the SQL

This will create:
- `reports` table with the required fields
- Indexes for efficient queries
- Row Level Security (RLS) policies for public read/write

## 3. Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## 4. Set Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## 5. Deploy

After setting up the environment variables:
- For local development: `npm run dev`
- For Vercel: Add the environment variables in Vercel dashboard → Settings → Environment Variables

## Notes

- The database uses Row Level Security (RLS) with public read/write access
- Reports are automatically filtered to last 90 minutes in the API
- No authentication required - reports are anonymous

