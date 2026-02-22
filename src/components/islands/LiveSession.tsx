import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { useSession } from '../../lib/useSession';
import type { Session, ScrollPosition } from '../../lib/useSession';
import { getSupabase } from '../../lib/supabase';
import MegillahReader from './MegillahReader';

type Lang = 'he' | 'en' | 'es' | 'ru' | 'fr' | 'pt' | 'it';

const lobbyText = {
  he: {
    title: 'מגילה לייב',
    subtitle: 'עקבו אחרי קריאת מגילה בזמן אמת',
    createSession: 'צור סשן',
    joinSession: 'הצטרף לסשן',
    adminPassword: 'סיסמת מנהל',
    choosePassword: 'בחר סיסמה...',
    creating: 'יוצר...',
    sessionCode: 'קוד סשן',
    passwordAdmins: 'סיסמה (למנהלים בלבד)',
    optional: 'אופציונלי...',
    joining: 'מצטרף...',
    back: 'חזרה',
    shareTitle: 'שתפו עם העוקבים',
    copyLink: 'העתק קישור',
    copied: 'הועתק!',
    startBroadcasting: 'התחל שידור',
    scanQR: 'או סרקו קוד QR',
  },
  en: {
    title: 'Megillah Live',
    subtitle: 'Follow along with a live Megillah reading',
    createSession: 'Create Session',
    joinSession: 'Join Session',
    adminPassword: 'Admin Password',
    choosePassword: 'Choose a password...',
    creating: 'Creating...',
    sessionCode: 'Session Code',
    passwordAdmins: 'Password (admins only)',
    optional: 'Optional...',
    joining: 'Joining...',
    back: 'Back',
    shareTitle: 'Share with followers',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    startBroadcasting: 'Start Broadcasting',
    scanQR: 'Or scan QR code',
  },
  es: {
    title: 'Meguilá en Vivo',
    subtitle: 'Sigue una lectura en vivo de la Meguilá',
    createSession: 'Crear sesión',
    joinSession: 'Unirse a sesión',
    adminPassword: 'Contraseña de admin',
    choosePassword: 'Elige una contraseña...',
    creating: 'Creando...',
    sessionCode: 'Código de sesión',
    passwordAdmins: 'Contraseña (solo admins)',
    optional: 'Opcional...',
    joining: 'Uniéndose...',
    back: 'Volver',
    shareTitle: 'Compartir con seguidores',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    startBroadcasting: 'Iniciar transmisión',
    scanQR: 'O escanear código QR',
  },
  ru: {
    title: 'Мегила Лайв',
    subtitle: 'Следите за чтением Мегилы в реальном времени',
    createSession: 'Создать сессию',
    joinSession: 'Присоединиться',
    adminPassword: 'Пароль администратора',
    choosePassword: 'Выберите пароль...',
    creating: 'Создание...',
    sessionCode: 'Код сессии',
    passwordAdmins: 'Пароль (только для админов)',
    optional: 'Необязательно...',
    joining: 'Подключение...',
    back: 'Назад',
    shareTitle: 'Поделиться с подписчиками',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    startBroadcasting: 'Начать трансляцию',
    scanQR: 'Или отсканируйте QR-код',
  },
  fr: {
    title: 'Méguila en Direct',
    subtitle: 'Suivez une lecture en direct de la Méguila',
    createSession: 'Créer une session',
    joinSession: 'Rejoindre une session',
    adminPassword: 'Mot de passe admin',
    choosePassword: 'Choisissez un mot de passe...',
    creating: 'Création...',
    sessionCode: 'Code de session',
    passwordAdmins: 'Mot de passe (admins uniquement)',
    optional: 'Facultatif...',
    joining: 'Connexion...',
    back: 'Retour',
    shareTitle: 'Partager avec les abonnés',
    copyLink: 'Copier le lien',
    copied: 'Copié !',
    startBroadcasting: 'Commencer la diffusion',
    scanQR: 'Ou scannez le code QR',
  },
  pt: {
    title: 'Meguilá ao Vivo',
    subtitle: 'Acompanhe uma leitura ao vivo da Meguilá',
    createSession: 'Criar sessão',
    joinSession: 'Entrar na sessão',
    adminPassword: 'Senha de admin',
    choosePassword: 'Escolha uma senha...',
    creating: 'Criando...',
    sessionCode: 'Código da sessão',
    passwordAdmins: 'Senha (apenas admins)',
    optional: 'Opcional...',
    joining: 'Entrando...',
    back: 'Voltar',
    shareTitle: 'Compartilhar com seguidores',
    copyLink: 'Copiar link',
    copied: 'Copiado!',
    startBroadcasting: 'Iniciar transmissão',
    scanQR: 'Ou escaneie o código QR',
  },
  it: {
    title: 'Meghillà dal Vivo',
    subtitle: 'Segui una lettura dal vivo della Meghillà',
    createSession: 'Crea sessione',
    joinSession: 'Unisciti alla sessione',
    adminPassword: 'Password admin',
    choosePassword: 'Scegli una password...',
    creating: 'Creazione...',
    sessionCode: 'Codice sessione',
    passwordAdmins: 'Password (solo admin)',
    optional: 'Facoltativo...',
    joining: 'Connessione...',
    back: 'Indietro',
    shareTitle: 'Condividi con i follower',
    copyLink: 'Copia link',
    copied: 'Copiato!',
    startBroadcasting: 'Inizia la trasmissione',
    scanQR: 'Oppure scansiona il codice QR',
  },
} as const;

