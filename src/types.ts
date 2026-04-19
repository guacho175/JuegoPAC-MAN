export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP';

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  pos: Position;
  dir: Direction;
  nextDir: Direction;
  speed: number;
  type: 'PACMAN' | 'GHOST';
  id?: string;
  color?: string;
  isFrightened?: boolean;
}

export type TileType = 'WALL' | 'DOT' | 'POWER_PELLET' | 'EMPTY';

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  status: 'START' | 'PLAYING' | 'PAUSED' | 'POWERUP' | 'GAMEOVER' | 'WIN';
  powerUpTime: number;
}

export const GRID_SIZE = 20; // Size of each tile in pixels
export const MAP_WIDTH = 28;
export const MAP_HEIGHT = 31;
