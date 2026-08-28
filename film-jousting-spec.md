# Film Jousting — Product & Technical Spec

## Product Vision

Film Jousting is a smart, opinionated movie recommendation engine that doubles as a decision tool. You set your filters, tell the app how strongly you feel about each one, and get a tight list of movies scored and ranked by your priorities. No accounts, no swiping, no algorithm training. Just a fast answer to "what should I watch."

The visual concept: a stage at the top (empty in v1, becomes the jousting arena in v2), with movies as an "audience" at the bottom filling in as results load. The whole page tells a story even before the bracket feature exists.

Designed to evolve from a single-user recommendation tool into a multiplayer tournament experience.

## Competitive Landscape

Existing apps in this space (Taste.io, Suggest Me Movie, Show Me A Movie, whatishouldwatch.com, Movier, etc.) are either building long-term taste profiles, throwing random movies at users, or are simply poorly executed / abandoned. None of them are fast decision tools. None integrate with watchlists (personal or public). None let you weight how strongly you feel about each filter. None do tournament brackets. Film Jousting's differentiators, in order of when they ship:

- v1: Weighted filter-based recommendation engine with custom scoring, per-genre diverse pulls, random deep-page discovery + Letterboxd watchlist integration (personal and public lists)
- v2: Single-player bracket tournament to narrow your list
- v3: Multiplayer collaborative filtering with prefer-not/hard-no vetoes and group bracket voting
- v4: UI/UX polish, animations, visual personality (stage/audience theming)

## Versioning Roadmap

### v1 (Current Build)
Single-user web app. One-page design: filters at the top, movie results at the bottom. User fills out a filter form with genre Yes/Maybe weighting. App makes separate TMDB discover calls per genre (to ensure genre diversity). Each genre pull includes page 1 plus a random deeper page for discovery. Results are deduplicated by TMDB ID, scored using vote_average as a base plus user preference weights, and returned as a full scored array to the frontend. Frontend shows the first batch and "dig deeper" reveals more from the same array without additional API calls. Optionally imports any public Letterboxd watchlist with TMDB enrichment and in-memory caching. After results load, the filter area collapses and transforms into a sort bar.

### v2 (Bracket Tournament)
Adds a single-player bracket/tournament system on top of the scored results. User taps their pick in each head-to-head matchup, winner advances. No losers bracket in single player — the full list remains accessible below the bracket for browsing. Seeding TBD from testing: classic (top vs bottom) or genre-grouped (same-genre early matchups). Optional losers bracket toggle available.

### v3 (Multiplayer)
Multiplayer rooms. Room codes, lobby with emoji avatars, collaborative filter flow (everyone submits independently with their own weights, common denominator is calculated). "Prefer not" becomes socially meaningful — "I'd rather not but I'll go along with the group" vs hard no "absolutely not." Hidden movie submissions, duplicate detection with crowd favorite callouts, group voting on bracket matchups, losers bracket (40%+ vote threshold), grand final. Real-time via Supabase Realtime or WebSockets. Max 10-12 players per room. Disconnection handling with reconnection via room code + cookie. Room auto-timeout at 2 hours inactivity.

### v4 (UI/UX Polish)
Stage/audience visual theming fully realized. Custom illustrated avatars with idle animations, animated tournament reveals (posters flying onto screen), winner celebration animations (confetti, spotlight), landing page design, overall visual personality pass.

---

## Tech Stack (v1)

- **Frontend:** React + TypeScript (Vite) + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript (tsx for dev runtime)
- **Movie Data:** TMDB API (free tier) — posters, genres, runtime, ratings, synopses, keywords, cast, crew, original language. Free for non-commercial use with attribution (TMDB logo + notice required). ~40 requests per 10 seconds rate limit. No daily quota — purely rate-limited. Commercial license ($149/month) required only if monetized
- **Letterboxd Import:** Server-side HTML scraping of public watchlist pages (using cheerio), CSV upload as fallback. Scraper parses `data-item-name` attributes from `div.react-component` elements within `li.posteritem` containers. Handles pagination by following `a.next` links until none exist
- **Caching:** In-memory cache (`Record<string, any>`) keyed by `${type}:${query}:${year}` for TMDB lookups — once a movie is looked up, it's cached for the server's lifetime. On a live site with one server, cache persists between deployments (days/weeks). Prevents redundant API calls across users and sessions. For production scale, would migrate to Redis
- **Project Structure:** Monorepo — `/client` (Vite + React + Tailwind) and `/server` (Express)
- **Auth:** None. No user accounts. Purely stateless in v1
- **Database:** None in v1. All data is fetched, scored, cached in memory, and returned per request
- **Hosting:** Vercel or Netlify (frontend, free tier) + Railway or Render (backend, free/$5 tier). Total: $0-5/month

