interface Enemy {
  id: string;
  name: string;
  location: number;
  health: number;
  speed: number;
}

interface Tower {
  id: string;
  location: Point;
  range: number; // How much neihgbors can the towers see past it
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
  public userHealth = 100;
  private path = this.findPath(this.start, this.end);

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
          console.log(
            `enemy ${enemy.id} has reached the end of the path! User hit`
          );
          this.userHealth -= 30;
        }
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

  public spawnTower(tower: Tower) {
    this.towers.push(tower);
  }

  public getTowers() {
    return this.towers;
  }

  public targetEnemy(towerLocation: Point, towerRange: number) {
    return this.enemies.find((enemy) => {
      const enemyPosition = this.path[enemy.location];
      if (enemyPosition)
        return (
          enemyPosition.x <= towerLocation.x + towerRange &&
          enemyPosition.y <= towerLocation.y + towerRange
        );
    })?.id;
  }

  public fireEnemy(towerDamage: number, enemyId: string) {
    const enemyIndex = this.enemies.findIndex((en) => en.id === enemyId);
    const enemy = this.enemies[enemyIndex];
    if (enemy) {
      enemy.health -= towerDamage;
      console.log(`Enemy ${enemyId} hit!`);
      if (enemy.health <= 0) {
        this.enemies = this.enemies.filter((en) => en.id !== enemyId);
        console.log(`enemy ${enemyId} killed`);
      } else this.enemies[enemyIndex] = enemy;
    }
  }
}
