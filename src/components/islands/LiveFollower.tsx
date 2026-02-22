import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { useSession } from '../../lib/useSession';
import type { ScrollPosition } from '../../lib/useSession';
import MegillahReader from './MegillahReader';

function getCodeFromURL(): string {
  try {
    return new URLSearchParams(window.location.search).get('code') || '';
  } catch { return ''; }
}

export default function LiveFollower() {
  const [code] = useState(getCodeFromURL);
  const lastVerse = useRef<string | null>(null);
  const [remoteMinutes, setRemoteMinutes] = useState<number | null>(null);

  const handleRemoteScroll = useCallback((pos: ScrollPosition) => {
    if (pos.verse === lastVerse.current) return;
    lastVerse.current = pos.verse;
    const el = document.querySelector(`[data-verse="${pos.verse}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleRemoteTime = useCallback((minutes: number) => {
    setRemoteMinutes(minutes);
  }, []);

  const { session, error } = useSession(handleRemoteScroll, handleRemoteTime, code);

  // Hide the server-rendered loading screen once we're ready
  useEffect(() => {
    if (session || error) {
      const el = document.querySelector('.loading-screen') as HTMLElement;
      if (el) el.style.display = 'none';
    }
  }, [session, error]);

  if (error) {
    return (
      <div class="follower-error">
        <div class="follower-error-card">
          <span class="material-icons" style="font-size:48px;color:var(--color-burgundy);margin-bottom:12px;">error_outline</span>
          <h2>Session not found</h2>
          <p>This session may have ended or the code is invalid.</p>
          <a href="/live" class="follower-error-link">Go to Megillah Live</a>
        </div>
        <style>{`
          .follower-error {
            min-height: 80dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
          }
          .follower-error-card {
            background: var(--color-white);
            border-radius: 16px;
            padding: 40px 32px;
            box-shadow: 0 4px 20px rgba(102, 10, 35, 0.12);
            max-width: 380px;
            width: 100%;
            text-align: center;
          }
          .follower-error-card h2 {
            font-size: 1.2rem;
            color: var(--color-burgundy);
            margin-bottom: 8px;
          }
          .follower-error-card p {
            font-size: 0.9rem;
            color: var(--color-text-light);
            margin-bottom: 20px;
          }
          .follower-error-link {
            display: inline-block;
            padding: 12px 24px;
            background: var(--color-burgundy);
            color: var(--color-white);
            border-radius: 10px;
            font-weight: 600;
            text-decoration: none;
          }
          .follower-error-link:hover {
            background: var(--color-burgundy-light);
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  if (!session) return null; // loading screen is server-rendered

  return (
    <div class="live-session">
      <MegillahReader standalone={true} session={session} remoteMinutes={remoteMinutes} />
    </div>
  );
}