## Estimated Costs (v1)

- $0-5/month. TMDB API is free for non-commercial use with no daily cap. A typical discover session uses ~2 API calls per selected genre (page 1 + random page). A Letterboxd import of 300 movies uses ~300 calls on first load, near-zero on subsequent loads due to caching
- If monetized (ads, subscriptions): TMDB commercial license is $149/month for companies under $1M ARR

---

## v1 User Flow

### Step 1: Filter Form (No Landing Page in v1)
No landing page in v1 — user goes straight to the filter form. Landing page comes in v3 when create/join room flow is needed. One-page design: everything lives on a single page.

The form has two sections: Basic Filters (always visible) and Advanced Filters (expandable). Each filter category is a button that expands into a panel/overlay when tapped, covering most of the screen for selection. When done, it collapses back to the button.

**Submit button stays disabled until genre is selected.** Minimum rating defaults to 6+ so there's always a rating floor.

**Basic Filters (always visible):**

1. **Genre** (REQUIRED, multi-select, Yes/Maybe/No weighted): Tap to select (Yes), different interaction (long press or double tap) to veto (No). Each selected genre gets its own TMDB discover call to ensure genre diversity. Movies matching multiple selected genres accumulate points. Genre and veto selection happen in the same panel — no separate veto section
2. **Minimum Rating**: Defaults to 6+ (via `vote_average.gte`). User can lower to 5+ or set no minimum. Options: No minimum, 5+, 6+, 7+, 8+. Always a hard filter
3. **Runtime**: Ranges — "Under 90 min", "90–120 min", "120–150 min", "150+ min", or "No preference" (via `with_runtime.gte` / `with_runtime.lte`). Hard filter sent to TMDB
4. **Release Year Range**: Dual-handle slider. Range from 1900 (or earliest available) to current year. Defaults to 1950–present. Hard filter sent to TMDB (years converted to full date format: 2010 → 2010-01-01, 1985 → 1985-12-31)
5. **Letterboxd URL Input**: Text field for pasting any public Letterboxd watchlist/list URL. Visible for feature discoverability. When present, submit hits the Letterboxd endpoint instead of discover. Both paths return scored movies through the same scoring engine

**Advanced Filters (expandable):**

1. **Language** (autocomplete, multi-select): Single autocomplete field sorted by most commonly spoken languages. User types to search. Mapped to TMDB `with_original_language`. Replaces the previous region/country filter — TMDB discover doesn't return origin_country in results, making country scoring impossible. Language is in the data and works as a hard filter
2. **Keywords** (autocomplete, multi-select): TMDB keyword search. Handles musicals, film movements, themes. Mapped to `with_keywords`. Hard filter
3. **People** (autocomplete, multi-select): Actors and all crew types. TMDB person search with department labels. Backend auto-routes by `known_for_department`. Hard filter
4. **Obscure / Hidden Gems Toggle**: When ON, sends `vote_count.lte=200`. Binary toggle

**Three autocomplete fields** (same UI component, different TMDB endpoints):
- Language → TMDB language list (sorted by most common film languages)
- Keywords → TMDB keyword search
- People → TMDB person search (auto-routes actors vs crew)

### Submit Logic

One submit button, two paths:
- If Letterboxd URL is entered → POST to `/letterboxdList` with `{ listUrl, filters }`
- If no URL → POST to `/discover` with filters only

Both endpoints return a full scored array. Frontend stores the entire array in React state.

### Step 2: Results Screen (Same Page)

When results load, the filter area collapses and transforms into a **sort bar**. The filter category buttons become sort options. User's selected filter values are shown as small tags/pills so they remember what they filtered by.

**Sort options (always available):**
- Match score (default — how well each movie fits preferences)
- Rating (high to low / low to high)
- Popularity (high to low / low to high)
- Runtime (short to long / long to short)
- Year (newest first / oldest first)
- Alphabetical (A-Z / Z-A)

