'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getCustomUserAvatar } from '@/lib/avatar-store';

interface AvatarProps {
  src?: string;
  name: string;
  userId?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, userId, email, size = 'md', className }: AvatarProps) {
  const [customSrc, setCustomSrc] = useState<string | undefined>(undefined);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const syncCustomAvatar = () => {
      const stored = getCustomUserAvatar({
        userId,
        email,
        name,
        fallbackSrc: src,
      });
      setCustomSrc(stored);
      setImgError(false);
    };

    syncCustomAvatar();
    window.addEventListener('ambizcon_avatar_updated', syncCustomAvatar);
    window.addEventListener('storage', syncCustomAvatar);
    return () => {
      window.removeEventListener('ambizcon_avatar_updated', syncCustomAvatar);
      window.removeEventListener('storage', syncCustomAvatar);
    };
  }, [src, name, userId, email]);

  const sizeMap = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
    xl: 'h-14 w-14 text-xl',
  };

  const getInitials = (n: string) => {
    if (!n) return 'TF';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const colors = [
    'bg-blue-500 text-white',
    'bg-purple-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-indigo-500 text-white',
  ];

  // Hash initial string to pick color
  const colorIndex =
    (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColorClass = colors[colorIndex];

  const finalSrc = customSrc || src;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full font-medium shadow-sm transition-transform hover:scale-105',
        sizeMap[size],
        className
      )}
    >
      {finalSrc && !imgError ? (
        <img
          src={finalSrc}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center font-semibold',
            bgColorClass
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
