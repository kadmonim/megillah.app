import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { useSession } from '../../lib/useSession';
import type { Session, ScrollPosition } from '../../lib/useSession';
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

export default function LiveSession({ initialCode }: { initialCode?: string }) {
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

  const { session, loading, error, createSession, joinSession } =
    useSession(handleRemoteScroll, handleRemoteTime);

  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => { setLang(detectLang()); }, []);

  if (!session) {
    return <LobbyScreen
      initialCode={initialCode}
      loading={loading}
      error={error}
      onCreateSession={createSession}
      onJoinSession={joinSession}
      lang={lang}
    />;
  }

  return (
    <div class="live-session">
      <MegillahReader standalone={true} session={session} remoteMinutes={remoteMinutes} />
    </div>
  );
}

function LobbyScreen({
  initialCode,
  loading,
  error,
  onCreateSession,
  onJoinSession,
  lang,
}: {
  initialCode?: string;
  loading: boolean;
  error: string | null;
  onCreateSession: (password: string) => Promise<void>;
  onJoinSession: (code: string, password?: string) => Promise<void>;
  lang: Lang;
}) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(
    initialCode ? 'join' : 'choose',
  );
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(initialCode || '');
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
                autoFocus={!initialCode}
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