**Movie cards display:** poster, title, year, rating, runtime, genres. Match score is NOT shown to user — it only affects the default sort order.

**Movie card interaction:** Tapping a card opens an expanded detail view (synopsis, full metadata). A "More Info" button links to a Google search for the movie.

**Navigation:**
- **"Dig Deeper" button:** Reveals the next batch from the already-scored array in frontend state. No API calls. When the frontend array is exhausted, silently fetches new pages from TMDB, scores them, and shows more results (feels like seamless loading to the user)
- **"Change Filters" button:** Returns to filter form with previous selections preserved. User adjusts and resubmits. New API call chain
- **"Start Over" button:** Clears all filters and results. Fresh start

**In v2:** A "Start Tournament" button appears on the results screen, feeding the scored list into the bracket

---

## Filter Weighting Summary

| Filter | Weighting | Sent to TMDB? | Behavior |
|--------|-----------|---------------|----------|
| Genre | Yes (5) / Maybe (3) | Yes, separate call per genre | Each genre gets its own discover call. Scoring engine ranks Yes-genres higher |
| Genre Vetoes | No (binary) | Yes, as `without_genres` | Hard exclude. In v3, "Prefer Not" option added |
| Minimum Rating | No (hard filter) | Yes, as `vote_average.gte` | Always enforced. Defaults to 6+ |
| Runtime | No (hard filter) | Yes, as `with_runtime.gte`/`.lte` | Always enforced if set |
| Release Year | No (hard filter) | Yes, as `primary_release_date.gte`/`.lte` | Always enforced if set |
| Language | No (hard filter) | Yes, as `with_original_language` | If set, always enforced |
| Keywords | No (hard filter) | Yes, as `with_keywords` | If selected, always required |
| People | No (hard filter) | Yes, as `with_cast`/`with_crew` | If selected, always required |
| Obscure Toggle | No (binary) | Yes, as `vote_count.lte=200` | If toggled, caps vote count at 200 |

Note: Country/region weighting was removed because TMDB's discover endpoint does not return `origin_country` in movie results, making country-based scoring impossible. Language replaced it as the geographic/cultural filter.

---

## TMDB Discover Strategy

### Why Per-Genre Calls Instead of OR Logic

TMDB's OR logic (`with_genres=35|99` for Comedy OR Documentary) sorts results by the `sort_by` parameter globally. When sorting by popularity, popular genres (Action, Comedy) completely drown out niche genres (Documentary, Foreign). Testing confirmed that zero documentaries appeared in a Comedy|Documentary search — all results were comedies.

Per-genre calls solve this by giving each genre its own pull. Each genre gets fair representation in the scoring pool regardless of how popular it is globally.

### Page Strategy

For each selected genre, the app makes two TMDB calls:
1. **Page 1** — the most popular/well-known movies matching that genre + all other hard filters
2. **A random deeper page** — a randomly selected page from the middle of the results (between page 2 and `total_pages`). This surfaces unexpected, lesser-known movies that the user wouldn't find on page 1

The random page is generated using the `total_pages` value from the first call's response. If `total_pages` is 3 or fewer, the random page is skipped (not enough depth to randomize).

Number of random pages is configurable in the function if more variety is needed.

### API Call Budget

- 2 calls per selected genre (page 1 + random page)
- 3 genres selected = 6 API calls
- 5 genres selected = 10 API calls
- All well within TMDB's 40 requests per 10 seconds rate limit

### Sort Order

TMDB calls always use `sort_by=popularity.desc`. This is hardcoded, not user-configurable. Sorting by rating was removed from the TMDB call because movies with 1 vote and a perfect 10 rating (like music videos and ultra-obscure entries) dominate results when sorting by vote_average. Popularity sorting naturally pushes these to later pages.

The user sorts results on the results screen after scoring is complete.

### Deduplication

Before scoring, the movie pool is deduplicated by TMDB `id` using a Set. Utility function in `/server/src/utils/` — reusable across discover and Letterboxd paths. The same movie can appear in multiple genre pulls (a comedy-romance appears in both the Comedy and Romance pulls). Only one copy is kept.

---

## Weighting & Scoring System

### User-Facing Labels

