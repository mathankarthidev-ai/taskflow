// Web Audio API synthesized notification chimes — Distinct sound per notification category
// Categories: 'chat' | 'reminder' | 'self_reminder' | 'task_assigned'
// Zero external file dependency, 100% offline, cross-browser support

export type NotificationSoundType =
  | 'chat'
  | 'reminder'
  | 'self_reminder'
  | 'task_assigned';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

function runWithAudioContext(playFn: (ctx: AudioContext) => number) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const execute = () => {
      const durationMs = playFn(ctx);
      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, durationMs + 250);
    };

    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(execute)
        .catch(() => {
          execute();
        });
    } else {
      execute();
    }
  } catch (err) {
    console.debug('Notification audio playback skipped:', err);
  }
}

/**
 * 1. CHAT MESSAGE SOUND ('chat')
 * Recognizable bouncy double water-drop pop + bright crystal ping (Messenger / Slack style)
 */
export function playChatNotificationSound() {
  runWithAudioContext((ctx) => {
    const now = ctx.currentTime;

    // Pop 1: Pitch-swept sine drop (G5 784Hz -> D6 1175Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);
    gain1.gain.setValueAtTime(0.42, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Pop 2: Higher crisp bubble reply (D6 1175Hz -> G6 1568Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.11);
    osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.21);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.45, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.11);
    osc2.stop(now + 0.36);

    return 400;
  });
}

/**
 * 2. REMINDER SOUND ('reminder')
 * Urgent 3-pulse ascending alarm bell + double ring for Scheduled & Due Date Reminders
 */
export function playReminderNotificationSound() {
  runWithAudioContext((ctx) => {
    const now = ctx.currentTime;
    // Urgent ascending bell pattern: C5 -> E5 -> G5 -> High C6 double-ring
    const notes = [
      { freq: 523.25, start: 0.0, dur: 0.13 }, // C5
      { freq: 659.25, start: 0.14, dur: 0.13 }, // E5
      { freq: 783.99, start: 0.28, dur: 0.13 }, // G5
      { freq: 1046.5, start: 0.43, dur: 0.18 }, // C6 ring 1
      { freq: 1046.5, start: 0.64, dur: 0.32 }, // C6 ring 2
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2, now + start);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.42, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      harmonic.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      harmonic.start(now + start);
      osc.stop(now + start + dur);
      harmonic.stop(now + start + dur);
    });

    return 1000;
  });
}

/**
 * 3. SELF REMINDER SOUND ('self_reminder')
 * Warm 4-note marimba / harp arpeggio melody for Personal Self Reminders
 */
export function playSelfReminderNotificationSound() {
  runWithAudioContext((ctx) => {
    const now = ctx.currentTime;
    // Warm F-major 7th harp arpeggio: F5 -> A5 -> C6 -> E6
    const arpeggio = [
      { freq: 698.46, start: 0.0, dur: 0.22 }, // F5
      { freq: 880.0, start: 0.11, dur: 0.22 }, // A5
      { freq: 1046.5, start: 0.22, dur: 0.24 }, // C6
      { freq: 1318.51, start: 0.33, dur: 0.45 }, // E6
    ];

    arpeggio.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.38, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    return 850;
  });
}

/**
 * 4. TASK ASSIGNED SOUND ('task_assigned')
 * Authoritative 2-chord synth brass fanfare for Task Assigned / Redirected / Review / Completed
 */
export function playTaskAssignedNotificationSound() {
  runWithAudioContext((ctx) => {
    const now = ctx.currentTime;

    // Chord 1: D5 (587.33Hz) + A5 (880Hz)
    const playChord = (freqs: number[], start: number, dur: number, peakGain: number) => {
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f, now + start);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.setValueAtTime(peakGain / freqs.length, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    };

    // Two-step heroic task fanfare: D5+A5 -> F#5+A5+D6
    playChord([587.33, 880.0], 0.0, 0.16, 0.36);
    playChord([739.99, 880.0, 1174.66], 0.17, 0.42, 0.45);

    return 650;
  });
}

/**
 * Resolve notification category/type to its distinct sound
 */
