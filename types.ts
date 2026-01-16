
export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  pos: Vector2D;
  size: number;
}

export interface FoodItem extends GameObject {
  velocity: Vector2D;
  gravity: number;
  type: 'carrot' | 'apple' | 'leaf' | 'bomb';
  rotation: number;
  rotationSpeed: number;
}

export interface RabbitState extends GameObject {
  frame: number;
  hopPhase: number;
  isEating: boolean;
  eatTimer: number;
  mood: 'neutral' | 'scared' | 'celebrating';
  celebrationTimer: number;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  VIDEO_GEN = 'VIDEO_GEN'
}
