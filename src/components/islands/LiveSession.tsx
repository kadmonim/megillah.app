import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { useSession, saveCreatedSession, loadCreatedSession, clearCreatedSession } from '../../lib/useSession';
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
    adminPassword: 'הגדירו סיסמת שידור',
    choosePassword: 'בחרו סיסמה...',
    creating: 'יוצר...',
    sessionCode: 'קוד סשן',
    passwordAdmins: 'סיסמה (למנהלים בלבד)',
    optional: 'אופציונלי...',
    joining: 'מצטרף...',
    back: 'חזרה',
    copyLink: 'העתק קישור',
    copied: 'הועתק!',
    startBroadcasting: 'התחל שידור',
    scanQR: 'או סרקו קוד QR',
    sessionCreated: 'הסשן נוצר בהצלחה!',

    shareHeading: 'מידע לשיתוף',
    shareTip1: 'שלחו להם את הקישור הזה:',
    shareTip2: 'או, בקשו מהם להיכנס ל-megillah.app/live, ללחוץ על "הצטרף לסשן" ולהזין את קוד הסשן',
    shareTip3: 'או שיסרקו את קוד ה-QR.',
    broadcastHeading: 'מידע לשידור',
    broadcastTip1: 'לחצו על הכפתור למטה כדי להתחיל לשדר עכשיו.',
    broadcastTip2Pre: 'או, מכל מכשיר אחר, היכנסו ל-megillah.app/live, לחצו על "הצטרף לסשן", הזינו את קוד הסשן',
    broadcastTip2Mid: 'ואת הסיסמה שהגדרתם:',
    saveNote: 'הקפידו לזכור את הסיסמה שלכם.',
    showPassword: 'הצג',
    hidePassword: 'הסתר',
  },
  en: {
    title: 'Megillah Live',
    subtitle: 'Follow along with a live Megillah reading',
    createSession: 'Create Session',
    joinSession: 'Join Session',
    adminPassword: 'Set a Broadcaster Password',
    choosePassword: 'Choose a password...',
    creating: 'Creating...',
    sessionCode: 'Session Code',
    passwordAdmins: 'Password (admins only)',
    optional: 'Optional...',
    joining: 'Joining...',
    back: 'Back',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    startBroadcasting: 'Start Broadcasting',
    scanQR: 'Or scan QR code',
    sessionCreated: 'Session created successfully!',

    shareHeading: 'Sharing Information',
    shareTip1: 'Send them this link:',
    shareTip2: 'Or, tell them to go to megillah.app/live, click "Join Session", and enter the Session Code',
    shareTip3: 'Or have them scan this QR code.',
    broadcastHeading: 'Broadcasting Information',
    broadcastTip1: 'Click the button below to start broadcasting now.',
    broadcastTip2Pre: 'Or, from any device, go to megillah.app/live, click "Join Session", and enter the Session Code',
    broadcastTip2Mid: 'and the password you just created:',
    saveNote: 'Make sure to remember your password.',
    showPassword: 'Show',
    hidePassword: 'Hide',
  },
  es: {
    title: 'Meguilá en Vivo',
    subtitle: 'Sigue una lectura en vivo de la Meguilá',
    createSession: 'Crear sesión',
    joinSession: 'Unirse a sesión',
    adminPassword: 'Establece una contraseña de transmisión',
    choosePassword: 'Elige una contraseña...',
    creating: 'Creando...',
    sessionCode: 'Código de sesión',
    passwordAdmins: 'Contraseña (solo admins)',
    optional: 'Opcional...',
    joining: 'Uniéndose...',
    back: 'Volver',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    startBroadcasting: 'Iniciar transmisión',
    scanQR: 'O escanear código QR',
    sessionCreated: '¡Sesión creada con éxito!',

    shareHeading: 'Información para compartir',
    shareTip1: 'Envíales este enlace:',
    shareTip2: 'O diles que vayan a megillah.app/live, hagan clic en "Unirse a sesión" e ingresen el código de sesión',
    shareTip3: 'O que escaneen este código QR.',
    broadcastHeading: 'Información de transmisión',
    broadcastTip1: 'Haz clic en el botón de abajo para comenzar a transmitir ahora.',
    broadcastTip2Pre: 'O, desde cualquier dispositivo, ve a megillah.app/live, haz clic en "Unirse a sesión" e ingresa el código de sesión',
    broadcastTip2Mid: 'y la contraseña que acabas de crear:',
    saveNote: 'Asegúrate de recordar tu contraseña.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
  },
  ru: {
    title: 'Мегила Лайв',
    subtitle: 'Следите за чтением Мегилы в реальном времени',
    createSession: 'Создать сессию',
    joinSession: 'Присоединиться',
    adminPassword: 'Задайте пароль трансляции',
    choosePassword: 'Выберите пароль...',
    creating: 'Создание...',
    sessionCode: 'Код сессии',
    passwordAdmins: 'Пароль (только для админов)',
    optional: 'Необязательно...',
    joining: 'Подключение...',
    back: 'Назад',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    startBroadcasting: 'Начать трансляцию',
    scanQR: 'Или отсканируйте QR-код',
    sessionCreated: 'Сессия успешно создана!',

    shareHeading: 'Информация для обмена',
    shareTip1: 'Отправьте им эту ссылку:',
    shareTip2: 'Или попросите их зайти на megillah.app/live, нажать «Присоединиться» и ввести код сессии',
    shareTip3: 'Или пусть отсканируют этот QR-код.',
    broadcastHeading: 'Информация о трансляции',
    broadcastTip1: 'Нажмите кнопку ниже, чтобы начать трансляцию сейчас.',
    broadcastTip2Pre: 'Или с любого устройства зайдите на megillah.app/live, нажмите «Присоединиться» и введите код сессии',
    broadcastTip2Mid: 'и пароль, который вы только что создали:',
    saveNote: 'Обязательно запомните свой пароль.',
    showPassword: 'Показать',
    hidePassword: 'Скрыть',
  },
  fr: {
    title: 'Méguila en Direct',
    subtitle: 'Suivez une lecture en direct de la Méguila',
    createSession: 'Créer une session',
    joinSession: 'Rejoindre une session',
    adminPassword: 'Définir un mot de passe de diffusion',
    choosePassword: 'Choisissez un mot de passe...',
    creating: 'Création...',
    sessionCode: 'Code de session',
    passwordAdmins: 'Mot de passe (admins uniquement)',
    optional: 'Facultatif...',
    joining: 'Connexion...',
    back: 'Retour',
    copyLink: 'Copier le lien',
    copied: 'Copié !',
    startBroadcasting: 'Commencer la diffusion',
    scanQR: 'Ou scannez le code QR',
    sessionCreated: 'Session créée avec succès !',

    shareHeading: 'Informations de partage',
    shareTip1: 'Envoyez-leur ce lien :',
    shareTip2: 'Ou demandez-leur d\'aller sur megillah.app/live, de cliquer sur « Rejoindre » et d\'entrer le code de session',
    shareTip3: 'Ou qu\'ils scannent ce code QR.',
    broadcastHeading: 'Informations de diffusion',
    broadcastTip1: 'Cliquez sur le bouton ci-dessous pour commencer la diffusion maintenant.',
    broadcastTip2Pre: 'Ou, depuis n\'importe quel appareil, allez sur megillah.app/live, cliquez sur « Rejoindre » et entrez le code de session',
    broadcastTip2Mid: 'et le mot de passe que vous venez de créer :',
    saveNote: 'N\'oubliez pas de retenir votre mot de passe.',
    showPassword: 'Afficher',
    hidePassword: 'Masquer',
  },
  pt: {
    title: 'Meguilá ao Vivo',
    subtitle: 'Acompanhe uma leitura ao vivo da Meguilá',
    createSession: 'Criar sessão',
    joinSession: 'Entrar na sessão',
    adminPassword: 'Defina uma senha de transmissão',
    choosePassword: 'Escolha uma senha...',
    creating: 'Criando...',
    sessionCode: 'Código da sessão',
    passwordAdmins: 'Senha (apenas admins)',
    optional: 'Opcional...',
    joining: 'Entrando...',
    back: 'Voltar',
    copyLink: 'Copiar link',
    copied: 'Copiado!',
    startBroadcasting: 'Iniciar transmissão',
    scanQR: 'Ou escaneie o código QR',
    sessionCreated: 'Sessão criada com sucesso!',

    shareHeading: 'Informações de compartilhamento',
    shareTip1: 'Envie este link para eles:',
    shareTip2: 'Ou peça para acessarem megillah.app/live, clicar em "Entrar na sessão" e digitar o código da sessão',
    shareTip3: 'Ou escanear este código QR.',
    broadcastHeading: 'Informações de transmissão',
    broadcastTip1: 'Clique no botão abaixo para começar a transmitir agora.',
    broadcastTip2Pre: 'Ou, de qualquer dispositivo, acesse megillah.app/live, clique em "Entrar na sessão" e digite o código da sessão',
    broadcastTip2Mid: 'e a senha que você acabou de criar:',
    saveNote: 'Não se esqueça da sua senha.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
  },
  it: {
    title: 'Meghillà dal Vivo',
    subtitle: 'Segui una lettura dal vivo della Meghillà',
    createSession: 'Crea sessione',
    joinSession: 'Unisciti alla sessione',
    adminPassword: 'Imposta una password di trasmissione',
    choosePassword: 'Scegli una password...',
    creating: 'Creazione...',
    sessionCode: 'Codice sessione',
    passwordAdmins: 'Password (solo admin)',
    optional: 'Facoltativo...',
    joining: 'Connessione...',
    back: 'Indietro',
    copyLink: 'Copia link',
    copied: 'Copiato!',
    startBroadcasting: 'Inizia la trasmissione',
    scanQR: 'Oppure scansiona il codice QR',
    sessionCreated: 'Sessione creata con successo!',

    shareHeading: 'Informazioni per la condivisione',
    shareTip1: 'Invia loro questo link:',
    shareTip2: 'Oppure chiedi di andare su megillah.app/live, cliccare "Unisciti alla sessione" e inserire il codice sessione',
    shareTip3: 'Oppure fai scansionare questo codice QR.',
    broadcastHeading: 'Informazioni sulla trasmissione',
    broadcastTip1: 'Clicca il pulsante qui sotto per iniziare a trasmettere ora.',
    broadcastTip2Pre: 'Oppure, da qualsiasi dispositivo, vai su megillah.app/live, clicca "Unisciti alla sessione" e inserisci il codice sessione',
    broadcastTip2Mid: 'e la password che hai appena creato:',
    saveNote: 'Assicurati di ricordare la tua password.',
    showPassword: 'Mostra',
    hidePassword: 'Nascondi',
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
  const [remoteSettings, setRemoteSettings] = useState<Record<string, unknown>>({});
  const [syncEnabled, setSyncEnabled] = useState(true);
  const syncRef = useRef(true);
  syncRef.current = syncEnabled;
  const lastBroadcastVerse = useRef<string | null>(null);
  const [pendingSession, setPendingSession] = useState<{ code: string; password: string } | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const handleRemoteScroll = useCallback((pos: ScrollPosition) => {
    lastBroadcastVerse.current = pos.verse;
    if (!syncRef.current) return;
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
    // Track last broadcast verse even when sync is off
    let verseKey: string | null = null;
    if (wordId.startsWith('v:')) {
      verseKey = wordId.slice(2);
    } else {
      const lastDash = wordId.lastIndexOf('-');
      if (lastDash > 0) verseKey = wordId.slice(0, lastDash);
    }
    if (verseKey) lastBroadcastVerse.current = verseKey;

    if (!syncRef.current) return;
    lastHighlightTime.current = Date.now();
    if (wordId.startsWith('v:')) {
      const verse = wordId.slice(2);
      setRemoteActiveVerse(verse);
      setRemoteWord(null);
    } else {
      setRemoteWord(wordId);
      setRemoteActiveVerse(null);
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

  const handleRemoteSetting = useCallback((key: string, value: unknown) => {
    setRemoteSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const { session, loading, error, joinSession } =
    useSession(handleRemoteScroll, handleRemoteTime, undefined, handleRemoteWord, handleRemoteSetting);

  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => { setLang(detectLang()); }, []);

  // Restore a previously created session from localStorage
  useEffect(() => {
    if (session || pendingSession) return;
    const saved = loadCreatedSession();
    if (saved) setPendingSession(saved);
  }, []);

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
      saveCreatedSession(code, password);
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
      password={pendingSession.password}
      lang={lang}
      loading={loading}
      onStart={handleStartBroadcasting}
      onBack={() => { clearCreatedSession(); setPendingSession(null); }}
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
      <MegillahReader standalone={true} session={session} remoteMinutes={remoteMinutes} activeWord={remoteWord} activeVerse={remoteActiveVerse} remoteSettings={remoteSettings} syncEnabled={syncEnabled} onToggleSync={() => {
        setSyncEnabled(v => {
          const next = !v;
          if (next && lastBroadcastVerse.current) {
            // Jump to broadcaster's last known position when re-enabling sync
            const el = document.querySelector(`[data-verse="${lastBroadcastVerse.current}"]`);
            if (el) {
              const stickyHeight = document.querySelector('.toolbar-sticky')?.getBoundingClientRect().bottom ?? 60;
              const y = el.getBoundingClientRect().top + window.scrollY - stickyHeight - 40;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }
          return next;
        });
      }} />
    </div>
  );
}

function ShareScreen({
  code,
  password,
  lang,
  loading,
  onStart,
  onBack,
}: {
  code: string;
  password: string;
  lang: Lang;
  loading: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        {/* Success banner */}
        <div class="share-success-banner">
          <span class="material-icons">check_circle</span>
          <span>{t.sessionCreated}</span>
        </div>

        {/* Section 1: Sharing Information */}
        <div class="share-section">
          <h2 class="share-section-heading">{t.shareHeading}</h2>
          <ul class="share-tips">
            <li>
              {t.shareTip1}
              <div class="share-url-box">
                <span class="share-url">{shareUrl}</span>
                <button class="share-copy-btn" onClick={handleCopy}>
                  <span class="material-icons">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? t.copied : t.copyLink}
                </button>
              </div>
            </li>
            <li>{t.shareTip2} <strong>{code}</strong></li>
            <li>
              {t.shareTip3}
              <img class="share-qr" src={qrUrl} alt="QR Code" width={180} height={180} />
            </li>
          </ul>
        </div>

        {/* Section 2: Broadcasting Information */}
        <div class="share-section">
          <h2 class="share-section-heading">{t.broadcastHeading}</h2>
          <ul class="share-tips">
            <li>{t.broadcastTip1}</li>
            <li>
              {t.broadcastTip2Pre} <strong>{code}</strong> {t.broadcastTip2Mid}{' '}
              {showPassword
                ? <strong>{password}</strong>
                : <span class="share-pw-dots">{'••••••••'}</span>}
              {' '}
              <button
                type="button"
                class="share-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                ({showPassword ? t.hidePassword : t.showPassword})
              </button>
            </li>
          </ul>
          <p class="share-admin-save">{t.saveNote}</p>

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
      </div>

      <style>{`
        .share-success-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(46, 125, 50, 0.1);
          color: #2e7d32;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 8px;
        }

        .share-success-banner .material-icons {
          font-size: 20px;
        }

        .share-section {
          border-top: 1px solid var(--color-cream-dark, #e8ddd0);
          padding-top: 18px;
          margin-top: 4px;
          margin-bottom: 8px;
          text-align: start;
        }

        .share-section-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-burgundy);
          margin: 0 0 10px;
        }

        .share-tips {
          list-style: none;
          padding: 0;
          margin: 0 0 14px;
          font-size: 0.85rem;
          color: var(--color-text);
          line-height: 1.6;
        }

        .share-tips li {
          position: relative;
          padding-inline-start: 20px;
          margin-bottom: 10px;
        }

        .share-tips li::before {
          content: '•';
          position: absolute;
          inset-inline-start: 4px;
          color: var(--color-burgundy);
          font-weight: 700;
        }

        .share-tips .share-url-box {
          margin-top: 8px;
        }

        .share-tips .share-qr {
          margin-top: 10px;
        }

        .share-pw-dots {
          color: var(--color-text);
          letter-spacing: 0.1em;
        }

        .share-pw-toggle {
          background: none;
          border: none;
          color: var(--color-burgundy);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .share-pw-toggle:hover {
          text-decoration: underline;
        }

        .share-admin-save {
          font-size: 0.8rem;
          font-style: italic;
          color: var(--color-text-light);
          opacity: 0.8;
          margin: 0 0 16px;
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

        .share-qr {
          display: block;
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
