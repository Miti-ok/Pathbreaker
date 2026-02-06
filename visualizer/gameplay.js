let savedMap = null;
let gridEl = null;
let nextMoveBtn = null;
let turnInfoEl = null;
let batteryTextEl = null;
let batteryFillEl = null;
let sessionId = null;
let robotPos = null;
let gameOver = false;
let phase = "robot_turn"; // robot_turn | player_obstacle_turn
let selectedObstacle = null;
let legalMoves = [];
let lastObstacleMove = null; // { from: [r,c], to: [r,c] }

const API_BASE = "https://pathbreaker-production.up.railway.app";

document.addEventListener("DOMContentLoaded", async () => {

    gridEl = document.getElementById("grid");
    nextMoveBtn = document.getElementById("nextMove");
    turnInfoEl = document.getElementById("turnInfo");
    batteryTextEl = document.getElementById("batteryText");
    batteryFillEl = document.getElementById("batteryFill");

    savedMap = JSON.parse(localStorage.getItem("gridMap"));

    if (!savedMap) {
        alert("No map found!");
        return;
    }

    drawGrid(savedMap, robotPos);
    updateBattery(null, null);

    nextMoveBtn.addEventListener("click", nextMove);
    gridEl.addEventListener("click", onGridClick);
});


/* ==============================
        DRAW GRID
============================== */

function drawGrid(map, robotPosition = null) {
    gridEl.innerHTML = "";

    for (let r = 0; r < map.height; r++) {
        for (let c = 0; c < map.width; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = String(r);
            cell.dataset.col = String(c);

            const isRobot = robotPosition && robotPosition[0] === r && robotPosition[1] === c;
            const isStart = r === map.start[0] && c === map.start[1];
            const isEnd = r === map.end[0] && c === map.end[1];
            const isObstacle = map.obstacles.some(o => o[0] === r && o[1] === c);

            // Robot visual gets priority if it shares a cell with start/end.
            if (isRobot) {
                cell.classList.add("robot");
            } else {
                if (isStart) cell.classList.add("start");
                if (isEnd) cell.classList.add("end");
                if (isObstacle) cell.classList.add("obstacle");
            }

            if (selectedObstacle && selectedObstacle[0] === r && selectedObstacle[1] === c) {
                cell.classList.add("selected-obstacle");
            }

            if (legalMoves.some(move => move[0] === r && move[1] === c)) {
                cell.classList.add("legal-move");
            }

            gridEl.appendChild(cell);
        }
    }
}


/* ==============================
        SERVER CALLS
============================== */

async function postJson(path, payload) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
    }

    return await res.json();
}


function toLastMovePayload() {
    if (!lastObstacleMove) return null;
    return {
        from_pos: lastObstacleMove.from,
        to_pos: lastObstacleMove.to,
    };
}


async function getRobotMove(map) {
    const endpoint = sessionId ? "/next-move" : "/start-game";
    const payload = sessionId
        ? { session_id: sessionId, updated_map: map }
        : map;

    return postJson(endpoint, payload);
}


async function getLegalObstacleMoves(obstaclePos) {
    if (!sessionId) return [];

    const result = await postJson("/legal-obstacle-moves", {
        session_id: sessionId,
        updated_map: savedMap,
        obstacle: obstaclePos,
        last_move: toLastMovePayload(),
    });

    return result.legal_moves || [];
}


async function applyObstacleMove(fromPos, toPos) {
    const result = await postJson("/move-obstacle", {
        session_id: sessionId,
        updated_map: savedMap,
        from_pos: fromPos,
        to_pos: toPos,
        last_move: toLastMovePayload(),
    });

    return result.updated_map;
}


/* ==============================
        OBSTACLE TURN
============================== */

async function onGridClick(e) {
    if (phase !== "player_obstacle_turn" || gameOver) return;

    const target = e.target.closest(".cell");
    if (!target) return;

    const r = Number(target.dataset.row);
    const c = Number(target.dataset.col);

    const clickedIsLegal = legalMoves.some(move => move[0] === r && move[1] === c);

    try {
        if (selectedObstacle && clickedIsLegal) {
            await moveSelectedObstacleTo([r, c]);
            return;
        }

        const clickedIsObstacle = savedMap.obstacles.some(obs => obs[0] === r && obs[1] === c);
        if (clickedIsObstacle) {
            selectedObstacle = [r, c];
            legalMoves = await getLegalObstacleMoves(selectedObstacle);
            drawGrid(savedMap, robotPos);
            return;
        }

        selectedObstacle = null;
        legalMoves = [];
        drawGrid(savedMap, robotPos);
    } catch (err) {
        console.error(err);
        alert("Could not fetch legal obstacle moves from server.");
    }
}


async function moveSelectedObstacleTo(targetPos) {
    const previousPos = [selectedObstacle[0], selectedObstacle[1]];
    const updatedMap = await applyObstacleMove(previousPos, targetPos);

    savedMap = updatedMap;
    lastObstacleMove = {
        from: previousPos,
        to: [targetPos[0], targetPos[1]],
    };

    selectedObstacle = null;
    legalMoves = [];
    phase = "robot_turn";
    turnInfoEl.textContent = "Obstacle moved. Click Next Robot Move.";
    nextMoveBtn.disabled = false;

    drawGrid(savedMap, robotPos);
}


async function hasAtLeastOneObstacleMove() {
    for (const obstacle of savedMap.obstacles) {
        const moves = await getLegalObstacleMoves(obstacle);
        if (moves.length > 0) {
            return true;
        }
    }
    return false;
}


/* ==============================
        STATUS UI
============================== */

function updateBattery(current, max) {
    if (current == null || max == null || max <= 0) {
        batteryTextEl.textContent = "--";
        batteryFillEl.style.width = "0%";
        return;
    }

    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    batteryTextEl.textContent = `${current} / ${max}`;
    batteryFillEl.style.width = `${pct}%`;
}


function handleGameOver(result) {
    gameOver = true;
    phase = "robot_turn";
    nextMoveBtn.disabled = true;

    if (result.winner === "robot") {
        turnInfoEl.textContent = "Robot reached the goal. Robot wins.";
        alert("Robot reached the goal. Robot wins.");
    } else {
        turnInfoEl.textContent = "Robot cannot move anymore. You win.";
        alert("Robot cannot move anymore. You win.");
    }
}


async function enterObstacleTurn() {
    selectedObstacle = null;
    legalMoves = [];

    if (!(await hasAtLeastOneObstacleMove())) {
        phase = "robot_turn";
        turnInfoEl.textContent = "No legal obstacle move available. Click Next Robot Move.";
        nextMoveBtn.disabled = false;
        drawGrid(savedMap, robotPos);
        return;
    }

    phase = "player_obstacle_turn";
    turnInfoEl.textContent = "Your turn: click an obstacle, then click a pink cell to move it.";
    nextMoveBtn.disabled = true;
    drawGrid(savedMap, robotPos);
}


/* ==============================
        NEXT MOVE
============================== */

async function nextMove() {
    if (gameOver) return;
    if (phase !== "robot_turn") {
        alert("Move one obstacle first before the robot moves again.");
        return;
    }

    try {
        const result = await getRobotMove(savedMap);

        if (result.session_id) {
            sessionId = result.session_id;
        }

        robotPos = result.robot_position;
        updateBattery(result.battery, result.max_battery);
        drawGrid(savedMap, robotPos);

        if (result.game_over) {
            handleGameOver(result);
            return;
        }

        await enterObstacleTurn();
    } catch (err) {
        console.error(err);
        alert("Move failed. Make sure backend is running and session is valid.");
    }
}
