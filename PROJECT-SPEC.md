# Freeman Heights Baptist Church - Website Redesign

**Client:** Freeman Heights Baptist Church  
**Location:** 522 Freeman Street, Berryville, AR 72616  
**Current Site:** https://www.freemanheights.com/  
**Project Type:** React + Supabase Website Redesign  
**Timeline:** 1-2 weeks  
**Budget:** $3,000-$5,000 (easy money, quick win)

---

## Current Site Analysis

### What They Have
- **Platform:** Basic static site (possibly Wix/Squarespace)
- **Pages:** Home, Give, Ministries, Calendar, Our Staff, Explore, Livestream, Previous Livestreams
- **Features:**
  - Hero image of church building
  - Service times display
  - Contact information
  - Social media links (Facebook, Instagram, Spotify)
  - Embedded livestream (iframe)
  - Google Maps embed
  - Multiple ministry pages (embedded iframes)

### Pain Points
- ❌ Dated design (looks early 2010s)
- ❌ Heavy reliance on iframes (slow, not mobile-friendly)
- ❌ No content management system (hard to update)
- ❌ No modern features (event RSVP, prayer requests, etc.)
- ❌ Not optimized for mobile
- ❌ No online giving integration (just links out)

---

## Proposed Solution: Modern React + Supabase Stack

### Tech Stack
- **Frontend:** React 18 + Vite (fast, modern, no SSR needed)
- **Styling:** Tailwind CSS + Headless UI (professional, responsive)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Deployment:** Vercel (free tier, automatic deployments)
- **Analytics:** Vercel Analytics (simple, privacy-friendly)

### Why This Stack?
- ✅ **Fast to build:** 1-2 weeks from zero to launch
- ✅ **Easy to maintain:** Admin panel for church staff to update content
- ✅ **Modern UX:** Smooth, responsive, mobile-first
- ✅ **Scalable:** Can add features as needed
- ✅ **Low cost:** Supabase free tier + Vercel free tier = $0/month hosting
- ✅ **Future-proof:** Easy to add more features later

---

## Proposed Features (MVP)

### 1. **Home Page**
- Modern hero section with church image
- Mission statement
- Service times (dynamically updatable)
- Quick links to Give, Livestream, Calendar
- Recent sermon highlights
- Upcoming events feed

### 2. **Livestream Page**
- Embedded YouTube/Facebook livestream
- Chat/comments (if needed)
- Previous sermons archive with search
- Sermon notes download (PDF)

### 3. **Ministries**
- Clean cards for each ministry (Kids, Students, Adults, Awana)
- Photos, descriptions, contact info
- Event listings per ministry
- Leader bios

### 4. **Calendar/Events**
- Interactive calendar view
- Event detail pages
- RSVP functionality (nice to have)
- Export to Google Calendar/iCal

### 5. **Our Staff**
- Staff directory with photos
- Bios, roles, contact info
- Prayer request submission form

### 6. **Give**
- Integration with existing giving platform (Pushpay, Tithe.ly, etc.)
- One-click donation buttons
- Giving statements (if backend supports)

### 7. **Admin Panel (Supabase-powered)**
- Simple CMS for updating:
  - Service times
  - Events
  - Sermon archive
  - Staff directory
  - Ministry info
  - Announcements
- No technical knowledge required

---

## Database Schema (Supabase)

