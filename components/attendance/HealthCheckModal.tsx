'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  HeartPulse,
  CheckCircle2,
  Sparkles,
  Droplets,
  Activity,
  Smile,
  Clock,
  Volume2,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface HealthQuote {
  id: number;
  emoji: string;
  title: string;
  description: string;
  category: 'eyes' | 'hydration' | 'movement' | 'ergonomics' | 'screen' | 'mind';
}

const HEALTH_CHECKLIST: HealthQuote[] = [
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

export function HealthCheckModal() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [activeGifIndex, setActiveGifIndex] = useState<'stretch' | 'water'>('stretch');
  const [nextCheckInMinutes, setNextCheckInMinutes] = useState<number>(60);

  // Trigger modal function
  const triggerModal = useCallback(() => {
    setIsOpen(true);
    setCompletedItems([]);
  }, []);

  // Listen for custom trigger event (e.g. from header button or developer test)
  useEffect(() => {
    const handleCustomTrigger = () => triggerModal();
    window.addEventListener('ambizcon_trigger_health_check', handleCustomTrigger);
    return () => {
      window.removeEventListener('ambizcon_trigger_health_check', handleCustomTrigger);
    };
  }, [triggerModal]);

  // Hourly Clock-in / Login Timer Engine
  useEffect(() => {
    if (!currentUser) return;

    const ONE_HOUR_MS = 60 * 60 * 1000; // 3600 seconds
    const storageKeyLast = `ambizcon_last_health_check_${currentUser._id}`;
    const shiftStorageKey = `ambizcon_shift_${currentUser._id}`;

    // Helper to evaluate if 1 hour has elapsed
    const checkHourlyInterval = () => {
      const now = Date.now();
      const lastCheckStr = localStorage.getItem(storageKeyLast);
      const shiftStr = localStorage.getItem(shiftStorageKey);

      let isClockedIn = false;
      let clockInTimestamp: number | null = null;

      if (shiftStr) {
        try {
          const shiftData = JSON.parse(shiftStr);
          isClockedIn = Boolean(shiftData.isClockedIn);
          clockInTimestamp = shiftData.clockInTimestamp ? Number(shiftData.clockInTimestamp) : null;
        } catch (e) {}
      }

      // Check if user has last check timestamp
      if (lastCheckStr) {
        const lastCheckTime = Number(lastCheckStr);
        const elapsed = now - lastCheckTime;
        const remainingMs = Math.max(0, ONE_HOUR_MS - elapsed);
        setNextCheckInMinutes(Math.ceil(remainingMs / 60000));

        if (elapsed >= ONE_HOUR_MS) {
          triggerModal();
        }
      } else {
        // No previous check recorded: use clock-in time if available, or session initialization
        if (isClockedIn && clockInTimestamp) {
          const elapsed = now - clockInTimestamp;
          const remainingMs = Math.max(0, ONE_HOUR_MS - elapsed);
          setNextCheckInMinutes(Math.ceil(remainingMs / 60000));

          if (elapsed >= ONE_HOUR_MS) {
            triggerModal();
          }
        } else {
          // Initialize last check timestamp on first session start
          localStorage.setItem(storageKeyLast, now.toString());
          setNextCheckInMinutes(60);
        }
      }
    };

    // Run check immediately on mount and then every 15 seconds
    checkHourlyInterval();
    const interval = setInterval(checkHourlyInterval, 15000);

    return () => clearInterval(interval);
  }, [currentUser, triggerModal]);

  // Toggle checklist item
  const toggleItem = (id: number) => {
    setCompletedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Mark all completed
  const handleCheckAll = () => {
    setCompletedItems(HEALTH_CHECKLIST.map((h) => h.id));
  };

  // User clicked "Done"
  const handleDone = () => {
    if (currentUser) {
      const storageKeyLast = `ambizcon_last_health_check_${currentUser._id}`;
      localStorage.setItem(storageKeyLast, Date.now().toString());
    }
    setIsOpen(false);
    toast.success('Health Check Complete! 🎉', {
      description: 'Awesome job refreshing your body and eyes. Next check scheduled in 1 hour.',
      duration: 5000,
    });
  };

  if (!currentUser) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      maxWidth="xl"
    >
      <div className="space-y-5 py-1">
        {/* Header Ribbon & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="h-3 w-3 text-emerald-500 animate-pulse" />
                Hourly Workspace Wellness
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                Every 1 Hour
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 tracking-tight">
              👨‍💻 Quick Health Check
            </h2>
            <p className="text-xs text-muted-foreground">
              Take 60 seconds to reset your posture, stretch muscles, and rest your eyes before continuing your tasks.
            </p>
          </div>

          {/* Quick GIF Theme Switcher */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl self-start sm:self-auto border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
            <button
              type="button"
              onClick={() => setActiveGifIndex('stretch')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeGifIndex === 'stretch'
                  ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-3 w-3 text-emerald-500" />
              Stretches
            </button>
            <button
              type="button"
              onClick={() => setActiveGifIndex('water')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeGifIndex === 'water'
                  ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Droplets className="h-3 w-3 text-blue-500" />
              Hydration
            </button>
          </div>
        </div>

        {/* Center Animated GIF Display Card */}
        <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between shadow-inner">
          <div className="w-full sm:w-1/2 h-44 sm:h-48 relative bg-zinc-900/60 flex items-center justify-center overflow-hidden">
            <img
              src={activeGifIndex === 'stretch' ? '/health-stretch.gif' : '/drink-water.gif'}
              alt={activeGifIndex === 'stretch' ? 'Office Stretch Demonstration' : 'Drink Water Reminder'}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-transparent to-background/30" />
          </div>

          <div className="w-full sm:w-1/2 p-4 sm:p-5 space-y-2 bg-gradient-to-br from-emerald-500/5 via-brand-500/5 to-purple-500/5">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ergonomic Habit Builder</span>
            </div>
            <h4 className="text-sm font-bold text-foreground">
              {activeGifIndex === 'stretch'
                ? 'Relieve Spine & Shoulder Tension'
                : 'Keep Brain Hydrated & Clear'}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {activeGifIndex === 'stretch'
                ? 'Micro-breaks boost overall coding stamina by up to 28% and relieve musculoskeletal strain from sitting.'
                : 'Even mild dehydration reduces mental concentration by 15%. Grab your water bottle and take a sip now!'}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                Goal: 60 sec pause
              </span>
              <button
                type="button"
                onClick={handleCheckAll}
                className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Mark all done
              </button>
            </div>
          </div>
        </div>

        {/* 10 Quick Health Check Points */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs px-1 text-muted-foreground pb-1">
            <span className="font-bold text-foreground">10 Health Checkpoints</span>
            <span className="font-mono text-[11px]">
              {completedItems.length} of {HEALTH_CHECKLIST.length} completed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {HEALTH_CHECKLIST.map((item) => {
              const isChecked = completedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-foreground'
                      : 'border-zinc-200/70 dark:border-zinc-800/70 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-center text-lg shrink-0 pt-0.5 select-none">
                    {item.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-muted-foreground select-none">
                        {item.id}.
                      </span>
                      <h4
                        className={`text-xs font-extrabold ${
                          isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 transition-all border ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-700 bg-background hover:border-emerald-500'
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions: Prominent DONE Button */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            <span>Next automatic alert in <strong>60 minutes</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-1/3 sm:w-auto text-xs"
            >
              Remind Later
            </Button>
            <Button
              type="button"
              onClick={handleDone}
              size="default"
              className="flex-1 sm:flex-initial ambizcon-gradient text-white font-extrabold text-xs shadow-glow px-6 py-2.5 rounded-xl gap-2 hover:opacity-95 transition-transform active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Done (I&apos;m Refreshed &amp; Ready)</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
