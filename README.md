# Freeman Heights Baptist Church - Website

Modern React + Supabase website for Freeman Heights Baptist Church, Berryville, AR.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS + Headless UI
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Clone and install dependencies**

   ```bash
   cd FreemanHeights/frontend
   npm install
   ```

2. **Configure Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run the migration in `supabase/migrations/001_initial_schema.sql`
   - Optionally run `supabase/seed.sql` for sample data
   - Copy `.env.example` to `.env` and add your Supabase URL and anon key

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
npm run build
```

Output is in `frontend/dist`. Deploy to Vercel or any static host.

## Project Structure

```
freeman-heights/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── App.jsx
│   └── public/
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── README.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Admin Panel

The admin panel at `/admin` provides a CMS interface for managing events, sermons, and ministries. Supabase auth can be added to protect these routes.

## Client Info

- **Location:** 522 Freeman Street, Berryville, AR 72616
- **Current Site:** https://www.freemanheights.com/
