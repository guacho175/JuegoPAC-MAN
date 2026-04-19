import { Direction, Position, GRID_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../types.ts';
import { INITIAL_MAP } from '../constants.ts';

export const isWall = (x: number, y: number): boolean => {
  const gridX = Math.floor(x);
  const gridY = Math.floor(y);

  if (gridX < 0 || gridX >= MAP_WIDTH || gridY < 0 || gridY >= MAP_HEIGHT) {
    return false; // Allow passing through borders for tunnel effect
  }

  return INITIAL_MAP[gridY][gridX] === 1;
};

export const getNextPos = (pos: Position, dir: Direction, speed: number): Position => {
  let nextX = pos.x;
  let nextY = pos.y;

  switch (dir) {
    case 'UP': nextY -= speed; break;
    case 'DOWN': nextY += speed; break;
    case 'LEFT': nextX -= speed; break;
    case 'RIGHT': nextX += speed; break;
  }

  // Tunnel effect
  if (nextX < -0.5) nextX = MAP_WIDTH - 0.5;
  if (nextX > MAP_WIDTH - 0.5) nextX = -0.5;

  return { x: nextX, y: nextY };
};

export const canTurn = (pos: Position, dir: Direction): boolean => {
  // We can only turn if we are roughly in the center of a tile
  const threshold = 0.2;
  const gridX = Math.round(pos.x);
  const gridY = Math.round(pos.y);

  if (Math.abs(pos.x - gridX) > threshold || Math.abs(pos.y - gridY) > threshold) {
    return false;
  }

  // Check if target tile in direction is wall
  let targetX = gridX;
  let targetY = gridY;

  switch (dir) {
    case 'UP': targetY -= 1; break;
    case 'DOWN': targetY += 1; break;
    case 'LEFT': targetX -= 1; break;
    case 'RIGHT': targetX += 1; break;
  }

  // Boundary check
  if (targetX < 0 || targetX >= MAP_WIDTH || targetY < 0 || targetY >= MAP_HEIGHT) return true;

  return INITIAL_MAP[targetY][targetX] !== 1;
};
