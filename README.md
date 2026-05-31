# BB: Where to Makan?

> A tasty solution for Big Backs

BB is a group-first restaurant recommendation app. Tell it who's eating, what everyone can and can't have, and what you're craving — it finds somewhere that works for the whole group and tells you why.

## The problem
Deciding where to eat as a group is painful. One person is halal-only, another is vegetarian, someone has a RM20 budget. WhatsApp polls solve the coordination but not the discovery. BB solves the discovery.

## How it works
1. Create a group and add your members
2. Each member sets their dietary restrictions and budget
3. Type what you're craving in plain language ("something warm, not too heavy")
4. Drop a location pin
5. BB fetches nearby restaurants, filters by your group's constraints, and asks an LLM to recommend top places to eat

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Python 3.14 + FastAPI |
| AI | Gemini/Ollama models |
| Data | Google Places API + JAKIM halal dataset |
| Cache | Redis |
| Database | SQLite (via SQLAlchemy) |
| Containerisation | Docker + Docker Compose |
| Dependency management | uv 0.8.* |
| Code formatting | ruff 0.15.* |

## Project structure
```
bb-where-to-makan/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI entry point
│   │   ├── routers/
│   │   │   ├── groups.py             # POST /groups, GET /groups/{id}
│   │   │   └── recommendations.py   # POST /groups/{id}/recommend
│   │   ├── services/
│   │   │   ├── places.py             # Google Places API + Redis caching
│   │   │   ├── ai.py                 # Prompt builder + LLM call
│   │   │   └── validator.py          # Pydantic schemas + retry logic
│   │   ├── models/
│   │   │   ├── group.py              # Group, Member, Preferences
│   │   │   └── recommendation.py    # RecommendationResult schema
│   │   └── db/
│   │       └── database.py           # SQLAlchemy + SQLite setup
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GroupSetup.jsx        # Step 1 — group name
│   │   │   ├── PreferenceForm.jsx    # Step 2 — members + restrictions
│   │   │   ├── CravingInput.jsx      # Step 3 — craving + location
│   │   │   └── ResultsCard.jsx       # Recommendation display
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example                      # Committed — placeholder keys only
├── .env                              # NOT committed — see .gitignore
└── README.md
```
