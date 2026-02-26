import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { useSession, saveCreatedSession, loadCreatedSession, clearCreatedSession } from '../../lib/useSession';
import type { Session, ScrollPosition } from '../../lib/useSession';
import { getSupabase } from '../../lib/supabase';
import MegillahReader from './MegillahReader';

type Lang = 'he' | 'en' | 'es' | 'ru' | 'fr' | 'pt' | 'it' | 'hu' | 'de' | 'el';

const lobbyText = {
  he: {
    title: 'מגילה לייב',
    subtitle: 'עקבו אחרי קריאת מגילה בזמן אמת',
    tabFollow: 'עוקב',
    tabBroadcast: 'משדר',
    createSession: 'צור לינק חדש',
    createSubmit: 'צור לינק',
    joinSession: 'הצטרף',
    joinAsAdmin: 'כנס כמנהל',
    adminPassword: 'הגדר סיסמת מנהל',
    choosePassword: 'בחרו סיסמה...',
    creating: 'יוצר...',
    sessionCode: 'קוד',
    password: 'סיסמה',
    joining: 'מצטרף...',
    back: 'חזרה',
    logOut: 'התנתק',
    copyLink: 'העתק קישור',
    copied: 'הועתק!',
    startBroadcasting: 'התחל שידור',
    scanQR: 'או סרקו קוד QR',
    sessionCreated: 'הלינק נוצר בהצלחה!',
    sessionRestored: 'יש לכם שידור פעיל',

    shareHeading: 'איך נכנסים כמשתתף',
    shareTip1: 'שלחו להם את הקישור הזה:',
    shareTip2: 'או, בקשו מהם להיכנס ל-megillah.app/live ולהזין את הקוד',
    shareTip3: 'הדפס את הקוד ה-QR הזה, והם יוכלו לסרוק אותו בכדי להצטרף.',
    broadcastHeading: 'איך נכנסים כמנהל',
    broadcastTip1: 'לחצו על הכפתור למטה כדי להתחיל לשדר עכשיו.',
    broadcastTip2Pre: 'או, מכל מכשיר אחר, היכנסו ל-megillah.app/live, עברו ללשונית "משדר", הזינו את הקוד',
    broadcastTip2Mid: 'ואת הסיסמה שהגדרתם:',
    saveNote: 'הקפידו לזכור את הסיסמה שלכם.',
    wrongPassword: 'סיסמה שגויה, נסו שנית.',
    showPassword: 'הצג',
    hidePassword: 'הסתר',
  },
  en: {
    title: 'Megillah Live',
    subtitle: 'Follow along with a live Megillah reading',
    tabFollow: 'Follow',
    tabBroadcast: 'Broadcast',
    createSession: 'Create New Session',
    createSubmit: 'Create Session',
    joinSession: 'Join',
    joinAsAdmin: 'Join Existing Session',
    adminPassword: 'Set a Broadcaster Password',
    choosePassword: 'Choose a password...',
    creating: 'Creating...',
    sessionCode: 'Session Code',
    password: 'Password',
    joining: 'Joining...',
    back: 'Back',
    logOut: 'Log Out',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    startBroadcasting: 'Start Broadcasting',
    scanQR: 'Or scan QR code',
    sessionCreated: 'Session created successfully!',
    sessionRestored: 'You have an active session',

    shareHeading: 'Sharing Information',
    shareTip1: 'Send them this link:',
    shareTip2: 'Or, tell them to go to megillah.app/live and enter the Session Code',
    shareTip3: 'Or have them scan this QR code.',
    broadcastHeading: 'Broadcasting Information',
    broadcastTip1: 'Click the button below to start broadcasting now.',
    broadcastTip2Pre: 'Or, from any device, go to megillah.app/live, switch to the "Broadcast" tab, and enter the Session Code',
    broadcastTip2Mid: 'and the password you just created:',
    saveNote: 'Make sure to remember your password.',
    wrongPassword: 'Wrong password, please try again.',
    showPassword: 'Show',
    hidePassword: 'Hide',
  },
  es: {
    title: 'Meguilá en Vivo',
    subtitle: 'Sigue una lectura en vivo de la Meguilá',
    tabFollow: 'Seguir',
    tabBroadcast: 'Transmitir',
    createSession: 'Crear nueva sesión',
    createSubmit: 'Crear sesión',
    joinSession: 'Unirse',
    joinAsAdmin: 'Unirse a sesión existente',
    adminPassword: 'Establece una contraseña de transmisión',
    choosePassword: 'Elige una contraseña...',
    creating: 'Creando...',
    sessionCode: 'Código de sesión',
    password: 'Contraseña',
    joining: 'Uniéndose...',
    back: 'Volver',
    logOut: 'Cerrar sesión',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    startBroadcasting: 'Iniciar transmisión',
    scanQR: 'O escanear código QR',
    sessionCreated: '¡Sesión creada con éxito!',
    sessionRestored: 'Tiene una sesión activa',

    shareHeading: 'Información para compartir',
    shareTip1: 'Envíales este enlace:',
    shareTip2: 'O diles que vayan a megillah.app/live e ingresen el código de sesión',
    shareTip3: 'O que escaneen este código QR.',
    broadcastHeading: 'Información de transmisión',
    broadcastTip1: 'Haz clic en el botón de abajo para comenzar a transmitir ahora.',
    broadcastTip2Pre: 'O, desde cualquier dispositivo, ve a megillah.app/live, cambia a la pestaña "Transmitir" e ingresa el código de sesión',
    broadcastTip2Mid: 'y la contraseña que acabas de crear:',
    saveNote: 'Asegúrate de recordar tu contraseña.',
    wrongPassword: 'Contraseña incorrecta, inténtelo de nuevo.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
  },
  ru: {
    title: 'Мегила Лайв',
    subtitle: 'Следите за чтением Мегилы в реальном времени',
    tabFollow: 'Следить',
    tabBroadcast: 'Трансляция',
    createSession: 'Создать новую сессию',
    createSubmit: 'Создать сессию',
    joinSession: 'Присоединиться',
    joinAsAdmin: 'Войти в существующую',
    adminPassword: 'Задайте пароль трансляции',
    choosePassword: 'Выберите пароль...',
    creating: 'Создание...',
    sessionCode: 'Код сессии',
    password: 'Пароль',
    joining: 'Подключение...',
    back: 'Назад',
    logOut: 'Выйти',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    startBroadcasting: 'Начать трансляцию',
    scanQR: 'Или отсканируйте QR-код',
    sessionCreated: 'Сессия успешно создана!',
    sessionRestored: 'У вас есть активная сессия',

    shareHeading: 'Информация для обмена',
    shareTip1: 'Отправьте им эту ссылку:',
    shareTip2: 'Или попросите их зайти на megillah.app/live и ввести код сессии',
    shareTip3: 'Или пусть отсканируют этот QR-код.',
    broadcastHeading: 'Информация о трансляции',
    broadcastTip1: 'Нажмите кнопку ниже, чтобы начать трансляцию сейчас.',
    broadcastTip2Pre: 'Или с любого устройства зайдите на megillah.app/live, переключитесь на вкладку «Трансляция» и введите код сессии',
    broadcastTip2Mid: 'и пароль, который вы только что создали:',
    saveNote: 'Обязательно запомните свой пароль.',
    wrongPassword: 'Неверный пароль, попробуйте ещё раз.',
    showPassword: 'Показать',
    hidePassword: 'Скрыть',
  },
  fr: {
    title: 'Méguila en Direct',
    subtitle: 'Suivez une lecture en direct de la Méguila',
    tabFollow: 'Suivre',
    tabBroadcast: 'Diffuser',
    createSession: 'Créer nouvelle session',
    createSubmit: 'Créer une session',
    joinSession: 'Rejoindre',
    joinAsAdmin: 'Rejoindre une session existante',
    adminPassword: 'Définir un mot de passe de diffusion',
    choosePassword: 'Choisissez un mot de passe...',
    creating: 'Création...',
    sessionCode: 'Code de session',
    password: 'Mot de passe',
    joining: 'Connexion...',
    back: 'Retour',
    logOut: 'Déconnexion',
    copyLink: 'Copier le lien',
    copied: 'Copié !',
    startBroadcasting: 'Commencer la diffusion',
    scanQR: 'Ou scannez le code QR',
    sessionCreated: 'Session créée avec succès !',
    sessionRestored: 'Vous avez une session active',

    shareHeading: 'Informations de partage',
    shareTip1: 'Envoyez-leur ce lien :',
    shareTip2: 'Ou demandez-leur d\'aller sur megillah.app/live et d\'entrer le code de session',
    shareTip3: 'Ou qu\'ils scannent ce code QR.',
    broadcastHeading: 'Informations de diffusion',
    broadcastTip1: 'Cliquez sur le bouton ci-dessous pour commencer la diffusion maintenant.',
    broadcastTip2Pre: 'Ou, depuis n\'importe quel appareil, allez sur megillah.app/live, passez à l\'onglet « Diffuser » et entrez le code de session',
    broadcastTip2Mid: 'et le mot de passe que vous venez de créer :',
    saveNote: 'N\'oubliez pas de retenir votre mot de passe.',
    wrongPassword: 'Mot de passe incorrect, veuillez réessayer.',
    showPassword: 'Afficher',
    hidePassword: 'Masquer',
  },
  pt: {
    title: 'Meguilá ao Vivo',
    subtitle: 'Acompanhe uma leitura ao vivo da Meguilá',
    tabFollow: 'Seguir',
    tabBroadcast: 'Transmitir',
    createSession: 'Criar nova sessão',
    createSubmit: 'Criar sessão',
    joinSession: 'Entrar',
    joinAsAdmin: 'Entrar em sessão existente',
    adminPassword: 'Defina uma senha de transmissão',
    choosePassword: 'Escolha uma senha...',
    creating: 'Criando...',
    sessionCode: 'Código da sessão',
    password: 'Senha',
    joining: 'Entrando...',
    back: 'Voltar',
    logOut: 'Sair',
    copyLink: 'Copiar link',
    copied: 'Copiado!',
    startBroadcasting: 'Iniciar transmissão',
    scanQR: 'Ou escaneie o código QR',
    sessionCreated: 'Sessão criada com sucesso!',
    sessionRestored: 'Você tem uma sessão ativa',

    shareHeading: 'Informações de compartilhamento',
    shareTip1: 'Envie este link para eles:',
    shareTip2: 'Ou peça para acessarem megillah.app/live e digitar o código da sessão',
    shareTip3: 'Ou escanear este código QR.',
    broadcastHeading: 'Informações de transmissão',
    broadcastTip1: 'Clique no botão abaixo para começar a transmitir agora.',
    broadcastTip2Pre: 'Ou, de qualquer dispositivo, acesse megillah.app/live, mude para a aba "Transmitir" e digite o código da sessão',
    broadcastTip2Mid: 'e a senha que você acabou de criar:',
    saveNote: 'Não se esqueça da sua senha.',
    wrongPassword: 'Senha incorreta, tente novamente.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
  },
  it: {
    title: 'Meghillà dal Vivo',
    subtitle: 'Segui una lettura dal vivo della Meghillà',
    tabFollow: 'Segui',
    tabBroadcast: 'Trasmetti',
    createSession: 'Crea nuova sessione',
    createSubmit: 'Crea sessione',
    joinSession: 'Unisciti',
    joinAsAdmin: 'Unisciti a sessione esistente',
    adminPassword: 'Imposta una password di trasmissione',
    choosePassword: 'Scegli una password...',
    creating: 'Creazione...',
    sessionCode: 'Codice sessione',
    password: 'Password',
    joining: 'Connessione...',
    back: 'Indietro',
    logOut: 'Esci',
    copyLink: 'Copia link',
    copied: 'Copiato!',
    startBroadcasting: 'Inizia la trasmissione',
    scanQR: 'Oppure scansiona il codice QR',
    sessionCreated: 'Sessione creata con successo!',
    sessionRestored: 'Hai una sessione attiva',

    shareHeading: 'Informazioni per la condivisione',
    shareTip1: 'Invia loro questo link:',
    shareTip2: 'Oppure chiedi di andare su megillah.app/live e inserire il codice sessione',
    shareTip3: 'Oppure fai scansionare questo codice QR.',
    broadcastHeading: 'Informazioni sulla trasmissione',
    broadcastTip1: 'Clicca il pulsante qui sotto per iniziare a trasmettere ora.',
    broadcastTip2Pre: 'Oppure, da qualsiasi dispositivo, vai su megillah.app/live, passa alla scheda "Trasmetti" e inserisci il codice sessione',
    broadcastTip2Mid: 'e la password che hai appena creato:',
    saveNote: 'Assicurati di ricordare la tua password.',
    wrongPassword: 'Password errata, riprova.',
    showPassword: 'Mostra',
    hidePassword: 'Nascondi',
  },
  hu: {
    title: 'Megilla Élő',
    subtitle: 'Kövesse a Megilla felolvasást valós időben',
    tabFollow: 'Követés',
    tabBroadcast: 'Közvetítés',
    createSession: 'Új munkamenet létrehozása',
    createSubmit: 'Munkamenet létrehozása',
    joinSession: 'Csatlakozás',
    joinAsAdmin: 'Csatlakozás meglévőhöz',
    adminPassword: 'Közvetítői jelszó beállítása',
    choosePassword: 'Válasszon jelszót...',
    creating: 'Létrehozás...',
    sessionCode: 'Munkamenet kód',
    password: 'Jelszó',
    joining: 'Csatlakozás...',
    back: 'Vissza',
    logOut: 'Kijelentkezés',
    copyLink: 'Link másolása',
    copied: 'Másolva!',
    startBroadcasting: 'Közvetítés indítása',
    scanQR: 'Vagy olvassa be a QR-kódot',
    sessionCreated: 'Munkamenet sikeresen létrehozva!',
    sessionRestored: 'Van egy aktív munkamenete',

    shareHeading: 'Megosztási információk',
    shareTip1: 'Küldje el nekik ezt a linket:',
    shareTip2: 'Vagy kérje meg őket, hogy menjenek a megillah.app/live oldalra és írják be a kódot',
    shareTip3: 'Vagy olvassák be ezt a QR-kódot.',
    broadcastHeading: 'Közvetítési információk',
    broadcastTip1: 'Kattintson az alábbi gombra a közvetítés indításához.',
    broadcastTip2Pre: 'Vagy bármilyen eszközről menjen a megillah.app/live oldalra, váltson a „Közvetítés" fülre és írja be a kódot',
    broadcastTip2Mid: 'és az imént létrehozott jelszót:',
    saveNote: 'Ne felejtse el a jelszavát.',
    wrongPassword: 'Hibás jelszó, próbálja újra.',
    showPassword: 'Mutat',
    hidePassword: 'Elrejt',
  },
  de: {
    title: 'Megilla Live',
    subtitle: 'Folgen Sie einer Live-Megilla-Lesung',
    tabFollow: 'Folgen',
    tabBroadcast: 'Übertragen',
    createSession: 'Neue Sitzung erstellen',
    createSubmit: 'Sitzung erstellen',
    joinSession: 'Beitreten',
    joinAsAdmin: 'Bestehender Sitzung beitreten',
    adminPassword: 'Übertragungspasswort festlegen',
    choosePassword: 'Passwort wählen...',
    creating: 'Erstelle...',
    sessionCode: 'Sitzungscode',
    password: 'Passwort',
    joining: 'Beitritt...',
    back: 'Zurück',
    logOut: 'Abmelden',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    startBroadcasting: 'Übertragung starten',
    scanQR: 'Oder QR-Code scannen',
    sessionCreated: 'Sitzung erfolgreich erstellt!',
    sessionRestored: 'Sie haben eine aktive Sitzung',

    shareHeading: 'Informationen zum Teilen',
    shareTip1: 'Senden Sie ihnen diesen Link:',
    shareTip2: 'Oder bitten Sie sie, megillah.app/live aufzurufen und den Sitzungscode einzugeben',
    shareTip3: 'Oder diesen QR-Code scannen.',
    broadcastHeading: 'Übertragungsinformationen',
    broadcastTip1: 'Klicken Sie auf die Schaltfläche unten, um die Übertragung zu starten.',
    broadcastTip2Pre: 'Oder rufen Sie von einem beliebigen Gerät megillah.app/live auf, wechseln Sie zum Tab „Übertragen" und geben Sie den Sitzungscode ein',
    broadcastTip2Mid: 'und das gerade erstellte Passwort:',
    saveNote: 'Vergessen Sie Ihr Passwort nicht.',
    wrongPassword: 'Falsches Passwort, bitte versuchen Sie es erneut.',
    showPassword: 'Anzeigen',
    hidePassword: 'Ausblenden',
  },
  el: {
    title: 'Megillah Live',
    subtitle: 'Ακολουθήστε μια ζωντανή ανάγνωση Μεγιλά',
    tabFollow: 'Παρακολούθηση',
    tabBroadcast: 'Μετάδοση',
    createSession: 'Δημιουργία νέας συνεδρίας',
    createSubmit: 'Δημιουργία συνεδρίας',
    joinSession: 'Συμμετοχή',
    joinAsAdmin: 'Συμμετοχή σε υπάρχουσα',
    adminPassword: 'Ορισμός κωδικού μετάδοσης',
    choosePassword: 'Επιλέξτε κωδικό...',
    creating: 'Δημιουργία...',
    sessionCode: 'Κωδικός συνεδρίας',
    password: 'Κωδικός',
    joining: 'Σύνδεση...',
    back: 'Πίσω',
    logOut: 'Αποσύνδεση',
    copyLink: 'Αντιγραφή συνδέσμου',
    copied: 'Αντιγράφηκε!',
    startBroadcasting: 'Έναρξη μετάδοσης',
    scanQR: 'Ή σαρώστε τον κωδικό QR',
    sessionCreated: 'Η συνεδρία δημιουργήθηκε επιτυχώς!',
    sessionRestored: 'Έχετε μια ενεργή συνεδρία',
    shareHeading: 'Πληροφορίες κοινοποίησης',
    shareTip1: 'Στείλτε τους αυτόν τον σύνδεσμο:',
    shareTip2: 'Ή ζητήστε τους να ανοίξουν megillah.app/live και να εισάγουν τον κωδικό',
    shareTip3: 'Ή σαρώστε αυτόν τον κωδικό QR.',
    broadcastHeading: 'Πληροφορίες μετάδοσης',
    broadcastTip1: 'Πατήστε το κουμπί παρακάτω για να ξεκινήσετε τη μετάδοση.',
    broadcastTip2Pre: 'Ή ανοίξτε megillah.app/live από οποιαδήποτε συσκευή, μεταβείτε στην καρτέλα «Μετάδοση» και εισάγετε τον κωδικό',
    broadcastTip2Mid: 'και τον κωδικό που μόλις δημιουργήσατε:',
    saveNote: 'Μην ξεχάσετε τον κωδικό σας.',
    wrongPassword: 'Λάθος κωδικός, δοκιμάστε ξανά.',
    showPassword: 'Εμφάνιση',
    hidePassword: 'Απόκρυψη',
  },
} as const;

