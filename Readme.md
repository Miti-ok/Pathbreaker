Developer note-
I created this project as a way to learn python while building something, before this I created a simple bfs path planner using code i learnt daily from the book "Let us python", however this project has largely AI-written code due to the harsh truth that manually writing syntax will be dead in a few year's time if not sooner, so I better work with it rather than go against it.Errors have been debugged manually (which well took some time) and game logic and pseudocode has largely been my part, will be working on a v2 sooner which will incorporate a much better robot path planning system and a realistc battery drowning which will depend on type of move robot uses.
Below is an AI-generated summary for the game, enjoy.


Adversarial Robot Path Planning Game

This is a turn-based terminal game where a robot tries to reach a goal on a 2D grid while a human player dynamically moves obstacles to slow it down.
The twist is that the robot replans its path every turn and has a limited battery, so the user has to be smart instead of just blocking everything.

The project started as a learning exercise for path planning and slowly turned into a proper game with fairness rules and interaction design.

How the Game Works

The map is a 2D grid with a start (S) and end (E).

A robot (R) starts at S and tries to reach E.

The robot moves one step per turn using shortest-path planning (BFS).

Each robot move consumes 1 battery unit.

The robot’s initial battery is set to 1.5× the shortest path length on an empty map.

The user’s goal is to drain the robot’s battery before it reaches the end.

User Actions
Initial Setup

The user places a limited number of obstacles (X) on empty cells.

After each placement, the game checks that at least one path from start to end still exists.

Obstacle count is capped based on map size (≈12% of total cells) to keep the game fair.

During the Game

The user controls a cursor (C) using w / a / s / d.

When the cursor is on an obstacle:

Press p to select it

Use w / a / s / d to preview moving it to a neighboring cell

Press p again to confirm

Press q to cancel

Only one obstacle move per user turn is allowed.

Fairness Rules (Important)

To avoid trivial or exploitable gameplay, a few constraints are enforced:

❌ Obstacles cannot block all paths from the robot to the goal

❌ An obstacle cannot be immediately moved back to its previous position

❌ Obstacles cannot be placed on the start, end, or robot

❌ Obstacle count is limited relative to map size

These rules force the user to strategically reshape the environment instead of stalling the robot indefinitely.

Controls Summary
w / a / s / d  → move cursor or obstacle
p              → place / select / confirm
q              → cancel obstacle move


Legend:

S = Start
E = End
R = Robot
X = Obstacle
C = Cursor
O = Empty cell

Project Structure
.
├── main.py            # Game loop and orchestration
├── Map_gen.py         # Grid map, rendering, and utilities
├── pathfinding.py     # BFS path existence check
├── Obstacles.py       # Obstacle placement and movement rules
├── user_side.py       # User interaction and input handling
├── robot.py           # Robot logic and path planning


Each module has a single responsibility, which makes the code easier to reason about and extend.

Why BFS?

For version 1, the robot uses Breadth-First Search:

It guarantees the shortest path on an unweighted grid

It’s easy to debug and explain

It reacts cleanly to dynamic obstacle changes

More advanced planners (weighted costs, diagonals, heuristics) are intentionally left for future versions.

How to Run

Requirements:

Python 3.10+

rich library

Install dependencies:

pip install rich


Run the game:

python main.py

Future Ideas (Not Implemented Yet)

Weighted movement costs (turning, rerouting penalties)

Diagonal movement

Difficulty presets

Visual battery bar

Logging and analysis of robot paths

These were intentionally left out to keep v1 focused and stable.

Why This Project Exists

This project was built to better understand:

path planning under constraints

dynamic replanning

fairness in adversarial systems

how small rule changes affect behavior

It’s part game, part simulation, and part learning experiment.