import { useEffect } from 'preact/hooks';

// LiveFollower is now a redirect to LiveSession which handles both roles.
// This preserves backwards compatibility for /live/join?code=X URLs.
export default function LiveFollower() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    window.location.href = code ? `/live?code=${code}` : '/live';
  }, []);
  return null;
}
