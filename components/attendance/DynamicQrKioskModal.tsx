'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';
import {
  QrCode,
  RotateCw,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  UserCheck,
  Sparkles,
  Smartphone,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SEED_USERS } from '@/lib/seed-data';
import { formatTimeIST, formatTimeAEST } from '@/lib/utils';

interface DynamicQrKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: string;
  onPunchSuccess?: (punchData: any) => void;
}

export function DynamicQrKioskModal({
  isOpen,
  onClose,
  branch,
  onPunchSuccess,
}: DynamicQrKioskModalProps) {
  const isAus = branch.includes('Australia');
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [token, setToken] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState(SEED_USERS[0]?.email || '');
  const [isScanning, setIsScanning] = useState(false);
  const [recentPunches, setRecentPunches] = useState<any[]>([]);

  // Generate new 10-second security token
  const refreshToken = () => {
    const now = Date.now();
    const nonce = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newToken = `AMB-PUNCH-${now.toString(36).toUpperCase()}-${nonce}`;
    setToken(newToken);
    setExpiresAt(now + 10000);
    setSecondsLeft(10);
  };

  // Initialize and run 10-second countdown interval
  useEffect(() => {
    if (!isOpen) return;

    refreshToken();
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          refreshToken();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, branch]);

  // Sound feedback
  const playPunchBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio fallback
    }
  };

  // Simulate employee scanning the dynamic QR code
  const handleSimulateScan = async () => {
    const targetUser = SEED_USERS.find((u) => u.email === selectedUserEmail) || SEED_USERS[0];
    if (!targetUser || isScanning) return;

    setIsScanning(true);
    try {
      const res = await fetch('/api/attendance/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: token,
          userId: targetUser.email,
          userName: targetUser.name,
          userTeam: targetUser.team,
          branch,
          expiresAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'QR Scan failed');
        return;
      }

      playPunchBeep();
      const newPunch = {
        id: `P-${Date.now().toString().slice(-4)}`,
        name: targetUser.name,
        team: targetUser.team,
        type: data.action === 'PUNCH_OUT' ? 'Clock Out' : 'Clock In',
        time: data.punch?.time || (isAus ? formatTimeAEST() : formatTimeIST()),
        location: isAus ? 'Queen Street, Brisbane CBD' : 'Anna Nagar, Chennai',
      };

      setRecentPunches([newPunch, ...recentPunches.slice(0, 4)]);
      toast.success(data.message, {
        description: `Verified at ${newPunch.time} via QR Kiosk`,
      });

      if (onPunchSuccess) {
        onPunchSuccess(newPunch);
      }
    } catch (err) {
      toast.error('Network error during QR punch');
    } finally {
      setIsScanning(false);
    }
  };

  // QR SVG Data URL generator based on dynamic token payload (Direct URL for both native camera & in-app scanner)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taskflow-saas-app-five.vercel.app';
  const qrTargetUrl = `${origin}/attendance?qrToken=${token}&branch=${isAus ? 'Australia' : 'India'}&exp=${expiresAt}`;
  const qrDataPayload = encodeURIComponent(qrTargetUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${qrDataPayload}&bgcolor=ffffff&color=086075&margin=1`;

  // Circular countdown stroke calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / 10) * circumference;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      description=""
      maxWidth={isFullScreen ? '2xl' : 'xl'}
    >
      <div className={`space-y-6 pt-1 transition-all ${isFullScreen ? 'min-h-[85vh] flex flex-col justify-between' : ''}`}>
        {/* Kiosk Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-foreground">
                  Ambizcon Pulse — Dynamic Attendance Kiosk
                </h3>
                <Badge className="bg-emerald-500 text-white font-mono text-[10px] animate-pulse">
                  LIVE 10s ROTATION
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Touchless biometric QR check-in • {isAus ? '🇦🇺 Brisbane HQ' : '🇮🇳 Chennai HQ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8 p-0 text-muted-foreground"
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="h-8 w-8 p-0 text-muted-foreground"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Kiosk'}
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Central QR Code & Countdown Widget */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* QR Display Card */}
          <div className="md:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 via-background to-zinc-50/50 dark:to-zinc-900/50 relative shadow-inner">
            {/* Countdown Badge overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Circular SVG Timer */}
              <div className="relative flex items-center justify-center h-12 w-12">
                <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-zinc-200 dark:text-zinc-800"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-emerald-500 transition-all duration-1000"
                  />
                </svg>
                <span className="absolute font-mono font-extrabold text-xs text-foreground">
                  {secondsLeft}s
                </span>
              </div>
            </div>

            {/* Instruction Banner */}
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
              Scan with Mobile Camera to Punch
            </span>

            {/* QR Code Container */}
            <div className="relative p-3.5 bg-white rounded-3xl shadow-xl border-4 border-emerald-500/20 group">
              <img
                src={qrImageUrl}
                alt="Ambizcon Dynamic QR Code"
                className="w-56 h-56 rounded-2xl object-contain transition-opacity duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="p-2 bg-white/95 rounded-xl shadow-md border border-emerald-500/30">
                  <img
                    src={isAus ? '/ambizcon-australia-icon.png' : '/ambizcon-logo.png'}
                    alt="Logo"
                    className="h-7 w-7 rounded-lg object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Security Token Tag */}
            <div className="mt-4 flex flex-col items-center gap-1 text-center">
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Token: <strong className="text-foreground">{token || 'GENERATING...'}</strong>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Regenerates automatically every 10 seconds to prevent fraudulent clock-ins
              </span>
            </div>

            {/* Geofence & Location Stamp */}
            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap justify-center">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> GPS Geofence (200m Radius)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-zinc-500">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                {isAus ? '103.246.40.112 (Brisbane CBD)' : '192.168.1.104 (Chennai HQ)'}
              </span>
            </div>
          </div>

          {/* Test Scan Simulator & Live Punch Feed */}
          <div className="md:col-span-5 space-y-4">
            {/* Quick Scan Simulator */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Employee Scan Simulator
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40">
                  Instant Test
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Simulate an employee scanning the kiosk QR code from their mobile device:
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Select Employee
                </label>
                <select
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
                >
                  {SEED_USERS.filter((u) => (isAus ? u.company?.includes('Australia') || u.name === 'Anirudh' : !u.company?.includes('Australia') || u.name === 'Anirudh')).map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.name} — {u.team} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="w-full ambizcon-gradient text-white font-bold text-xs gap-2 shadow-glow py-2"
              >
                <Smartphone className="h-3.5 w-3.5" />
                {isScanning ? 'Verifying QR Token...' : 'Scan Dynamic QR & Punch'}
              </Button>
            </div>

            {/* Live Punch Activity Feed */}
            <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Live Kiosk Punch Activity
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Today's Feed
                </span>
              </div>

              <div className="space-y-2.5">
                {recentPunches.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.name} size="sm" />
                      <div>
                        <span className="font-bold text-foreground block text-xs">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {p.team} • {p.location}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge
                        className={`text-[9px] font-bold ${
                          p.type === 'Clock In'
                            ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {p.type}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">
                        {p.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kiosk Scanner Active • Ambizcon Hardware Security Layer</span>
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close Kiosk
          </Button>
        </div>
      </div>
    </Modal>
  );
}