const SUPPORTED_LANGS: Lang[] = ['he', 'en', 'es', 'ru', 'fr', 'pt', 'it', 'hu', 'de', 'el'];

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('megillah-lang');
    if (stored && SUPPORTED_LANGS.includes(stored as Lang)) return stored as Lang;
  } catch {}
  const dataLang = document.documentElement.dataset.lang;
  if (dataLang && SUPPORTED_LANGS.includes(dataLang as Lang)) return dataLang as Lang;
  const navLang = navigator.language.split('-')[0].toLowerCase();
  if (SUPPORTED_LANGS.includes(navLang as Lang)) return navLang as Lang;
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
  const [pendingSession, setPendingSession] = useState<{ code: string; password: string; isNew?: boolean } | null>(null);
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
      const stickyHeight = document.querySelector('.toolbar-sticky')?.getBoundingClientRect().bottom ?? 60;
      const availableHeight = window.innerHeight - stickyHeight;
      const elRect = el.getBoundingClientRect();
      const offset = elRect.height < availableHeight ? (availableHeight - elRect.height) / 2 : 40;
      const y = elRect.top + window.scrollY - stickyHeight - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
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
        const availableHeight = window.innerHeight - stickyHeight;
        const elRect = el.getBoundingClientRect();
        const offset = elRect.height < availableHeight ? (availableHeight - elRect.height) / 2 : 40;
        const y = elRect.top + window.scrollY - stickyHeight - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, []);

  const handleRemoteSetting = useCallback((key: string, value: unknown) => {
    setRemoteSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const { session, loading, error, joinSession } =
    useSession(handleRemoteScroll, handleRemoteTime, undefined, handleRemoteWord, handleRemoteSetting);

  const [lang, setLangState] = useState<Lang>(detectLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('megillah-lang', l); } catch {}
  }, []);

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
      setPendingSession({ code, password, isNew: true });
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
      isNew={!!pendingSession.isNew}
      lang={lang}
      onLangChange={setLang}
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
      onLangChange={setLang}
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

