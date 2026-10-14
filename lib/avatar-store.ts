'use client';

import { SEED_USERS } from '@/lib/seed-data';

const AVATAR_MAP_KEY = 'ambizcon_user_avatars_v1';

export interface AvatarMapRecord {
  byId: Record<string, string>;
  byEmail: Record<string, string>;
  byName: Record<string, string>;
}

// Consistent default portraits for workspace members before a custom photo is uploaded
export const DEFAULT_PORTRAIT_AVATARS: Record<string, string> = {
  'anirudh@ambizcon.com':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'mathan@ambizcon.com':
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'aravind@ambizcon.com':
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'kenneth@ambizcon.com':
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'thanikaivel@ambizcon.com':
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'deva@ambizcon.com':
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'mathi.p@ambizcon.com':
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'mathi@ambizcon.com':
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'kiruthikashri@ambizcon.com':
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'krithikashri@ambizcon.com':
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'naraine@ambizcon.com':
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'mathanmk@ambizcon.com':
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&crop=faces&q=80',
  'siddesh@ambizcon.com':
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'sathish@ambizcon.com':
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  'kavish@ambizcon.com':
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&auto=format&fit=crop&q=80',
  'kasthuri@ambizcon.com':
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'ahamed@ambizcon.com':
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'adriana@ambizcon.com':
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
};

function readAvatarMap(): AvatarMapRecord {
  if (typeof window === 'undefined') {
    return { byId: {}, byEmail: {}, byName: {} };
  }
  try {
    const raw = localStorage.getItem(AVATAR_MAP_KEY);
    if (!raw) return { byId: {}, byEmail: {}, byName: {} };
    const parsed = JSON.parse(raw);
    return {
      byId: parsed.byId || {},
      byEmail: parsed.byEmail || {},
      byName: parsed.byName || {},
    };
  } catch (_) {
    return { byId: {}, byEmail: {}, byName: {} };
  }
}

function getFirstToken(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^@/, '')
    .trim()
    .split(/[\s._-]+/)[0];
}

function resolveCanonicalSeedMember(params: {
  userId?: string;
  email?: string;
  name?: string;
}): { seedId?: string; email?: string; name?: string; firstToken?: string } {
  const emailLower = (params.email || '').toLowerCase().trim();
  const nameLower = (params.name || '').toLowerCase().replace(/^@/, '').trim();
  const firstToken = getFirstToken(params.name);

  for (let i = 0; i < SEED_USERS.length; i++) {
    const s = SEED_USERS[i];
    const sId = `u_${i + 1}`;
    const sEmail = s.email.toLowerCase().trim();
    const sName = s.name.toLowerCase().trim();
    const sFirst = getFirstToken(s.name);

    if (
      (params.userId && params.userId === sId) ||
      (emailLower && emailLower === sEmail) ||
      (nameLower && (nameLower === sName || sName.startsWith(nameLower) || nameLower.startsWith(sName))) ||
      (firstToken && firstToken.length >= 4 && firstToken === sFirst)
    ) {
      return {
        seedId: sId,
        email: sEmail,
        name: sName,
        firstToken: sFirst,
      };
    }
  }

  return {
    seedId: params.userId,
    email: emailLower || undefined,
    name: nameLower || undefined,
    firstToken: firstToken || undefined,
  };
}

export function isCustomUploadedAvatarUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.includes('dicebear.com')) return false;
  if (Object.values(DEFAULT_PORTRAIT_AVATARS).includes(trimmed)) return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:');
}

