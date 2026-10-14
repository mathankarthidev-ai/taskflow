'use client';

import React from 'react';

export interface HealthQuote {
  id: number;
  emoji: string;
  title: string;
  description: string;
  category: 'eyes' | 'hydration' | 'movement' | 'ergonomics' | 'screen' | 'mind';
}

export const HEALTH_CHECKLIST: HealthQuote[] = [
  {
    id: 1,
    emoji: '👀',
    title: 'Blink 3 times now.',
    description: 'Relieves eye strain and prevents dry eyes from screen focus.',
    category: 'eyes',
  },
  {
    id: 2,
    emoji: '💧',
    title: 'Drink some water now.',
    description: 'Keep your body hydrated to maintain peak mental focus.',
    category: 'hydration',
  },
  {
    id: 3,
    emoji: '🔄',
    title: 'Rotate your head and hands 5 times.',
    description: 'Releases neck tension, relieves wrist stiffness, and boosts circulation.',
    category: 'movement',
  },
  {
    id: 4,
    emoji: '💻',
    title: 'Keep the screen at least 50 cm away.',
    description: 'Optimal distance protects your vision and prevents headaches.',
    category: 'screen',
  },
  {
    id: 5,
    emoji: '💡',
    title: 'Keep screen brightness comfortable.',
    description: 'Match screen brightness to your surrounding workspace ambient light.',
    category: 'screen',
  },
  {
    id: 6,
    emoji: '👁️',
    title: 'Look away from the screen while thinking or debugging.',
    description: 'Follow the 20-20-20 rule to rest your optical focus.',
    category: 'eyes',
  },
  {
    id: 7,
    emoji: '🖥️',
    title: 'Keep the top of your screen near eye level.',
    description: 'Prevents chronic neck bending and cervical spine fatigue.',
    category: 'ergonomics',
  },
  {
    id: 8,
    emoji: '🌤️',
    title: 'Keep your room properly lit and reduce screen glare.',
    description: 'Soft, indirect light reduces contrast fatigue on your retinas.',
    category: 'screen',
  },
  {
    id: 9,
    emoji: '🪑',
    title: 'Keep your back supported and feet flat on the floor.',
    description: 'Promotes healthy posture, spine alignment, and lower back comfort.',
    category: 'ergonomics',
  },
  {
    id: 10,
    emoji: '📱',
    title: 'During breaks, avoid using your phone.',
    description: 'Give your brain and optical nerves a genuine digital rest.',
    category: 'mind',
  },
];

export interface WellnessHabit {
  id: string;
  category: 'stretch' | 'water' | 'eyes' | 'wrists' | 'breathing' | 'posture' | 'movement';
  badge: string;
  title: string;
  description: string;
  goal: string;
  gif: string;
  recommendedCheckpoints?: number[];
}

export const DAILY_WELLNESS_HABITS: WellnessHabit[] = [
  {
    id: 'habit_spine_shoulder',
    category: 'stretch',
    badge: 'Ergonomic Habit Builder',
    title: 'Relieve Spine & Shoulder Tension',
    description: 'Micro-breaks boost overall coding stamina by up to 28% and relieve musculoskeletal strain from sitting.',
    goal: 'Goal: 60 sec pause',
    gif: '/health-stretch.gif',
    recommendedCheckpoints: [3, 7, 9],
  },
  {
    id: 'habit_hydration_spark',
    category: 'water',
    badge: 'Brain Fuel & Focus Booster',
    title: 'Keep Brain Hydrated & Clear',
    description: 'Even mild 1% dehydration reduces mental concentration by 15%. Grab your water bottle and take a sip now!',
    goal: 'Goal: Drink 250ml water',
    gif: '/drink-water.gif',
    recommendedCheckpoints: [2, 10],
  },
  {
    id: 'habit_optical_reset',
    category: 'eyes',
    badge: 'Optical Stamina Builder (20-20-20)',
    title: 'Optical Eye Reset & Ciliary Rest',
    description: 'Follow the 20-20-20 rule. Look at an object 20 feet away for 20 seconds. Relax your optic focus and blink 5 times.',
    goal: 'Goal: 20 sec eye rest',
    gif: '/health-stretch.gif',
    recommendedCheckpoints: [1, 6, 8],
  },
  {
    id: 'habit_wrist_carpal',
    category: 'wrists',
    badge: 'Developer Wrist & Forearm Mobility',
    title: 'Wrist Flexor & Carpal Tunnel Decompression',
    description: 'Repetitive keyboard typing causes median nerve compression. Gentle reverse wrist extension keeps tendons healthy.',
    goal: 'Goal: 45 sec stretch',
    gif: '/health-stretch.gif',
    recommendedCheckpoints: [3, 4],
  },
  {
    id: 'habit_box_breathing',
    category: 'breathing',
    badge: 'Deep Stress & Nervous System Reset',
    title: 'Diaphragmatic Box Breathing (4-4-4-4)',
    description: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Instantly lowers heart rate, regulates cortisol, and resets deep focus.',
    goal: 'Goal: 4 deep breath cycles',
    gif: '/health-stretch.gif',
    recommendedCheckpoints: [10, 3],
  },
  {
    id: 'habit_posture_alignment',
    category: 'posture',
    badge: 'Anti-Slouch Posture Alignment',
    title: 'Stand Up & Decompress Lower Back',
    description: 'Sitting exerts 40% more pressure on your spine than standing. Stand up, roll shoulders back, and stretch your hips.',
    goal: 'Goal: Stand up & stretch',
    gif: '/health-stretch.gif',
    recommendedCheckpoints: [9, 7, 4],
  },
  {
    id: 'habit_chest_opener',
    category: 'movement',
    badge: 'Circulation & Oxygenation Booster',
    title: 'Doorway Chest Opener & Neck Relief',
    description: 'Counteract the hunched desk posture. Opening your chest immediately increases oxygen intake by up to 12%.',
    goal: 'Goal: 30 sec chest open',
    gif: '/health-stretch.gif',
    recommendedCheckpoints: [3, 5, 8],
  },
];

export function getDailyHabitIndex(): number {
  if (typeof window === 'undefined') return 0;
  const dateStr = new Date().toLocaleDateString('en-CA');
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) % 100000;
  }
  return hash % DAILY_WELLNESS_HABITS.length;
}

export function getDailyShuffledCheckpoints(): HealthQuote[] {
  const dateStr = typeof window !== 'undefined' ? new Date().toLocaleDateString('en-CA') : '2026-10-14';
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 37 + dateStr.charCodeAt(i)) % 100000;
  }
  const offset = hash % HEALTH_CHECKLIST.length;
  return [...HEALTH_CHECKLIST.slice(offset), ...HEALTH_CHECKLIST.slice(0, offset)];
}

export const INTERVAL_OPTIONS = [
  { label: 'Every 30 Mins', minutes: 30 },
  { label: 'Every 1 Hour', minutes: 60 },
  { label: 'Every 2 Hours', minutes: 120 },
  { label: 'Every 4 Hours', minutes: 240 },
];

export function HealthCheckModal() {
  // Completely disabled modal popup — health check opens exclusively in navbar dropdown
  return null;
}
