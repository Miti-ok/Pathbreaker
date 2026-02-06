document.addEventListener("DOMContentLoaded", () => {

    // ================================
    // CONFIG
    // ================================
    const GRID_SIZE = 8;

    const gridEl = document.getElementById("grid");
    const obstacleLimitText = document.getElementById("obstacleLimitText");
    const confirmBtn = document.getElementById("confirmBtn");
    const resetBtn = document.getElementById("resetBtn");

    if (!gridEl || !obstacleLimitText || !confirmBtn) {
        console.error("Required DOM elements not found. Check HTML IDs.");
        return;
    }

    // Keep this formula aligned with engine/game design rule.
    const MAX_OBSTACLES = Math.floor(GRID_SIZE * GRID_SIZE * 0.12);
    obstacleLimitText.textContent = `You can place maximum of ${MAX_OBSTACLES} obstacles.`;

    // ================================
    // STATE
    // ================================
    let gridState = [];
    let startPos = [7, 0];
    let endPos = [0, 7];
    let dragging = null;
    let activePointerId = null;

    // ================================
    // INIT GRID
    // ================================
    function initGrid() {
        gridEl.innerHTML = "";
        gridState = [];

        for (let r = 0; r < GRID_SIZE; r++) {
            gridState[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                gridState[r][c] = "empty";

                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.row = r;
                cell.dataset.col = c;

                gridEl.appendChild(cell);
            }
        }

        placeStartEnd();
        render();
    }

    function placeStartEnd() {
        gridState[startPos[0]][startPos[1]] = "start";
        gridState[endPos[0]][endPos[1]] = "end";
    }

    // ================================
    // INTERACTION
    // ================================
    function onCellPointerDown(r, c, pointerId) {
        const type = gridState[r][c];

        if (type === "start" || type === "end") {
            dragging = type;
            activePointerId = pointerId;
            return;
        }

        toggleObstacle(r, c);
    }

    function onCellDragMove(r, c) {
        if (!dragging) return;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
        if (gridState[r][c] !== "empty") return;

        if (dragging === "start") {
            if (startPos[0] === r && startPos[1] === c) return;
            gridState[startPos[0]][startPos[1]] = "empty";
            startPos = [r, c];
            gridState[r][c] = "start";
        }

        if (dragging === "end") {
            if (endPos[0] === r && endPos[1] === c) return;
            gridState[endPos[0]][endPos[1]] = "empty";
            endPos = [r, c];
            gridState[r][c] = "end";
        }

        render();
    }

    function clearDragging(pointerId = null) {
        if (pointerId !== null && activePointerId !== pointerId) return;
        dragging = null;
        activePointerId = null;
    }

    function getCellFromEventTarget(target) {
        const cell = target.closest(".cell");
        if (!cell) return null;
        return {
            r: Number(cell.dataset.row),
            c: Number(cell.dataset.col),
        };
    }

    function onGridPointerDown(e) {
        const pos = getCellFromEventTarget(e.target);
        if (!pos) return;
        onCellPointerDown(pos.r, pos.c, e.pointerId);
    }

    function onGridPointerMove(e) {
        if (!dragging || activePointerId !== e.pointerId) return;
        e.preventDefault();
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target) return;

        const pos = getCellFromEventTarget(target);
        if (!pos) return;
        onCellDragMove(pos.r, pos.c);
    }

    function toggleObstacle(r, c) {
        const type = gridState[r][c];

        // Never touch start or end
        if (type === "start" || type === "end") return;

        // Obstacle -> Empty (toggle OFF)
        if (type === "obstacle") {
            gridState[r][c] = "empty";
            render();
            return;
        }

        // Empty -> Obstacle (toggle ON)
        if (type === "empty") {
            if (countObstacles() >= MAX_OBSTACLES) return;

            gridState[r][c] = "obstacle";
            render();
        }
    }


    // ================================
    // RENDER
    // ================================
    function render() {
        document.querySelectorAll(".cell").forEach(cell => {
            const r = Number(cell.dataset.row);
            const c = Number(cell.dataset.col);

            cell.className = "cell";
            if (gridState[r][c] === "start") cell.classList.add("start");
            if (gridState[r][c] === "end") cell.classList.add("end");
            if (gridState[r][c] === "obstacle") cell.classList.add("obstacle");
        });
    }

    function countObstacles() {
        return gridState.flat().filter(v => v === "obstacle").length;
    }

    // ================================
    // BFS VALIDATION
    // ================================
    function pathExists(start, end) {
        const queue = [start];
        const visited = new Set([start.join(",")]);
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        while (queue.length) {
            const [r, c] = queue.shift();
            if (r === end[0] && c === end[1]) return true;

            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;

                if (nr < 0 || nc < 0 || nr >= GRID_SIZE || nc >= GRID_SIZE) continue;
                if (visited.has(key)) continue;
                if (gridState[nr][nc] === "obstacle") continue;

                visited.add(key);
                queue.push([nr, nc]);
            }
        }
        return false;
    }

    // ================================
    // EXPORT
    // ================================
    function exportMap() {
        const obstacles = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (gridState[r][c] === "obstacle") obstacles.push([r, c]);
            }
        }

        return {
            width: GRID_SIZE,
            height: GRID_SIZE,
            start: startPos,
            end: endPos,
            obstacles
        };
    }

    // ================================
    // CONTROLS
    // ================================
    confirmBtn.addEventListener("click", () => {
        if (countObstacles() === 0) {
            alert("Place at least one obstacle before confirming the map.");
            return;
        }

        if (!pathExists(startPos, endPos)) {
            alert("Invalid map: no path exists.");
            return;
        }

        const map = exportMap();

        // Save map into browser memory
        localStorage.setItem("gridMap", JSON.stringify(map));

        // Move to gameplay page
        window.location.href = "gameplay.html";
    });

    resetBtn?.addEventListener("click", initGrid);
    gridEl.addEventListener("pointerdown", onGridPointerDown);
    gridEl.addEventListener("pointermove", onGridPointerMove);
    window.addEventListener("pointerup", (e) => clearDragging(e.pointerId));
    window.addEventListener("pointercancel", (e) => clearDragging(e.pointerId));

    // ================================
    // START
    // ================================
    initGrid();

});
