export interface Enemy {
  id: string;
  name: string;
  location: number; // index into path
  health: number;
  speed: number; // currently not used by movement logic (kept for scaling + UI)
}

export interface Point {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  location: Point;
  range: number;
  cooldown: number; // ms remaining until next shot
  damage: number;
}

/**
 * Browser-friendly copy of the server GameState with a few extra getters for rendering.
 * Movement is intentionally kept identical to your server skeleton.
 */
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
  public userHealth = 100;

  private path = this.findPath(this.start, this.end);

  private findPath(startPosition: Point, endPosition: Point) {
    const queue: Point[] = [startPosition];
    const startPositionKey = `${startPosition.x}x${startPosition.y}`;
    const parentForCell: Record<string, { key: string; cell: Point }> = {
      [startPositionKey]: {
        key: startPositionKey,
        cell: startPosition,
      },
    };
    const targetKey = `${endPosition.x}x${endPosition.y}`;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const currentKey = `${x}x${y}`;
      if (currentKey === targetKey) break;

      [
        { x: x - 1, y },
        { x, y: y + 1 },
        { x: x + 1, y },
        { x, y: y - 1 },
      ].forEach((neighbor) => {
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

    const path: Point[] = [];
    let currentKey = targetKey;
    let currentPosition = endPosition;
    while (currentKey !== startPositionKey) {
      path.unshift(currentPosition);
      const { key, cell } = parentForCell[currentKey]!;
      currentPosition = cell;
      currentKey = key;
    }
    path.unshift(startPosition);
    return path;
  }

  public getGrid() {
    return this.grid;
  }

  public getPath() {
    return this.path;
  }

  public getEnemyCount(): number {
    return this.enemies.length;
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getTowers(): Tower[] {
    return this.towers;
  }

  public moveEnemysForward() {
    this.enemies = this.enemies.reduce<Enemy[]>((acc, enemy) => {
      if (enemy.location < this.path.length) {
        acc.push({ ...enemy, location: enemy.location + 1 });
      } else {
        this.userHealth -= 30;
      }
      return acc;
    }, []);
  }

  public spawnEnemy(id: string, health: number = 100, speed: number = 10) {
    this.enemies.push({
      id,
      location: 0,
      name: `Enemy ${id}`,
      health,
      speed,
    });
  }

  public spawnTower(tower: Tower) {
    this.towers.push(tower);
  }

  public targetEnemy(towerLocation: Point, towerRange: number) {
    return this.enemies.find((enemy) => {
      const enemyPosition = this.path[enemy.location];
      if (!enemyPosition) return false;
      return (
        enemyPosition.x <= towerLocation.x + towerRange &&
        enemyPosition.y <= towerLocation.y + towerRange
      );
    })?.id;
  }

  public fireEnemy(towerDamage: number, enemyId: string) {
    const enemyIndex = this.enemies.findIndex((en) => en.id === enemyId);
    const enemy = this.enemies[enemyIndex];
    if (!enemy) return;

    enemy.health -= towerDamage;
    if (enemy.health <= 0) {
      this.enemies = this.enemies.filter((en) => en.id !== enemyId);
    } else {
      this.enemies[enemyIndex] = enemy;
    }
  }
}
