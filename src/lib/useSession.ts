import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { getSupabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SessionRole = 'admin' | 'follower';

/** A position in the megillah text — either a chapter:verse or a named section */
export interface ScrollPosition {
  /** e.g. "3:7" or "blessings-before" / "blessings-after" / "shoshanat" */
  verse: string;
}

export interface Session {
  code: string;
  role: SessionRole;
  /** Call to broadcast current position (admin only) */
  broadcast: (pos: ScrollPosition) => void;
  /** Call to broadcast reading time change (admin only) */
  broadcastTime: (minutes: number) => void;
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

export function useSession(
  onRemoteScroll?: (pos: ScrollPosition) => void,
  onRemoteTime?: (minutes: number) => void,
): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
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
    (code: string, role: SessionRole) => {
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
      };

      const leave = () => cleanup();

      setSession({ code, role, broadcast, broadcastTime, leave });
    },
    [cleanup, onRemoteScroll, onRemoteTime],
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
          .select('password')
          .eq('code', code)
          .single();
        if (fetchErr || !data) throw new Error('Session not found');
        const role: SessionRole =
          password && data.password === password ? 'admin' : 'follower';
        subscribe(code, role);
      } catch (e: any) {
        setError(e.message || 'Failed to join session');
      } finally {
        setLoading(false);
      }
    },
    [subscribe],
  );

  return { session, loading, error, createSession, joinSession };
}
