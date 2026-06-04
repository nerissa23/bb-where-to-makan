# BB: Where to Makan?

> A group-first restaurant recommendation app — tell it who's eating, what everyone can and can't have, and what you're craving, and it finds somewhere that works for the whole group with AI-powered reasoning.

## Project Overview

Deciding where to eat as a group is painful. One person is halal-only, another is vegetarian, someone has a RM20 budget, and the group can't agree on cuisine. WhatsApp polls solve the coordination but not the discovery. BB solves both.

The app takes a group's dietary restrictions, budget, and cravings, searches nearby restaurants via the Google Places API, runs them through a multi-stage pipeline (heuristic filters → AI dietary enrichment → AI ranking), and returns top recommendations with human-readable reasoning.

**Tech stack:**

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TailwindCSS + shadcn/ui |
| Backend | Python 3.14 + FastAPI |
| AI | Google Gemini (via `google-genai`) or local Ollama models |
| Data | Google Places API + JAKIM halal dataset (KL & Selangor) |
| Cache | Redis 7 (optional — degrades gracefully) |
| Containerisation | Docker + Docker Compose |
| Package management | `uv` 0.8.x (backend), npm (frontend) |
| Code formatting | ruff 0.15.x |

**Architecture overview:**

```
┌──────────┐     HTTP/JSON     ┌──────────┐     Google Places API
│ Frontend │ ◄──────────────► │ Backend  │ ─────────────────────►
│  :3000   │                   │  :8000   │
└──────────┘                   │          │ ───► JAKIM DB (fuzzy match)
                                │          │
                                │  ┌───────┴───────┐
                                │  │    Redis       │
                                │  │  (optional)    │
                                │  └───────────────┘
                                │          │
                                │  ┌───────┴───────┐
                                │  │  LLM (Gemini / │
                                │  │   Ollama)      │
                                │  └───────────────┘
                                └──────────┘
```

**Pipeline per recommendation request:**

```
Google Places Nearby API
        │
        ▼
  _normalise(): heuristic halal/vegetarian status (keyword + JAKIM match)
        │
        ▼
  enhance_dietary_status(): AI fills UNKNOWN statuses (1 batched LLM call)
        │
        ▼
  Redis cache (stores AI-enriched data, TTL: 30 min default)
        │
        ▼
  _filter(): removes budget misfits & UNLIKELY/UNFRIENDLY restaurants
        │
        ▼
  rank_with_ai(): batch LLM call scores & ranks, produces reasoning
        │
        ▼
  Frontend renders ranked recommendations with fit score + reasoning
```

## Setup Instructions

### Prerequisites

**For Docker (recommended):**

