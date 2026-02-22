import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { getSupabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SessionRole = 'admin' | 'follower';

const STORAGE_KEY = 'megillah-live-session';
const CREATED_SESSION_KEY = 'megillah-created-session';

/** A position in the megillah text — either a chapter:verse or a named section */
export interface ScrollPosition {
  /** e.g. "3:7" or "blessings-before" / "blessings-after" / "shoshanat" */
  verse: string;
}

export interface SessionSettings {
  readingMinutes?: number;
  chabadMode?: boolean;
  lang?: string;
  showTranslation?: boolean; // legacy, mapped to translationMode
  translationMode?: 'hebrew' | 'both' | 'translation';
  customSubtitle?: { text: string; url: string };
  customTapHint?: string;
}

export interface Session {
  code: string;
  role: SessionRole;
  /** Initial settings loaded from DB when joining */
  initialSettings: SessionSettings;
  /** Call to broadcast current position (admin only) */
  broadcast: (pos: ScrollPosition) => void;
  /** Call to broadcast reading time change (admin only) */
  broadcastTime: (minutes: number) => void;
  /** Call to broadcast a word highlight (admin only) */
  broadcastWord: (wordId: string) => void;
  /** Call to broadcast a setting change and persist to DB (admin only) */
  broadcastSetting: (key: string, value: unknown) => void;
  /** Call to leave/end the session */
  leave: () => void;
}

interface UseSessionReturn {
  session: Session | null;
  loading: boolean;
  error: string | null;
  createSession: (password: string) => Promise<void>;
  joinSession: (code: string, password?: string) => Promise<void>;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function saveToStorage(code: string, password?: string) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code, password: password || '' }));
}

function clearStorage() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function loadFromStorage(): { code: string; password: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.code) return parsed;
  } catch {}
  return null;
}

export function saveCreatedSession(code: string, password: string) {
  localStorage.setItem(CREATED_SESSION_KEY, JSON.stringify({ code, password }));
}

export function loadCreatedSession(): { code: string; password: string } | null {
  try {
    const raw = localStorage.getItem(CREATED_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.code && parsed.password) return parsed;
  } catch {}
  return null;
}

export function clearCreatedSession() {
  localStorage.removeItem(CREATED_SESSION_KEY);
}

export function useSession(
  onRemoteScroll?: (pos: ScrollPosition) => void,
  onRemoteTime?: (minutes: number) => void,
  initialCode?: string,
  onRemoteWord?: (wordId: string) => void,
  onRemoteSetting?: (key: string, value: unknown) => void,
): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!initialCode || !!loadFromStorage());
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastBroadcast = useRef(0);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const sb = getSupabase();
      sb.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSession(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const subscribe = useCallback(
    (code: string, role: SessionRole, initialSettings: SessionSettings = {}) => {
      const sb = getSupabase();
      const channel = sb.channel(`session:${code}`, {
        config: { broadcast: { self: false } },
      });

      channel.on('broadcast', { event: 'scroll' }, (payload) => {
        if (role === 'follower' && onRemoteScroll) {
          onRemoteScroll(payload.payload as ScrollPosition);
        }
      });

      channel.on('broadcast', { event: 'reading-time' }, (payload) => {
        if (role === 'follower' && onRemoteTime) {
          onRemoteTime(payload.payload.minutes);
        }
      });

      channel.on('broadcast', { event: 'word-highlight' }, (payload) => {
        if (role === 'follower' && onRemoteWord) {
          onRemoteWord(payload.payload.word);
        }
      });

      channel.on('broadcast', { event: 'setting' }, (payload) => {
        if (role === 'follower' && onRemoteSetting) {
          onRemoteSetting(payload.payload.key, payload.payload.value);
        }
      });

      channel.subscribe();
      channelRef.current = channel;

      const broadcast = (pos: ScrollPosition) => {
        if (role !== 'admin') return;
        const now = Date.now();
        if (now - lastBroadcast.current < 200) return;
        lastBroadcast.current = now;
        channel.send({
          type: 'broadcast',
          event: 'scroll',
          payload: pos,
        });
      };

      const broadcastTime = (minutes: number) => {
        if (role !== 'admin') return;
        channel.send({
          type: 'broadcast',
          event: 'reading-time',
          payload: { minutes },
        });
        // Persist to DB
        const sb = getSupabase();
        sb.from('sessions').update({ settings: { ...initialSettings, readingMinutes: minutes } }).eq('code', code).then(() => {
          initialSettings.readingMinutes = minutes;
        });
      };

      const broadcastWord = (wordId: string) => {
        if (role !== 'admin') return;
        channel.send({
          type: 'broadcast',
          event: 'word-highlight',
          payload: { word: wordId },
        });
      };

      const broadcastSetting = (key: string, value: unknown) => {
        if (role !== 'admin') return;
        channel.send({
          type: 'broadcast',
          event: 'setting',
          payload: { key, value },
        });
        // Persist to DB
        const updated = { ...initialSettings, [key]: value };
        const sb = getSupabase();
        sb.from('sessions').update({ settings: updated }).eq('code', code).then(() => {
          Object.assign(initialSettings, updated);
        });
      };

      const leave = () => {
        clearStorage();
        clearCreatedSession();
        cleanup();
      };

      setSession({ code, role, initialSettings, broadcast, broadcastTime, broadcastWord, broadcastSetting, leave });
    },
    [cleanup, onRemoteScroll, onRemoteTime, onRemoteWord, onRemoteSetting],
  );

  const createSession = useCallback(
    async (password: string) => {
      setLoading(true);
      setError(null);
      try {
        const sb = getSupabase();
        const code = generateCode();
        const { error: insertErr } = await sb
          .from('sessions')
          .insert({ code, password });
        if (insertErr) throw insertErr;
        saveToStorage(code, password);
        subscribe(code, 'admin');
      } catch (e: any) {
        setError(e.message || 'Failed to create session');
      } finally {
        setLoading(false);
      }
    },
    [subscribe],
  );

  const joinSession = useCallback(
    async (code: string, password?: string) => {
      setLoading(true);
      setError(null);
      try {
        const sb = getSupabase();
        const { data, error: fetchErr } = await sb
          .from('sessions')
          .select('password, settings')
          .eq('code', code)
          .single();
        if (fetchErr || !data) throw new Error('Session not found');
        const role: SessionRole =
          password && data.password === password ? 'admin' : 'follower';
        saveToStorage(code, password);
        subscribe(code, role, (data.settings as SessionSettings) || {});
      } catch (e: any) {
        setError(e.message || 'Failed to join session');
      } finally {
        setLoading(false);
      }
    },
    [subscribe],
  );

  // Auto-rejoin on mount: initialCode (from URL) takes priority over sessionStorage
  useEffect(() => {
    if (initialCode) {
      clearStorage();
      joinSession(initialCode);
    } else {
      const saved = loadFromStorage();
      if (saved) {
        joinSession(saved.code, saved.password || undefined);
      }
    }
  }, []);

  return { session, loading, error, createSession, joinSession };
}