```sql
-- Service Times
CREATE TABLE service_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week TEXT NOT NULL,
  time TEXT NOT NULL,
  service_type TEXT, -- 'Sunday Morning', 'Sunday Evening', etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  ministry_id UUID REFERENCES ministries(id),
  image_url TEXT,
  registration_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ministries
CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  leader_name TEXT,
  leader_email TEXT,
  image_url TEXT,
  meeting_time TEXT,
  target_audience TEXT, -- 'Kids', 'Students', 'Adults', 'All'
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Pastor', 'Associate Pastor', 'Worship Leader', etc.
  bio TEXT,
  email TEXT,
  phone TEXT,
  image_url TEXT,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sermons
CREATE TABLE sermons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  sermon_date DATE NOT NULL,
  scripture_reference TEXT,
  description TEXT,
  video_url TEXT, -- YouTube embed
  audio_url TEXT, -- Direct audio file
  notes_url TEXT, -- PDF download
  series TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer Requests (optional)
CREATE TABLE prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  request TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false, -- Can be shared with prayer team
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  priority INTEGER DEFAULT 0, -- Higher = shows first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Design Mockup (Concept)

### Color Palette
- **Primary:** Orange/gold (from their logo)
- **Secondary:** Deep purple/blue (current gradient)
- **Accent:** White, light gray
- **Text:** Dark gray, black

### Typography
- **Headings:** Clean sans-serif (Inter, Poppins)
- **Body:** Readable serif or sans (Lora, Open Sans)

### Layout
- Clean, modern, card-based design
- Mobile-first responsive
- Large, touch-friendly buttons
- High-contrast for readability
- Minimal distractions, focus on content

---

## Project Structure

```
freeman-heights/
├── frontend/                  # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── Navigation.jsx
│   │   │   ├── home/
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── ServiceTimes.jsx
│   │   │   │   ├── UpcomingEvents.jsx
│   │   │   │   └── RecentSermons.jsx
│   │   │   ├── livestream/
│   │   │   │   ├── LivePlayer.jsx
│   │   │   │   └── SermonArchive.jsx
│   │   │   ├── ministries/
│   │   │   │   ├── MinistryCard.jsx
│   │   │   │   └── MinistryDetail.jsx
│   │   │   ├── calendar/
│   │   │   │   ├── EventCalendar.jsx
│   │   │   │   └── EventCard.jsx
│   │   │   ├── staff/
│   │   │   │   └── StaffCard.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── EventEditor.jsx
│   │   │       ├── SermonEditor.jsx
│   │   │       └── MinistryEditor.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LivestreamPage.jsx
│   │   │   ├── MinistriesPage.jsx
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── StaffPage.jsx
│   │   │   ├── GivePage.jsx
│   │   │   ├── ExplorePage.jsx
│   │   │   └── admin/
│   │   │       └── AdminDashboard.jsx
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── hooks.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   ├── logo.png
│   │   └── church-building.jpg
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── seed.sql
│   └── config.toml
└── README.md
```

---

## Development Timeline

### Week 1: Core Pages + Database
- **Day 1-2:** Project setup, database schema, Supabase config
- **Day 3-4:** Home page, navigation, footer
- **Day 5-7:** Livestream, Ministries, Calendar pages

### Week 2: Admin Panel + Polish
- **Day 8-9:** Admin authentication, content editor
- **Day 10-11:** Staff page, Give page, final pages
- **Day 12-13:** Mobile optimization, testing
- **Day 14:** Deploy to Vercel, client review, tweaks

---

## Pricing

### Option 1: Quick Launch ($3,000)
- ✅ All MVP features above
- ✅ Mobile-responsive design
- ✅ Admin panel for content updates
- ✅ Deployment + 1 month support
- ✅ Basic analytics

### Option 2: Enhanced ($5,000)
- ✅ Everything in Option 1, plus:
- ✅ Prayer request system
- ✅ Event RSVP functionality
- ✅ Email notifications (via Supabase Edge Functions)
- ✅ Sermon search + filtering
- ✅ 3 months support
- ✅ Training session for staff

### Option 3: Custom
- Want online giving integration? Live chat? Custom features?
- We can scope and quote separately

---

## Why This Works for You (Uncle D)

### Business Benefits
- ✅ **Quick revenue:** 1-2 weeks from start to payment
- ✅ **Low effort, high value:** Straightforward requirements, grateful client
- ✅ **Portfolio piece:** Clean, professional work to show potential clients
- ✅ **Recurring potential:** They'll need updates, new features later
- ✅ **Testimonial opportunity:** Churches have networks, word-of-mouth referrals

### Technical Benefits
- ✅ **Uses your stack:** React + Supabase (what you know best)
- ✅ **Reusable architecture:** Template for future church sites
- ✅ **Fast development:** Vite + Tailwind = ship quickly
- ✅ **Low maintenance:** Supabase handles backend complexity

---

## Next Steps

1. ✅ **Review this spec** - Any changes needed?
2. ⬜ **Contact client** - Get their approval on scope
3. ⬜ **Set up project** - Create repo, Supabase project, Vercel site
4. ⬜ **Build MVP** - Start with core pages
5. ⬜ **Iterate** - Weekly check-ins with client
6. ⬜ **Launch** - Deploy, test, handoff
7. ⬜ **Collect payment** - Invoice, celebrate first client!

---

**Want me to start scaffolding the React app now?** I can create the initial project structure, set up Vite + Tailwind + React Router, and build the first few components while you reach out to the client.