- [Docker](https://docs.docker.com/get-started/get-docker/) with engine running
- Docker Compose (included with Docker Desktop)
- [Ollama](https://ollama.com/download) installed and running (for local LLMs, optional)
- (Optional) A Google AI Studio key from https://aistudio.google.com/ (for Gemini models)

**For manual (non-Docker) setup:**

- Python 3.14
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) package manager
- Node.js 20+
- [Ollama](https://ollama.com/download) installed and running (optional)
- (Optional) A Google AI Studio key

### Environment Variables

Create a `.env` file in the project root by copying the template:

```bash
cp .env.example .env
```

Then fill in the values:

```python
# ------------ backend -------------------
PLACES_API_KEY=your_key_here            # required: Google Places API key
GOOGLE_API_KEY=your_key_here            # optional: for Gemini models

# use host.docker.internal when running with docker-compose
# use localhost when running manually without docker
OLLAMA_HOST=http://host.docker.internal:11434

# gemini or ollama models
MODEL=gemini-2.5-flash                  # or e.g. deepseek-r1:1.5b for Ollama

CORS_ORIGINS=http://localhost:3000      # optional: comma-separated CORS origins

DATABASE_URL=your-db-url

# ------------ frontend ------------------
NEXT_PUBLIC_API_URL=http://localhost:8000  # URL browser uses to reach backend

# ------------ redis --------------------
# REDIS_URL=redis://localhost:6379       # for local dev
REDIS_URL=redis://redis:6379            # for docker
CACHE_TTL_SECONDS=1800                  # optional: cache TTL in seconds (default 1800)
```

> **Note on `OLLAMA_HOST`:** Must be `http://host.docker.internal:11434` when running with Docker Compose (containers can't reach the host via `localhost`). Use `http://localhost:11434` when running manually.

### Running with Docker Compose

1. Make sure Ollama is running on your machine and the model is pulled:

    ```bash
    ollama pull deepseek-r1:1.5b
    ollama serve
    ```

2. From the project root, build and start all services:

    ```bash
    docker compose up --build
    ```

3. Visit `http://localhost:3000` in your browser.

4. To stop:

    ```bash
    docker compose down
    ```

### Running with Individual Docker Containers

**Backend:**

```bash
cd backend
docker build -t bb-backend .
docker run --name bb-backend --rm -p 8000:8000 bb-backend
```

**Frontend:**

```bash
cd frontend
docker build -t bb-frontend .
docker run --name bb-frontend --rm -p 3000:3000 bb-frontend
```

The backend and frontend will not be on a shared Docker network this way, so the frontend's `NEXT_PUBLIC_API_URL` must point to `http://localhost:8000`.

### Running without Docker (Manual)

1. **Backend:**

    ```bash
    cd backend
    uv venv
    uv sync
    uv run uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
    ```

2. **Frontend** (in a separate terminal):

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3. Verify Ollama is running (if using local models):

    ```bash
    curl http://localhost:11434
    # Expected: Ollama is running
    ```

4. Visit `http://localhost:3000` in your browser.

## Usage

### Creating a group and getting recommendations

The app walks you through a 4-step wizard:

| Step | What you do |
|---|---|
| **1. Group** | Enter a group name (e.g., "Friday Lunch") |
| **2. Members** | Add each person's name, dietary restrictions, and budget |
| **3. Cravings** | Type what you're craving (e.g., "something spicy"), select cuisine mood(s), and enter a location |
| **4. Results** | View AI-ranked recommendations with reasoning, fit scores, and member-specific dietary badges |

### What each member can specify

| Restriction | Example |
|---|---|
| Halal | "Halal" |
| Vegetarian | "Vegetarian" |
| Vegan | "Vegan" |
| No Pork | "No Pork" |
| No Seafood | "No Seafood" |

Group constraints are derived automatically:
- **Halal required** if *any* member has "Halal"
- **Vegetarian required** if *any* member has "Vegetarian" or "Vegan"
- **Budget ceiling** is the *minimum* budget across all members

### Understanding the results

Each recommendation card shows:

- **Fit Score** (1–10) — composite suitability from the AI
- **Reasoning** — explains why this restaurant fits (dietary + cravings reasoning)
- **Diet badge** — `compatible` / `incompatible` / `uncertain`
- **Craving badge** — `yes` / `no`
- **Per-member badges** — shows whether the restaurant satisfies each member's restrictions
- **Vote button** — group members can vote to decide together
- **Filter controls** — adjust max budget and distance

Results with distance > 3 km are shown as "Nearby Alternatives" below the main list.

## API / Function Reference

### API Endpoints

#### `POST /groups`

Create a new group.

**Request body:**

```json
{
  "group_name": "Friday Lunch",
  "members": [
    {
      "name": "Mia",
      "dietary": ["halal"],
      "budget_rm": 30
    },
    {
      "name": "Sara",
      "dietary": ["vegetarian"],
      "budget_rm": 25
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `group_name` | `string` | Yes | Name for the group |
| `members` | `array` | Yes | List of group members |
| `members[].name` | `string` | Yes | Member's name |
| `members[].dietary` | `array` | No | Dietary restrictions (`halal`, `vegetarian`, `vegan`, `no_pork`, `no_seafood`) |
| `members[].budget_rm` | `number` | Yes | Member's max budget in RM |

**Response:**

```json
{
  "group_id": "uuid-string"
}
```

#### `GET /groups/{group_id}`

Retrieve group details.

**Response:**

```json
{
  "group_name": "Friday Lunch",
  "members": [...]
}
```

#### `POST /groups/{group_id}/recommend`

Get restaurant recommendations for a group.

**Request body:**

```json
{
  "craving": "something warm, not too heavy",
  "cuisine_mood": ["Malaysian"],
  "meal_time": "lunch",
  "location": "Bangsar, KL",
  "radius_metres": 3000
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `craving` | `string` | Yes | Plain-language craving description |
| `cuisine_mood` | `array` | No | Cuisine preferences (e.g., `Malaysian`, `Chinese`, `Japanese`) |
| `meal_time` | `string` | Yes | `breakfast`, `lunch`, `dinner` |
| `location` | `string` | Yes | Address or area name for geocoding |
| `radius_metres` | `number` | No | Search radius in metres (default: 3000) |

**Response:**

```json
{
  "group_id": "uuid-string",
  "recommendations": [
    {
      "restaurant": {
        "place_id": "...",
        "name": "Mr Naan & Mrs Idly",
        "address": "...",
        "cuisine_types": ["meal_takeaway"],
        "price_level": 2,
        "price_range_rm": "RM 15–35",
        "rating": 4.2,
        "halal_status": "likely",
        "vegetarian_status": "friendly",
        "distance_km": 0.2,
        ...
      },
      "suitability_score": 0.9,
      "dietary_fit": "compatible",
      "dietary_reasoning": "Likely Halal and vegetarian friendly.",
      "cravings_match": "yes",
      "cravings_reasoning": "Indian cuisine fits the Malaysian cuisine mood."
    }
  ]
}
```

#### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

### Key Backend Functions

| Function | File | Description |
|---|---|---|
| `get_halal_status()` | `services/get_halal_status.py` | Heuristic halal classification (JAKIM DB + keyword matching) |
| `get_vegetarian_status()` | `services/get_vegetarian_status.py` | Heuristic vegetarian classification (keyword matching) |
| `enhance_dietary_status()` | `services/ai_dietary.py` | AI-enhanced classification for UNKNOWN restaurants via batched LLM call |
| `rank_with_ai()` | `services/ai_recommendations.py` | AI ranking & reasoning for filtered candidates via batched LLM call |
| `prompt_model()` | `services/prompt_model.py` | Unified interface for Gemini and Ollama LLM calls |
| `_normalise()` | `services/get_google_places.py` | Converts raw Google Places API response to Restaurant model |
| `_filter()` | `services/get_google_places.py` | Applies budget, halal, and vegetarian filters |

### Key Frontend Functions

| Function | File | Description |
|---|---|---|
| `createGroup()` | `lib/api.ts` | POST request to create a group |
| `getRecommendations()` | `lib/api.ts` | POST request to get recommendations |
| `handleCravingNext()` | `app/page.tsx` | Orchestrates the full recommendation flow |

### Frontend/Backend Communication over Docker

The frontend and backend run as separate containers. The frontend is served to the browser at `http://localhost:3000`, and the backend is at `http://localhost:8000`. API requests from the browser go directly to the backend via the host's port mapping — not through the Docker internal network — because browser JavaScript runs on the host machine, not inside the container.

This is why `NEXT_PUBLIC_API_URL=http://localhost:8000` is used rather than `http://backend:8000`. The internal Docker hostname (`backend`) would only be relevant for server-side requests from within the frontend container.

## Data / Assumptions

### Data Sources

| Source | What it provides |
|---|---|
| **Google Places API** | Nearby restaurants, names, types, ratings, price levels, coordinates |
| **JAKIM CSV datasets** | Confirmed halal premises in KL and Selangor (company name + brand) |
| **LLM (Gemini/Ollama)** | Dietary inference for unknown restaurants, cuisine mood matching, ranking |

### Assumptions

| Assumption | Detail |
|---|---|
| **Halal in Malaysia** | Major chains (McDonald's, KFC, Texas Chicken, Pizza Hut, Sushi King) are assumed JAKIM-certified. Malay/Mamak/Indian Muslim restaurants are assumed halal |
| **Google Places types** | The Nearby API returns generic types (`restaurant`, `cafe`, `meal_takeaway`), not fine-grained cuisine labels. Actual cuisine is inferred from the restaurant name by the LLM |
| **Malaysian cuisine classification** | Malaysian Chinese, Malaysian Indian (Mamak), Nasi Kandar, Nyonya/Baba, and local fusion count as "Malaysian" cuisine. Only clearly foreign food (authentic mainland Chinese, Japanese, Korean BBQ, Italian fine dining) is classified as non-Malaysian |
| **LLM availability** | When no LLM is configured or the LLM call fails, the system falls back to heuristic-only results with neutral scores |
| **Cache** | Redis is optional. If unavailable, every request fetches fresh data from the Google Places API |
| **JAKIM coverage** | Only KL and Selangor datasets are included. Restaurants outside these areas cannot be `CONFIRMED` via JAKIM |
| **Stateless groups** | Groups are stored in-memory (dict). Restarting the backend clears all groups |

### Data Flow

1. User fills in group details (name, members with dietary restrictions + budgets) via the frontend wizard.
2. Frontend sends `POST /groups` to create the group.
3. User enters cravings and location on step 3.
4. Frontend sends `POST /groups/{id}/recommend` with craving, cuisine mood, location, and radius.
5. Backend geocodes the location via Google Maps Geocoding API.
6. Backend fetches nearby restaurants from Google Places Nearby API (types: `restaurant`, `cafe`, `meal_takeaway`).
7. Raw results are normalised into `Restaurant` objects with heuristic halal/vegetarian status.
8. AI dietary enhancer fills in UNKNOWN statuses via a single batched LLM call.
9. Enriched results are cached in Redis with configurable TTL.
10. Heuristic filter removes budget misfits and clearly incompatible restaurants.
11. AI ranker scores and ranks remaining candidates with reasoning via a second batched LLM call.
12. Frontend renders ranked cards with fit scores, reasoning, and per-member dietary badges.

## Testing

### Backend test cases (curl)

```bash
# Health check
curl http://localhost:8000/health

# Create a group
curl -X POST http://localhost:8000/groups \
  -H "Content-Type: application/json" \
  -d '{"group_name":"Test","members":[{"name":"Mia","dietary":["halal"],"budget_rm":30},{"name":"Sara","dietary":["vegetarian"],"budget_rm":25}]}'

# Get recommendations (replace GROUP_ID with the UUID from above)
curl -X POST http://localhost:8000/groups/GROUP_ID/recommend \
  -H "Content-Type: application/json" \
  -d '{"craving":"something warm","cuisine_mood":["Malaysian"],"meal_time":"lunch","location":"Bangsar, KL","radius_metres":3000}'
```

### Verifying Docker communication

1. Run `docker compose ps` — `bb-backend`, `bb-frontend`, and `bb-redis` should all show status `Up`.

2. Test the backend directly from your machine:

    ```bash
    curl http://localhost:8000/health
    ```

3. Open `http://localhost:3000` — the frontend should load and allow you to create a group and get recommendations.

4. Inspect container logs for errors:

    ```bash
    docker compose logs backend
    docker compose logs frontend
    ```

### Frontend test cases

| Test | Steps | Expected |
|---|---|---|
| Create a group | Enter group name → Next | Advances to members step |
| Add members | Fill in name, diet, budget → Add Member → Next | Advances to cravings step |
| Get recommendations | Enter cravings, location → Find restaurants | Loading state appears, then ranked cards display |
| Filter results | Adjust budget/distance sliders | Results re-filter |
| Vote for a restaurant | Click Vote button on a card | Vote count increments |
| Per-member badges | Hover over member badges | Shows dietary restriction info |

## Limitations

- **No persistent group storage:** Groups are stored in an in-memory dict. Restarting the backend clears all groups.
- **LLM-dependent ranking:** When the LLM is unreachable or misconfigured, recommendations fall back to heuristic-only results without reasoning or meaningful scoring.
- **No menu-level analysis:** Dietary inference is based on restaurant name and Google types only. Actual menu items are not fetched or analysed.
- **JAKIM coverage limited to KL/Selangor:** Halal confirmation only works for premises in the included CSV datasets. Restaurants outside these areas are classified as `LIKELY` or `UNKNOWN`.
- **Google Places Nearby API limits:** The API has rate limits and pricing. Searches with large radii may return partial results. Pagination is not implemented — only the first page of results per type is fetched.
- **Cuisine inference is heuristic + LLM-based:** The LLM infers cuisine from the restaurant name, which is generally accurate but can be wrong for generic or unfamiliar names.
- **No meal_time-aware filtering:** The `meal_time` field is sent to the LLM for context but is not used to filter restaurants (e.g., breakfast spots vs. dinner spots).
- **Single geocoded location:** All searches are centred on one geocoded point. There is no support for multiple meeting points or midpoint calculation.
- **No user authentication:** Anyone can create groups and view results. There are no user accounts or access controls.
