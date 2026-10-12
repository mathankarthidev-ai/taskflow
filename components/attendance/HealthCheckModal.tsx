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
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';

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

export const INTERVAL_OPTIONS = [
  { label: 'Every 30 Mins', minutes: 30 },
  { label: 'Every 1 Hour', minutes: 60 },
  { label: 'Every 2 Hours', minutes: 120 },
  { label: 'Every 4 Hours', minutes: 240 },
];

export function HealthCheckModal() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [activeGifIndex, setActiveGifIndex] = useState<'stretch' | 'water'>('stretch');
  const [alertIntervalMinutes, setAlertIntervalMinutes] = useState<number>(60);
  const [nextCheckInMinutes, setNextCheckInMinutes] = useState<number>(60);

  // Dropdown state for choosing from the 10 Health Checkpoints
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<number | 'all'>(1);
  const [isCheckpointDropdownOpen, setIsCheckpointDropdownOpen] = useState<boolean>(false);

  // Trigger modal function
  const triggerModal = useCallback(() => {
    setIsOpen(true);
    setCompletedItems([]);
    setIsCheckpointDropdownOpen(false);
  }, []);

  // Listen for custom trigger event (e.g. from header button or developer test)
  useEffect(() => {
    const handleCustomTrigger = () => triggerModal();
    window.addEventListener('ambizcon_trigger_health_check', handleCustomTrigger);
    return () => {
      window.removeEventListener('ambizcon_trigger_health_check', handleCustomTrigger);
    };
  }, [triggerModal]);

  // Hourly / Custom Interval Clock-in / Login Timer Engine
  useEffect(() => {
    if (!currentUser) return;

    const INTERVAL_MS = alertIntervalMinutes * 60 * 1000;
    const storageKeyLast = `ambizcon_last_health_check_${currentUser._id}`;
    const shiftStorageKey = `ambizcon_shift_${currentUser._id}`;

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

      if (lastCheckStr) {
        const lastCheckTime = Number(lastCheckStr);
        const elapsed = now - lastCheckTime;
        const remainingMs = Math.max(0, INTERVAL_MS - elapsed);
        setNextCheckInMinutes(Math.ceil(remainingMs / 60000));

        if (elapsed >= INTERVAL_MS) {
          triggerModal();
        }
      } else {
        if (isClockedIn && clockInTimestamp) {
          const elapsed = now - clockInTimestamp;
          const remainingMs = Math.max(0, INTERVAL_MS - elapsed);
          setNextCheckInMinutes(Math.ceil(remainingMs / 60000));

          if (elapsed >= INTERVAL_MS) {
            triggerModal();
          }
        } else {
          localStorage.setItem(storageKeyLast, now.toString());
          setNextCheckInMinutes(alertIntervalMinutes);
        }
      }
    };

    checkHourlyInterval();
    const interval = setInterval(checkHourlyInterval, 15000);

    return () => clearInterval(interval);
  }, [currentUser, triggerModal, alertIntervalMinutes]);

  // Toggle checklist item
  const toggleItem = (id: number) => {
    setCompletedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Mark all completed
  const handleCheckAll = () => {
    setCompletedItems(HEALTH_CHECKLIST.map((h) => h.id));
    toast.success('All 10 health checkpoints marked as done!');
  };

  // User clicked "Done"
  const handleDone = () => {
    if (currentUser) {
      const storageKeyLast = `ambizcon_last_health_check_${currentUser._id}`;
      localStorage.setItem(storageKeyLast, Date.now().toString());
    }
    setIsOpen(false);
    toast.success('Health Check Complete! 🎉', {
      description: `Awesome job refreshing your body and eyes. Next check scheduled in ${alertIntervalMinutes} minutes.`,
      duration: 5000,
    });
  };

  if (!currentUser) return null;

  const activeCheckpoint =
    selectedCheckpointId === 'all'
      ? null
      : HEALTH_CHECKLIST.find((item) => item.id === selectedCheckpointId) || HEALTH_CHECKLIST[0];

  const displayedCheckpoints =
    selectedCheckpointId === 'all'
      ? HEALTH_CHECKLIST
      : activeCheckpoint
      ? [activeCheckpoint]
      : [HEALTH_CHECKLIST[0]];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      maxWidth="xl"
    >
      <div className="space-y-4 py-1">
        {/* Header Ribbon & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="h-3 w-3 text-emerald-500 animate-pulse" />
                Hourly Workspace Wellness
              </Badge>

              {/* Frequency Dropdown to Choose */}
              <select
                value={alertIntervalMinutes}
                onChange={(e) => {
                  const mins = Number(e.target.value);
                  setAlertIntervalMinutes(mins);
                  setNextCheckInMinutes(mins);
                  toast.info(`Wellness alert interval updated to ${mins} minutes`);
                }}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-0.5 text-[10px] font-mono font-bold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                title="Choose Reminder Frequency"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.minutes} value={opt.minutes}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 tracking-tight">
              👨‍💻 Quick Health Check
            </h2>
            <p className="text-xs text-muted-foreground">
              Take 60 seconds to reset your posture, stretch muscles, and rest your eyes before continuing your tasks.
            </p>
          </div>

          {/* Activity Mode Switcher + Dropdown */}
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
          <div className="w-full sm:w-1/2 h-40 sm:h-44 relative bg-zinc-900/60 flex items-center justify-center overflow-hidden">
            <img
              src={activeGifIndex === 'stretch' ? '/health-stretch.gif' : '/drink-water.gif'}
              alt={activeGifIndex === 'stretch' ? 'Office Stretch Demonstration' : 'Drink Water Reminder'}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-transparent to-background/30" />
          </div>

          <div className="w-full sm:w-1/2 p-4 space-y-2 bg-gradient-to-br from-emerald-500/5 via-brand-500/5 to-purple-500/5">
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

        {/* 10 Health Checkpoints — Interactive Dropdown Selector to Choose */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <ListChecks className="h-4 w-4 text-emerald-500" />
              10 Health Checkpoints (Choose from Dropdown)
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {completedItems.length} of {HEALTH_CHECKLIST.length} completed
            </span>
          </div>

          {/* Native Select Dropdown + Custom Interactive Rich Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCheckpointDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/90 hover:border-emerald-500/50 text-left transition-all shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">
                  {selectedCheckpointId === 'all' ? '📋' : activeCheckpoint?.emoji}
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Choose Health Checkpoint
                  </span>
                  <span className="text-xs font-extrabold text-foreground truncate block">
                    {selectedCheckpointId === 'all'
                      ? `Showing All 10 Health Checkpoints (${completedItems.length}/10 Done)`
                      : `${activeCheckpoint?.id}. ${activeCheckpoint?.title}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-muted-foreground hidden sm:inline">
                  {isCheckpointDropdownOpen ? 'Close list' : 'Select option'}
                </span>
                {isCheckpointDropdownOpen ? (
                  <ChevronUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Dropdown Options Menu */}
            {isCheckpointDropdownOpen && (
              <div className="mt-1.5 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-background shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/70 animate-fade">
                {/* Option: Show All 10 */}
                <div
                  onClick={() => {
                    setSelectedCheckpointId('all');
                    setIsCheckpointDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                    selectedCheckpointId === 'all'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-foreground font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    <span>Show All 10 Health Checkpoints</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    All 10
                  </Badge>
                </div>

                {/* Individual 10 Checkpoints in Dropdown */}
                {HEALTH_CHECKLIST.map((item) => {
                  const isChecked = completedItems.includes(item.id);
                  const isSelected = selectedCheckpointId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedCheckpointId(item.id);
                        setIsCheckpointDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="text-base shrink-0 mt-0.5">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-muted-foreground">
                              {item.id}.
                            </span>
                            <span
                              className={`text-xs font-bold truncate ${
                                isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(item.id);
                        }}
                        title={isChecked ? 'Completed' : 'Mark as completed'}
                        className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-600 bg-background hover:border-emerald-500'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Selected Checkpoint Card(s) */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {displayedCheckpoints.map((item) => {
              const isChecked = completedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-foreground'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-center text-xl shrink-0 pt-0.5 select-none">
                    {item.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 select-none">
                        #{item.id}
                      </span>
                      <h4
                        className={`text-xs sm:text-sm font-extrabold ${
                          isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 transition-all border mt-0.5 ${
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

          {/* Quick Prev / Next Navigation when viewing single checkpoint */}
          {selectedCheckpointId !== 'all' && activeCheckpoint && (
            <div className="flex items-center justify-between px-1 pt-0.5">
              <button
                type="button"
                onClick={() =>
                  setSelectedCheckpointId(activeCheckpoint.id > 1 ? activeCheckpoint.id - 1 : 10)
                }
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Previous Checkpoint
              </button>
              <button
                type="button"
                onClick={() => setSelectedCheckpointId('all')}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View All 10
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedCheckpointId(activeCheckpoint.id < 10 ? activeCheckpoint.id + 1 : 1)
                }
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Next Checkpoint →
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions: Prominent DONE Button */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            <span>
              Next automatic alert in <strong>{nextCheckInMinutes} minutes</strong>
            </span>
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
