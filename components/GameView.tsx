
import React, { useRef, useEffect, useState } from 'react';
import { Vector2D, FoodItem, RabbitState, GameStatus } from '../types';
import { playHopSound, playEatSound, playBombSound } from '../services/sfxService';

interface Particle {
  id: string;
  pos: Vector2D;
  velocity: Vector2D;
  color: string;
  life: number;
  decay: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'confetti' | 'leaf' | 'explosion' | 'heart';
}

interface SceneryObject {
  id: string;
  worldX: number;
  type: 'pine' | 'birch' | 'flower' | 'grass' | 'bush';
  flowerType?: 'azalea' | 'jasmine' | 'poppy' | 'lavender';
  color?: string;
  scale: number;
  y: number;
  parallax: number;
}

interface GameViewProps {
  status: GameStatus;
  score: number;
  energy: number;
  onScoreIncrement: () => void;
  onScoreDecrement: () => void;
}

const GRAVITY = 0.45;
const PARTICLE_COLORS = ['#FFD1DC', '#FFB7C5', '#FF7F50', '#FFFF99', '#98FB98', '#AFEEEE', '#DDA0DD'];
const EXPLOSION_COLORS = ['#ff5722', '#f44336', '#ffeb3b', '#212121', '#757575'];

const GameView: React.FC<GameViewProps> = ({ status, score, energy, onScoreIncrement, onScoreDecrement }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const foodsRef = useRef<FoodItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const throwCounterRef = useRef(0);
  const lastScoreRef = useRef(0);
  
  const rabbitRef = useRef<RabbitState>({
    id: 'rabbit',
    pos: { x: 0, y: 0 },
    size: 80,
    frame: 0,
    hopPhase: 0,
    isEating: false,
    eatTimer: 0,
    mood: 'neutral',
    celebrationTimer: 0
  });

  const sceneryRef = useRef<SceneryObject[]>([]);
  const worldDistRef = useRef(0);
  const backpackPos = { x: 80, y: windowSize.h - 80 };

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    const initial: SceneryObject[] = [];
    for(let i = 0; i < 100; i++) {
      const type = ['pine', 'birch', 'flower', 'grass', 'bush'][Math.floor(Math.random() * 5)] as any;
      const s = createScenery(type, Math.random() * window.innerWidth * 3);
      initial.push(s);
    }
    sceneryRef.current = initial;

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (score > 0 && score % 10 === 0 && score !== lastScoreRef.current) {
      rabbitRef.current.mood = 'celebrating';
      rabbitRef.current.celebrationTimer = 2000;
      lastScoreRef.current = score;
    }
  }, [score]);

  const createScenery = (type: SceneryObject['type'], xOffset: number): SceneryObject => {
    const horizon = windowSize.h * 0.6;
    let yPos = horizon;
    let parallax = 1.0;
    let scale = 1.0;
    let color = '';
    let flowerType: SceneryObject['flowerType'];

    if (type === 'pine') {
      parallax = 0.15 + Math.random() * 0.2;
      yPos = horizon - 15 - Math.random() * 40;
      scale = 0.4 + Math.random() * 0.6;
    } else if (type === 'birch') {
      parallax = 0.5 + Math.random() * 0.3;
      yPos = horizon + Math.random() * 25;
      scale = 0.6 + Math.random() * 0.7;
    } else if (type === 'bush') {
      parallax = 0.8 + Math.random() * 0.4;
      yPos = horizon + 40 + Math.random() * 100;
      scale = 0.5 + Math.random() * 0.8;
      const greens = ['#2d5a27', '#1e4620', '#386641', '#6a994e'];
      color = greens[Math.floor(Math.random() * greens.length)];
    } else if (type === 'grass') {
      const depthRoll = Math.random();
      if (depthRoll > 0.85) {
        parallax = 1.8 + Math.random() * 0.8;
        yPos = windowSize.h - 30 - Math.random() * 80;
        scale = 1.8 + Math.random() * 1.5;
      } else {
        parallax = 1.0 + (Math.random() - 0.5) * 0.1;
        yPos = horizon + 70 + Math.random() * 120;
        scale = 0.5 + Math.random() * 0.6;
      }
    } else {
      parallax = 0.9 + Math.random() * 0.2;
      yPos = horizon + 80 + Math.random() * 120;
      scale = 0.4 + Math.random() * 0.5;
      const fTypes: SceneryObject['flowerType'][] = ['azalea', 'jasmine', 'poppy', 'lavender'];
      flowerType = fTypes[Math.floor(Math.random() * fTypes.length)];
    }

    const worldX = (worldDistRef.current * parallax) + xOffset;

    return {
      id: Math.random().toString(), 
      worldX, 
      type,
      flowerType,
      color,
      scale,
      y: yPos, 
      parallax
    };
  };

  const spawnParticles = (x: number, y: number, type: 'confetti' | 'explosion' | 'heart') => {
    const count = type === 'explosion' ? 40 : (type === 'heart' ? 3 : 25);
    const colors = type === 'explosion' ? EXPLOSION_COLORS : (type === 'heart' ? ['#f06292', '#ec407a'] : PARTICLE_COLORS);
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        velocity: { 
          x: (Math.random() - 0.5) * (type === 'explosion' ? 18 : (type === 'heart' ? 4 : 14)), 
          y: (Math.random() - 0.5) * (type === 'explosion' ? 18 : (type === 'heart' ? 4 : 14)) - (type === 'explosion' ? 10 : (type === 'heart' ? 10 : 8)) 
        },
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0, decay: 0.015 + Math.random() * 0.02, size: (type === 'explosion' ? 8 : (type === 'heart' ? 15 : 5)) + Math.random() * 7,
        rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.3, type
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    const render = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateGame(dt, time);
      drawGame(ctx, time);
      animationFrameId = requestAnimationFrame(render);
    };

    const updateGame = (dt: number, time: number) => {
      const rabbit = rabbitRef.current;
      const isPlaying = status === GameStatus.PLAYING;
      const speed = isPlaying ? 7 : 1.5;
      worldDistRef.current += speed;
      
      const hopFreq = isPlaying ? 0.22 : 0.05;
      const prevPhase = rabbit.hopPhase;
      rabbit.hopPhase += (rabbit.mood === 'celebrating' ? hopFreq * 1.5 : hopFreq);
      
      if (isPlaying && Math.floor(rabbit.hopPhase / Math.PI) > Math.floor(prevPhase / Math.PI)) {
        playHopSound();
      }

      const wiggleRange = canvas.width * 0.3;
      rabbit.pos.x = canvas.width / 2 + Math.sin(rabbit.hopPhase * 0.4) * wiggleRange;
      const roadY = canvas.height * 0.75;
      const baseJumpHeight = isPlaying ? Math.abs(Math.sin(rabbit.hopPhase)) * 65 : 0;
      const extraJump = rabbit.mood === 'celebrating' ? 40 : 0;
      rabbit.pos.y = roadY - (baseJumpHeight + extraJump) + Math.sin(time * 0.01) * 3;

      if (rabbit.isEating) {
        rabbit.eatTimer -= dt;
        if (rabbit.eatTimer <= 0) rabbit.isEating = false;
      }

      if (rabbit.celebrationTimer > 0) {
        rabbit.celebrationTimer -= dt;
        if (Math.random() > 0.92) spawnParticles(rabbit.pos.x, rabbit.pos.y - 40, 'heart');
        if (rabbit.celebrationTimer <= 0) {
            rabbit.mood = 'neutral';
        }
      } else {
        const nearestBomb = foodsRef.current.find(f => f.type === 'bomb' && Math.abs(f.pos.x - rabbit.pos.x) < 250);
        rabbit.mood = nearestBomb ? 'scared' : 'neutral';
      }

      sceneryRef.current = sceneryRef.current.filter(s => {
        const screenX = s.worldX - (worldDistRef.current * s.parallax);
        return screenX > -800;
      });

      if (sceneryRef.current.length < 120) {
        const types: SceneryObject['type'][] = ['pine', 'birch', 'flower', 'grass', 'bush'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        sceneryRef.current.push(createScenery(randomType, canvas.width + Math.random() * 400));
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.pos.x += p.velocity.x; p.pos.y += p.velocity.y; p.rotation += p.rotationSpeed; p.life -= p.decay;
        if (p.type !== 'leaf' && p.type !== 'heart') p.velocity.y += 0.3;
        if (p.type === 'heart') p.velocity.y -= 0.1;
        return p.life > 0;
      });

      foodsRef.current = foodsRef.current.filter(food => {
        food.velocity.y += GRAVITY; food.pos.x += food.velocity.x; food.pos.y += food.velocity.y;
        food.rotation += food.rotationSpeed;
        const dx = food.pos.x - rabbit.pos.x, dy = food.pos.y - (rabbit.pos.y - 20);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 45 && !rabbit.isEating) {
          if (food.type === 'bomb') {
            onScoreDecrement();
            playBombSound();
            spawnParticles(food.pos.x, food.pos.y, 'explosion');
          } else {
            onScoreIncrement();
            playEatSound();
            spawnParticles(food.pos.x, food.pos.y, 'confetti');
          }
          rabbit.isEating = true; rabbit.eatTimer = 700;
          return false;
        }
        return food.pos.y < canvas.height + 100;
      });
    };

    const drawGame = (ctx: CanvasRenderingContext2D, time: number) => {
      const w = canvas.width, h = canvas.height;
      drawClouds(ctx, time);
      drawPath(ctx, w, h);
      
      const sortedScenery = [...sceneryRef.current].sort((a, b) => a.parallax - b.parallax);
      
      sortedScenery.forEach(s => {
        const finalX = s.worldX - (worldDistRef.current * s.parallax);
        if (finalX < -600 || finalX > w + 600) return;
        
        if (s.type === 'pine') drawPineTree(ctx, finalX, s.y, s.scale);
        else if (s.type === 'birch') drawBirchTree(ctx, finalX, s.y, s.scale);
        else if (s.type === 'flower') drawFlowerCluster(ctx, finalX, s.y, s.scale, s.flowerType!);
        else if (s.type === 'grass') drawGrassCluster(ctx, finalX, s.y, s.scale, time);
        else if (s.type === 'bush') drawBush(ctx, finalX, s.y, s.scale, s.color!);
      });

      drawRabbit(ctx, rabbitRef.current, time);
      foodsRef.current.forEach(food => drawFood(ctx, food, time));
      drawParticles(ctx);
      drawBackpack(ctx, backpackPos);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, score, onScoreIncrement, onScoreDecrement, backpackPos.x, backpackPos.y, windowSize]);

  const drawBush = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = color;
    const circles = [
      { x: 0, y: 0, r: 25 }, { x: -18, y: 5, r: 20 }, { x: 18, y: 5, r: 20 },
      { x: -10, y: -12, r: 18 }, { x: 10, y: -12, r: 18 }
    ];
    circles.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    circles.forEach(c => { ctx.beginPath(); ctx.arc(c.x - c.r*0.3, c.y - c.r*0.3, c.r*0.4, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  };

  const drawGrassCluster = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const colors = ['#1b5e20', '#2e7d32', '#43a047', '#66bb6a'];
    for (let i = 0; i < 6; i++) {
        const angle = -0.3 + (i / 6) * 0.6 + Math.sin(time * 0.002 + x) * 0.05;
        const height = 15 + Math.sin(i * 10) * 8;
        ctx.save(); ctx.rotate(angle); ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2, -height / 2, 0, -height); ctx.quadraticCurveTo(2, -height / 2, 0, 0); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
  };

  const drawPineTree = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const trunkGrad = ctx.createLinearGradient(-10, 0, 10, 0);
    trunkGrad.addColorStop(0, '#2e1d13'); trunkGrad.addColorStop(0.5, '#4e342e'); trunkGrad.addColorStop(1, '#2e1d13');
    ctx.fillStyle = trunkGrad; ctx.fillRect(-10, -5, 20, 60);
    for (let i = 0; i < 4; i++) {
      const layerY = -120 + i * 35; const layerW = 65 - i * 10;
      ctx.fillStyle = '#102518'; ctx.beginPath(); ctx.moveTo(0, layerY - 10); ctx.lineTo(layerW + 8, layerY + 35); ctx.lineTo(-(layerW + 8), layerY + 35); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1b3022'; ctx.beginPath(); ctx.moveTo(0, layerY);
      for(let j = 0; j <= 12; j++) {
          const px = -layerW + (layerW * 2 * (j/12)); const py = layerY + 40 + (j % 2 === 0 ? 6 : 0);
          ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  const drawBirchTree = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const trunkGrad = ctx.createLinearGradient(-8, 0, 8, 0);
    trunkGrad.addColorStop(0, '#e8e8e8'); trunkGrad.addColorStop(0.3, '#ffffff'); trunkGrad.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = trunkGrad; ctx.fillRect(-8, -160, 16, 160);
    ctx.fillStyle = '#222';
    for(let j=0; j<18; j++) {
      const dashY = -155 + j * 9; const dashW = 5 + Math.random() * 10;
      const dashX = (j % 2 === 0 ? -8 : 8 - dashW); ctx.fillRect(dashX, dashY, dashW, 1.8);
    }
    const drawLeafCloud = (cx: number, cy: number, r: number, c: string) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    };
    drawLeafCloud(0, -170, 50, '#558b2f'); drawLeafCloud(-30, -155, 38, '#689f38'); drawLeafCloud(30, -155, 38, '#689f38');
    ctx.restore();
  };

  const drawFlowerCluster = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, type: SceneryObject['flowerType']) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    let mainColor = '#fbc02d'; let accentColor = '#fff59d'; let petalCount = 5;
    if (type === 'azalea') { mainColor = '#c2185b'; accentColor = '#f06292'; }
    else if (type === 'poppy') { mainColor = '#d32f2f'; accentColor = '#212121'; petalCount = 4; }
    else if (type === 'lavender') { mainColor = '#7b1fa2'; accentColor = '#e1bee7'; petalCount = 3; }
    for(let i=0; i < (type === 'lavender' ? 8 : 4); i++) {
      const ox = (i - 2) * 12, oy = Math.sin(i * 1.5) * 8;
      ctx.save(); ctx.translate(ox, oy);
      if (type === 'lavender') {
        ctx.fillStyle = mainColor; ctx.beginPath(); ctx.ellipse(0, -5, 5, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = accentColor; ctx.beginPath(); ctx.ellipse(0, -10, 3, 6, 0, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle = mainColor;
        for(let j=0; j<petalCount; j++) {
          const angle = (j / petalCount) * Math.PI * 2;
          ctx.beginPath(); ctx.ellipse(Math.cos(angle)*8, Math.sin(angle)*8, 7, 7, 0, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = accentColor; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  };

  const drawPath = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const horizon = h * 0.6, roadTop = h * 0.7, roadBottom = h * 0.85;
    const forestGrad = ctx.createLinearGradient(0, horizon, 0, roadTop);
    forestGrad.addColorStop(0, '#0a3d0a'); forestGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = forestGrad; ctx.fillRect(0, horizon, w, roadTop - horizon);
    ctx.fillStyle = '#2e7d32'; ctx.fillRect(0, roadBottom, w, h - roadBottom);
    const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    roadGrad.addColorStop(0, '#4e342e'); roadGrad.addColorStop(0.5, '#5d4037'); roadGrad.addColorStop(1, '#3e2723');
    ctx.fillStyle = roadGrad; ctx.fillRect(0, roadTop, w, roadBottom - roadTop);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, roadTop); ctx.lineTo(w, roadTop); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, roadBottom); ctx.lineTo(w, roadBottom); ctx.stroke();
  };

  const drawRabbit = (ctx: CanvasRenderingContext2D, r: RabbitState, time: number) => {
    ctx.save(); ctx.translate(r.pos.x, r.pos.y);
    const hop = Math.abs(Math.sin(r.hopPhase));
    const hopV = Math.cos(r.hopPhase); // Approximates vertical velocity for ear lag
    
    if (r.mood === 'scared') ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    
    ctx.scale(1 + hop*0.08, 1 - hop*0.05);
    const bodyGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
    bodyGrad.addColorStop(0, '#ffffff'); bodyGrad.addColorStop(1, '#fce4ec');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 10;
    
    // Body
    ctx.beginPath(); ctx.ellipse(-5, 10, 50, 35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Tail: Dynamic fluffy tail
    const drawTail = () => {
        ctx.save();
        ctx.translate(-55, 10);
        // Tail wags during celebration
        if (r.mood === 'celebrating') {
            ctx.rotate(Math.sin(time * 0.05) * 0.4);
        } else {
            ctx.rotate(hopV * 0.1); // Lag with hop
        }
        ctx.fillStyle = '#ffffff';
        // Cluster of circles for "pom-pom" fluff
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-6, -4, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -6, 9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    };
    drawTail();

    // Head
    ctx.beginPath(); ctx.ellipse(35, -5, 30, 32, 0, 0, Math.PI * 2); ctx.fill();

    // Face details
    if (r.mood === 'celebrating') {
        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath(); ctx.arc(45, 5, 6, 0, Math.PI * 2); ctx.fill();
    }

    // Whiskers: Subtle twitching lines
    const drawWhiskers = () => {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
        const twitch = Math.sin(time * 0.01) * 0.05;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath(); ctx.moveTo(55, 0); ctx.lineTo(75, i * 10 + twitch * 20); ctx.stroke();
        }
    };
    drawWhiskers();

    // Legs
    ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff';
    const legOffset = Math.sin(r.hopPhase * 2) * 10;
    ctx.beginPath(); ctx.moveTo(-25, 30); ctx.lineTo(-35 + legOffset, 45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 30); ctx.lineTo(25 - legOffset, 45); ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1a1a1a';
    if (r.mood === 'scared') {
        ctx.beginPath(); ctx.arc(45, -12, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(50, -15, 4, 0, Math.PI * 2); ctx.fill();
    } else if (r.mood === 'celebrating') {
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(45, -10, 8, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.arc(45, -12, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(48, -15, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Nose
    ctx.fillStyle = '#f06292'; ctx.beginPath(); ctx.arc(62, -5, 4, 0, Math.PI * 2); ctx.fill();

    // Ears: Dynamic ears with lag and rotation
    const drawEar = (ox: number, oy: number, baseAngle: number, isBehind: boolean) => {
        ctx.save(); ctx.translate(ox, oy); 
        
        let finalAngle = baseAngle;
        if (r.mood === 'scared') {
            finalAngle += 1.4; // Pinned back
        } else if (r.mood === 'celebrating') {
            finalAngle += Math.sin(time * 0.02) * 0.2; // Wiggle fast
        } else {
            finalAngle += hopV * 0.3; // Physics lag: ears flop back when ascending
        }
        
        ctx.rotate(finalAngle);
        ctx.fillStyle = isBehind ? '#e1e1e1' : '#ffffff';
        ctx.beginPath(); ctx.ellipse(0, -35, 12, 38, 0, 0, Math.PI * 2); ctx.fill();
        // Inner ear
        ctx.fillStyle = isBehind ? '#d1d1d1' : '#fce4ec';
        ctx.beginPath(); ctx.ellipse(0, -38, 6, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    };
    drawEar(35, -25, 0.15, true); 
    drawEar(25, -25, -0.1, false);
    ctx.restore();
  };

  const drawBackpack = (ctx: CanvasRenderingContext2D, pos: Vector2D) => {
    ctx.save(); ctx.translate(pos.x, pos.y);
    const redGrad = ctx.createLinearGradient(-40, -50, 40, 50);
    redGrad.addColorStop(0, '#f44336'); redGrad.addColorStop(1, '#b71c1c');
    ctx.fillStyle = redGrad; ctx.beginPath(); ctx.roundRect(-45, -60, 90, 110, 15); ctx.fill();
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.roundRect(-48, -65, 96, 35, 12); ctx.fill();
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.roundRect(-52, 10, 15, 40, 5); ctx.roundRect(37, 10, 15, 40, 5); ctx.fill();
    ctx.restore();
  };

  const drawFood = (ctx: CanvasRenderingContext2D, f: FoodItem, time: number) => {
    ctx.save(); ctx.translate(f.pos.x, f.pos.y); ctx.rotate(f.rotation);
    if (f.type === 'bomb') {
      ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(-7, -7, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#795548'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(10, -35, 20, -30); ctx.stroke();
      const sparkSize = 4 + Math.sin(time * 0.05) * 2;
      ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(20, -30, sparkSize, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#fb8c00'; ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(14, 20); ctx.lineTo(-14, 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(0, -28, 8, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(p => {
      ctx.save(); ctx.translate(p.pos.x, p.pos.y); ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      if (p.type === 'heart') {
        const size = p.size; ctx.beginPath(); ctx.moveTo(0, size / 4);
        ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, size / 4);
        ctx.bezierCurveTo(-size / 2, size / 2, 0, size * 0.75, 0, size);
        ctx.bezierCurveTo(0, size * 0.75, size / 2, size / 2, size / 2, size / 4);
        ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size / 4); ctx.fill();
      } else { ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size/2); }
      ctx.restore();
    });
  };

  const drawClouds = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 5; i++) {
      const x = ((time * 0.007 + i * 550) % (ctx.canvas.width + 800)) - 400;
      const y = 60 + (i % 3) * 80;
      ctx.beginPath(); ctx.arc(x, y, 45, 0, Math.PI*2); ctx.arc(x+45, y-25, 60, 0, Math.PI*2); ctx.arc(x+90, y, 45, 0, Math.PI*2); ctx.fill();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (status !== GameStatus.PLAYING) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const tx = e.clientX - rect.left, ty = e.clientY - rect.top;
    const dx = tx - backpackPos.x, dy = ty - backpackPos.y;
    throwCounterRef.current++;
    let bombInterval = 12;
    if (score >= 40) bombInterval = 4;
    else if (score >= 30) bombInterval = 6;
    else if (score >= 20) bombInterval = 8;
    else if (score >= 10) bombInterval = 10;
    const isBomb = throwCounterRef.current % bombInterval === 0;
    foodsRef.current.push({
      id: Math.random().toString(), pos: { ...backpackPos },
      velocity: { x: dx * 0.05, y: dy * 0.05 - 20 },
      gravity: GRAVITY, size: 35, type: isBomb ? 'bomb' : 'carrot', 
      rotation: 0, rotationSpeed: Math.random()*0.7-0.35
    });
  };

  return <canvas ref={canvasRef} onClick={handleCanvasClick} className="block w-full h-full cursor-crosshair" />;
};

export default GameView;
