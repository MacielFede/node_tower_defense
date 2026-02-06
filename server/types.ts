interface Enemy {
  id: string;
  name: string;
  location: number;
  health: number;
  speed: number;
}

interface Tower {
  id: string;
  name: string;
  location: Point;
  range: number;
  fireRate: number;
  cooldown: number;
  damage: number;
}

interface Point {
  x: number;
  y: number;
}

export class GameState {
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private grid = [
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
  ];
  private start: Point = { x: 0, y: 4 };
  private end: Point = { x: 9, y: 4 };
  private path = this.findPath(this.start, this.end);
  /* this should be:
	 	[{0,4}, {1,4}, {2,4}, {3,4}, {4,4}, {5,4}, {6,4}, {7,4}, {8,4}, {9,4}]
	 */

  private findPath(startPosition: Point, endPosition: Point) {
    // BFS algorithm implementation
    const queue: Point[] = [startPosition];
    const startPositionKey = `${startPosition.x}x${startPosition.y}`;
    const parentForCell: Record<string, { key: string; cell: Point }> = {
      startPositionKey: {
        key: startPositionKey,
        cell: startPosition,
      },
    };
    const targetKey = `${endPosition.x}x${endPosition.y}`;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const currentKey = `${x}x${y}`;
      if (currentKey === targetKey) break;
      // Neighbors
      [
        { x: x - 1, y },
        { x, y: y + 1 },
        { x: x + 1, y },
        { x, y: y - 1 },
      ].forEach((neighbor) => {
        console.log(neighbor);
        const nX = neighbor.x;
        const nY = neighbor.y;
        if (
          nX < 0 ||
          nX > this.grid.length - 1 ||
          nY < 0 ||
          nY > this.grid[nX]!.length - 1 ||
          this.grid[nX]![nY] === 1
        )
          return;
        const key = `${nX}x${nY}`;
        if (key in parentForCell) return;
        parentForCell[key] = {
          key: currentKey,
          cell: { x, y },
        };
        queue.push(neighbor);
      });
    }
    console.log(parentForCell);
    const path = [];

    let currentKey = targetKey;
    let currentPosition = endPosition;
    while (currentKey !== startPositionKey) {
      path.push(currentPosition);

      const { key, cell } = parentForCell[currentKey]!;
      currentPosition = cell;
      currentKey = key;
    }
    path.push(startPosition);
    console.log(path);

    return path;
  }

  public moveEnemysForward() {
    this.enemies = this.enemies.reduce<Enemy[]>((acc, enemy) => {
      if (enemy) {
        if (enemy.location < this.path.length) {
          console.log(`enemy ${enemy.id} location: ${enemy.location + 1}`);
          acc.push({ ...enemy, location: enemy.location + 1 });
        } else {
          console.log(`enemy ${enemy.id} has reached the end of the path`);
        }
      }
      return acc;
    }, []);
  }

  public spawnEnemy(id: string) {
    this.enemies.push({
      id,
      location: 0,
      name: `Enemy ${id}`,
      health: 100,
      speed: 10,
    });
  }
}
