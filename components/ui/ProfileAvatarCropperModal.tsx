'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Check,
  RefreshCw,
  Sparkles,
  Camera,
} from 'lucide-react';

interface ProfileAvatarCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (croppedDataUrl: string) => Promise<void> | void;
  userName?: string;
}

const VIEWPORT_SIZE = 300;
const CROP_DIAMETER = 240;

export function ProfileAvatarCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onSave,
  userName = 'User',
}: ProfileAvatarCropperModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Auto-fit zoom so smaller dimension covers the crop circle
      const minDim = Math.min(img.width, img.height);
      const initialZoom = Math.max(1, CROP_DIAMETER / minDim);
      setZoom(initialZoom);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw canvas on state changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    // 1. Draw transformed image
    ctx.save();
    ctx.translate(VIEWPORT_SIZE / 2 + pan.x, VIEWPORT_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    // 2. Draw dark vignette mask outside crop circle
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 25, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, CROP_DIAMETER / 2, 0, Math.PI * 2, true);
    ctx.fill('evenodd');

    // 3. Draw Ambizcon Teal Crop Guide Circle
    ctx.strokeStyle = '#086075';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, CROP_DIAMETER / 2, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Subtle dashed crosshairs for centering face
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2 - CROP_DIAMETER / 2);
    ctx.lineTo(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2 + CROP_DIAMETER / 2);
    ctx.moveTo(VIEWPORT_SIZE / 2 - CROP_DIAMETER / 2, VIEWPORT_SIZE / 2);
    ctx.lineTo(VIEWPORT_SIZE / 2 + CROP_DIAMETER / 2, VIEWPORT_SIZE / 2);
    ctx.stroke();

    ctx.restore();
  }, [image, zoom, pan, rotation]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.002;
    setZoom((prev) => Math.min(4, Math.max(0.4, Number((prev + zoomDelta).toFixed(2)))));
  };

  // Reset to default center & scale
  const handleReset = () => {
    if (!image) return;
    const minDim = Math.min(image.width, image.height);
    const initialZoom = Math.max(1, CROP_DIAMETER / minDim);
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Rotate handlers
  const handleRotateCW = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCCW = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Export cropped circle image to 280x280 dataUrl
  const handleApply = async () => {
    if (!image) return;
    setIsSaving(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 280;
      exportCanvas.height = 280;
      const expCtx = exportCanvas.getContext('2d');
      if (!expCtx) return;

      const scaleFactor = 280 / CROP_DIAMETER;

      expCtx.save();
      // Translate to center of 280x280 canvas
      expCtx.translate(140 + pan.x * scaleFactor, 140 + pan.y * scaleFactor);
      expCtx.rotate((rotation * Math.PI) / 180);
      expCtx.scale(zoom * scaleFactor, zoom * scaleFactor);
      expCtx.drawImage(image, -image.width / 2, -image.height / 2);
      expCtx.restore();

      const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
      await onSave(croppedDataUrl);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust & Crop Profile Picture"
      description="Drag the image to reposition, use the zoom slider or scroll wheel, and rotate to fit perfectly inside the circle."
      maxWidth="md"
    >
      <div className="flex flex-col items-center gap-5 pt-1">
        {/* Interactive Canvas Viewport */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-brand-500/30 bg-zinc-950 shadow-xl flex items-center justify-center select-none touch-none">
          <canvas
            ref={canvasRef}
            width={VIEWPORT_SIZE}
            height={VIEWPORT_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`cursor-grab active:cursor-grabbing ${
              isDragging ? 'cursor-grabbing' : ''
            }`}
          />

          {/* Floating Drag Hint Pill */}
          <div className="absolute bottom-2.5 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1.5 pointer-events-none border border-white/10">
            <Move className="h-3 w-3 text-brand-300" />
            <span>Drag image to position</span>
          </div>
        </div>

        {/* Zoom Slider & Buttons */}
        <div className="w-full space-y-3 px-2 sm:px-4">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-brand-500" />
              Zoom Scale:
            </span>
            <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.4, Number((prev - 0.15).toFixed(2))))}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <input
              type="range"
              min="0.4"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-brand-500 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(4, Number((prev + 0.15).toFixed(2))))}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Action Toolbar: Rotate 90° CCW / CW & Reset */}
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleRotateCCW}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-xs font-bold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-brand-500" />
              <span>Rotate -90°</span>
            </button>

            <button
              type="button"
              onClick={handleRotateCW}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-xs font-bold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <RotateCw className="h-3.5 w-3.5 text-brand-500" />
              <span>Rotate +90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
              title="Reset Position & Zoom"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Fit</span>
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="w-full flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleApply}
            disabled={isSaving || !image}
            className="ambizcon-gradient text-white text-xs font-bold px-5 gap-1.5 shadow-glow hover:opacity-95"
          >
            <Check className="h-4 w-4" />
            <span>{isSaving ? 'Applying...' : 'Save & Crop Avatar'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
