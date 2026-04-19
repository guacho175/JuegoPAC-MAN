/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas.tsx';
import { Dpad } from './components/Dpad.tsx';
import { AudioPlayer } from './components/AudioPlayer.tsx';
import { Direction, GameState } from './types.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Play, RefreshCcw, Pause, Terminal } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: parseInt(localStorage.getItem('pacman-neon-highscore') || '0'),
    lives: 3,
    level: 1,
    status: 'START',
    powerUpTime: 0
  });

  const [nextDir, setNextDir] = useState<Direction>('STOP');
  const gameRef = useRef<GameCanvasHandle>(null);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys: Record<string, Direction> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT'
      };

      if (keys[e.key]) {
        e.preventDefault();
        setNextDir(keys[e.key]);
      }

      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => ({
          ...prev,
          status: prev.status === 'PAUSED' ? 'PLAYING' : 'PAUSED'
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Anti-refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameState.status === 'PLAYING' || gameState.status === 'POWERUP') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState.status]);

  const onStateUpdate = useCallback((update: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...update }));
  }, []);

  const startGame = () => {
    setNextDir('STOP');
    gameRef.current?.reset();
    setGameState(prev => ({ ...prev, status: 'PLAYING', lives: 3, score: 0 }));
  };

  const togglePause = () => {
    const newStatus = gameState.status === 'PAUSED' ? 'PLAYING' : 'PAUSED';
    setGameState(prev => ({ ...prev, status: newStatus }));
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] font-sans flex flex-col items-center justify-center overflow-hidden selection:bg-neon-cyan selection:text-black">
      {/* HUD Header */}
      <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-30 glass border-b-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Current Logic</span>
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-neon-cyan" />
              <span className="text-xl font-bold neon-text-cyan tabular-nums">
                {gameState.score.toString().padStart(6, '0')}
              </span>
            </div>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-6">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">High Sync</span>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-neon-magenta" />
              <span className="text-xl font-bold neon-text-magenta tabular-nums">
                {gameState.highScore.toString().padStart(6, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 mr-4">
            {Array.from({ length: gameState.lives }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Heart size={20} className="fill-neon-yellow text-neon-yellow drop-shadow-[0_0_5px_rgba(255,255,0,0.5)]" />
              </motion.div>
            ))}
          </div>
          <button
            onClick={togglePause}
            className="p-2 glass rounded-lg neon-text-cyan hover:bg-white/5 transition-colors"
          >
            {gameState.status === 'PAUSED' ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
        <div className="mb-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tighter uppercase italic">
            PAC-MAN <span className="neon-text-cyan">NEÓN</span>
          </h1>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] mt-1">Ver. 2026.04 // Neural Network Hack</p>
        </div>

        <GameCanvas
          ref={gameRef}
          onStateChange={onStateUpdate}
          nextDir={nextDir}
        />
      </div>

      {/* UI Overlays */}
      <AnimatePresence>
        {(gameState.status === 'START' || gameState.status === 'GAMEOVER' || gameState.status === 'WIN' || gameState.status === 'PAUSED') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full glass p-8 rounded-3xl border-neon-cyan/30 text-center"
            >
              {gameState.status === 'START' && (
                <>
                  <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">Iniciando Protocolo</h2>
                  <p className="text-white/60 mb-8 font-light leading-relaxed">
                    Recupera los <span className="text-neon-magenta font-semibold">Fragmentos de Datos</span> y evita las <span className="text-neon-cyan font-semibold">Anomalías Centinela</span>.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="w-full py-4 bg-neon-cyan text-black font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,255,255,0.4)]"
                  >
                    <Play fill="black" size={20} /> Ejecutar Sesión
                  </motion.button>
                </>
              )}

              {gameState.status === 'GAMEOVER' && (
                <>
                  <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter text-red-500 underline decoration-red-500/50 underline-offset-8">FALLO DE SISTEMA</h2>
                  <p className="text-white/60 mb-2 font-mono text-xs">LOG: BUFFER_OVERFLOW_PACKETS_LOST</p>
                  <p className="text-2xl font-bold mb-8 neon-text-magenta">PUNTOS: {gameState.score}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="w-full py-4 glass text-neon-cyan border-neon-cyan font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 neon-border"
                  >
                    <RefreshCcw size={20} /> Reiniciar Núcleo
                  </motion.button>
                </>
              )}

              {gameState.status === 'WIN' && (
                <>
                  <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter text-green-400 underline decoration-green-400/50 underline-offset-8">SISTEMA PURGADO</h2>
                  <p className="text-white/60 mb-2 font-mono text-xs">LOG: ENCRYPTION_SUCCESS_SECTOR_CLEAR</p>
                  <p className="text-2xl font-bold mb-8 neon-text-yellow">PUNTOS: {gameState.score}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="w-full py-4 bg-green-500 text-black font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                  >
                    <RefreshCcw size={20} /> Siguiente Protocolo
                  </motion.button>
                </>
              )}

              {gameState.status === 'PAUSED' && (
                <>
                  <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">SESIÓN EN ESPERA</h2>
                  <p className="text-white/60 mb-8 font-mono text-xs italic">C:\PACMAN_NEON\SYSTEM\SUSPENDED...</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePause}
                    className="w-full py-4 glass text-neon-cyan border-neon-cyan font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 neon-border"
                  >
                    <Play fill="currentColor" size={20} /> Reanudar
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <Dpad onDirectionChange={setNextDir} />
      <AudioPlayer />

      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#00ffff11,transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_50%_50%,#ff00ff11,transparent_70%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_50%_50%,#ffff0008,transparent_70%)]" />
      </div>
    </div>
  );
}
