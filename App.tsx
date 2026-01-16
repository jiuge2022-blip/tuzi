
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameView from './components/GameView';
import MusicPlayer from './components/MusicPlayer';
import { GameStatus } from './types';
import { getRabbitWisdom } from './services/geminiService';

const INITIAL_ENERGY = 100;
const ENERGY_DRAIN_RATE = 6;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(INITIAL_ENERGY);
  const [wisdom, setWisdom] = useState<string>("Hi! Feed me? 🐰✨");
  const [isWisdomLoading, setIsWisdomLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Track last wisdom fetch to prevent overlapping calls
  const lastFetchTime = useRef<number>(0);

  const fetchWisdom = useCallback(async (currentScore: number) => {
    const now = Date.now();
    // Simple throttle: don't fetch more than once every 3 seconds
    if (now - lastFetchTime.current < 3000) return;
    
    lastFetchTime.current = now;
    setIsWisdomLoading(true);
    const msg = await getRabbitWisdom(currentScore);
    setWisdom(msg);
    setIsWisdomLoading(false);
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (status === GameStatus.PLAYING) {
      interval = window.setInterval(() => {
        setEnergy((prev) => {
          const next = prev - (ENERGY_DRAIN_RATE / 10);
          if (next <= 0) {
            setStatus(GameStatus.GAMEOVER);
            fetchWisdom(score);
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status, score, fetchWisdom]);

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
    setEnergy((prev) => Math.min(INITIAL_ENERGY, prev + 12));
    // Trigger wisdom every 5 points
    if (newScore > 0 && newScore % 5 === 0) fetchWisdom(newScore);
  }, [fetchWisdom]);

  const handleScoreDecrement = useCallback(() => {
    setScore((prev) => Math.max(0, prev - 5));
    setEnergy((prev) => Math.max(0, prev - 15));
    setWisdom("BOOM! That hurt... -5 points! 💣💥");
  }, []);

  const startGame = () => {
    setScore(0);
    setEnergy(INITIAL_ENERGY);
    setWisdom("Let's hop! 🥕✨");
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="relative w-screen h-screen bg-sky-300 overflow-hidden select-none">
      <MusicPlayer isPlaying={status !== GameStatus.START} isMuted={isMuted} isGameOver={status === GameStatus.GAMEOVER} />

      <GameView 
        status={status} 
        score={score}
        energy={energy} 
        onScoreIncrement={() => handleScoreChange(score + 1)} 
        onScoreDecrement={handleScoreDecrement}
      />

      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-3xl shadow-xl border-4 border-amber-500/20">
            <p className="text-2xl font-black text-amber-600 drop-shadow-sm">SCORE: {score}</p>
          </div>
          <div className="w-48 h-5 bg-black/10 rounded-full p-1 border-2 border-white/50 backdrop-blur-sm">
            <div className={`h-full rounded-full transition-all duration-300 ${energy > 30 ? 'bg-gradient-to-r from-emerald-400 to-green-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-rose-400 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} style={{ width: `${energy}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/95 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-transform">{isMuted ? '🔇' : '🔊'}</button>
          <div className="max-w-xs bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-xl border-4 border-amber-200 animate-bounce-slow relative">
            <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l-4 border-t-4 border-amber-200 rotate-[-45deg]" />
            <p className="text-gray-700 font-bold italic text-sm text-center leading-relaxed">{isWisdomLoading ? "🐰💭..." : `"${wisdom}"`}</p>
          </div>
        </div>
      </div>

      {/* Main Menus */}
      {(status === GameStatus.START || status === GameStatus.GAMEOVER) && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center max-w-md border-[14px] border-amber-100 animate-in zoom-in duration-300">
            <div className="text-8xl mb-6 drop-shadow-xl animate-bounce-slow">🐰</div>
            <h1 className="text-5xl font-black text-amber-600 mb-2 leading-tight">
              {status === GameStatus.START ? "FOREST FEAST" : "POOPED OUT!"}
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest mb-10 text-xs">
              {status === GameStatus.START ? "A hopping great adventure" : `Final Score: ${score}`}
            </p>
            
            <div className="flex flex-col gap-5">
              <button onClick={startGame} className="bg-amber-500 hover:bg-amber-600 text-white text-3xl font-black py-6 px-14 rounded-full transition-all hover:scale-105 shadow-[0_12px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-none">
                {status === GameStatus.START ? "START HOP!" : "TRY AGAIN!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