export function getCustomUserAvatar(params: {
  userId?: string;
  email?: string;
  name?: string;
  fallbackSrc?: string;
}): string | undefined {
  const canonical = resolveCanonicalSeedMember(params);

  // 1. If fallbackSrc itself is already a freshly uploaded data:image URL, prefer it immediately
  if (typeof window === 'undefined') {
    if (isCustomUploadedAvatarUrl(params.fallbackSrc)) return params.fallbackSrc;
    if (canonical.email && DEFAULT_PORTRAIT_AVATARS[canonical.email]) {
      return DEFAULT_PORTRAIT_AVATARS[canonical.email];
    }
    return params.fallbackSrc;
  }

  const map = readAvatarMap();

  // 2. Check custom uploaded avatar in localStorage map by ID, Email, Full Name, Canonical Seed Info, or First Name
  if (params.userId && map.byId[params.userId]) {
    return map.byId[params.userId];
  }
  if (canonical.seedId && map.byId[canonical.seedId]) {
    return map.byId[canonical.seedId];
  }
  if (params.email) {
    const emailKey = params.email.toLowerCase().trim();
    if (map.byEmail[emailKey]) return map.byEmail[emailKey];
  }
  if (canonical.email && map.byEmail[canonical.email]) {
    return map.byEmail[canonical.email];
  }
  if (params.name) {
    const nameKey = params.name.toLowerCase().replace(/^@/, '').trim();
    if (map.byName[nameKey]) return map.byName[nameKey];
  }
  if (canonical.name && map.byName[canonical.name]) {
    return map.byName[canonical.name];
  }
  if (canonical.firstToken && canonical.firstToken.length >= 4 && map.byName[canonical.firstToken]) {
    return map.byName[canonical.firstToken];
  }

  // 3. Also check individual cached profile details in localStorage (by userId or canonical seedId)
  const candidateIds = Array.from(new Set([params.userId, canonical.seedId].filter(Boolean))) as string[];
  for (const cid of candidateIds) {
    try {
      const cached = localStorage.getItem('ambizcon_user_details_' + cid);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.avatar && isCustomUploadedAvatarUrl(parsed.avatar)) {
          return parsed.avatar;
        }
      }
    } catch (_) {}
  }

  // 4. If fallbackSrc passed from Supabase/props is a custom uploaded photo, return it
  if (isCustomUploadedAvatarUrl(params.fallbackSrc)) {
    return params.fallbackSrc;
  }

  // 5. Return consistent member portrait across all views & options if known member
  if (canonical.email && DEFAULT_PORTRAIT_AVATARS[canonical.email]) {
    return DEFAULT_PORTRAIT_AVATARS[canonical.email];
  }

  return params.fallbackSrc;
}

export function saveCustomUserAvatar(
  user: { _id?: string; email?: string; name: string },
  avatarDataUrl: string
): void {
  if (typeof window === 'undefined' || !avatarDataUrl) return;
  try {
    const map = readAvatarMap();
    const canonical = resolveCanonicalSeedMember({
      userId: user._id,
      email: user.email,
      name: user.name,
    });

    if (user._id) map.byId[user._id] = avatarDataUrl;
    if (canonical.seedId) map.byId[canonical.seedId] = avatarDataUrl;

    if (user.email) map.byEmail[user.email.toLowerCase().trim()] = avatarDataUrl;
    if (canonical.email) map.byEmail[canonical.email] = avatarDataUrl;

    if (user.name) {
      const cleanName = user.name.toLowerCase().replace(/^@/, '').trim();
      map.byName[cleanName] = avatarDataUrl;
    }
    if (canonical.name) map.byName[canonical.name] = avatarDataUrl;
    if (canonical.firstToken && canonical.firstToken.length >= 4) {
      map.byName[canonical.firstToken] = avatarDataUrl;
    }

    localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));

    // Also update ambizcon_user_details_<id> for both user._id and canonical.seedId
    const targetIds = Array.from(new Set([user._id, canonical.seedId].filter(Boolean))) as string[];
    for (const tid of targetIds) {
      const detailsKey = 'ambizcon_user_details_' + tid;
      const existingRaw = localStorage.getItem(detailsKey);
      const existingObj = existingRaw ? JSON.parse(existingRaw) : {};
      localStorage.setItem(
        detailsKey,
        JSON.stringify({
          ...existingObj,
          _id: tid,
          name: user.name,
          email: user.email || canonical.email,
          avatar: avatarDataUrl,
        })
      );
    }

    window.dispatchEvent(
      new CustomEvent('ambizcon_avatar_updated', {
        detail: {
          userId: user._id || canonical.seedId,
          email: user.email || canonical.email,
          name: user.name,
          avatar: avatarDataUrl,
        },
      })
    );
  } catch (err) {
    console.error('Failed to save custom avatar:', err);
  }
}

