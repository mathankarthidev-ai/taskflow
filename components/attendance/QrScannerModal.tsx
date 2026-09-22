'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPunchSuccess?: (punchData: any) => void;
}

export function QrScannerModal({ isOpen, onClose, onPunchSuccess }: QrScannerModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon - Australia'
    : currentUser?.company === 'Ambizcon - Australia';

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [punchResult, setPunchResult] = useState<any | null>(null);
  const [activeKioskToken, setActiveKioskToken] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Play audio chime on successful scan
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, audioCtx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.18); // E6
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // Audio fallback
    }
  };

  // Fetch current kiosk token as quick fallback / test option
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/attendance/qr/token')
      .then((res) => res.json())
      .then((data) => {
        if (data?.token?.tokenId) {
          setActiveKioskToken(data.token.tokenId);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('Camera API is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setHasCamera(true);
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera permissions in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera detected on this device. You can test with the active kiosk token below.');
      } else {
        setCameraError('Unable to start camera. You can test using the quick token verification below.');
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Process Video Frame with jsQR
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleQrPayload(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  // Parse QR Code Payload & Execute Punch
  const handleQrPayload = async (rawData: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    let extractedToken = '';
    let extractedBranch = isAustralia ? 'Ambizcon - Australia' : 'Ambizcon Health - India';
    let expiresAt: number | undefined = undefined;

    // Check if rawData is a JSON payload
    try {
      const parsed = JSON.parse(rawData);
      if (parsed.token) extractedToken = parsed.token;
      if (parsed.branch) extractedBranch = parsed.branch.includes('Australia') ? 'Ambizcon - Australia' : 'Ambizcon Health - India';
      if (parsed.t) expiresAt = parsed.t;
    } catch {
      // Check if rawData is a URL: https://...?qrToken=...&branch=...
      try {
        const url = new URL(rawData);
        const tParam = url.searchParams.get('qrToken') || url.searchParams.get('token');
        if (tParam) extractedToken = tParam;
        const bParam = url.searchParams.get('branch');
        if (bParam) extractedBranch = bParam.includes('Australia') ? 'Ambizcon - Australia' : 'Ambizcon Health - India';
        const expParam = url.searchParams.get('exp');
        if (expParam) expiresAt = parseInt(expParam, 10);
      } catch {
        // Raw string token
        if (rawData.startsWith('AMB-QR-')) {
          extractedToken = rawData.trim();
        }
      }
    }

    if (!extractedToken) {
      toast.error('Invalid QR code format. Please scan the Ambizcon Kiosk QR code.');
      setIsProcessing(false);
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    await submitScanPunch(extractedToken, extractedBranch, expiresAt);
  };

  // Submit Verified Punch to Server
  const submitScanPunch = async (tokenId: string, branchName: string, expTime?: number) => {
    if (!currentUser) {
      toast.error('You must be logged in to record attendance.');
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch('/api/attendance/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          userId: currentUser.email,
          userName: currentUser.name,
          userTeam: currentUser.team || 'Development',
          branch: branchName,
          expiresAt: expTime || Date.now() + 10000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'QR Verification failed.');
        setIsProcessing(false);
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
        return;
      }

      playSuccessChime();
      stopCamera();

      const punchInfo = {
        name: currentUser.name,
        type: data.action === 'PUNCH_OUT' ? 'Clock Out' : 'Clock In',
        time: data.punch?.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        branch: branchName,
        totalHours: data.punch?.totalHours,
      };

      setPunchResult(punchInfo);
      toast.success(data.message, {
        description: `Verified at ${punchInfo.time}`,
      });

      if (onPunchSuccess) {
        onPunchSuccess(punchInfo);
      }
    } catch (err) {
      toast.error('Network error during scan verification.');
      setIsProcessing(false);
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      setPunchResult(null);
      setIsProcessing(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const handleClose = () => {
    stopCamera();
    setPunchResult(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      description=""
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Camera className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-foreground">Scan Office QR Code</h3>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  LIVE CAMERA
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Point your camera at the Reception Kiosk tablet screen
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Punch State */}
        {punchResult ? (
          <div className="p-6 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-transparent text-center space-y-4 animate-scale-in">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-glow">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                PUNCH VERIFIED & LOGGED
              </span>
              <h2 className="text-2xl font-black text-foreground">
                {punchResult.type === 'Clock In' ? 'Welcome to Ambizcon!' : 'Shift Successfully Closed!'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Verified for <strong className="text-foreground">{punchResult.name}</strong> • {punchResult.branch}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background/80 flex items-center justify-around font-mono text-sm">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">Action</span>
                <strong className={punchResult.type === 'Clock In' ? 'text-emerald-500 font-extrabold' : 'text-amber-500 font-extrabold'}>
                  {punchResult.type}
                </strong>
              </div>
              <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
                <span className="text-[10px] text-muted-foreground block uppercase">Timestamp</span>
                <strong className="text-foreground font-extrabold">{punchResult.time}</strong>
              </div>
              {punchResult.totalHours !== undefined && (
                <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
                  <span className="text-[10px] text-muted-foreground block uppercase">Shift Hours</span>
                  <strong className="text-emerald-500 font-extrabold">{punchResult.totalHours}h</strong>
                </div>
              )}
            </div>

            <Button
              onClick={handleClose}
              className="w-full ambizcon-gradient text-white font-extrabold py-3 rounded-2xl shadow-glow"
            >
              Done & Return to Workspace
            </Button>
          </div>
        ) : (
          /* Live Camera View */
          <div className="space-y-4">
            <div className="relative aspect-square w-full max-w-[360px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-xl flex items-center justify-center">
              {/* HTML5 Video Feed */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Target Reticle & Laser Sweep */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-56 h-56 rounded-2xl border-2 border-dashed border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                  {/* Corner Markers */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />

                  {/* Laser Scan Line */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />
                </div>
              </div>

              {/* Camera Error or Loading Overlay */}
              {hasCamera === false && (
                <div className="absolute inset-0 bg-background/95 p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                  <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Camera Unavailable</h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {cameraError || 'Camera could not be activated.'}
                  </p>
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry Camera
                  </Button>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2 z-30">
                  <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
                  <span className="text-xs font-bold tracking-wider uppercase">Verifying QR Token...</span>
                </div>
              )}
            </div>

            {/* Camera Controls & Quick Kiosk Fallback */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                title="Switch between front and rear cameras"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Flip Camera
              </Button>

              {/* 1-Tap Active Kiosk Verification (Fallback / Instant punch) */}
              <Button
                onClick={() => {
                  if (activeKioskToken) {
                    handleQrPayload(activeKioskToken);
                  } else {
                    toast.error('Fetching active kiosk token...');
                  }
                }}
                disabled={isProcessing}
                className="ambizcon-gradient text-white font-extrabold text-xs gap-1.5 shadow-glow hover:scale-105 transition-transform"
                title="Verify punch using current active kiosk security token"
              >
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                1-Tap Kiosk Punch
              </Button>
            </div>

            <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Auto-verifies 10s rotating kiosk code
              </span>
              <span className="font-bold text-foreground">
                {isAustralia ? '🇦🇺 Brisbane' : '🇮🇳 Chennai'}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
