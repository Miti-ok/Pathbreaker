# Pathbreaker

Pathbreaker is a turn-based robot path-planning strategy game:
- The **robot** tries to reach the goal.
- The **user** tries to drain the robot's battery before it reaches the goal by moving obstacles strategically.

This project is built as a full-stack system with a Python planning engine, FastAPI backend, and browser frontend.

## Architecture

Frontend -> Backend API -> Planning Engine

- `visualizer/`:
  - `index.html` + `app.js`: Map builder
  - `gameplay.html` + `gameplay.js`: Game turns, obstacle interaction, rendering
- `server/`:
  - `server.py`: FastAPI app, sessions, API endpoints, move validation
- `engine/`:
  - `Map_gen.py`: Grid map and cell types
  - `robot.py`: Robot state + path planning logic
  - `Obstacles.py`, `pathfinding.py`: supporting logic

## Core Gameplay Rules

1. Robot moves one step per turn.
2. Battery decreases by 1 each robot move.
3. User can move one obstacle after each robot move.
4. Obstacle moves must keep at least one valid path to goal.
5. Obstacle cannot be moved immediately back to where it came from.
6. User wins if robot cannot move (battery/path constraints).
7. Robot wins if it reaches the goal.

## API Endpoints

- `GET /ping`
- `POST /start-game`
- `POST /next-move`
- `POST /legal-obstacle-moves`
- `POST /move-obstacle`

The backend is session-based, so robot state persists across turns.

## Local Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run backend

```bash
python -m uvicorn server.server:app --reload
```

### 3. Run frontend

Open:
- `visualizer/index.html` for map generation
- `visualizer/gameplay.html` for gameplay flow (normally reached from map builder)

If using local backend, set in `visualizer/gameplay.js`:

```js
const API_BASE = "http://127.0.0.1:8000";
```

If using deployed backend, point `API_BASE` to your public URL.

## Deployment Notes

### Backend (Render/Railway)

- Build command:
  - `pip install -r requirements.txt`
- Start command:
  - `uvicorn server.server:app --host 0.0.0.0 --port $PORT`

### Frontend

Can be hosted as static files (e.g. GitHub Pages, Netlify).

## Requirements

See `requirements.txt`:
- FastAPI
- Uvicorn
- Pydantic
- Rich

## Current Goal

Pathbreaker is designed as a robotics-style learning project:
- Backend is authoritative for planning and rule validation.
- Frontend focuses on interaction and visualization.
- Engine remains the planning brain and can evolve to A*/Dijkstra in future versions.
