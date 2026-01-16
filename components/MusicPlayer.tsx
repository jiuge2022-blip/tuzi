
import React, { useEffect, useRef, useState } from 'react';

interface MusicPlayerProps {
  isPlaying: boolean;
  isMuted: boolean;
  isGameOver: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ isPlaying, isMuted, isGameOver }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const timerRef = useRef<number | null>(null);

  // Simple pentatonic scale for a charming "forest" feel
  const melody = [523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33]; // C5, D5, E5, G5, A5...
  const bass = [130.81, 146.83, 164.81, 196.00]; // C3, D3, E3, G3
  
  let step = 0;

  const playNote = (freq: number, startTime: number, duration: number, volume: number) => {
    if (!audioCtxRef.current || !gainNodeRef.current || !filterNodeRef.current) return;

    const osc = audioCtxRef.current.createOscillator();
    const noteGain = audioCtxRef.current.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(filterNodeRef.current);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const scheduler = () => {
    if (!audioCtxRef.current) return;

    const tempo = isGameOver ? 80 : 120; // Slower tempo when game over
    const secondsPerBeat = 60.0 / tempo;
    const lookahead = 0.1;
    const scheduleUntil = audioCtxRef.current.currentTime + lookahead;

    while (audioCtxRef.current.currentTime < scheduleUntil) {
      const startTime = audioCtxRef.current.currentTime + 0.1;
      
      // Play Melody
      playNote(melody[step % melody.length], startTime, secondsPerBeat * 0.8, 0.1);

      // Play Bass every 4 beats
      if (step % 4 === 0) {
        playNote(bass[(step / 4) % bass.length], startTime, secondsPerBeat * 2, 0.15);
      }

      step++;
      // Set the next timeout based on tempo
      const nextNoteTime = secondsPerBeat * 1000;
      timerRef.current = window.setTimeout(scheduler, nextNoteTime);
      break; 
    }
  };

  useEffect(() => {
    if (isPlaying && !isMuted) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioCtxRef.current.createGain();
        filterNodeRef.current = audioCtxRef.current.createBiquadFilter();
        
        filterNodeRef.current.type = 'lowpass';
        filterNodeRef.current.frequency.setValueAtTime(2000, audioCtxRef.current.currentTime);
        
        gainNodeRef.current.connect(audioCtxRef.current.destination);
        filterNodeRef.current.connect(gainNodeRef.current);
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      scheduler();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        // We don't close, just stop scheduling
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, isMuted]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : 0.5;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.1);
    }
  }, [isMuted]);

  useEffect(() => {
    if (filterNodeRef.current && audioCtxRef.current) {
      const freq = isGameOver ? 600 : 2000; // Muffled sound for game over
      filterNodeRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.5);
    }
  }, [isGameOver]);

  return null;
};

export default MusicPlayer;
