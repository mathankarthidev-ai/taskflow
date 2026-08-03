import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
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
  const colorIndex = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColorClass = colors[colorIndex];

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full font-medium shadow-sm transition-transform hover:scale-105',
        sizeMap[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="64px"
          className="object-cover"
          onError={(e) => {
            // Hide image on error to fallback to initials
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center font-semibold', bgColorClass)}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
