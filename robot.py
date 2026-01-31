# robot.py

from typing import Tuple, Dict, List, Optional
from collections import deque
from Map_gen import GridMap, CellType

Position = Tuple[int, int]


class Robot:
    def __init__(self, grid_map: GridMap):
        self.grid_map = grid_map
        self.position: Position = grid_map.start
        self.end: Position = grid_map.end

        # compute battery based on empty-map shortest path
        shortest = self._shortest_path_length_empty()
        self.battery: int = int(1.5 * shortest)

    # -----------------------------
    # Public API
    # -----------------------------
    def move(self) -> bool:
        """
        Robot takes one step toward the end.
        Returns True if move was successful.
        Returns False if robot cannot move (battery empty).
        """

        if self.battery <= 0:
            return False

        path = self._bfs_path(self.position, self.end)

        if path is None or len(path) < 2:
            # already at end or no path (should not happen)
            return False

        # move one step
        self.position = path[1]
        self.battery -= 1
        return True

    def reached_end(self) -> bool:
        return self.position == self.end

    # -----------------------------
    # Pathfinding
    # -----------------------------
    def _bfs_path(
        self,
        start: Position,
        goal: Position
    ) -> Optional[List[Position]]:
        """
        Standard BFS that returns the shortest path
        from start to goal as a list of positions.
        """

        queue = deque([start])
        came_from: Dict[Position, Optional[Position]] = {start: None}

        while queue:
            current = queue.popleft()

            if current == goal:
                break

            x, y = current
            for nx, ny in [
                (x + 1, y),
                (x - 1, y),
                (x, y + 1),
                (x, y - 1),
            ]:
                if not self.grid_map.in_bounds(nx, ny):
                    continue

                next_pos = (nx, ny)

                if next_pos in came_from:
                    continue

                cell = self.grid_map.cells[next_pos]
                if cell == CellType.OBSTACLE:
                    continue

                came_from[next_pos] = current
                queue.append(next_pos)

        if goal not in came_from:
            return None

        # reconstruct path
        path = []
        cur = goal
        while cur is not None:
            path.append(cur)
            cur = came_from[cur]

        path.reverse()
        return path

    def _shortest_path_length_empty(self) -> int:
        """
        Compute shortest path length from start to end
        on an empty map (ignores obstacles).
        Used for battery initialization.
        """

        queue = deque([self.grid_map.start])
        visited = {self.grid_map.start: 0}

        while queue:
            current = queue.popleft()
            dist = visited[current]

            if current == self.grid_map.end:
                return dist

            x, y = current
            for nx, ny in [
                (x + 1, y),
                (x - 1, y),
                (x, y + 1),
                (x, y - 1),
            ]:
                if not self.grid_map.in_bounds(nx, ny):
                    continue

                next_pos = (nx, ny)
                if next_pos in visited:
                    continue

            

                visited[next_pos] = dist + 1
                queue.append(next_pos)

        # fallback (should never happen)
        return self.grid_map.width * self.grid_map.height