function LangToggle({ lang, onLangChange }: { lang: Lang; onLangChange: (l: Lang) => void }) {
  return (
    <div class="lang-toggle">
      <button
        type="button"
        class={`lang-toggle-btn${lang === 'en' ? ' active' : ''}`}
        onClick={() => onLangChange('en')}
      >
        English
      </button>
      <span class="lang-toggle-sep">|</span>
      <button
        type="button"
        class={`lang-toggle-btn${lang === 'he' ? ' active' : ''}`}
        onClick={() => onLangChange('he')}
      >
        עברית
      </button>
      <style>{`
        .lang-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid var(--color-cream-dark, #e8ddd0);
        }
        .lang-toggle-btn {
          background: none;
          border: none;
          font-size: 0.78rem;
          cursor: pointer;
          padding: 2px 4px;
          color: var(--color-text-light);
          opacity: 0.55;
          transition: opacity 0.2s, color 0.2s;
        }
        .lang-toggle-btn:hover {
          opacity: 0.85;
        }
        .lang-toggle-btn.active {
          color: var(--color-burgundy);
          opacity: 1;
          font-weight: 600;
        }
        .lang-toggle-sep {
          font-size: 0.75rem;
          color: var(--color-text-light);
          opacity: 0.35;
        }
      `}</style>
    </div>
  );
}