function detectLang(): Lang {
  const navLang = navigator.language;
  if (navLang.startsWith('he')) return 'he';
  if (navLang.startsWith('es')) return 'es';
  if (navLang.startsWith('ru')) return 'ru';
  if (navLang.startsWith('fr')) return 'fr';
  if (navLang.startsWith('pt')) return 'pt';
  if (navLang.startsWith('it')) return 'it';
  return 'en';
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function LiveSession() {
  const lastVerse = useRef<string | null>(null);
  const lastHighlightTime = useRef(0);
  const [remoteMinutes, setRemoteMinutes] = useState<number | null>(null);
  const [remoteWord, setRemoteWord] = useState<string | null>(null);
  const [remoteActiveVerse, setRemoteActiveVerse] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<{ code: string; password: string } | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const handleRemoteScroll = useCallback((pos: ScrollPosition) => {
    // Suppress scroll broadcasts while word/verse highlighting is active
    if (Date.now() - lastHighlightTime.current < 3000) return;
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

  const handleRemoteWord = useCallback((wordId: string) => {
    lastHighlightTime.current = Date.now();
    let verseKey: string | null = null;
    if (wordId.startsWith('v:')) {
      const verse = wordId.slice(2);
      setRemoteActiveVerse(verse);
      setRemoteWord(null);
      verseKey = verse;
    } else {
      setRemoteWord(wordId);
      setRemoteActiveVerse(null);
      // Extract verse key: "3:7-5" → "3:7"
      const lastDash = wordId.lastIndexOf('-');
      if (lastDash > 0) verseKey = wordId.slice(0, lastDash);
    }
    if (verseKey) {
      const el = document.querySelector(`[data-verse="${verseKey}"]`);
      if (el) {
        const stickyHeight = document.querySelector('.toolbar-sticky')?.getBoundingClientRect().bottom ?? 60;
        const y = el.getBoundingClientRect().top + window.scrollY - stickyHeight - 40;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, []);

  const { session, loading, error, joinSession } =
    useSession(handleRemoteScroll, handleRemoteTime, undefined, handleRemoteWord);

  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => { setLang(detectLang()); }, []);

  const handleCreate = useCallback(async (password: string) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const sb = getSupabase();
      const code = generateCode();
      const { error: insertErr } = await sb
        .from('sessions')
        .insert({ code, password });
      if (insertErr) throw insertErr;
      setPendingSession({ code, password });
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create session');
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const handleStartBroadcasting = useCallback(async () => {
    if (!pendingSession) return;
    await joinSession(pendingSession.code, pendingSession.password);
    setPendingSession(null);
  }, [pendingSession, joinSession]);

  if (pendingSession && !session) {
    return <ShareScreen
      code={pendingSession.code}
      lang={lang}
      loading={loading}
      onStart={handleStartBroadcasting}
      onBack={() => setPendingSession(null)}
    />;
  }

  if (!session) {
    return <LobbyScreen
      loading={createLoading || loading}
      error={createError || error}
      onCreateSession={handleCreate}
      onJoinSession={joinSession}
      lang={lang}
    />;
  }

  return (
    <div class="live-session">
      <MegillahReader standalone={true} session={session} remoteMinutes={remoteMinutes} activeWord={remoteWord} activeVerse={remoteActiveVerse} />
    </div>
  );
}

function ShareScreen({
  code,
  lang,
  loading,
  onStart,
  onBack,
}: {
  code: string;
  lang: Lang;
  loading: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const t = lobbyText[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const shareUrl = `https://megillah.app/live/join?code=${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  return (
    <div class="lobby" dir={dir}>
      <div class="lobby-card">
        <h1 class="lobby-title">{t.shareTitle}</h1>

        <div class="share-code">{code}</div>

        <div class="share-url-box">
          <span class="share-url">{shareUrl}</span>
          <button class="share-copy-btn" onClick={handleCopy}>
            <span class="material-icons">{copied ? 'check' : 'content_copy'}</span>
            {copied ? t.copied : t.copyLink}
          </button>
        </div>

        <p class="share-qr-label">{t.scanQR}</p>
        <img class="share-qr" src={qrUrl} alt="QR Code" width={200} height={200} />

        <div class="share-actions">
          <button class="lobby-btn create" onClick={onStart} disabled={loading}>
            <span class="material-icons">cast</span>
            {loading ? t.joining : t.startBroadcasting}
          </button>
          <button type="button" class="lobby-back" onClick={onBack}>
            {t.back}
          </button>
        </div>
      </div>

      <style>{`
        .share-code {
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: var(--color-burgundy);
          margin: 16px 0 20px;
        }

        .share-url-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-cream, #f9f5f0);
          border: 2px solid var(--color-cream-dark, #e8ddd0);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 20px;
        }

        .share-url {
          flex: 1;
          font-size: 0.8rem;
          color: var(--color-text);
          word-break: break-all;
          text-align: start;
        }

        .share-copy-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--color-burgundy);
          color: var(--color-white);
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .share-copy-btn .material-icons {
          font-size: 16px;
        }

        .share-copy-btn:hover {
          background: var(--color-burgundy-light);
        }

        .share-qr-label {
          font-size: 0.85rem;
          color: var(--color-text-light);
          margin-bottom: 12px;
        }

        .share-qr {
          display: block;
          margin: 0 auto 24px;
          border-radius: 8px;
        }

        .share-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .share-actions .lobby-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          width: 100%;
        }

        .share-actions .lobby-btn:active {
          transform: scale(0.97);
        }

        .share-actions .lobby-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .share-actions .lobby-btn.create {
          background: var(--color-burgundy);
          color: var(--color-white);
        }

        .share-actions .lobby-btn.create:hover:not(:disabled) {
          background: var(--color-burgundy-light);
        }

        .share-actions .lobby-back {
          background: none;
          border: none;
          color: var(--color-text-light);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 4px;
        }

        .share-actions .lobby-back:hover {
          color: var(--color-burgundy);
        }
      `}</style>
    </div>
  );
}

function LobbyScreen({
  loading,
  error,
  onCreateSession,
  onJoinSession,
  lang,
}: {
  loading: boolean;
  error: string | null;
  onCreateSession: (password: string) => Promise<void>;
  onJoinSession: (code: string, password?: string) => Promise<void>;
  lang: Lang;
}) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const t = lobbyText[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return (
    <div class="lobby" dir={dir}>
      <div class="lobby-card">
        <h1 class="lobby-title">{t.title}</h1>
        <p class="lobby-sub">{t.subtitle}</p>

        {error && <div class="lobby-error">{error}</div>}

        {mode === 'choose' && (
          <div class="lobby-choices">
            <button class="lobby-btn create" onClick={() => setMode('create')}>
              <span class="material-icons">add_circle</span>
              {t.createSession}
            </button>
            <button class="lobby-btn join" onClick={() => setMode('join')}>
              <span class="material-icons">login</span>
              {t.joinSession}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form
            class="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (password.trim()) onCreateSession(password.trim());
            }}
          >
            <label class="lobby-label">
              {t.adminPassword}
              <input
                type="password"
                class="lobby-input"
                value={password}
                placeholder={t.choosePassword}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                required
                autoFocus
              />
            </label>
            <button class="lobby-btn create" type="submit" disabled={loading}>
              {loading ? t.creating : t.createSession}
            </button>
            <button
              type="button"
              class="lobby-back"
              onClick={() => setMode('choose')}
            >
              {t.back}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form
            class="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) onJoinSession(code.trim(), password.trim() || undefined);
            }}
          >
            <label class="lobby-label">
              {t.sessionCode}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                class="lobby-input code-input"
                value={code}
                placeholder="123456"
                onInput={(e) => setCode((e.target as HTMLInputElement).value)}
                required
                autoFocus
              />
            </label>
            <label class="lobby-label">
              {t.passwordAdmins}
              <input
                type="password"
                class="lobby-input"
                value={password}
                placeholder={t.optional}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              />
            </label>
            <button class="lobby-btn join" type="submit" disabled={loading}>
              {loading ? t.joining : t.joinSession}
            </button>
            <button
              type="button"
              class="lobby-back"
              onClick={() => { setMode('choose'); setCode(''); }}
            >
              {t.back}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .lobby {
          min-height: 80dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }

        .lobby-card {
          background: var(--color-white);
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 4px 20px rgba(102, 10, 35, 0.12);
          max-width: 380px;
          width: 100%;
          text-align: center;
        }

        .lobby-title {
          font-size: 1.4rem;
          font-weight: 900;
          color: var(--color-burgundy);
          margin-bottom: 4px;
        }

        .lobby-sub {
          font-size: 0.9rem;
          color: var(--color-text-light);
          margin-bottom: 24px;
        }

        .lobby-error {
          background: rgba(198, 40, 40, 0.1);
          color: var(--color-error);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        .lobby-choices {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .lobby-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          width: 100%;
        }

        .lobby-btn:active {
          transform: scale(0.97);
        }

        .lobby-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .lobby-btn.create {
          background: var(--color-burgundy);
          color: var(--color-white);
        }

        .lobby-btn.create:hover:not(:disabled) {
          background: var(--color-burgundy-light);
        }

        .lobby-btn.join {
          background: var(--color-gold);
          color: var(--color-white);
        }

        .lobby-btn.join:hover:not(:disabled) {
          background: var(--color-gold-light);
        }

        .lobby-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .lobby-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text);
          text-align: start;
        }

        .lobby-input {
          padding: 10px 12px;
          border: 2px solid var(--color-cream-dark);
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .lobby-input:focus {
          outline: none;
          border-color: var(--color-burgundy);
        }

        .code-input {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.3em;
          font-weight: 700;
        }

        .lobby-back {
          background: none;
          border: none;
          color: var(--color-text-light);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 4px;
        }

        .lobby-back:hover {
          color: var(--color-burgundy);
        }
      `}</style>
    </div>
  );
}