**For genre (the only weighted filter in v1):**
- **Yes** (default on tap) — "I want this"
- **Maybe** — "I'm open to this"
- **No** (different interaction — long press or double tap) — "Absolutely not." Binary elimination

All three states on the same UI element — no separate veto section.

**For genre vetoes (v3 addition):**
- **Prefer Not** — "I'd rather not, but I'll go along with the group if everyone else wants it"

### Backend Numeric Scale

| User Label   | Numeric Weight | Behavior |
|--------------|---------------|----------|
| Yes          | 5             | Separate TMDB discover call. Strong match boost in scoring |
| Maybe        | 3             | Separate TMDB discover call. Moderate match boost in scoring |
| No (veto)    | N/A (binary)  | Sent to TMDB as `without_genres`. Movie eliminated before scoring |
| Prefer Not   | -3 (v3 only)  | Not sent to TMDB. Scoring penalty that other players' votes can override |

Weight values (5, 3, -3) are starting values — to be tuned during testing with real TMDB data.

### Scoring Pipeline

1. **Per-genre TMDB calls:** Separate discover call for each selected genre (Yes and Maybe). Each call includes page 1 + random deeper page. All calls include shared hard filters (vetoed genres, rating, runtime, year, language, keywords, people, obscure toggle)
2. **Deduplication:** Remove duplicate movies by TMDB `id` using Set-based utility function
3. **Score each movie:** For every movie in the deduplicated pool:
   - Start with `movie.vote_average` as the base score (0-10 range)
   - For each of the movie's `genre_ids`: find the matching user genre selection. If Yes, add 5. If Maybe, add 3. A movie matching multiple selected genres accumulates points
   - Movies matching multiple Yes genres naturally score highest
4. **Sort:** All movies sorted by match score descending
5. **Return full array:** Entire scored array sent to frontend. Frontend stores in React state
6. **Display first batch:** Frontend shows top results (count TBD from testing)
7. **Dig deeper:** Frontend reveals next batch from stored array. When array is exhausted, new API call to backend for more pages — feels seamless to user

### How the Scoring Handles Edge Cases

**All genres set to Yes:** Every movie gets +5 per matching genre. Differentiation comes from `vote_average` (base score) and how many genres each movie matches

**Comedy-Romance AND vs OR:** No special handling needed. A movie tagged as both Comedy and Romance gets points for matching BOTH genres. Naturally scores higher than a pure Comedy or pure Romance

---

## Letterboxd Integration

### Scraping Details

- Scraper targets `li.posteritem` containers, extracts `data-item-name` attribute from nested `div.react-component` elements
- Title format: "Movie Title (Year)" — parsed by splitting on `(` to separate title and year
- Year is passed to TMDB search as a separate parameter for accurate matching
- Pagination: scraper follows `a.next` links until no next link exists (last page has a `<span>` instead of `<a>`)
- Base URL extracted from user-provided URL using `new URL(url).origin` — not hardcoded

### TMDB Enrichment

- Each scraped title is searched on TMDB via `searchTMDB('movie', title, year)` — top result taken
- In-memory cache keyed by `${type}:${query}:${year}` prevents redundant lookups
- Sequential processing in v1 (~5 seconds for 250 movies). Batch parallelization is a future optimization
- Cache hit logging available for debugging

### Watchlist-to-List Matching (v1 Feature)

User pastes their personal watchlist URL and a bigger curated list URL. Both lists are scraped and enriched through TMDB. The app finds movies that appear in BOTH lists (intersection by `tmdb_id`). Result: "these movies on your watchlist also appear on [curated list name]."

### Similar Movies Feature (v1 Feature)

User manually enters a few movies they like. For each entered movie, the app calls TMDB's `/movie/{id}/similar` endpoint to find related films. Results are merged, deduplicated, and scored. Good for users who don't have a Letterboxd watchlist.

---

## Build Order (v1)

### Phase 1: Project Skeleton ✅
- Monorepo with `/client` (Vite + React + TypeScript + Tailwind) and `/server` (Express + TypeScript + tsx)
- Both running locally (client on :5173, server on :3001)
- Basic test UI with JSON display
- Concurrently script for running both with one command

