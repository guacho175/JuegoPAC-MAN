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
import { Direction, GameState } from './types.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Play, RefreshCcw, Pause, Terminal, ListOrdered, Menu, X } from 'lucide-react';
import NeonMusicPlayer from './components/NeonMusicPlayer';

interface ScoreEntry {
  name: string;
  score: number;
  difficulty?: string;
  date: string;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: parseInt(localStorage.getItem('pacman-neon-highscore') || '0'),
    lives: 3,
    level: 1,
    status: 'START',
    powerUpTime: 0
  });

  const [ranking, setRanking] = useState<ScoreEntry[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);

  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.touches[0].clientX - touchStart.x;
    const dy = e.touches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      setNextDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP'));
      setTouchStart(null);
    }
  };
  const handleTouchEnd = () => setTouchStart(null);

  useEffect(() => {
    const loadRanking = async () => {
      const sheetUrl = "https://sheetdb.io/api/v1/6gn8xetirbn1d" || import.meta.env.VITE_SHEETDB_URL;
      setIsLoadingRanking(true);
      if (sheetUrl) {
        try {
          const res = await fetch(sheetUrl, { cache: 'no-store' });
          if (res.ok) {
            const data: any[] = await res.json();
            const parsed: ScoreEntry[] = data.map(row => ({
              name: String(row.name || 'ANON'),
              score: parseInt(row.score, 10) || 0,
              difficulty: String(row.difficulty || ''),
              date: String(row.date || '')
            }));
            const sorted = parsed.sort((a, b) => b.score - a.score).slice(0, 10);
            setRanking(sorted);
            setIsLoadingRanking(false);
            return;
          }
        } catch (error) {
          console.error("Fallo conectando a SheetDB", error);
        }
      }
      const saved = JSON.parse(localStorage.getItem('pacman_neon_ranking') || '[]');
      setRanking(saved);
      setIsLoadingRanking(false);
    };
    loadRanking();
    window.addEventListener('rankingUpdated', loadRanking);
    return () => window.removeEventListener('rankingUpdated', loadRanking);
  }, []);

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
    <div className="h-screen w-screen overflow-hidden bg-[#0c0c0e] flex flex-col font-sans selection:bg-cyan-500/30 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-magenta/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full pt-1.5 sm:pt-3 pb-1 px-4 flex flex-col items-center z-50 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-slate-900 flex-shrink-0"
      >
        <div className="flex items-baseline gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-2xl font-black italic text-slate-100 tracking-tighter uppercase relative">
            PAC-MAN
            <span className="text-neon-cyan mx-1">Neón</span>
            <span className="absolute -top-1 -right-4 sm:-top-1.5 sm:-right-5 text-[6px] sm:text-[8px] font-mono text-neon-magenta font-bold bg-neon-magenta/10 px-0.5 py-0.2 rounded border border-neon-magenta/20">V1.1</span>
          </h1>
        </div>
        <p className="text-slate-500 font-mono tracking-[0.3em] text-[6px] sm:text-[8px] uppercase text-center leading-none">
          Hecho por <span className="text-neon-cyan font-bold">Galindez</span>
        </p>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full z-10 relative min-h-0">
        
        {/* Toggle Ranking Button (Mobile) */}
        <button 
          className="lg:hidden absolute top-2 left-2 z-50 p-1.5 glass rounded text-neon-magenta hover:bg-neon-magenta/20 transition-colors"
          onClick={() => setIsRankingOpen(!isRankingOpen)}
        >
          {isRankingOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Ranking Sidebar */}
        <motion.aside
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: isRankingOpen ? 0 : (window.innerWidth < 1024 ? -300 : 0), opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`w-56 lg:w-44 xl:w-52 p-2 sm:p-3 lg:border-r border-slate-800 bg-slate-900/90 lg:bg-slate-900/40 backdrop-blur-xl flex flex-col fixed lg:absolute lg:left-0 lg:top-0 lg:bottom-0 top-12 left-2 bottom-20 z-40 rounded-xl lg:rounded-none ${isRankingOpen ? 'flex' : 'hidden lg:flex'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ListOrdered className="w-3.5 h-3.5 text-neon-magenta" />
            <h2 className="text-[10px] sm:text-xs font-bold text-slate-100 uppercase tracking-widest italic">Ranking</h2>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 max-h-[90px] lg:max-h-none">
            {isLoadingRanking ? (
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-[8px] font-mono text-neon-cyan uppercase tracking-widest animate-pulse">Sincronizando...</p>
              </div>
            ) : ranking.length > 0 ? (
              ranking.map((entry, index) => (
                <div
                  key={index}
                  className="group flex flex-col p-1 bg-slate-800/20 border border-slate-700/30 rounded hover:border-neon-magenta/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`font-mono font-black italic text-[10px] ${index < 3 ? 'text-neon-cyan' : 'text-slate-600'}`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-100 uppercase truncate max-w-[50px] sm:max-w-[70px]">{entry.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] sm:text-[10px] font-black text-neon-magenta leading-none">{entry.score}</p>
                    </div>
                  </div>
                  {entry.difficulty && (
                    <div className="flex justify-start ml-3">
                      <p className="text-[6px] sm:text-[7px] text-slate-500 uppercase tracking-wider">{entry.difficulty}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-2 border border-dashed border-slate-800 rounded">
                <p className="text-[7px] font-mono text-slate-600 uppercase">Vacío</p>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Game Area Wrapper */}
        <main 
          className="flex-1 flex flex-col items-center justify-center w-full h-full p-1 sm:p-2 lg:p-4 overflow-hidden relative bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:40px_40px] touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
            {/* PAC-MAN Inner Elements */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-2 z-30 glass p-2 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 font-mono">Current Logic</span>
                  <div className="flex items-center gap-1">
                    <Terminal size={12} className="text-neon-cyan" />
                    <span className="text-lg font-bold text-neon-cyan tabular-nums">
                      {gameState.score.toString().padStart(6, '0')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 font-mono">High Sync</span>
                  <div className="flex items-center gap-1">
                    <Trophy size={12} className="text-neon-magenta" />
                    <span className="text-lg font-bold text-neon-magenta tabular-nums">
                      {gameState.highScore.toString().padStart(6, '0')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1 mr-2">
                  {Array.from({ length: gameState.lives }).map((_, i) => (
                    <Heart key={i} size={14} className="fill-neon-yellow text-neon-yellow" />
                  ))}
                </div>
                <button onClick={togglePause} className="p-1.5 glass rounded-lg text-neon-cyan hover:bg-white/5 transition-colors">
                  {gameState.status === 'PAUSED' ? <Play size={14} /> : <Pause size={14} />}
                </button>
              </div>
            </div>

            <GameCanvas
              ref={gameRef}
              onStateChange={onStateUpdate}
              nextDir={nextDir}
            />

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
                        <p className="text-2xl font-bold mb-8 text-neon-magenta">PUNTOS: {gameState.score}</p>
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
                        <p className="text-2xl font-bold mb-8 text-neon-yellow">PUNTOS: {gameState.score}</p>
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

            <Dpad onDirectionChange={setNextDir} />
          </div>
        </main>
      </div>

      {/* ── Desktop & Mobile Music Player ── */}
      <div className="w-full flex-shrink-0 bg-[#0c0c0e]/95 backdrop-blur-md border-t border-slate-900 z-50 sm:fixed sm:bottom-4 sm:right-4 sm:w-72 lg:w-80 sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:flex-shrink">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="max-w-md mx-auto sm:max-w-none"
        >
          <NeonMusicPlayer playLoseTrack={gameState.status === 'GAMEOVER'} isGameStarted={gameState.status === 'PLAYING'} />
        </motion.div>
      </div>

      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
    </div>
  );
}
