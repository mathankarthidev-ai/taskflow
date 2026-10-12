// Web Audio API synthesized notification chime
// Zero external file dependency, 100% offline, cross-browser support

export function playNotificationChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const triggerTone = () => {
      const now = ctx.currentTime;

      // Note 1: Crisp Primary Chime (E5 659.25Hz -> B5 987.77Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(987.77, now);
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.14); // E6 harmonic

      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc1.connect(gain1);
      osc2.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);

      // Note 2: Follow-up Bell Ding at +0.15s (E6 1318.51Hz)
      const osc3 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.51, now + 0.15);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.42, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc3.connect(gain2);
      gain2.connect(ctx.destination);

      osc3.start(now + 0.15);
      osc3.stop(now + 0.55);

      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, 700);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(triggerTone).catch(() => {
        triggerTone();
      });
    } else {
      triggerTone();
    }
  } catch (err) {
    // AudioContext blocked or user has not interacted with page yet
    console.debug('Notification audio playback skipped:', err);
  }
}
