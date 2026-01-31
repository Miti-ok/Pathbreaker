# pathfinding.py
from collections import deque
from Map_gen import GridMap, CellType
def path_exists(grid_map: GridMap) -> bool:
    start = grid_map.start
    end = grid_map.end

    queue = deque([start])
    visited = set([start])

    while queue:
        x, y = queue.popleft()

        if (x, y) == end:
            return True

        for nx, ny in [
            (x + 1, y),
            (x - 1, y),
            (x, y + 1),
            (x, y - 1),
        ]:
            if not grid_map.in_bounds(nx, ny):
                continue

            if (nx, ny) in visited:
                continue

            cell = grid_map.cells[(nx, ny)]

            if cell == CellType.OBSTACLE:
                continue

            visited.add((nx, ny))
            queue.append((nx, ny))

    return False
