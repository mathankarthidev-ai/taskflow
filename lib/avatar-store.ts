'use client';

const AVATAR_MAP_KEY = 'ambizcon_user_avatars_v1';

export interface AvatarMapRecord {
  byId: Record<string, string>;
  byEmail: Record<string, string>;
  byName: Record<string, string>;
}

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

export function getCustomUserAvatar(params: {
  userId?: string;
  email?: string;
  name?: string;
  fallbackSrc?: string;
}): string | undefined {
  if (typeof window === 'undefined') return params.fallbackSrc;
  const map = readAvatarMap();

  if (params.userId && map.byId[params.userId]) {
    return map.byId[params.userId];
  }
  if (params.email) {
    const emailKey = params.email.toLowerCase().trim();
    if (map.byEmail[emailKey]) return map.byEmail[emailKey];
  }
  if (params.name) {
    const nameKey = params.name.toLowerCase().trim();
    if (map.byName[nameKey]) return map.byName[nameKey];
  }

  // Also check individual cached profile details in localStorage
  if (params.userId) {
    try {
      const cached = localStorage.getItem('ambizcon_user_details_' + params.userId);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.avatar) return parsed.avatar;
      }
    } catch (_) {}
  }

  return params.fallbackSrc;
}

export function saveCustomUserAvatar(
  user: { _id: string; email?: string; name: string },
  avatarDataUrl: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const map = readAvatarMap();
    if (user._id) {
      map.byId[user._id] = avatarDataUrl;
    }
    if (user.email) {
      map.byEmail[user.email.toLowerCase().trim()] = avatarDataUrl;
    }
    if (user.name) {
      map.byName[user.name.toLowerCase().trim()] = avatarDataUrl;
    }
    localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));

    // Also update ambizcon_user_details_<id> if present
    const detailsKey = 'ambizcon_user_details_' + user._id;
    const existingRaw = localStorage.getItem(detailsKey);
    const existingObj = existingRaw ? JSON.parse(existingRaw) : {};
    localStorage.setItem(
      detailsKey,
      JSON.stringify({
        ...existingObj,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: avatarDataUrl,
      })
    );

    window.dispatchEvent(
      new CustomEvent('ambizcon_avatar_updated', {
        detail: { userId: user._id, email: user.email, name: user.name, avatar: avatarDataUrl },
      })
    );
  } catch (err) {
    console.error('Failed to save custom avatar:', err);
  }
}

export function removeCustomUserAvatar(user: { _id: string; email?: string; name: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const map = readAvatarMap();
    if (user._id) delete map.byId[user._id];
    if (user.email) delete map.byEmail[user.email.toLowerCase().trim()];
    if (user.name) delete map.byName[user.name.toLowerCase().trim()];
    localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));

    const detailsKey = 'ambizcon_user_details_' + user._id;
    const existingRaw = localStorage.getItem(detailsKey);
    if (existingRaw) {
      const existingObj = JSON.parse(existingRaw);
      delete existingObj.avatar;
      localStorage.setItem(detailsKey, JSON.stringify(existingObj));
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
          let width = img.width;
          let height = img.height;

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