function ShareScreen({
  code,
  password,
  isNew,
  lang,
  onLangChange,
  loading,
  onStart,
  onBack,
}: {
  code: string;
  password: string;
  isNew: boolean;
  lang: Lang;
  onLangChange: (l: Lang) => void;
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
        {isNew ? (
          <div class="share-success-banner">
            <span class="material-icons">check_circle</span>
            <span>{t.sessionCreated}</span>
          </div>
        ) : (
          <div class="share-restored-banner">
            <h2>{t.sessionRestored}</h2>
            <p>{t.sessionCode}: <strong>{code}</strong></p>
          </div>
        )}

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
              {t.logOut}
            </button>
          </div>
        </div>

        <LangToggle lang={lang} onLangChange={onLangChange} />
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

        .share-restored-banner {
          text-align: center;
          padding: 12px 16px;
          margin-bottom: 8px;
        }

        .share-restored-banner h2 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-burgundy);
          margin: 0 0 4px;
        }

        .share-restored-banner p {
          font-size: 0.9rem;
          color: var(--color-text-light);
          margin: 0;
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
  onLangChange,
}: {
  loading: boolean;
  error: string | null;
  onCreateSession: (password: string) => Promise<void>;
  onJoinSession: (code: string, password?: string) => Promise<SessionRole | null>;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const [tab, setTab] = useState<'follow' | 'broadcast'>('follow');
  const [broadcastMode, setBroadcastMode] = useState<'choose' | 'join' | 'create'>('choose');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);
  const t = lobbyText[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return (
    <div class="lobby" dir={dir}>
      <div class="lobby-card">
        <h1 class="lobby-title">{t.title}</h1>
        <p class="lobby-sub">{t.subtitle}</p>

        {error && <div class="lobby-error">{error}</div>}

        <div class="lobby-tabs">
          <button
            class={`lobby-tab${tab === 'follow' ? ' active' : ''}`}
            onClick={() => { setTab('follow'); setBroadcastMode('choose'); setPassword(''); }}
          >
            {t.tabFollow}
          </button>
          <button
            class={`lobby-tab${tab === 'broadcast' ? ' active' : ''}`}
            onClick={() => { setTab('broadcast'); setBroadcastMode('choose'); }}
          >
            {t.tabBroadcast}
          </button>
        </div>

        {tab === 'follow' && (
          <form
            class="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) onJoinSession(code.trim());
            }}
          >
            <label class="lobby-label">
              {t.sessionCode}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                enterKeyHint="go"
                class="lobby-input code-input"
                value={code}
                placeholder="123456"
                onInput={(e) => setCode((e.target as HTMLInputElement).value)}
                required
                autoFocus
              />
            </label>
            <button class="lobby-btn join" type="submit" disabled={loading}>
              {loading ? t.joining : t.joinSession}
            </button>
          </form>
        )}

        {tab === 'broadcast' && broadcastMode === 'choose' && (
          <div class="lobby-choices">
            <button class="lobby-btn create" onClick={() => setBroadcastMode('create')}>
              <span class="material-icons">add_circle</span>
              {t.createSession}
            </button>
            <button class="lobby-btn join" onClick={() => setBroadcastMode('join')}>
              <span class="material-icons">login</span>
              {t.joinAsAdmin}
            </button>
          </div>
        )}

        {tab === 'broadcast' && broadcastMode === 'join' && (
          <form
            class="lobby-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!code.trim()) return;
              setJoinError('');
              const result = await onJoinSession(code.trim(), password.trim() || undefined);
              if (result === 'follower') {
                setJoinError(t.wrongPassword);
              }
            }}
          >
            <label class="lobby-label">
              {t.sessionCode}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                enterKeyHint="next"
                class="lobby-input code-input"
                value={code}
                placeholder="123456"
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value;
                  setCode(val);
                  if (val.length === 6) {
                    setTimeout(() => passwordRef.current?.focus(), 50);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.length === 6) {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
                required
                autoFocus
              />
            </label>
            <label class="lobby-label">
              {t.password}
              <input
                ref={passwordRef}
                type="password"
                enterKeyHint="go"
                class="lobby-input"
                value={password}
                onInput={(e) => { setPassword((e.target as HTMLInputElement).value); setJoinError(''); }}
              />
            </label>
            {joinError && <div class="lobby-error">{joinError}</div>}
            <button class="lobby-btn join" type="submit" disabled={loading}>
              {loading ? t.joining : t.joinSession}
            </button>
            <button
              type="button"
              class="lobby-back"
              onClick={() => setBroadcastMode('choose')}
            >
              {t.back}
            </button>
          </form>
        )}

        {tab === 'broadcast' && broadcastMode === 'create' && (
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
              {loading ? t.creating : t.createSubmit}
            </button>
            <button
              type="button"
              class="lobby-back"
              onClick={() => setBroadcastMode('choose')}
            >
              {t.back}
            </button>
          </form>
        )}

        <LangToggle lang={lang} onLangChange={onLangChange} />
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

        .lobby-choices {
          display: flex;
          flex-direction: column;
          gap: 12px;
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

        .lobby-tabs {
          display: flex;
          background: var(--color-cream-dark, #f0e8e0);
          border-radius: 8px;
          padding: 3px;
          margin-bottom: 20px;
        }

        .lobby-tab {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-text-light);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .lobby-tab.active {
          background: var(--color-white);
          color: var(--color-burgundy);
          box-shadow: 0 1px 4px rgba(102, 10, 35, 0.1);
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