### Phase 2: TMDB Service ✅
- TMDB API key secured and stored in `.env` with `.env.example` template
- TMDB service module with generic `tmdbFetch` helper
- `searchTMDB` function with optional year parameter and in-memory caching
- Per-genre discover function with page 1 + configurable random deep page pulls
- Get genre list function
- Parameterized search route (`/search/:type`) with type validation
- Discover route (POST `/discover`) with filter validation
- All tested with throwaway UI

### Phase 3: Scoring Engine ✅
- Scoring engine (`movieFilter`): vote_average base + genre weight (5/3). Country scoring removed (TMDB discover doesn't return origin_country)
- Deduplication utility function using Set
- Wired into discover route: discover → deduplicate → score → return full array
- Wired into Letterboxd route: scrape → enrich → score → return full array
- Tested with throwaway UI

### Phase 4: Letterboxd Scraping ✅
- Cheerio-based scraper following paginated Letterboxd pages
- Title/year parsing from `data-item-name` attributes
- TMDB enrichment with year parameter for accurate matching
- In-memory cache for all TMDB lookups
- POST route receiving `{ listUrl, filters }`
- Tested with throwaway UI

### Phase 5: Additional Features
- Watchlist-to-list matching: scrape two lists, enrich both, intersect by `tmdb_id`
- Similar movies: accept manual movie entries, call TMDB `/movie/{id}/similar`, merge and score results
- Additional scrapers (Rotten Tomatoes, IMDb) — architecture supports plugging in new scrapers

### Phase 6: Real Frontend
- Tailwind CSS styling
- One-page layout: filter area top, results bottom
- Filter buttons that expand into overlay panels
  - Genre panel: tap for Yes, different interaction for veto, Maybe as third state
  - Three autocomplete components with debouncing (language, keywords, people)
  - Runtime selector
  - Release year dual-handle slider (1900–present, default 1950–present)
  - Minimum rating selector (default 6+, can lower to no minimum)
  - Obscure toggle
  - Letterboxd URL input
- Submit button (disabled until genre selected)
- Submit logic: Letterboxd path if URL present, discover path if not
- Full scored array stored in React state
- Results area:
  - Filter area collapses into sort bar with filter values as tags/pills
  - Movie cards: poster, title, year, rating, runtime, genres (no visible match score)
  - Card tap → expanded detail view with synopsis + "More Info" (Google search link)
  - Sort options: match score, rating, popularity, runtime, year, alphabetical
  - "Dig Deeper" button: next batch from stored array, seamless new fetch when exhausted
  - "Change Filters" button: returns to form with selections preserved
  - "Start Over" button: clears everything
- Mobile-first, responsive design

---

## v2: Bracket Tournament Details

### Overview
Single-player bracket tournament runs entirely on the frontend using the scored array already in React state. No backend changes needed.

### Bracket Flow
1. User clicks "Start Tournament" on results screen
2. Scored movies are seeded into a bracket
3. Two movie posters shown side by side per matchup
4. User taps their pick, winner advances
5. Tournament progresses through rounds to a final winner
6. Full scored list remains accessible below the bracket for browsing

### Seeding (TBD from Testing)
Two approaches to test:
- **Classic seeding:** Top seed vs bottom seed, 2nd vs 2nd-to-last, etc. Best movies don't face each other until finals
- **Genre grouping:** Sort by genre first, then by score within genre. Same-genre matchups happen in early rounds, ensuring genre diversity in later rounds

### Losers Bracket
- Optional toggle before tournament starts (default: off)
- In single player, every loss is 0% votes so the multiplayer 40% threshold doesn't apply
- If toggled on, all losers enter the losers bracket (effectively re-running the tournament with losers)
- Skipped in single player recommended — user can browse the full list instead

### Bracket Sizing
- Works with any number of movies
- Non-power-of-2 counts: top seeds get first-round byes
- Over 16 movies: warning that the tournament will be long, option to proceed or filter more

---

## Architecture Notes (v2/v3/v4 Readiness)

- **Scoring engine as its own module** — v2's bracket seeding uses match scores. v3's multiplayer feeds the same engine. Built once, used everywhere
- **TMDB logic in its own service module** — v2/v3 call the same service
- **Per-genre discover calls ensure diversity** — scales to v3 where players weight genres differently
- **In-memory cache reduces API calls over time** — migration path to Redis
- **Letterboxd scraping in its own service module** — v3 calls same scraper per player. Architecture supports adding new scrapers (Rotten Tomatoes, IMDb) as additional service modules
- **Movie data normalized to consistent shape** — scoring engine depends on this
- **Three autocomplete fields, one reusable component** — language, keywords, people all use same UI component
- **People field auto-routes by department** — `known_for_department !== 'Acting'` goes to `with_crew`. Supports all crew types
- **Weighting supports multiplayer** — v3 averages FilterCriteria across players
- **DRY search endpoint** — one parameterized route for movie/keyword/person search with cache
- **Dig deeper uses frontend state** — no server-side session management needed. Full array in React state
- **Bracket runs entirely on frontend** — no backend changes for v2
- **Deduplication as a utility function** — reusable across discover, Letterboxd, and list-matching paths
- **Monorepo structure** — v3's WebSocket/Supabase layer slots in alongside Express

---

## Data Types (TypeScript)

```typescript
// Preference weight for genre
type PreferenceWeight = 5 | 3; // yes=5, maybe=3

// A filter value with its user-assigned weight
interface WeightedFilter<T> {
  value: T;
  weight: PreferenceWeight;
}

// Core movie interface — used everywhere
interface Movie {
  id: number;                 // TMDB movie ID (used for deduplication)
  title: string;
  year: number;
  poster_url: string;
  genre_ids: number[];        // TMDB genre IDs (from discover/search response)
  genres?: Genre[];           // full genre objects (if available)
  runtime: number;            // minutes
  original_language: string;  // ISO 639-1 language code
  vote_average: number;       // TMDB rating (0-10)
  vote_count: number;         // number of TMDB votes
  popularity: number;         // TMDB popularity score
  overview: string;           // synopsis
}

// Movie with scoring data attached
interface ScoredMovie extends Movie {
  score: number;              // calculated by scoring engine
}

interface Genre {
  id: number;                 // TMDB genre ID
  name: string;
}

interface Keyword {
  id: number;                 // TMDB keyword ID
  name: string;
}

interface Person {
  id: number;                 // TMDB person ID
  name: string;
  profile_url?: string;       // headshot image
  known_for_department: string; // "Acting", "Directing", "Writing", etc.
}

interface FilterCriteria {
  // Required — Yes/Maybe weighted
  genres: WeightedFilter<number>[];   // TMDB genre IDs with Yes(5) or Maybe(3) weight

  // Required — hard filter, no weight
  vetoedGenres: number[];     // TMDB genre IDs to exclude
  minRating: number;          // minimum TMDB rating (default: 6)

  // Optional — hard filters (if selected, always enforced)
  keywords?: number[];        // TMDB keyword IDs
  people?: {
    id: number;
    department: string;
  }[];
  originalLanguage?: string[];  // ISO 639-1 codes (array)
  obscure?: boolean;          // when true, vote_count.lte = 200
  runtimeRange?: { min?: number; max?: number };
  releaseYearRange?: { from?: number; to?: number };

  // Controls
  filterForMe?: boolean;
}

// v2 additions
interface BracketMatchup {
  id: string;
  round: number;
  movie_a: ScoredMovie;
  movie_b: ScoredMovie;
  winner?: ScoredMovie;
}

interface BracketState {
  movies: ScoredMovie[];      // seeded movie list
  matchups: BracketMatchup[];
  currentMatchup: number;     // index of current matchup
  losers_bracket_enabled: boolean;
  champion?: ScoredMovie;
}

// v3 additions
interface Room {
  room_id: string;
  host_session_id: string;
  status: 'lobby' | 'filtering' | 'submitting' | 'reveal' | 'tournament' | 'losers_bracket' | 'grand_final' | 'complete';
  created_at: Date;
  last_activity_at: Date;
  resolved_filters: FilterCriteria;
}

interface Player {
  session_id: string;
  room_id: string;
  display_name: string;
  avatar: string;
  is_host: boolean;
  is_connected: boolean;
  filters: FilterCriteria;
}
```

---

## Multiplayer Details (v3 Reference)

Preserved here so nothing is lost when v3 development begins:

- **Landing page:** Film Jousting logo, tagline, "Create Room" button and "Join Room" code input. Avatars pop in as people join
- **Lobby:** Host creates room, gets code. Friends join with code. Emoji avatars assigned randomly, optional swap from preset list of ~12-16. Host locks room with "Everyone's In" button
- **Collaborative filters:** Everyone fills out filters independently on their own device, including Yes/Maybe/No/Prefer Not. Submissions hidden. Resolution logic:
  - Positive filter weights: Averaged across all players
  - Hard No: ANY player's No eliminates the genre for everyone
  - Prefer Not: Averaged with other players' positive weights. Prefer Not = "I'll go along with the group"
  - Runtime: Intersection of ranges. If no overlap, union of all selected
  - Language: Union — if anyone selects a language, it's included
  - Rating: Most restrictive wins (highest floor selected by any player)
  - If zero overlap on any filter, both/all values are used — let the bracket settle the disagreement
  - Soft warning popup if one player vetoes 5+ genres
- **Filter results screen:** Shared view showing resolved group filters as "Arena Rules"
- **Movie submission:** Hidden from other players. Letterboxd import (any public list), manual entry, or both
- **Duplicate detection:** Deduplicate by TMDB ID. Crowd favorites called out: "3 of you want Parasite!"
- **Seeding:** Movies submitted by multiple players get top seeds
- **Bracket:** Same as v2 but with group voting. Ties send both to losers bracket
- **Losers bracket:** 40%+ vote threshold to qualify. Plays out after main bracket
- **Grand final:** Winners bracket champion vs losers bracket champion
- **Disconnection:** Reconnection via room code + cookie
- **Room management:** Max 10-12 players. Auto-timeout at 2 hours inactivity

---

## Stretch Goals (All Versions)

- **Streaming service filter (Pro feature):** Uses TMDB watch provider data. Potential monetization path
- **Franchise deduplication:** TMDB `belongs_to_collection` or title prefix matching. Parked — revisit if testing shows it's a problem
- **Additional scrapers:** Rotten Tomatoes (clean HTML, doable). IMDb (`ipc-title__text` selector looks stable but parent classes are auto-generated). Architecture supports plugging in new scrapers
- **Custom illustrated avatars** with idle animations — v4
- **Animated tournament reveal** — posters flying onto screen — v4
- **Winner celebration animation** — confetti, spotlight — v4
- **Mini-games:** Timed pitches before vote rounds — v3+
- **Additional list sources:** Trakt, manual sharing
- **Accounts & history:** Saved tournament results, favorite groups
- **"Surprise me" mode:** Pull exclusively from deep random pages
- **Redis cache:** Migration from in-memory for production scalability
- **Batch parallelization for Letterboxd:** Promise.all in groups of 30-40 for faster enrichment

---

## Key Design Principles

1. **Smart recommendation engine AND fast decision tool.** Opinionated, finite results
2. **Your priorities, your ranking.** Yes/Maybe weighting means personal results
3. **Genre diversity by design.** Per-genre TMDB calls ensure niche genres aren't drowned out
4. **Discovery built in.** Random deep-page pulls surface unexpected movies. "Dig deeper" extends without extra API calls
5. **Enthusiast-friendly but accessible.** Deep filters for cinephiles, simple defaults for everyone else. Advanced filters are gated, not gone
6. **One page, two states.** Filters collapse into sort bar when results load. Change or start over to go back
7. **Stage and audience.** Visual concept: empty stage top (becomes bracket in v2), movie audience bottom (results). The page tells a story
8. **Vetoes are sacred.** No always eliminates. Prefer Not (v3) is a meaningful compromise
9. **Mobile-first.** Touch targets big, text readable, posters prominent
10. **Zero friction.** No accounts, no downloads, no sign-ups
11. **Letterboxd is the primary import path.** Any public list. Manual entry and other scrapers are fallbacks
12. **Modular architecture.** Build once, use v1 through v4
13. **API efficiency.** Caching, dig-deeper from frontend state, per-genre calls within rate limits

---

## Future Scalability Notes

- **In-memory cache** persists for server lifetime (days/weeks on live site) but doesn't survive restarts. Production path: Redis
- **TMDB rate limits** (40/10s) are per API key. Multiple simultaneous Letterboxd imports could bottleneck. Solutions: request queuing, cache warming
- **Letterboxd scraping** is fragile — HTML changes or Netflix acquisition could break it. Mitigation: CSV upload fallback. Architecture supports adding alternative scrapers
- **These are known limitations, not blockers.** Architecture supports upgrading each piece independently
