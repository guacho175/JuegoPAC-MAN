import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Direction, Position, Entity, GameState, MAP_WIDTH, MAP_HEIGHT, GRID_SIZE } from '../types.ts';
import { INITIAL_MAP } from '../gameConstants.ts'; // fallback
import { MAPS, COLORS, SPEED } from '../gameConstants.ts';
import { getNextPos, canTurn, isWall } from '../utils/gameUtils.ts';

interface GameCanvasProps {
  onStateChange: (state: Partial<GameState>) => void;
  nextDir: Direction;
  level: number;
}

export interface GameCanvasHandle {
  reset: (newLevel?: number) => void;
  pause: (paused: boolean) => void;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ onStateChange, nextDir, level }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const nextDirRef = useRef<Direction>(nextDir);
  useEffect(() => {
    nextDirRef.current = nextDir;
  }, [nextDir]);

  // Use refs for engine state to avoid re-renders
  const mapRef = useRef<number[][]>(JSON.parse(JSON.stringify(MAPS[(level - 1) % MAPS.length] || MAPS[0])));
  const pacmanRef = useRef<Entity>({
    pos: { x: 14, y: 23 },
    dir: 'STOP',
    nextDir: 'STOP',
    speed: SPEED.PACMAN,
    type: 'PACMAN'
  });

  const ghostsRef = useRef<Entity[]>(COLORS.GHOSTS.map((g, i) => ({
    pos: { x: 12 + i % 4, y: 14 },
    dir: 'LEFT',
    nextDir: 'LEFT',
    speed: SPEED.GHOST,
    type: 'GHOST',
    id: g.name,
    color: g.color,
    isFrightened: false
  })));

  const gameStateRef = useRef<GameState>({
    score: 0,
    highScore: parseInt(localStorage.getItem('pacman-neon-highscore') || '0'),
    lives: 3,
    level: 1,
    status: 'START',
    powerUpTime: 0
  });

  const [isPaused, setIsPaused] = useState(false);

  useImperativeHandle(ref, () => ({
    reset: (newLevel?: number) => {
      const activeLevel = newLevel ?? level;
      mapRef.current = JSON.parse(JSON.stringify(MAPS[(activeLevel - 1) % MAPS.length] || MAPS[0]));
      pacmanRef.current.pos = { x: 14, y: 23 };
      pacmanRef.current.dir = 'STOP';
      ghostsRef.current.forEach((g, i) => {
        g.pos = { x: 12 + i, y: 14 };
      });
      gameStateRef.current.score = 0;
      gameStateRef.current.status = 'PLAYING';
      onStateChange({ score: 0, status: 'PLAYING' });
    },
    pause: (p) => setIsPaused(p)
  }));

  const update = (time: number) => {
    if (gameStateRef.current.status !== 'PLAYING' || isPaused) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // 1. Update Pac-Man
    const pac = pacmanRef.current;
    pac.nextDir = nextDirRef.current;

    // Try to turn if nextDir is set and we can
    if (pac.nextDir !== 'STOP' && canTurn(pac.pos, pac.nextDir, mapRef.current)) {
      if (pac.dir !== pac.nextDir) {
        // Snap when turning to avoid drifting
        if (['UP', 'DOWN'].includes(pac.nextDir) && ['LEFT', 'RIGHT'].includes(pac.dir)) {
           pac.pos.x = Math.round(pac.pos.x);
        } else if (['LEFT', 'RIGHT'].includes(pac.nextDir) && ['UP', 'DOWN'].includes(pac.dir)) {
           pac.pos.y = Math.round(pac.pos.y);
        }
      }
      pac.dir = pac.nextDir;
    }

    // Move Pac-Man carefully to avoid walls
    let nextPos = getNextPos(pac.pos, pac.dir, pac.speed);
    const roundedX = Math.round(pac.pos.x);
    const roundedY = Math.round(pac.pos.y);
    let frontX = roundedX; let frontY = roundedY;
    if (pac.dir === 'RIGHT') frontX++; else if (pac.dir === 'LEFT') frontX--; else if (pac.dir === 'DOWN') frontY++; else if (pac.dir === 'UP') frontY--;
    
    if (isWall(frontX, frontY, mapRef.current)) {
      if (pac.dir === 'RIGHT' && nextPos.x > roundedX) { nextPos.x = roundedX; pac.dir = 'STOP'; }
      else if (pac.dir === 'LEFT' && nextPos.x < roundedX) { nextPos.x = roundedX; pac.dir = 'STOP'; }
      else if (pac.dir === 'DOWN' && nextPos.y > roundedY) { nextPos.y = roundedY; pac.dir = 'STOP'; }
      else if (pac.dir === 'UP' && nextPos.y < roundedY) { nextPos.y = roundedY; pac.dir = 'STOP'; }
    }
    pac.pos = nextPos;

    // 2. Consume items
    const gridX = Math.round(pac.pos.x);
    const gridY = Math.round(pac.pos.y);
    const tile = mapRef.current[gridY][gridX];

    if (tile === 2) { // DOT
      mapRef.current[gridY][gridX] = 0;
      gameStateRef.current.score += 10;
      onStateChange({ score: gameStateRef.current.score });
    } else if (tile === 3) { // POWER PELLET
      mapRef.current[gridY][gridX] = 0;
      gameStateRef.current.score += 50;
      gameStateRef.current.powerUpTime = 500; // frames roughly
      ghostsRef.current.forEach(g => g.isFrightened = true);
      onStateChange({ score: gameStateRef.current.score, status: 'POWERUP' });
    }

    // 3. Update Ghosts
    ghostsRef.current.forEach(ghost => {
      if (gameStateRef.current.powerUpTime > 0) {
        ghost.isFrightened = true;
        ghost.speed = SPEED.FRIGHTENED;
      } else {
        ghost.isFrightened = false;
        ghost.speed = SPEED.GHOST;
      }

      // Simple AI: choose random direction at intersections
      if (canTurn(ghost.pos, ghost.dir, mapRef.current)) {
        const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const possibleDirs = dirs.filter(d => canTurn(ghost.pos, d, mapRef.current));
        if (possibleDirs.length > 1) {
           // Bias towards Pacman or random
           ghost.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        }
      }

      let gNext = getNextPos(ghost.pos, ghost.dir, ghost.speed);
      const gRndX = Math.round(ghost.pos.x);
      const gRndY = Math.round(ghost.pos.y);
      let gFrontX = gRndX; let gFrontY = gRndY;
      if (ghost.dir === 'RIGHT') gFrontX++; else if (ghost.dir === 'LEFT') gFrontX--; else if (ghost.dir === 'DOWN') gFrontY++; else if (ghost.dir === 'UP') gFrontY--;
      
      if (isWall(gFrontX, gFrontY, mapRef.current)) {
        if (ghost.dir === 'RIGHT' && gNext.x > gRndX) { gNext.x = gRndX; ghost.dir = 'STOP'; }
        else if (ghost.dir === 'LEFT' && gNext.x < gRndX) { gNext.x = gRndX; ghost.dir = 'STOP'; }
        else if (ghost.dir === 'DOWN' && gNext.y > gRndY) { gNext.y = gRndY; ghost.dir = 'STOP'; }
        else if (ghost.dir === 'UP' && gNext.y < gRndY) { gNext.y = gRndY; ghost.dir = 'STOP'; }
        
        if (ghost.dir === 'STOP') {
          ghost.pos = { x: gRndX, y: gRndY };
          const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          const possibleDirs = dirs.filter(d => {
            let fx = gRndX; let fy = gRndY;
            if (d === 'RIGHT') fx++; else if (d === 'LEFT') fx--; else if (d === 'DOWN') fy++; else if (d === 'UP') fy--;
            return !isWall(fx, fy, mapRef.current);
          });
          ghost.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)] || 'STOP';
        } else {
          ghost.pos = gNext;
        }
      } else {
        ghost.pos = gNext;
      }

      // 4. Collision Detection
      const dist = Math.sqrt(Math.pow(pac.pos.x - ghost.pos.x, 2) + Math.pow(pac.pos.y - ghost.pos.y, 2));
      if (dist < 0.8) {
        if (ghost.isFrightened) {
          // Eat ghost
          ghost.pos = { x: 14, y: 14 };
          ghost.isFrightened = false;
          gameStateRef.current.score += 200;
          onStateChange({ score: gameStateRef.current.score });
        } else {
          // Pacman dies
          gameStateRef.current.lives -= 1;
          if (gameStateRef.current.lives <= 0) {
             gameStateRef.current.status = 'GAMEOVER';
             if (gameStateRef.current.score > gameStateRef.current.highScore) {
                gameStateRef.current.highScore = gameStateRef.current.score;
                localStorage.setItem('pacman-neon-highscore', String(gameStateRef.current.score));
             }
             onStateChange({ status: 'GAMEOVER', highScore: gameStateRef.current.highScore });
          } else {
             pac.pos = { x: 14, y: 23 };
             pac.dir = 'STOP';
             ghostsRef.current.forEach((g, i) => g.pos = { x: 12 + i, y: 14 });
             onStateChange({ lives: gameStateRef.current.lives });
          }
        }
      }
    });

    if (gameStateRef.current.powerUpTime > 0) {
      gameStateRef.current.powerUpTime--;
      if (gameStateRef.current.powerUpTime === 0) {
        onStateChange({ status: 'PLAYING' });
      }
    }

    // Win condition check: any dots left?
    const hasDots = mapRef.current.some(row => row.some(tile => tile === 2 || tile === 3));
    if (!hasDots) {
      gameStateRef.current.status = 'WIN';
      onStateChange({ status: 'WIN' });
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const s = GRID_SIZE;

    // Draw Map
    mapRef.current.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === 1) { // Wall
          ctx.strokeStyle = COLORS.WALL;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = COLORS.WALL;
          ctx.strokeRect(x * s + 2, y * s + 2, s - 4, s - 4);
        } else if (tile === 2) { // Dot
          ctx.fillStyle = COLORS.DOT;
          ctx.shadowBlur = 5;
          ctx.shadowColor = COLORS.DOT;
          ctx.beginPath();
          ctx.arc(x * s + s/2, y * s + s/2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 3) { // Power Pellet
          ctx.fillStyle = COLORS.POWER_PELLET;
          ctx.shadowBlur = 15;
          ctx.shadowColor = COLORS.POWER_PELLET;
          ctx.beginPath();
          ctx.arc(x * s + s/2, y * s + s/2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // Draw Pac-Man (Node of Light)
    const pac = pacmanRef.current;
    ctx.fillStyle = COLORS.PACMAN;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.PACMAN;
    ctx.beginPath();
    // Mouth animation based on position
    const mouthOpen = (Math.sin(lastTimeRef.current * 0.01) + 1) * 0.2;
    let startAngle = mouthOpen;
    let endAngle = Math.PI * 2 - mouthOpen;

    if (pac.dir === 'LEFT') { startAngle += Math.PI; endAngle += Math.PI; }
    if (pac.dir === 'DOWN') { startAngle += Math.PI/2; endAngle += Math.PI/2; }
    if (pac.dir === 'UP') { startAngle += Math.PI * 1.5; endAngle += Math.PI * 1.5; }

    ctx.moveTo(pac.pos.x * s + s/2, pac.pos.y * s + s/2);
    ctx.arc(pac.pos.x * s + s/2, pac.pos.y * s + s/2, s/2 - 2, startAngle, endAngle);
    ctx.fill();

    // Draw Ghosts
    ghostsRef.current.forEach(ghost => {
      ctx.fillStyle = ghost.isFrightened ? COLORS.FRIGHTENED : ghost.color!;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(ghost.pos.x * s + s/2, ghost.pos.y * s + s/2, s/2 - 2, Math.PI, 0);
      ctx.lineTo(ghost.pos.x * s + s - 2, ghost.pos.y * s + s - 2);
      ctx.lineTo(ghost.pos.x * s + 2, ghost.pos.y * s + s - 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ghost.pos.x * s + s/2 - 4, ghost.pos.y * s + s/2 - 2, 2, 0, Math.PI * 2);
      ctx.arc(ghost.pos.x * s + s/2 + 4, ghost.pos.y * s + s/2 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0; // Reset
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPaused]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH * GRID_SIZE}
        height={MAP_HEIGHT * GRID_SIZE}
        className="max-w-full max-h-[80vh] border-2 border-white/10 rounded-lg shadow-2xl"
      />
    </div>
  );
});