export function resolveNotificationSoundType(input?: {
  type?: string;
  category?: string;
  link?: string;
}): NotificationSoundType {
  if (!input) return 'task_assigned';
  const type = (input.type || '').toLowerCase();
  const cat = (input.category || '').toLowerCase();
  const link = (input.link || '').toLowerCase();

  if (type === 'chat_message' || cat.includes('chat') || link.startsWith('/chat')) {
    return 'chat';
  }
  if (cat.includes('self reminder') || link.startsWith('/self-reminders') || link.includes('tab=self')) {
    return 'self_reminder';
  }
  if (
    type === 'due_date_reminder' ||
    type === 'overdue' ||
    cat.includes('reminder') ||
    cat.includes('overdue') ||
    link.startsWith('/reminders')
  ) {
    return 'reminder';
  }
  return 'task_assigned';
}

/**
 * Unified entry point — plays the distinct sound for the given category
 */
export function playNotificationChime(soundType: NotificationSoundType = 'chat') {
  switch (soundType) {
    case 'chat':
      playChatNotificationSound();
      break;
    case 'reminder':
      playReminderAlarmSound(30);
      break;
    case 'self_reminder':
      playReminderAlarmSound(30);
      break;
    case 'task_assigned':
      playTaskAssignedNotificationSound();
      break;
    default:
      playChatNotificationSound();
      break;
  }
}

/**
 * 5. CONTINUOUS 30-SECOND REMINDER ALARM SOUND
 * Plays an attention-grabbing, pleasant repeating alarm sequence for 30 seconds.
 * Automatically halts at 30 seconds, or stops immediately when clicked / dismissed.
 */
let activeAlarmCtx: AudioContext | null = null;
let activeAlarmInterval: any = null;
let activeAlarmTimeout: any = null;
let isAlarmCurrentlyActive = false;

export function stopReminderAlarmSound() {
  if (typeof window === 'undefined') return;
  isAlarmCurrentlyActive = false;

  if (activeAlarmTimeout) {
    clearTimeout(activeAlarmTimeout);
    activeAlarmTimeout = null;
  }
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeAlarmCtx) {
    try {
      activeAlarmCtx.close();
    } catch (_) {}
    activeAlarmCtx = null;
  }
  try {
    window.dispatchEvent(new CustomEvent('ambizcon_alarm_stopped'));
  } catch (_) {}
}

export function isReminderAlarmPlaying(): boolean {
  return isAlarmCurrentlyActive;
}

export function playReminderAlarmSound(durationSeconds: number = 30) {
  if (typeof window === 'undefined') return;
  stopReminderAlarmSound(); // Stop previous active alarm if any

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const ctx = new AudioContextClass();
    activeAlarmCtx = ctx;
    isAlarmCurrentlyActive = true;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const playBeepCycle = () => {
      if (!isAlarmCurrentlyActive || !activeAlarmCtx || activeAlarmCtx.state === 'closed') return;
      const now = activeAlarmCtx.currentTime;

      // Pulse 1: 880 Hz (A5)
      const osc1 = activeAlarmCtx.createOscillator();
      const gain1 = activeAlarmCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.setValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(activeAlarmCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Pulse 2: 1046.5 Hz (C6)
      const osc2 = activeAlarmCtx.createOscillator();
      const gain2 = activeAlarmCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.5, now + 0.14);
      gain2.gain.setValueAtTime(0.001, now + 0.14);
      gain2.gain.setValueAtTime(0.38, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(activeAlarmCtx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.33);

      // Pulse 3: 1318.5 Hz (E6) - bright chime
      const osc3 = activeAlarmCtx.createOscillator();
      const gain3 = activeAlarmCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.5, now + 0.33);
      gain3.gain.setValueAtTime(0.001, now + 0.33);
      gain3.gain.setValueAtTime(0.42, now + 0.35);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc3.connect(gain3);
      gain3.connect(activeAlarmCtx.destination);
      osc3.start(now + 0.33);
      osc3.stop(now + 0.66);
    };

    // Play first cycle immediately
    playBeepCycle();

    // Repeat every 1.2s
    activeAlarmInterval = setInterval(playBeepCycle, 1200);

    // Auto turn off after durationSeconds (default 30 seconds)
    activeAlarmTimeout = setTimeout(() => {
      stopReminderAlarmSound();
    }, durationSeconds * 1000);

    try {
      window.dispatchEvent(
        new CustomEvent('ambizcon_alarm_started', { detail: { durationSeconds } })
      );
    } catch (_) {}
  } catch (err) {
    console.debug('Alarm audio playback skipped:', err);
    isAlarmCurrentlyActive = false;
  }
}