/**
 * Syncs any custom uploaded avatars returned from Supabase (getAllUsers / fetchAllUsersAction)
 * into localStorage so every component across the app immediately displays them.
 */
export function syncUsersAvatarsToLocalStore(
  users: Array<{ _id?: string; email?: string; name?: string; avatar?: string }>
): void {
  if (typeof window === 'undefined' || !Array.isArray(users) || users.length === 0) return;
  try {
    const map = readAvatarMap();
    let changed = false;

    for (const u of users) {
      if (!u || !isCustomUploadedAvatarUrl(u.avatar)) continue;
      const avatarUrl = u.avatar!.trim();
      const canonical = resolveCanonicalSeedMember({
        userId: u._id,
        email: u.email,
        name: u.name,
      });

      if (u._id && map.byId[u._id] !== avatarUrl) {
        map.byId[u._id] = avatarUrl;
        changed = true;
      }
      if (canonical.seedId && map.byId[canonical.seedId] !== avatarUrl) {
        map.byId[canonical.seedId] = avatarUrl;
        changed = true;
      }
      if (u.email) {
        const ek = u.email.toLowerCase().trim();
        if (map.byEmail[ek] !== avatarUrl) {
          map.byEmail[ek] = avatarUrl;
          changed = true;
        }
      }
      if (canonical.email && map.byEmail[canonical.email] !== avatarUrl) {
        map.byEmail[canonical.email] = avatarUrl;
        changed = true;
      }
      if (u.name) {
        const nk = u.name.toLowerCase().replace(/^@/, '').trim();
        if (map.byName[nk] !== avatarUrl) {
          map.byName[nk] = avatarUrl;
          changed = true;
        }
      }
      if (canonical.name && map.byName[canonical.name] !== avatarUrl) {
        map.byName[canonical.name] = avatarUrl;
        changed = true;
      }
      if (canonical.firstToken && canonical.firstToken.length >= 4 && map.byName[canonical.firstToken] !== avatarUrl) {
        map.byName[canonical.firstToken] = avatarUrl;
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('ambizcon_avatar_updated', { detail: { synced: true } }));
    }
  } catch (_) {}
}

export function removeCustomUserAvatar(user: { _id?: string; email?: string; name: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const map = readAvatarMap();
    const canonical = resolveCanonicalSeedMember({
      userId: user._id,
      email: user.email,
      name: user.name,
    });

    if (user._id) delete map.byId[user._id];
    if (canonical.seedId) delete map.byId[canonical.seedId];
    if (user.email) delete map.byEmail[user.email.toLowerCase().trim()];
    if (canonical.email) delete map.byEmail[canonical.email];
    if (user.name) delete map.byName[user.name.toLowerCase().replace(/^@/, '').trim()];
    if (canonical.name) delete map.byName[canonical.name];
    if (canonical.firstToken) delete map.byName[canonical.firstToken];

    localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));

    const targetIds = Array.from(new Set([user._id, canonical.seedId].filter(Boolean))) as string[];
    for (const tid of targetIds) {
      const detailsKey = 'ambizcon_user_details_' + tid;
      const existingRaw = localStorage.getItem(detailsKey);
      if (existingRaw) {
        const existingObj = JSON.parse(existingRaw);
        delete existingObj.avatar;
        localStorage.setItem(detailsKey, JSON.stringify(existingObj));
      }
    }

    window.dispatchEvent(
      new CustomEvent('ambizcon_avatar_updated', {
        detail: { userId: user._id, email: user.email, name: user.name, avatar: undefined },
      })
    );
  } catch (_) {}
}

export function compressImageFileToDataUrl(file: File, maxDimension = 280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) {
        reject(new Error('Empty image file'));
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.width;
          const height = img.height;

          // Center-crop square or scale proportionally
          const size = Math.min(width, height);
          const sx = (width - size) / 2;
          const sy = (height - size) / 2;

          const targetSize = Math.min(maxDimension, size || maxDimension);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        } catch (_) {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
