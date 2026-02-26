import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { megillahText } from '../../lib/megillah-text';
import { translationsEn } from '../../lib/megillah-translations-en';
import type { Session, ScrollPosition } from '../../lib/useSession';

type Lang = 'he' | 'en' | 'es' | 'ru' | 'fr' | 'pt' | 'it' | 'hu' | 'de' | 'el';
type TranslationMap = Record<string, string>;

function toHebrew(n: number): string {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל'];
  if (n === 15) return 'טו';
  if (n === 16) return 'טז';
  return (tens[Math.floor(n / 10)] || '') + (ones[n % 10] || '');
}

const LOUD_VERSES = new Set(['2:5', '8:15', '8:16', '10:3']);

const LOUD_TRANSLITERATIONS: Record<string, Record<string, string>> = {
  en: {
    '2:5': 'Ish Yehudi haya b\'Shushan habirah, ush\'mo Mordechai ben Ya\'ir ben Shim\'i ben Kish, ish Y\'mini.',
    '8:15': 'U\'Mordechai yatza milifnei hamelech bil\'vush malchut t\'chelet vachur, va\'ateret zahav g\'dolah, v\'tachrich butz v\'argaman, v\'ha\'ir Shushan tzahalah v\'sameicha.',
    '8:16': 'LaYehudim hayta orah v\'simcha v\'sasson vikar.',
    '10:3': 'Ki Mordechai haYehudi mishneh lamelech Achashveirosh, v\'gadol laYehudim v\'ratzui l\'rov echav, doreish tov l\'amo v\'doveir shalom l\'chol zar\'o.',
  },
  es: {
    '2:5': 'Ish Yehudí hayá be-Shushán habirá, ushmó Mordejai ben Yaír ben Shimí ben Kish, ish Yeminí.',
    '8:15': 'U-Mordejai yatzá milifnéi hamélej bilvúsh maljut tejélet vajúr, vaatéret zaháv guedolá, vetajríj butz veargamán, vehair Shushán tzahalá vesaméja.',
    '8:16': 'LaYehudím haytá orá vesimjá vesasón vikar.',
    '10:3': 'Ki Mordejai haYehudí mishné lamélej Ajashverósh, vegadól laYehudím veratzúi lerov ejáv, dorésh tov leamó vedovér shalóm lejol zaró.',
  },
  fr: {
    '2:5': 'Ish Yehoudi haya be-Shoushan habirah, oushmo Mordekhaï ben Yaïr ben Shim\'i ben Kish, ish Yemini.',
    '8:15': 'Ou-Mordekhaï yatza milifneï hamélekh bilvoush malkhout tekhélet va\'hour, vaatéret zahav guedolah, vetakhrikh boutz veargamane, vehaïr Shoushan tzahalah vesamé\'ha.',
    '8:16': 'LaYehoudim hayta orah vesim\'ha vesassone vikar.',
    '10:3': 'Ki Mordekhaï haYehoudi mishné lamélekh A\'hashvérosh, vegadol laYehoudim veratzouï lerov é\'hav, dorésh tov leamo vedovér shalom lekhol zaro.',
  },
  ru: {
    '2:5': 'Иш Йеуди хая бе-Шушан хабира, ушмо Мордехай бен Яир бен Шими бен Киш, иш Йемини.',
    '8:15': 'У-Мордехай яца милифней хамелех бильвуш малхут тхелет вахур, ваатерет захав гдола, ветахрих буц веаргаман, веха-ир Шушан цахала весамеха.',
    '8:16': 'Ла-Йехудим хайта ора весимха весасон викар.',
    '10:3': 'Ки Мордехай ха-Йехуди мишне ламелех Ахашверош, вегадоль ла-Йехудим верацуй леров эхав, дореш тов леамо ведовер шалом лехоль заро.',
  },
  pt: {
    '2:5': 'Ish Yehudí hayá be-Shushán habirá, ushmó Mordechai ben Yaír ben Shimí ben Kish, ish Yeminí.',
    '8:15': 'U-Mordechai yatzá milifnéi hamélech bilvúsh malchút techélet vachúr, vaatéret zaháv guedolá, vetachríkh butz veargamán, vehaír Shushán tzahalá vesamécha.',
    '8:16': 'LaYehudím haytá orá vesimchá vesassón vikár.',
    '10:3': 'Ki Mordechai haYehudí mishné lamélech Achashverósh, vegadól laYehudím veratzúi leróv echáv, dorésh tov leamó vedovér shalóm lechól zaró.',
  },
  it: {
    '2:5': 'Ish Yehudì hayà be-Shushàn habiràh, ushmò Mordechai ben Yaìr ben Shimì ben Kish, ish Yeminì.',
    '8:15': 'U-Mordechai yatzà milifnèi hamèlech bilvùsh malchùt techèlet vachùr, vaatèret zahàv ghedolàh, vetachrìch butz veargamàn, vehaìr Shushàn tzahalàh vesamècha.',
    '8:16': 'LaYehudìm haytà oràh vesimchàh vesassòn vikàr.',
    '10:3': 'Ki Mordechai haYehudì mishnè lamèlech Achashveròsh, vegadòl laYehudìm veratzùi leròv echàv, dorèsh tov leamò vedovèr shalòm lechòl zarò.',
  },
  hu: {
    '2:5': 'Is Jehudi hájá be-Susán hábirá, usmó Mordecháj ben Jáir ben Simi ben Kis, is Jemini.',
    '8:15': 'U-Mordecháj jácá milifné hámelech bilvus málchut tchélet váchur, vááteret záháv gdolá, vetáchrich buc veárgámán, veháir Susán cáhálá veszáméchá.',
    '8:16': 'LáJehudim hájtá orá veszimchá veszászon vikár.',
    '10:3': 'Ki Mordecháj háJehudi misne lámelech Áchásverós, vegádol láJehudim verácuj lerov echáv, dorés tov leámó vedovér sálom lechol záro.',
  },
  de: {
    '2:5': 'Isch Jehudi haja be-Schuschan habira, uschmo Mordechai ben Jair ben Schimi ben Kisch, isch Jemini.',
    '8:15': 'U-Mordechai jatza milifnei hamelech bilwusch malchut techelet wachur, waateret sahaw gedola, wetachrich buz weargaman, wehair Schuschan zahala wesamecha.',
    '8:16': 'LaJehudim hajta ora wesimcha wesasson wikar.',
    '10:3': 'Ki Mordechai haJehudi mischne lamelech Achaschverosch, wegadol laJehudim weratzui lerow echaw, doresch tow leamo wedower schalom lechol saro.',
  },
  el: {
    '2:5': 'Ισς Γιεουντί αγιά μπε-Σσουσσάν αμπιρά, ουσσμό Μορντοάι μπεν Γιαΐρ μπεν Σσιμΐ μπεν Κισς, ισς Γιεμινί.',
    '8:15': 'Ου-Μορντοάι γιατζά μιλιφνέι αμέλε μπιλβούσς μαλούτ τεέλετ βαούρ, βααταρέτ ζαάβ γκεντολά, βεταρί μπουτζ βεαργαμάν, βεαΐρ Σσουσσάν τζααλά βεσαμέα.',
    '8:16': 'Λα-Γιεουντίμ αϊτά ορά βεσιμά βεσασόν βικάρ.',
    '10:3': 'Κι Μορντοάι α-Γιεουντί μισσνέ λαμέλε Αασσβερόσς, βεγκαντόλ λα-Γιεουντίμ βερατζούι λερόβ εάβ, ντορέσς τοβ λεαμό βεντοβέρ σσαλόμ λεόλ ζαρό.',
  },
};
const BNEI_HAMAN_VERSES = new Set(['9:7', '9:8', '9:9']);
const BNEI_HAMAN_SPLIT_VERSE = '9:6';
const BNEI_HAMAN_SPLIT_RE = /(חֲמֵ[\u0591-\u05C7]*שׁ מֵא[\u0591-\u05C7]*וֹת אִ[\u0591-\u05C7]*י[\u0591-\u05C7]*שׁ׃)/;
const DEFAULT_READING_MINUTES = 35;

// Precomputed: verses where Haman's name appears
const HAMAN_VERSES = new Set([
  '3:1','3:2','3:4','3:5','3:6','3:7','3:8','3:10','3:11','3:12','3:15',
  '4:7',
  '5:4','5:5','5:8','5:9','5:10','5:11','5:12','5:14',
  '6:4','6:5','6:6','6:7','6:10','6:11','6:12','6:13','6:14',
  '7:1','7:6','7:7','7:8','7:9','7:10',
  '8:1','8:2','8:3','8:5','8:7',
  '9:10','9:12','9:13','9:14','9:24',
]);

// Precomputed: verses where Haman has a title (Chabad mode — only these get highlighted)
const HAMAN_TITLED_VERSES = new Set([
  '3:1','3:10','7:6','8:1','8:3','8:5','9:10','9:24',
]);

const ILLUSTRATIONS = [
  { after: '1:1', src: '/illustrations/1-1-4.webp', he: 'המשתה המלכותי', en: 'The Royal Feast' },
  { after: '1:10', src: '/illustrations/1-10-12.webp', he: 'ושתי מסרבת', en: 'Vashti Refuses' },
  { after: '2:17', src: '/illustrations/2-17.webp', he: 'אסתר מוכתרת', en: 'Esther is Crowned' },
  { after: '3:1', src: '/illustrations/3-1-2.webp', he: 'מרדכי מסרב להשתחוות', en: 'Mordechai Refuses to Bow' },
  { after: '3:8', src: '/illustrations/3-8-11.webp', he: 'הגזירה הרעה', en: 'The Evil Decree' },
  { after: '5:2', src: '/illustrations/5-1-2.webp', he: 'אסתר ניגשת אל המלך', en: 'Esther Approaches the King' },
  { after: '6:1', src: '/illustrations/6-1.webp', he: 'המלך אינו ישן', en: 'The King Cannot Sleep' },
  { after: '7:4', src: '/illustrations/7-3-4.webp', he: 'אסתר חושפת את המזימה', en: 'Esther Reveals the Plot' },
];

const translations = {
  he: {
    showCantillation: 'הצג טעמים',
    chabadCustom: 'הדגש המן לפי מנהג חב״ד',
    showTranslation: 'הגדרות',
    hebrewOnly: 'מקור בלבד',
    langName: 'ביאור',
    hebrewName: 'מקור',
    only: 'בלבד',
    both: 'שניהם',
    fontSize: 'גודל גופן',
    minLeft: 'דק׳ נותרו',
    readingTime: 'זמן קריאה (דקות):',
    save: 'שמור',
    changeReadingTime: 'שנה זמן קריאה',
    chabadHint: 'מנהג חב״ד — רק כשהמן מוזכר עם תואר',
    tapHint: 'לחצו על שמו של המן להשמיע רעש!',
    chapter: 'פרק',
    loudLabel: 'הקהל אומר בקול רם',
    bneiHamanLabel: 'יש אומרים שהקהל אומר בקול רם',
    headerTitle: 'מגילת אסתר',
    headerSub: <a href="https://chabadisrael.co.il/purim" target="_blank" rel="noopener noreferrer" class="header-link">למידע נוסף על מצוות החג לחץ כאן</a>,
    language: 'שפה',
    editSubtitle: 'ערוך כותרת משנה',
    subtitleText: 'טקסט',
    subtitleUrl: 'קישור (אופציונלי)',
    displayIllustrations: 'הצג איורים',
    trackScrolling: 'גלילה בלבד, ללא הדגשה',
    trackVerse: 'פסוקים שתלחץ יודגשו לצופים (מומלץ)',
    trackWord: 'מילים שתלחץ יודגשו לצופים',
    editTapHint: 'ערוך הודעה',
    resetToDefault: 'איפוס לברירת מחדל',
    sessionCode: 'קוד',
    broadcasting: 'משדר',
    following: 'עוקב',
    endSession: 'סיום',
    leaveSession: 'יציאה',
    joinLive: 'שידור חי',
    syncOn: 'עוקב אחרי השידור החי',
    syncOff: 'הפסקת מעקב — גלול בקצב שלך',
    copyLink: 'העתק קישור',
    copied: 'הועתק!',
  },
  en: {
    showCantillation: 'Show cantillation signs',
    chabadCustom: 'Highlight fewer Hamans',
    showTranslation: 'Translation',
    hebrewOnly: 'Hebrew Only',
    langName: 'English',
    hebrewName: 'Hebrew',
    only: 'Only',
    both: 'Both',
    fontSize: 'Font size',
    minLeft: 'min left',
    readingTime: 'Reading time (min):',
    save: 'Save',
    changeReadingTime: 'Change reading time',
    chabadHint: 'Chabad custom — Haman highlighted only with a title',
    tapHint: <>Don't have a gragger?<br class="mobile-only"/> Just click Haman's name!</>,
    chapter: 'Chapter',
    loudLabel: 'Everyone reads this together:',
    bneiHamanLabel: 'In some communities, everyone says this together.',
    headerTitle: 'The Megillah App',
    headerSub: <a href="https://www.chabad.org/purim" target="_blank" rel="noopener noreferrer" class="header-link">Learn more about Purim</a>,
    language: 'Language',
    editSubtitle: 'Edit subtitle',
    subtitleText: 'Text',
    subtitleUrl: 'Link (optional)',
    displayIllustrations: 'Display illustrations',
    trackScrolling: 'Scrolling only, no highlighting',
    trackVerse: 'Verses you tap are highlighted for viewers (recommended)',
    trackWord: 'Words you tap are highlighted for viewers',
    editTapHint: 'Edit announcement',
    resetToDefault: 'Reset to default',
    sessionCode: 'Code',
    broadcasting: 'Broadcasting',
    following: 'Following',
    endSession: 'End',
    leaveSession: 'Leave',
    joinLive: 'Join Live',
    syncOn: 'Following the live broadcast',
    syncOff: 'Unfollowed — read at your own pace',
    copyLink: 'Copy Link',
    copied: 'Copied!',
  },
  es: {
    showCantillation: 'Mostrar signos de cantilación',
    chabadCustom: 'Resaltar menos Hamanes',
    showTranslation: 'Traducción',
    hebrewOnly: 'Solo hebreo',
    langName: 'Español',
    hebrewName: 'Hebreo',
    only: 'Solo',
    both: 'Ambos',
    fontSize: 'Tamaño de fuente',
    minLeft: 'min restantes',
    readingTime: 'Tiempo de lectura (min):',
    save: 'Guardar',
    changeReadingTime: 'Cambiar tiempo de lectura',
    chabadHint: 'Costumbre Jabad — Hamán resaltado solo con título',
    tapHint: '¡No tienes matraca? ¡Haz clic en el nombre de Hamán!',
    chapter: 'Capítulo',
    loudLabel: 'Todos leen esto juntos:',
    bneiHamanLabel: 'En algunas comunidades, todos dicen esto juntos.',
    headerTitle: 'La Meguilá',
    headerSub: 'Matraca incorporada y barra de progreso',
    language: 'Idioma',
    editSubtitle: 'Editar subtítulo',
    subtitleText: 'Texto',
    subtitleUrl: 'Enlace (opcional)',
    displayIllustrations: 'Mostrar ilustraciones',
    trackScrolling: 'Solo desplazamiento, sin resaltado',
    trackVerse: 'Versículos que toques se resaltan para los espectadores (recomendado)',
    trackWord: 'Palabras que toques se resaltan para los espectadores',
    editTapHint: 'Editar anuncio',
    resetToDefault: 'Restablecer predeterminado',
    sessionCode: 'Código',
    broadcasting: 'Transmitiendo',
    following: 'Siguiendo',
    endSession: 'Finalizar',
    leaveSession: 'Salir',
    joinLive: 'En vivo',
    syncOn: 'Siguiendo la transmisión en vivo',
    syncOff: 'Dejaste de seguir — lee a tu ritmo',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
  },
  ru: {
    showCantillation: 'Показать знаки кантилляции',
    chabadCustom: 'Выделять меньше Аманов',
    showTranslation: 'Перевод',
    hebrewOnly: 'Только иврит',
    langName: 'Русский',
    hebrewName: 'Иврит',
    only: 'Только',
    both: 'Оба',
    fontSize: 'Размер шрифта',
    minLeft: 'мин осталось',
    readingTime: 'Время чтения (мин):',
    save: 'Сохранить',
    changeReadingTime: 'Изменить время чтения',
    chabadHint: 'Обычай Хабад — Аман выделяется только с титулом',
    tapHint: 'Нет трещотки? Нажмите на имя Амана!',
    chapter: 'Глава',
    loudLabel: 'Все читают это вместе:',
    bneiHamanLabel: 'В некоторых общинах все говорят это вместе.',
    headerTitle: 'Мегилат Эстер',
    headerSub: 'Встроенная трещотка и индикатор прогресса',
    language: 'Язык',
    editSubtitle: 'Редактировать подзаголовок',
    subtitleText: 'Текст',
    subtitleUrl: 'Ссылка (необязательно)',
    displayIllustrations: 'Показать иллюстрации',
    trackScrolling: 'Только прокрутка, без выделения',
    trackVerse: 'Нажатые стихи выделяются для зрителей (рекомендуется)',
    trackWord: 'Нажатые слова выделяются для зрителей',
    editTapHint: 'Редактировать объявление',
    resetToDefault: 'Сбросить по умолчанию',
    sessionCode: 'Код',
    broadcasting: 'Трансляция',
    following: 'Слежение',
    endSession: 'Завершить',
    leaveSession: 'Выйти',
    joinLive: 'Эфир',
    syncOn: 'Следите за прямой трансляцией',
    syncOff: 'Отписались — читайте в своём темпе',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
  },
  fr: {
    showCantillation: 'Afficher les signes de cantillation',
    chabadCustom: 'Surligner moins de Hamans',
    showTranslation: 'Traduction',
    hebrewOnly: 'Hébreu seul',
    langName: 'Français',
    hebrewName: 'Hébreu',
    only: 'Seul',
    both: 'Les deux',
    fontSize: 'Taille de police',
    minLeft: 'min restantes',
    readingTime: 'Temps de lecture (min) :',
    save: 'Enregistrer',
    changeReadingTime: 'Modifier le temps de lecture',
    chabadHint: "Coutume Habad — Haman n'est souligné qu'avec un titre",
    tapHint: "Pas de crécelle ? Cliquez sur le nom d'Haman !",
    chapter: 'Chapitre',
    loudLabel: 'Tout le monde lit ceci ensemble :',
    bneiHamanLabel: 'Dans certaines communautés, tout le monde dit ceci ensemble.',
    headerTitle: 'La Méguila',
    headerSub: 'Crécelle intégrée et barre de progression',
    language: 'Langue',
    editSubtitle: 'Modifier le sous-titre',
    subtitleText: 'Texte',
    subtitleUrl: 'Lien (facultatif)',
    displayIllustrations: 'Afficher les illustrations',
    trackScrolling: 'Défilement seul, sans surlignage',
    trackVerse: 'Les versets touchés sont surlignés pour les spectateurs (recommandé)',
    trackWord: 'Les mots touchés sont surlignés pour les spectateurs',
    editTapHint: "Modifier l'annonce",
    resetToDefault: 'Réinitialiser par défaut',
    sessionCode: 'Code',
    broadcasting: 'Diffusion',
    following: 'Suivi',
    endSession: 'Terminer',
    leaveSession: 'Quitter',
    joinLive: 'En direct',
    syncOn: 'Vous suivez la diffusion en direct',
    syncOff: 'Plus de suivi — lisez à votre rythme',
    copyLink: 'Copier le lien',
    copied: 'Copié !',
  },
  pt: {
    showCantillation: 'Mostrar sinais de cantilação',
    chabadCustom: 'Destacar menos Hamãs',
    showTranslation: 'Tradução',
    hebrewOnly: 'Só hebraico',
    langName: 'Português',
    hebrewName: 'Hebraico',
    only: 'Só',
    both: 'Ambos',
    fontSize: 'Tamanho da fonte',
    minLeft: 'min restantes',
    readingTime: 'Tempo de leitura (min):',
    save: 'Salvar',
    changeReadingTime: 'Alterar tempo de leitura',
    chabadHint: 'Costume Chabad — Hamã destacado apenas com título',
    tapHint: 'Não tem matraca? Clique no nome de Hamã!',
    chapter: 'Capítulo',
    loudLabel: 'Todos leem isto juntos:',
    bneiHamanLabel: 'Em algumas comunidades, todos dizem isto juntos.',
    headerTitle: 'A Meguilá',
    headerSub: 'Matraca embutida e barra de progresso',
    language: 'Idioma',
    editSubtitle: 'Editar subtítulo',
    subtitleText: 'Texto',
    subtitleUrl: 'Link (opcional)',
    displayIllustrations: 'Mostrar ilustrações',
    trackScrolling: 'Apenas rolagem, sem destaque',
    trackVerse: 'Versículos tocados são destacados para espectadores (recomendado)',
    trackWord: 'Palavras tocadas são destacadas para espectadores',
    editTapHint: 'Editar anúncio',
    resetToDefault: 'Redefinir padrão',
    sessionCode: 'Código',
    broadcasting: 'Transmitindo',
    following: 'Seguindo',
    endSession: 'Encerrar',
    leaveSession: 'Sair',
    joinLive: 'Ao vivo',
    syncOn: 'Seguindo a transmissão ao vivo',
    syncOff: 'Deixou de seguir — leia no seu ritmo',
    copyLink: 'Copiar link',
    copied: 'Copiado!',
  },
  it: {
    showCantillation: 'Mostra segni di cantillazione',
    chabadCustom: 'Evidenzia meno Haman',
    showTranslation: 'Traduzione',
    hebrewOnly: 'Solo ebraico',
    langName: 'Italiano',
    hebrewName: 'Ebraico',
    only: 'Solo',
    both: 'Entrambi',
    fontSize: 'Dimensione carattere',
    minLeft: 'min rimasti',
    readingTime: 'Tempo di lettura (min):',
    save: 'Salva',
    changeReadingTime: 'Modifica tempo di lettura',
    chabadHint: 'Usanza Chabad — Haman evidenziato solo con titolo',
    tapHint: 'Non hai una raganella? Clicca sul nome di Haman!',
    chapter: 'Capitolo',
    loudLabel: 'Tutti leggono questo insieme:',
    bneiHamanLabel: 'In alcune comunità, tutti dicono questo insieme.',
    headerTitle: 'La Meghillà',
    headerSub: 'Raganella integrata e barra di avanzamento',
    language: 'Lingua',
    editSubtitle: 'Modifica sottotitolo',
    subtitleText: 'Testo',
    subtitleUrl: 'Link (facoltativo)',
    displayIllustrations: 'Mostra illustrazioni',
    trackScrolling: 'Solo scorrimento, senza evidenziazione',
    trackVerse: 'I versetti toccati vengono evidenziati per gli spettatori (consigliato)',
    trackWord: 'Le parole toccate vengono evidenziate per gli spettatori',
    editTapHint: 'Modifica annuncio',
    resetToDefault: 'Ripristina predefinito',
    sessionCode: 'Codice',
    broadcasting: 'Trasmissione',
    following: 'Seguendo',
    endSession: 'Termina',
    leaveSession: 'Esci',
    joinLive: 'Dal vivo',
    syncOn: 'Stai seguendo la trasmissione in diretta',
    syncOff: 'Non segui più — leggi al tuo ritmo',
    copyLink: 'Copia link',
    copied: 'Copiato!',
  },
  hu: {
    showCantillation: 'Kantilláció jelzések mutatása',
    chabadCustom: 'Kevesebb Hámán kiemelése',
    showTranslation: 'Fordítás',
    hebrewOnly: 'Csak héber',
    langName: 'Magyar',
    hebrewName: 'Héber',
    only: 'Csak',
    both: 'Mindkettő',
    fontSize: 'Betűméret',
    minLeft: 'perc van hátra',
    readingTime: 'Olvasási idő (perc):',
    save: 'Mentés',
    changeReadingTime: 'Olvasási idő módosítása',
    chabadHint: 'Chabad szokás — Hámán csak címmel kiemelve',
    tapHint: 'Nincs kereplőd? Kattints Hámán nevére!',
    chapter: 'Fejezet',
    loudLabel: 'Mindenki együtt olvassa:',
    bneiHamanLabel: 'Egyes közösségekben mindenki együtt mondja.',
    headerTitle: 'A Megilla',
    headerSub: 'Beépített kereplő és haladásjelző',
    language: 'Nyelv',
    editSubtitle: 'Alcím szerkesztése',
    subtitleText: 'Szöveg',
    subtitleUrl: 'Link (opcionális)',
    displayIllustrations: 'Illusztrációk megjelenítése',
    trackScrolling: 'Csak görgetés, kiemelés nélkül',
    trackVerse: 'Az érintett versek kijelölődnek a nézők számára (ajánlott)',
    trackWord: 'Az érintett szavak kijelölődnek a nézők számára',
    editTapHint: 'Hirdetmény szerkesztése',
    resetToDefault: 'Visszaállítás alapértelmezettre',
    sessionCode: 'Kód',
    broadcasting: 'Közvetítés',
    following: 'Követés',
    endSession: 'Befejezés',
    leaveSession: 'Kilépés',
    joinLive: 'Élő',
    syncOn: 'Követi az élő közvetítést',
    syncOff: 'Nem követ — olvasson a saját tempójában',
    copyLink: 'Link másolása',
    copied: 'Másolva!',
  },
  de: {
    showCantillation: 'Kantillationszeichen anzeigen',
    chabadCustom: 'Weniger Haman hervorheben',
    showTranslation: 'Übersetzung',
    hebrewOnly: 'Nur Hebräisch',
    langName: 'Deutsch',
    hebrewName: 'Hebräisch',
    only: 'Nur',
    both: 'Beide',
    fontSize: 'Schriftgröße',
    minLeft: 'Min. übrig',
    readingTime: 'Lesezeit (Min.):',
    save: 'Speichern',
    changeReadingTime: 'Lesezeit ändern',
    chabadHint: 'Chabad-Brauch — Haman nur mit Titel hervorgehoben',
    tapHint: 'Keine Ratsche? Klicke einfach auf Hamans Namen!',
    chapter: 'Kapitel',
    loudLabel: 'Alle lesen dies gemeinsam:',
    bneiHamanLabel: 'In manchen Gemeinden sagen alle dies gemeinsam.',
    headerTitle: 'Die Megilla',
    headerSub: 'Eingebaute Ratsche und Fortschrittsanzeige',
    language: 'Sprache',
    editSubtitle: 'Untertitel bearbeiten',
    subtitleText: 'Text',
    subtitleUrl: 'Link (optional)',
    displayIllustrations: 'Illustrationen anzeigen',
    trackScrolling: 'Nur Scrollen, keine Hervorhebung',
    trackVerse: 'Angetippte Verse werden für Zuschauer hervorgehoben (empfohlen)',
    trackWord: 'Angetippte Wörter werden für Zuschauer hervorgehoben',
    editTapHint: 'Ankündigung bearbeiten',
    resetToDefault: 'Auf Standard zurücksetzen',
    sessionCode: 'Code',
    broadcasting: 'Übertragung',
    following: 'Folgen',
    endSession: 'Beenden',
    leaveSession: 'Verlassen',
    joinLive: 'Live',
    syncOn: 'Sie folgen der Live-Übertragung',
    syncOff: 'Nicht mehr folgen — lesen Sie in Ihrem Tempo',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
  },
  el: {
    showCantillation: 'Εμφάνιση σημείων καντιλασιόν',
    chabadCustom: 'Λιγότερη επισήμανση Αμάν',
    showTranslation: 'Μετάφραση',
    hebrewOnly: 'Μόνο Εβραϊκά',
    langName: 'Ελληνικά',
    hebrewName: 'Εβραϊκά',
    only: 'Μόνο',
    both: 'Και τα δύο',
    fontSize: 'Μέγεθος γραμματοσειράς',
    minLeft: 'λεπτά απομ.',
    readingTime: 'Χρόνος ανάγνωσης (λεπτά):',
    save: 'Αποθήκευση',
    changeReadingTime: 'Αλλαγή χρόνου ανάγνωσης',
    chabadHint: 'Έθιμο Χαμπάντ — ο Αμάν επισημαίνεται μόνο με τίτλο',
    tapHint: 'Δεν έχετε ρατσέτα; Πατήστε στο όνομα του Αμάν!',
    chapter: 'Κεφάλαιο',
    loudLabel: 'Όλοι διαβάζουν αυτό μαζί:',
    bneiHamanLabel: 'Σε ορισμένες κοινότητες, όλοι λένε αυτό μαζί.',
    headerTitle: 'Η Μεγιλά',
    headerSub: 'Ενσωματωμένη ρατσέτα και παρακολούθηση προόδου',
    language: 'Γλώσσα',
    editSubtitle: 'Επεξεργασία υπότιτλου',
    subtitleText: 'Κείμενο',
    subtitleUrl: 'Σύνδεσμος (προαιρετικά)',
    displayIllustrations: 'Εμφάνιση εικονογραφήσεων',
    trackScrolling: 'Μόνο κύλιση, χωρίς επισήμανση',
    trackVerse: 'Οι στίχοι που πατιούνται επισημαίνονται για τους θεατές (συνιστάται)',
    trackWord: 'Οι λέξεις που πατιούνται επισημαίνονται για τους θεατές',
    editTapHint: 'Επεξεργασία ανακοίνωσης',
    resetToDefault: 'Επαναφορά στις προεπιλογές',
    sessionCode: 'Κωδικός',
    broadcasting: 'Μετάδοση',
    following: 'Παρακολούθηση',
    endSession: 'Τέλος',
    leaveSession: 'Αποχώρηση',
    joinLive: 'Ζωντανά',
    syncOn: 'Ακολουθείτε τη ζωντανή μετάδοση',
    syncOff: 'Δεν ακολουθείτε πλέον — διαβάστε με το δικό σας ρυθμό',
    copyLink: 'Αντιγραφή συνδέσμου',
    copied: 'Αντιγράφηκε!',
  },
} as const;

type Translations = typeof translations[keyof typeof translations];

const HAMAN_REGEX = /((?:[\u05B0-\u05C7]*[ולבכמשה][\u05B0-\u05C7]*)?הָמָ[\u0591-\u05AF]*ן)/g;

// Strip nikkud and cantillation for consonant-only matching
function stripMarks(s: string): string {
  return s.replace(/[\u0591-\u05C7]/g, '');
}

// Chabad custom: only highlight Haman when he has a title
// Titles: האגגי (the Agagite), הרע (the evil), צורר/צרר (enemy)
// These may appear after "בן המדתא" so we check a wider window
function hasTitleAfter(textAfter: string): boolean {
  const plain = stripMarks(textAfter.slice(0, 50));
  return /(האגגי|הרע|צרר|צורר)/.test(plain);
}

function hasEnglishTitle(before: string, after: string): boolean {
  return /\b(evil|wicked)\s*$/i.test(before) || /^\s*[,]?\s*(the Agagite|son of Hamdata|persecutor)/i.test(after);
}

// Strip cantillation marks (U+0591–U+05AF) and paseq (U+05C0) but keep nikkud vowels
function stripCantillation(s: string): string {
  return s.replace(/[\u0591-\u05AF\u05C0]/g, '');
}

// Split Steinsaltz commentary into vowelized (biblical) and plain (commentary) runs
// Words containing nikud vowels (U+05B0–U+05BD, U+05BF, U+05C1–U+05C2, U+05C4–U+05C7) are biblical text
const NIKUD_RE = /[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4-\u05C7]/;
function boldVowelized(text: string) {
  // Split into words keeping whitespace/punctuation attached
  const tokens = text.split(/(\s+)/);
  const result: (string | ComponentChildren)[] = [];
  let boldRun: string[] = [];
  let plainRun: string[] = [];

  const flushBold = () => {
    if (boldRun.length) {
      result.push(<b>{boldRun.join('')}</b>);
      boldRun = [];
    }
  };
  const flushPlain = () => {
    if (plainRun.length) {
      result.push(plainRun.join(''));
      plainRun = [];
    }
  };

  for (const token of tokens) {
    if (NIKUD_RE.test(token)) {
      flushPlain();
      boldRun.push(token);
    } else {
      flushBold();
      plainRun.push(token);
    }
  }
  flushBold();
  flushPlain();
  return result;
}

const SPLAT_COLORS = ['#5c3a1e', '#7a4f2e', '#3e2710', '#8b6914', '#6b4423', '#4a3015'];
const CONFETTI_COLORS = ['#660a23', '#E8962E', '#f0b054', '#8a1e3c', '#2e7d32', '#1565c0', '#e91e63', '#ff9800'];

function spawnConfetti() {
  const count = 80;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 8;
    const x = Math.random() * window.innerWidth;
    const dx = (Math.random() - 0.5) * 300;
    const duration = 1.5 + Math.random() * 2;
    const delay = Math.random() * 600;
    const rotation = Math.random() * 720 - 360;
    piece.style.cssText = `
      left:${x}px;top:-10px;
      width:${size}px;height:${size * (0.5 + Math.random() * 0.8)}px;
      background:${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
      --dx:${dx}px;--rot:${rotation}deg;
      animation-delay:${delay}ms;
      animation-duration:${duration}s;
    `;
    document.body.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

function spawnSplats(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = 14 + Math.floor(Math.random() * 8);

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'haman-splat';
    const size = 5 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 120;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const delay = Math.random() * 80;
    const duration = 0.5 + Math.random() * 0.4;
    dot.style.cssText = `
      left:${cx}px;top:${cy}px;
      width:${size}px;height:${size}px;
      background:${SPLAT_COLORS[Math.floor(Math.random() * SPLAT_COLORS.length)]};
      --dx:${dx}px;--dy:${dy}px;
      animation-delay:${delay}ms;
      animation-duration:${duration}s;
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }
}

function HamanWord({ text, onTap, wordId, isActive }: { text: string; onTap: () => void; wordId?: string; isActive?: boolean }) {
  const [shaking, setShaking] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const handleClick = () => {
    onTap();
    setShaking(true);
    if (ref.current) spawnSplats(ref.current);
    setTimeout(() => setShaking(false), 400);
  };

  return (
    <span
      ref={ref}
      class={`haman-name${shaking ? ' shake' : ''}${isActive ? ' word-active' : ''}`}
      data-word={wordId}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      {text}
    </span>
  );
}

/** Wrap a text segment into individual word spans with data-word attributes */
function wrapWords(
  text: string,
  verseKey: string,
  startIdx: number,
  activeWord: string | null,
  needsWordSpans: boolean,
): { nodes: ComponentChildren[]; nextIdx: number } {
  if (!needsWordSpans) {
    // Count words for index tracking but skip creating individual spans
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return { nodes: [text], nextIdx: startIdx + wordCount };
  }
  const words = text.split(/(\s+)/);
  const nodes: ComponentChildren[] = [];
  let idx = startIdx;
  for (const w of words) {
    if (/^\s+$/.test(w)) {
      nodes.push(w);
      continue;
    }
    if (!w) continue;
    const wordId = `${verseKey}-${idx}`;
    const isActive = activeWord === wordId;
    nodes.push(
      <span
        key={wordId}
        class={`word${isActive ? ' word-active' : ''}`}
        data-word={wordId}
      >
        {w}
      </span>
    );
    idx++;
  }
  return { nodes, nextIdx: idx };
}

// Person names in English translations for emphasis
const NAMES_RE = /\b(Achashverosh|Achashveirosh|Vashti|Mordechai|Esther|Hadassah|Haman|Mehuman|Bizzeta|Charvona|Charvonah|Bigta|Avagta|Zeitar|Charkas|Carshina|Sheitar|Admata|Tarshish|Meress|Marsina|Memuchan|Heigai|Shaashgaz|Bigtan|Teresh|Hatach|Yair|Shim'iy|Kish|Jechoniah|Nebuchadnezzar|Avichayil|Zeresh|Parshandata|Dalfon|Aspata|Porata|Adalya|Aridata|Parmashta|Arisai|Aridai|Vaizata|Hamdata)\b/;

function highlightNames(text: string): (string | preact.JSX.Element)[] {
  const parts = text.split(new RegExp(NAMES_RE.source, 'g'));
  if (parts.length === 1) return [text];
  return parts.map((part, i) =>
    NAMES_RE.test(part) ? <span key={i} class="person-name">{part}</span> : part
  );
}

function renderVerse(
  text: string,
  chapterNum: number,
  verseNum: number,
  onHamanTap: () => void,
  chabadMode: boolean,
  hideCantillation: boolean,
  translationMode: 'hebrew' | 'both' | 'translation',
  t: Translations,
  lang: Lang,
  translationMap: TranslationMap | null,
  activeWord: string | null,
  activeVerse: string | null,
  needsWordSpans: boolean = true,
) {
  const displayText = hideCantillation ? stripCantillation(text) : text;
  const parts = displayText.split(HAMAN_REGEX);
  const verseKey = `${chapterNum}:${verseNum}`;
  const isLoud = LOUD_VERSES.has(verseKey);
  const isVerseActive = activeVerse === verseKey;
  const translation = translationMap?.[verseKey];

  let wordIdx = 0;

  const showHebrew = translationMode !== 'translation';
  const showTrans = translationMode !== 'hebrew' && !!translation;
  const sideBySide = translationMode === 'both' && lang !== 'he';

  const hebrewContent = showHebrew && parts.map((part, i) => {
    if (!HAMAN_REGEX.test(part)) {
      const { nodes, nextIdx } = wrapWords(part, verseKey, wordIdx, activeWord, needsWordSpans);
      wordIdx = nextIdx;
      return <span key={`${chapterNum}-${verseNum}-${i}`}>{nodes}</span>;
    }
    if (chabadMode) {
      const nextPart = parts[i + 1] || '';
      if (!hasTitleAfter(nextPart)) {
        const wId = `${verseKey}-${wordIdx}`;
        const isActive = needsWordSpans && activeWord === wId;
        wordIdx++;
        return needsWordSpans
          ? <span key={`${chapterNum}-${verseNum}-${i}`} class={`word${isActive ? ' word-active' : ''}`} data-word={wId}>{part}</span>
          : <span key={`${chapterNum}-${verseNum}-${i}`}>{part}</span>;
      }
    }
    const wId = `${verseKey}-${wordIdx}`;
    const isActive = needsWordSpans && activeWord === wId;
    wordIdx++;
    return (
      <HamanWord key={`${chapterNum}-${verseNum}-${i}`} text={part} onTap={onHamanTap} wordId={wId} isActive={isActive} />
    );
  });

  const translationContent = showTrans && (
    <span class="verse-translation" dir={lang === 'he' ? 'rtl' : 'ltr'}>{
      lang === 'he'
        ? boldVowelized(translation)
        : (chabadMode ? HAMAN_TITLED_VERSES : HAMAN_VERSES).has(verseKey)
          ? translation.split(/(Haman)/gi).map((seg, j, arr) =>
              /^haman$/i.test(seg)
                ? (chabadMode && !hasEnglishTitle(arr.slice(0, j).join(''), arr.slice(j + 1).join('')))
                  ? seg
                  : <HamanWord key={`tr-${chapterNum}-${verseNum}-${j}`} text={seg} onTap={onHamanTap} />
                : seg
            )
          : highlightNames(translation)
    }</span>
  );

  const transliteration = isLoud && lang !== 'he' ? LOUD_TRANSLITERATIONS[lang]?.[verseKey] ?? LOUD_TRANSLITERATIONS['en']?.[verseKey] : null;

  const verseContent = sideBySide ? (
    <div class={`verse verse-row${isLoud ? ' loud-verse' : ''}${isVerseActive ? ' verse-active' : ''}`} data-verse={verseKey}>
      {isLoud && <span class="loud-label">{t.loudLabel}</span>}
      {transliteration && <div class="transliteration-box" dir="ltr">{transliteration}</div>}
      <div class="verse-col verse-col-translation" dir="ltr">
        <sup class="verse-num">{verseNum}</sup>
        {translationContent}
      </div>
      <div class="verse-col verse-col-hebrew" dir="rtl">
        <sup class="verse-num">{toHebrew(verseNum)}</sup>
        {hebrewContent}
      </div>
    </div>
  ) : (
    <span class={`verse${isLoud ? ' loud-verse' : ''}${isVerseActive ? ' verse-active' : ''}`} data-verse={verseKey}>
      {isLoud && <span class="loud-label" dir={lang === 'he' ? 'rtl' : 'ltr'}>{t.loudLabel}</span>}
      {transliteration && <span class="transliteration-box" dir="ltr">{transliteration}</span>}
      <sup class="verse-num">{lang === 'he' ? toHebrew(verseNum) : verseNum}</sup>
      {hebrewContent}
      {translationContent}
      {' '}
    </span>
  );

  return verseContent;
}

const LANG_STORAGE_KEY = 'megillah-lang';
const SUPPORTED_LANGS: Lang[] = ['he', 'en', 'es', 'ru', 'fr', 'pt', 'it', 'hu', 'de', 'el'];

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored as Lang)) return stored as Lang;
  } catch {}
  const dataLang = document.documentElement.dataset.lang;
  if (dataLang && SUPPORTED_LANGS.includes(dataLang as Lang)) return dataLang as Lang;
  const navLang = navigator.language.split('-')[0].toLowerCase();
  if (SUPPORTED_LANGS.includes(navLang as Lang)) return navLang as Lang;
  return 'en';
}

export default function MegillahReader({ standalone = false, showTitle = false, session, remoteMinutes, activeWord: remoteActiveWord, activeVerse: remoteActiveVerse, onWordTap, remoteSettings, syncEnabled = true, onToggleSync }: { standalone?: boolean; showTitle?: boolean; session?: Session; remoteMinutes?: number | null; activeWord?: string | null; activeVerse?: string | null; onWordTap?: (wordId: string) => void; remoteSettings?: Record<string, unknown>; syncEnabled?: boolean; onToggleSync?: () => void }) {
  const dragging = useRef(false);
  const lastBroadcastTime = useRef(0);
  const lastDragWord = useRef<string | null>(null);
  const gapAnimating = useRef(false);
  const [showCantillation, setShowCantillation] = useState(false);
  const [chabadMode, setChabadMode] = useState(true);
  const [fontSize, setFontSize] = useState(1.15);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(DEFAULT_READING_MINUTES);
  const [draftMinutes, setDraftMinutes] = useState(DEFAULT_READING_MINUTES);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuDismissedByScroll = useRef(false);
  const [showTrackingMenu, setShowTrackingMenu] = useState(false);
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [translationMode, setTranslationMode] = useState<'hebrew' | 'both' | 'translation'>('hebrew');
  const [loadedTranslations, setLoadedTranslations] = useState<TranslationMap | null>(null);
  const translationCache = useRef<Record<string, TranslationMap>>({});
  const deviceLang = useRef<Lang>(getInitialLang);
  const [showIllustrations, setShowIllustrations] = useState(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [trackingMode, setTrackingMode] = useState<'off' | 'verse' | 'word'>('off');
  const [customSubtitle, setCustomSubtitle] = useState<{ text: string; url: string } | null>(null);
  const [showSubtitleEdit, setShowSubtitleEdit] = useState(false);
  const [draftSubText, setDraftSubText] = useState('');
  const [draftSubUrl, setDraftSubUrl] = useState('');
  const [customTapHint, setCustomTapHint] = useState<string | null>(null);
  const [showTapHintEdit, setShowTapHintEdit] = useState(false);
  const tinymceRef = useRef<HTMLDivElement | null>(null);
  const [customBottomHint, setCustomBottomHint] = useState<string | null>(null);
  const [showBottomHintEdit, setShowBottomHintEdit] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [syncPulse, setSyncPulse] = useState(false);
  const syncPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [muted, setMuted] = useState(false);
  const [soundActive, setSoundActive] = useState(false);
  const audioPool = useRef<HTMLAudioElement[]>([]);
  const soundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTextRef = useRef<HTMLDivElement>(null);
  const confettiFired = useRef(false);

  // Default to verse tracking when starting a broadcast
  useEffect(() => {
    if (session?.role === 'admin') setTrackingMode('verse');
  }, [session?.role]);

  // Detect real language and restore settings after hydration
  useEffect(() => {
    const detected = getInitialLang();
    if (detected !== lang) {
      setLang(detected);
      deviceLang.current = detected;
    }
    try {
      const stored = localStorage.getItem('megillah-translation-mode');
      if (stored === 'both' || stored === 'translation') {
        setTranslationMode(stored);
      } else if (detected !== 'he') {
        setTranslationMode('both');
      }
    } catch {}
  }, []);

  const t = translations[lang];
  // Only create per-word spans when word tracking is active or a remote word is highlighted
  const needsWordSpans = trackingMode === 'word' || !!activeWord || !!remoteActiveWord;

  // The translation language to use when translation is shown
  // Hebrew users get Steinsaltz commentary; others get their language's translation
  const translationKey: Lang = lang;
  const showTranslation = translationMode !== 'hebrew';

  // Resolve the active translation map
  const activeTranslations: TranslationMap | null =
    !showTranslation ? null :
    translationKey === 'en' ? translationsEn :
    loadedTranslations;


  // Lazy-load non-English translations when needed
  useEffect(() => {
    if (!showTranslation || translationKey === 'en') {
      setLoadedTranslations(null);
      return;
    }
    if (translationCache.current[translationKey]) {
      setLoadedTranslations(translationCache.current[translationKey]);
      return;
    }
    fetch(`/translations/${translationKey}.json`)
      .then(r => r.json())
      .then((data: TranslationMap) => {
        translationCache.current[translationKey] = data;
        setLoadedTranslations(data);
      })
      .catch(() => setLoadedTranslations(null));
  }, [showTranslation, translationKey]);

  useEffect(() => {
    const saved = sessionStorage.getItem('megillah-reading-minutes');
    if (saved) {
      const val = parseInt(saved, 10);
      setTotalMinutes(val);
      setDraftMinutes(val);
    }
  }, []);

  // Apply initial settings from DB when session connects
  useEffect(() => {
    if (!session?.initialSettings) return;
    const s = session.initialSettings;
    if (s.readingMinutes != null) {
      setTotalMinutes(s.readingMinutes);
      setDraftMinutes(s.readingMinutes);
    }
    if (s.chabadMode !== undefined) {
      setChabadMode(s.chabadMode);
    }
    if (s.lang) {
      setLang(s.lang as Lang);
    }
    if (s.translationMode) {
      setTranslationMode(s.translationMode);
    } else if (s.showTranslation || (s.lang && s.lang !== 'he') || (!s.lang && lang !== 'he')) {
      setTranslationMode('both');
    }
    if (s.customSubtitle) {
      setCustomSubtitle(s.customSubtitle);
    }
    if (s.customTapHint) {
      setCustomTapHint(s.customTapHint);
    }
    if (s.customBottomHint) {
      setCustomBottomHint(s.customBottomHint);
    }
    if (s.showIllustrations) {
      setShowIllustrations(true);
    }
    if (s.fontSize != null) {
      setFontSize(s.fontSize);
    }
  }, [session]);

  // Follower: apply real-time reading time from admin
  useEffect(() => {
    if (remoteMinutes != null) {
      setTotalMinutes(remoteMinutes);
      setDraftMinutes(remoteMinutes);
    }
  }, [remoteMinutes]);

  // Follower: apply real-time settings from admin
  useEffect(() => {
    if (remoteSettings?.chabadMode !== undefined) {
      setChabadMode(remoteSettings.chabadMode as boolean);
    }
  }, [remoteSettings?.chabadMode]);

  useEffect(() => {
    if (remoteSettings?.translationMode !== undefined) {
      setTranslationMode(remoteSettings.translationMode as 'hebrew' | 'both' | 'translation');
    }
  }, [remoteSettings?.translationMode]);

  useEffect(() => {
    if (remoteSettings?.customSubtitle !== undefined) {
      setCustomSubtitle(remoteSettings.customSubtitle as { text: string; url: string } | null);
    }
  }, [remoteSettings?.customSubtitle]);

  useEffect(() => {
    if (remoteSettings?.customTapHint !== undefined) {
      setCustomTapHint(remoteSettings.customTapHint as string | null);
    }
  }, [remoteSettings?.customTapHint]);

  useEffect(() => {
    if (remoteSettings?.customBottomHint !== undefined) {
      setCustomBottomHint(remoteSettings.customBottomHint as string | null);
    }
  }, [remoteSettings?.customBottomHint]);

  useEffect(() => {
    if (remoteSettings?.lang !== undefined && SUPPORTED_LANGS.includes(remoteSettings.lang as Lang)) {
      setLang(remoteSettings.lang as Lang);
    }
  }, [remoteSettings?.lang]);

  useEffect(() => {
    if (remoteSettings?.fontSize != null) {
      setFontSize(remoteSettings.fontSize as number);
    }
  }, [remoteSettings?.fontSize]);

  // Pulse sync button when receiving remote updates
  useEffect(() => {
    if (!syncEnabled || session?.role !== 'follower') return;
    if (!remoteActiveWord && !remoteActiveVerse) return;
    setSyncPulse(true);
    if (syncPulseTimer.current) clearTimeout(syncPulseTimer.current);
    syncPulseTimer.current = setTimeout(() => setSyncPulse(false), 1200);
  }, [remoteActiveWord, remoteActiveVerse]);

  // Load TinyMCE when editor opens
  const initHintEditor = (selector: string, content: string, contentStyle?: string) => {
    const tinymce = (window as any).tinymce;
    if (!tinymce) return;
    tinymce.init({
      selector,
      height: 200,
      menubar: false,
      branding: false,
      promotion: false,
      directionality: lang === 'he' ? 'rtl' as const : 'ltr' as const,
      plugins: 'link lists directionality',
      toolbar: 'bold italic underline forecolor | link insertbutton | bullist numlist | alignleft aligncenter alignright | fontsize | ltr rtl | removeformat',
      content_style: contentStyle || `body { font-family: Heebo, sans-serif; font-size: 14px; direction: ${lang === 'he' ? 'rtl' : 'ltr'}; background: #fdf6f0; color: #E8962E; text-align: center; } a { color: #E8962E; } p { margin: 4px 0; }`,
      setup: (editor: any) => {
        editor.ui.registry.addButton('insertbutton', {
          text: 'Button',
          icon: 'new-tab',
          onAction: () => {
            editor.windowManager.open({
              title: 'Insert Button',
              body: {
                type: 'panel',
                items: [
                  { type: 'input', name: 'text', label: 'Button text' },
                  { type: 'input', name: 'url', label: 'Button URL' },
                ]
              },
              buttons: [
                { type: 'cancel', text: 'Cancel' },
                { type: 'submit', text: 'Insert', primary: true },
              ],
              onSubmit: (api: any) => {
                const data = api.getData();
                if (data.text && data.url) {
                  editor.insertContent(
                    `<a href="${data.url}" target="_blank" rel="noopener" style="display:inline-block;background:#660a23;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin:4px 2px;">${data.text}</a>`
                  );
                }
                api.close();
              }
            });
          }
        });
        editor.on('init', () => {
          editor.setContent(content);
        });
      },
    });
  };

  const ensureTinyMCELoaded = (callback: () => void) => {
    if ((window as any).tinymce) {
      callback();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.tiny.cloud/1/utcucfgqm71xjbhcb3dgsm1sdjund27o1tylz7nl7llyrfc9/tinymce/7/tinymce.min.js';
      script.referrerPolicy = 'origin';
      script.onload = callback;
      document.head.appendChild(script);
    }
  };

  useEffect(() => {
    if (!showTapHintEdit) return;
    ensureTinyMCELoaded(() => initHintEditor('#tap-hint-tinymce', customTapHint || ''));
    return () => {
      (window as any).tinymce?.get('tap-hint-tinymce')?.destroy();
    };
  }, [showTapHintEdit]);

  const defaultBottomHintHe = `<h2>מה הלאה?</h2>
<p>חוץ מקריאת המגילה, ישנן עוד שלוש מצוות שיש לקיים אותן ביום פורים:</p>
<h3>🎁 מתנות לאביונים – איך עושים?</h3>
<p>במהלך יום הפורים כל איש ואישה – ורצוי שגם הילדים ישתתפו – נותנים סכום כסף או מתנה לשני אנשים נזקקים (איש או אישה). המינימום הוא לתת לשני עניים, ולפחות שווי של פרוטה לכל אחד. כל המרבה – הרי זה משובח.</p>
<p>יש להרבות במתנות לאביונים יותר מיתר מצוות הפורים, כי השמחה המפוארת והגדולה ביותר היא לשמח את לב העניים, היתומים, האלמנות והגרים.</p>
<h3>🍱 משלוח מנות – איך עושים?</h3>
<p>ביום הפורים שולחים לחברים ולידידים – ואפשר גם לכאלה שיהיו ידידים בעתיד 😉 – שני מוצרי מזון לאדם אחד לפחות.</p>
<p>ניתן לשלוח כל סוג של מזון, ובלבד שיהיה דבר אכיל: פירות או ירקות, משקאות או מאפים, תבשילים או מוצרים קנויים.</p>
<p>כל גבר צריך לשלוח לגבר אחד לפחות, וכל אישה לאישה אחת לפחות. אפשר, ואף מומלץ, לשלוח ליותר אנשים. כל המרבה – הרי זה משובח.</p>
<h3>🎉 משתה ושמחה – סעודת פורים</h3>
<p>ביום הפורים מצווה לקיים סעודה ומשתה מתוך שמחה מיוחדת וגדולה. פורים הוא מהימים השמחים ביותר בלוח השנה היהודי, ואם שמחים בו כראוי – זוכים להמשיך את השמחה גם לימים הבאים.</p>
<p>חז"ל קבעו: "חייב אדם לבסומי בפוריא עד דלא ידע בין ארור המן לברוך מרדכי".</p>
<p>סעודת הפורים מתקיימת ביום, ללא עריכת קידוש. מכבדים את היום בפריסת מפה נאה על השולחן, במאכלים משובחים, ויש הנוהגים לבצוע חלות יפות ולהדליק תאורה או נרות חגיגיים (ללא ברכה).</p>
<p style="text-align:left;font-size:0.75rem;opacity:0.5;">(באדיבות אתר חב"ד.אורג)</p>
<p style="text-align:center;font-weight:900;font-size:1.1rem;">פורים שמח!</p>`;

  const defaultBottomHintEn = `<h2>What's Next?</h2>
<p>Now that you finished hearing the Megillah, here are the other 3 Purim Mitzvot to remember:</p>
<h3>1. Give to the Needy (Matanot LaEvyonim)</h3>
<p>On Purim day, give money or food to at least two needy people. This mitzvah highlights Jewish unity and caring for others. If you don't know anyone personally, you can give through your synagogue or place money in a charity box. Even children should participate.</p>
<h3>2. Send Food Gifts (Mishloach Manot)</h3>
<p>On Purim day, send at least two ready-to-eat food or drink items to at least one friend. This strengthens friendship and community bonds. It's ideal to send the package through a messenger, and children are encouraged to take part.</p>
<h3>3. Celebrate with a Festive Meal</h3>
<p>During Purim day, have a joyful meal with family and possibly guests. Traditionally, it includes bread, meat, wine, songs, Torah thoughts, and a spirit of celebration, continuing into the evening.</p>
<p style="text-align:center;font-weight:900;font-size:1.1rem;">Happy Purim!</p>`;

  const getBottomHintDefault = () => {
    if (lang === 'he') return defaultBottomHintHe;
    if (lang === 'en') return defaultBottomHintEn;
    return '';
  };

  useEffect(() => {
    if (!showBottomHintEdit) return;
    const bottomStyle = `body { font-family: Heebo, sans-serif; font-size: 14px; direction: ${lang === 'he' ? 'rtl' : 'ltr'}; background: #fdf6f0; color: #333; } h2 { font-size: 1.2rem; font-weight: 900; color: #660a23; } h3 { font-size: 0.95rem; font-weight: 700; color: #660a23; } p { font-size: 0.85rem; line-height: 1.55; margin: 0 0 8px; } a { color: #660a23; }`;
    ensureTinyMCELoaded(() => initHintEditor('#bottom-hint-tinymce', customBottomHint || getBottomHintDefault(), bottomStyle));
    return () => {
      (window as any).tinymce?.get('bottom-hint-tinymce')?.destroy();
    };
  }, [showBottomHintEdit]);

  // Sync remote word/verse highlight from follower callback
  useEffect(() => {
    if (remoteActiveWord !== undefined) {
      setActiveWord(remoteActiveWord ?? null);
    }
  }, [remoteActiveWord]);

  useEffect(() => {
    if (remoteActiveVerse !== undefined) {
      setActiveVerse(remoteActiveVerse ?? null);
    }
  }, [remoteActiveVerse]);

  const highlightWord = useCallback((wordId: string) => {
    setActiveWord(wordId);
    setActiveVerse(null);
    const now = Date.now();
    if (now - lastBroadcastTime.current >= 80) {
      lastBroadcastTime.current = now;
      session?.broadcastWord(wordId);
      onWordTap?.(wordId);
    }
  }, [session, onWordTap]);

  const highlightVerse = useCallback((verseKey: string) => {
    setActiveVerse(verseKey);
    setActiveWord(null);
    session?.broadcastWord(`v:${verseKey}`);
  }, [session]);

  const trackingModeRef = useRef(trackingMode);
  trackingModeRef.current = trackingMode;

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Touch/mouse drag handlers for word-by-word and verse highlighting (admin only)
  useEffect(() => {
    const container = scrollTextRef.current;
    if (!container || session?.role !== 'admin') return;

    const getWordFromPoint = (x: number, y: number): string | null => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const wordEl = (el as HTMLElement).closest?.('[data-word]') as HTMLElement | null;
      return wordEl?.dataset.word ?? null;
    };

    const getVerseFromPoint = (x: number, y: number): string | null => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const verseEl = (el as HTMLElement).closest?.('[data-verse]') as HTMLElement | null;
      return verseEl?.dataset.verse ?? null;
    };

    // Smooth gap-fill: animate through intermediate words when drag skips
    const fillGap = (fromWord: string, toWord: string) => {
      if (gapAnimating.current) return;
      const allWords = Array.from(container.querySelectorAll('[data-word]')) as HTMLElement[];
      const fromIdx = allWords.findIndex(el => el.dataset.word === fromWord);
      const toIdx = allWords.findIndex(el => el.dataset.word === toWord);
      if (fromIdx === -1 || toIdx === -1 || Math.abs(toIdx - fromIdx) <= 1) return;

      gapAnimating.current = true;
      const step = fromIdx < toIdx ? 1 : -1;
      let i = fromIdx + step;
      const animateNext = () => {
        if ((step > 0 && i >= toIdx) || (step < 0 && i <= toIdx)) {
          gapAnimating.current = false;
          return;
        }
        const wId = allWords[i]?.dataset.word;
        if (wId) {
          setActiveWord(wId);
        }
        i += step;
        setTimeout(() => requestAnimationFrame(animateNext), 30);
      };
      requestAnimationFrame(animateNext);
    };

    const onPointerStart = (x: number, y: number) => {
      const mode = trackingModeRef.current;
      if (mode === 'off') return false;

      if (mode === 'verse') {
        const verseKey = getVerseFromPoint(x, y);
        if (verseKey) highlightVerse(verseKey);
        return false; // Don't start drag for verse mode
      }

      // Word mode
      const wordId = getWordFromPoint(x, y);
      if (!wordId) return false;
      dragging.current = true;
      lastDragWord.current = wordId;
      setActiveWord(wordId);
      setActiveVerse(null);
      lastBroadcastTime.current = Date.now();
      session?.broadcastWord(wordId);
      onWordTap?.(wordId);
      return true;
    };

    const onPointerMove = (x: number, y: number) => {
      if (!dragging.current) return;
      const wordId = getWordFromPoint(x, y);
      if (wordId && wordId !== lastDragWord.current) {
        // Fill gaps if words were skipped
        if (lastDragWord.current) {
          fillGap(lastDragWord.current, wordId);
        }
        lastDragWord.current = wordId;
        highlightWord(wordId);
      }
    };

    const onPointerEnd = () => {
      dragging.current = false;
      lastDragWord.current = null;
    };

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      // Multi-touch always cancels tracking and allows scroll
      if (e.touches.length >= 2) {
        dragging.current = false;
        lastDragWord.current = null;
        return;
      }
      if (trackingModeRef.current === 'off') return;
      const touch = e.touches[0];
      onPointerStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Multi-touch cancels
      if (e.touches.length >= 2) {
        dragging.current = false;
        lastDragWord.current = null;
        return;
      }
      if (!dragging.current) return;
      e.preventDefault(); // Block scrolling while dragging words
      const touch = e.touches[0];
      onPointerMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => onPointerEnd();

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      if (trackingModeRef.current === 'off') return;
      onPointerStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      onPointerMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => onPointerEnd();

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [session?.role, highlightWord, highlightVerse, session, onWordTap]);

  useEffect(() => {
    const handleScroll = () => {
      const el = scrollTextRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrolled = -rect.top;
      const scrollable = totalHeight - viewportHeight;
      if (scrolled > 50 && menuOpen) {
        setMenuOpen(false);
      }
      if (scrollable <= 0) { setScrollProgress(1); return; }
      const progress = Math.min(1, Math.max(0, scrolled / scrollable));
      setScrollProgress(progress);
      if (progress >= 0.99 && !confettiFired.current) {
        confettiFired.current = true;
        spawnConfetti();
      }
      // Admin: find topmost visible verse and broadcast it
      if (sessionRef.current?.role === 'admin') {
        const verseEls = el.querySelectorAll('[data-verse]');
        let topVerse: string | null = null;
        for (const v of verseEls) {
          const r = v.getBoundingClientRect();
          if (r.top >= -r.height) {
            topVerse = (v as HTMLElement).dataset.verse || null;
            break;
          }
        }
        if (topVerse) {
          sessionRef.current.broadcast({ verse: topVerse });
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const TOTAL_SOUNDS = 22;

  const playGragger = useCallback(() => {
    if (muted) return;
    const idx = Math.floor(Math.random() * TOTAL_SOUNDS) + 1;
    const audio = new Audio(`/sounds/gragger${idx}.mp3`);
    audioPool.current.push(audio);
    audio.play().catch(() => {});
    audio.addEventListener('ended', () => {
      audioPool.current = audioPool.current.filter((a) => a !== audio);
    });
    setSoundActive(true);
    if (soundTimer.current) clearTimeout(soundTimer.current);
    soundTimer.current = setTimeout(() => setSoundActive(false), 5000);
  }, [muted]);

  // Ref so shake effect can read current mute state
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      if (!prev) {
        // Muting: stop all playing sounds
        audioPool.current.forEach(a => { a.pause(); a.currentTime = 0; });
        audioPool.current = [];
        setSoundActive(false);
        if (soundTimer.current) clearTimeout(soundTimer.current);
      }
      return !prev;
    });
  }, []);

  // Unlock audio on first user interaction (needed for shake-to-play on iOS/Android)
  useEffect(() => {
    let unlocked = false;
    const unlockAudio = () => {
      if (unlocked) return;
      unlocked = true;
      // Play a real sound file at zero volume to fully unlock iOS audio
      const audio = new Audio('/sounds/gragger1.mp3');
      audio.volume = 0;
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('touchend', unlockAudio);
    document.addEventListener('click', unlockAudio);
    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  return (
    <div class="megillah-reader" dir={lang === 'he' ? 'rtl' : 'ltr'} ref={(el: HTMLDivElement | null) => { if (el) { const expected = lang === 'he' ? 'rtl' : 'ltr'; if (el.dir !== expected) setTimeout(() => { el.dir = expected; el.querySelectorAll('[dir]').forEach(child => { (child as HTMLElement).dir = expected; }); }, 0); } }}>
      {standalone && (
        <header class={`reader-header${session ? ' has-session-bar' : ''}`}>
          <span class="logo-main">{t.headerTitle}</span>
          <span class="logo-sub">
            {customSubtitle ? (customSubtitle.url ? <a href={customSubtitle.url} target="_blank" rel="noopener noreferrer" class="header-link">{customSubtitle.text}</a> : customSubtitle.text) : t.headerSub}
            {session?.role === 'admin' && (
              <button class="edit-subtitle-btn" onClick={() => { setShowSubtitleEdit(!showSubtitleEdit); setDraftSubText(customSubtitle?.text || ''); setDraftSubUrl(customSubtitle?.url || ''); }} title={t.editSubtitle}>
                <span class="material-icons" style="font-size:14px;vertical-align:middle;margin:0 4px">edit</span>
              </button>
            )}
          </span>
          {!session && (
            <a href="/live" class="join-live-btn">
              <span class="material-icons" style="font-size:13px;vertical-align:middle;margin-inline-end:3px">cast</span>
              {t.joinLive}
            </a>
          )}
        </header>
      )}
      {showTitle && (
        <div class="page-title-block">
          <h1 class="page-title">{t.headerTitle}</h1>
          <p class="page-subtitle">
            {customSubtitle ? (customSubtitle.url ? <a href={customSubtitle.url} target="_blank" rel="noopener noreferrer" class="header-link">{customSubtitle.text}</a> : customSubtitle.text) : t.headerSub}
            {session?.role === 'admin' && (
              <button class="edit-subtitle-btn" onClick={() => { setShowSubtitleEdit(!showSubtitleEdit); setDraftSubText(customSubtitle?.text || ''); setDraftSubUrl(customSubtitle?.url || ''); }} title={t.editSubtitle}>
                <span class="material-icons" style="font-size:14px;vertical-align:middle;margin:0 4px">edit</span>
              </button>
            )}
          </p>
        </div>
      )}
      {/* Subtitle edit popover */}
      {showSubtitleEdit && session?.role === 'admin' && (
        <div class="time-popover subtitle-popover" dir={lang === 'he' ? 'rtl' : 'ltr'}>
          <label class="subtitle-field">
            {t.subtitleText}
            <input
              type="text"
              value={draftSubText}
              onInput={(e) => setDraftSubText((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="subtitle-field">
            {t.subtitleUrl}
            <input
              type="url"
              value={draftSubUrl}
              onInput={(e) => setDraftSubUrl((e.target as HTMLInputElement).value)}
              placeholder="https://..."
            />
          </label>
          <button
            class="save-time-btn"
            onClick={() => {
              const val = draftSubText.trim() ? { text: draftSubText.trim(), url: draftSubUrl.trim() } : null;
              setCustomSubtitle(val);
              session.broadcastSetting('customSubtitle', val);
              setShowSubtitleEdit(false);
            }}
          >
            {t.save}
          </button>
        </div>
      )}
      {/* Session info bar */}
      {session && (
        <div class="session-bar">
          <button class="session-code" onClick={() => setShowQR(true)}>
            <span class="material-icons" style="font-size:16px;vertical-align:middle;margin:0 4px">
              {session.role === 'admin' ? 'cast' : 'cast_connected'}
            </span>
            {t.sessionCode}: {session.code}
          </button>
          <span class="session-role">
            {session.role === 'admin' ? t.broadcasting : t.following}
          </span>
          <button class="session-leave" onClick={session.leave}>
            <span class="material-icons" style={`font-size:16px;vertical-align:middle;margin:0 2px${lang === 'he' && session.role !== 'admin' ? ';transform:scaleX(-1)' : ''}`}>
              {session.role === 'admin' ? 'stop_circle' : 'logout'}
            </span>
            {session.role === 'admin' ? t.endSession : t.leaveSession}
          </button>
        </div>
      )}
      {/* Progress bar */}
      <div class="progress-bar-container" dir={lang === 'he' ? 'rtl' : 'ltr'}>
        <div class="progress-bar-fill" style={{ width: `${scrollProgress * 100}%` }} />
        <span class="progress-label">
          {`${Math.round(scrollProgress * 100)}%`}
          {scrollProgress < 1 && ` · ~${Math.ceil((1 - scrollProgress) * totalMinutes)} ${t.minLeft}`}
        </span>
      </div>
      {/* Inline toolbar */}
      <div class="toolbar-sticky">
      <div class="inline-toolbar" dir={lang === 'he' ? 'rtl' : 'ltr'}>
        <div class="toolbar-left">
          <span class="material-icons size-icon">text_fields</span>
          <input
            type="range"
            min="0.9"
            max="2.2"
            step="0.05"
            value={fontSize}
            onInput={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); setFontSize(v); if (session?.role === 'admin') session.broadcastSetting('fontSize', v); }}
            class="size-slider"
          />
        </div>
        {lang === 'he' ? (
          <div class="toolbar-translation-toggle">
            <button class={`toolbar-trans-btn${translationMode === 'hebrew' ? ' active' : ''}`} onClick={() => { setTranslationMode('hebrew'); try { localStorage.setItem('megillah-translation-mode', 'hebrew'); } catch {} if (session?.role === 'admin') session.broadcastSetting('translationMode', 'hebrew'); }}>מקור</button>
            <button class={`toolbar-trans-btn${translationMode === 'translation' ? ' active' : ''}`} onClick={() => { setTranslationMode('translation'); try { localStorage.setItem('megillah-translation-mode', 'translation'); } catch {} if (session?.role === 'admin') session.broadcastSetting('translationMode', 'translation'); }}>ביאור משולב</button>
          </div>
        ) : (
          <div class="toolbar-translation-toggle">
            <button class={`toolbar-trans-btn${translationMode === 'translation' ? ' active' : ''}`} onClick={() => { setTranslationMode('translation'); try { localStorage.setItem('megillah-translation-mode', 'translation'); } catch {} if (session?.role === 'admin') session.broadcastSetting('translationMode', 'translation'); }}>{t.langName}</button>
            <button class={`toolbar-trans-btn${translationMode === 'both' ? ' active' : ''}`} onClick={() => { setTranslationMode('both'); try { localStorage.setItem('megillah-translation-mode', 'both'); } catch {} if (session?.role === 'admin') session.broadcastSetting('translationMode', 'both'); }}>{t.both}</button>
            <button class={`toolbar-trans-btn${translationMode === 'hebrew' ? ' active' : ''}`} onClick={() => { setTranslationMode('hebrew'); try { localStorage.setItem('megillah-translation-mode', 'hebrew'); } catch {} if (session?.role === 'admin') session.broadcastSetting('translationMode', 'hebrew'); }}>{t.hebrewName}</button>
          </div>
        )}
        <div class="toolbar-right">
          {session?.role === 'admin' && (
            <button
              class={`toolbar-icon-btn${trackingMode !== 'off' ? ' tracking-active' : ''}`}
              onClick={() => { setShowTrackingMenu(!showTrackingMenu); setShowTimeEdit(false); setMenuOpen(false); }}
              title="Tracking mode"
            >
              <span class="material-icons">highlight</span>
            </button>
          )}
          {session?.role === 'follower' && onToggleSync && (
            <button
              class={`toolbar-icon-btn${syncEnabled ? ' tracking-active' : ''}${syncPulse ? ' sync-pulse' : ''}`}
              onClick={() => {
                onToggleSync();
                const msg = syncEnabled ? t.syncOff : t.syncOn;
                setToast(msg);
                if (toastTimer.current) clearTimeout(toastTimer.current);
                toastTimer.current = setTimeout(() => setToast(null), 3000);
              }}
              title={syncEnabled ? 'Unfollow broadcaster' : 'Follow broadcaster'}
            >
              <span class="material-icons">{syncEnabled ? 'sensors' : 'sensors_off'}</span>
            </button>
          )}
          {!(session?.role === 'follower') && (
          <button
            class="toolbar-icon-btn"
            onClick={() => { setShowTimeEdit(!showTimeEdit); setMenuOpen(false); setShowTrackingMenu(false); }}
            title={t.changeReadingTime}
          >
            <span class="material-icons">timer</span>
          </button>
          )}
          <button
            class="toolbar-icon-btn"
            onClick={() => { setMenuOpen(!menuOpen); setShowTimeEdit(false); setShowTrackingMenu(false); }}
            title="Settings"
          >
            <span class="material-icons">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {/* Reading time popover */}
      {showTimeEdit && (
        <div class="time-popover" dir={lang === 'he' ? 'rtl' : 'ltr'}>
          <label>
            {t.readingTime}
            <input
              type="number"
              min="10"
              max="90"
              value={draftMinutes}
              onInput={(e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                if (val >= 10 && val <= 90) setDraftMinutes(val);
              }}
              class="time-input"
            />
          </label>
          <button
            class="save-time-btn"
            onClick={() => {
              setTotalMinutes(draftMinutes);
              sessionStorage.setItem('megillah-reading-minutes', String(draftMinutes));
              setShowTimeEdit(false);
              if (session?.role === 'admin') {
                session.broadcastTime(draftMinutes);
              }
            }}
          >
            {t.save}
          </button>
        </div>
      )}
      {/* Tracking mode popover */}
      {showTrackingMenu && (
        <div class="tracking-popover" dir={lang === 'he' ? 'rtl' : 'ltr'}>
          <button
            class={`tracking-option${trackingMode === 'off' ? ' active' : ''}`}
            onClick={() => { setTrackingMode('off'); setActiveVerse(null); setActiveWord(null); setShowTrackingMenu(false); }}
          >
            <span class="material-icons">swipe_vertical</span>
            {t.trackScrolling}
          </button>
          <button
            class={`tracking-option${trackingMode === 'verse' ? ' active' : ''}`}
            onClick={() => { setTrackingMode('verse'); setActiveWord(null); setShowTrackingMenu(false); }}
          >
            <span class="material-icons">view_headline</span>
            {t.trackVerse}
          </button>
          <button
            class={`tracking-option${trackingMode === 'word' ? ' active' : ''}`}
            onClick={() => { setTrackingMode('word'); setActiveVerse(null); setShowTrackingMenu(false); }}
          >
            <span class="material-icons">touch_app</span>
            {t.trackWord}
          </button>
        </div>
      )}
      {/* Settings menu */}
      {menuOpen && (
        <div class="settings-menu" dir={lang === 'he' ? 'rtl' : 'ltr'}>
          <label class="option-toggle">
            <input
              type="checkbox"
              checked={showCantillation}
              onChange={() => setShowCantillation(!showCantillation)}
            />
            <span class="toggle-switch"></span>
            <span class="option-label">{t.showCantillation}</span>
          </label>
          {!(session?.role === 'follower') && (
          <label class="option-toggle">
            <input
              type="checkbox"
              checked={chabadMode}
              onChange={() => {
                const next = !chabadMode;
                setChabadMode(next);
                if (session?.role === 'admin') session.broadcastSetting('chabadMode', next);
              }}
            />
            <span class="toggle-switch"></span>
            <span class="option-label">{t.chabadCustom}</span>
          </label>
          )}
          <label class="option-toggle">
            <input
              type="checkbox"
              checked={showIllustrations}
              onChange={() => { const next = !showIllustrations; setShowIllustrations(next); if (session?.role === 'admin') session.broadcastSetting('showIllustrations', next); }}
            />
            <span class="toggle-switch"></span>
            <span class="option-label">{t.displayIllustrations}</span>
          </label>
          <div class="menu-row">
            <label>
              {t.language}
              <select
                class="lang-select"
                value={lang}
                onChange={(e) => {
                  const newLang = (e.target as HTMLSelectElement).value as Lang;
                  setLang(newLang);
                  if (newLang === 'he') {
                    setTranslationMode('hebrew');
                    try { localStorage.setItem('megillah-translation-mode', 'hebrew'); } catch {}
                  } else if (translationMode === 'hebrew') {
                    setTranslationMode('both');
                    try { localStorage.setItem('megillah-translation-mode', 'both'); } catch {}
                  }
                  try { localStorage.setItem(LANG_STORAGE_KEY, newLang); } catch {}
                  if (session?.role === 'admin') session.broadcastSetting('lang', newLang);
                }}
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="ru">Русский</option>
                <option value="fr">Français</option>
                <option value="pt">Português</option>
                <option value="it">Italiano</option>
                <option value="hu">Magyar</option>
                <option value="de">Deutsch</option>
                <option value="el">Ελληνικά</option>
              </select>
            </label>
          </div>
        </div>
      )}
      </div>

      <div class="hint-area">
        {customTapHint ? (
          <div class="hint-text custom-hint" dangerouslySetInnerHTML={{ __html: customTapHint }} />
        ) : (
          <p class="hint-text">
            <span class="material-icons hint-icon">touch_app</span>
            {t.tapHint}
          </p>
        )}
        {session?.role === 'admin' && (
          <button class="edit-hint-btn" onClick={() => setShowTapHintEdit(!showTapHintEdit)} title={t.editTapHint}>
            <span class="material-icons" style={{ fontSize: '16px' }}>edit</span>
          </button>
        )}
        {showTapHintEdit && session?.role === 'admin' && (
          <div class="tap-hint-editor">
            <div ref={tinymceRef} class="tinymce-container">
              <textarea id="tap-hint-tinymce" />
            </div>
            <div class="tap-hint-editor-actions">
              <button class="save-btn" onClick={() => {
                const editor = (window as any).tinymce?.get('tap-hint-tinymce');
                const html = editor?.getContent() || '';
                const val = html.trim() ? html : null;
                setCustomTapHint(val);
                session.broadcastSetting('customTapHint', val);
                setShowTapHintEdit(false);
                editor?.destroy();
              }}>{t.save}</button>
              <button class="reset-btn" onClick={() => {
                setCustomTapHint(null);
                session.broadcastSetting('customTapHint', null);
                setShowTapHintEdit(false);
                const editor = (window as any).tinymce?.get('tap-hint-tinymce');
                editor?.destroy();
              }}>{t.resetToDefault}</button>
            </div>
          </div>
        )}
      </div>

      <div class={`scroll-text${session?.role === 'admin' ? ' admin-session' : ''}${trackingMode !== 'off' ? ' tracking-on' : ''}`} dir="rtl" ref={scrollTextRef}>
        <div class="blessings-block" data-verse="blessings-before" style={{ fontSize: `${fontSize}rem` }}>
          <h2 class="chapter-heading">{lang === 'he' ? 'ברכות לפני קריאת המגילה' : 'Blessings Before the Reading'}</h2>
          {lang === 'en' && translationMode === 'translation' ? (
            <>
              <div class="blessing-unit">
                <div class="blessing-translation">
                  <p>Blessed are You, G‑d our L-rd, King of the universe, Who has sanctified us with His commandments and commanded us concerning the reading of the Megillah.</p>
                </div>
                <div class="blessing-transliteration">
                  <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm ah-shehr kahd-sah-noo bi-meetz-voh-taiv vi-tzee-vah-noo. ahl meek-rah mi-glah.</p>
                </div>
                <p class="blessing-response">Respond: Amein</p>
              </div>
              <div class="blessing-unit">
                <div class="blessing-translation">
                  <p>Blessed are You, G‑d our L-rd, King of the universe, Who performed miracles for our ancestors in those days, at this time.</p>
                </div>
                <div class="blessing-transliteration">
                  <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm sheh-ah-sah-h ni-seem lah-ah-voh-tay-noo bah-yah-meem hah-haym beez-mahn hah-zeh.</p>
                </div>
                <p class="blessing-response">Respond: Amein</p>
              </div>
              <div class="blessing-unit">
                <div class="blessing-translation">
                  <p>Blessed are You, G‑d our L-rd, King of the universe, Who has granted us life, sustained us, and enabled us to reach this occasion.</p>
                </div>
                <div class="blessing-transliteration">
                  <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm sheh-heh-kheh-ah-noo vi-kee-mah-noo vi-hee-gee-ah-noo leez-mahn hah-zeh.</p>
                </div>
                <p class="blessing-response">Respond: Amein</p>
              </div>
            </>
          ) : lang === 'en' && translationMode === 'both' ? (
            <div class="blessing-side-by-side">
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>Blessed are You, G‑d our L-rd, King of the universe, Who has sanctified us with His commandments and commanded us concerning the reading of the Megillah.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text">
                    <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל מִקְרָא מְגִלָּה.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm ah-shehr kahd-sah-noo bi-meetz-voh-taiv vi-tzee-vah-noo. ahl meek-rah mi-glah.</p>
              </div>
              <p class="blessing-response-full">Respond: Amein</p>
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>Blessed are You, G‑d our L-rd, King of the universe, Who performed miracles for our ancestors in those days, at this time.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text">
                    <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה נִסִּים לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm sheh-ah-sah-h ni-seem lah-ah-voh-tay-noo bah-yah-meem hah-haym beez-mahn hah-zeh.</p>
              </div>
              <p class="blessing-response-full">Respond: Amein</p>
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>Blessed are You, G‑d our L-rd, King of the universe, Who has granted us life, sustained us, and enabled us to reach this occasion.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text">
                    <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm sheh-heh-kheh-ah-noo vi-kee-mah-noo vi-hee-gee-ah-noo leez-mahn hah-zeh.</p>
              </div>
              <p class="blessing-response-full">Respond: Amein</p>
            </div>
          ) : (
            <div class="blessing-text">
              <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל מִקְרָא מְגִלָּה.</p>
              <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה נִסִּים לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה.</p>
              <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.</p>
            </div>
          )}
        </div>

        {megillahText.map((ch) => (
          <div key={ch.chapter} class="chapter-block">
            <h2 class="chapter-heading">{t.chapter} {lang === 'he' ? toHebrew(ch.chapter) : ch.chapter}</h2>
            <div class={`verses-container${translationMode !== 'hebrew' ? ' with-translation' : ''}${translationMode === 'translation' ? ' translation-only' : ''}${translationMode === 'both' && lang !== 'he' ? ' side-by-side' : ''}`} dir={translationMode === 'translation' && lang !== 'he' ? 'ltr' : undefined} style={{ fontSize: `${fontSize}rem` }}>
              {ch.verses.flatMap((v) => {
                const verseKey = `${ch.chapter}:${v.verse}`;

                // Skip 9:7-9:9, they're rendered inside the bnei haman block at 9:6
                if (BNEI_HAMAN_VERSES.has(verseKey)) return [];

                // Verse 9:6: split at "חמש מאות איש", render first part normally, then the bnei haman block
                if (verseKey === BNEI_HAMAN_SPLIT_VERSE) {
                  const raw = !showCantillation ? stripCantillation(v.text) : v.text;
                  const splitParts = raw.split(BNEI_HAMAN_SPLIT_RE);
                  const beforeText = splitParts[0] || '';
                  const splitText = splitParts[1] || '';

                  // Collect all sons' verses from 9:7-9:9
                  const sonsVerses = ch.verses.filter(sv => BNEI_HAMAN_VERSES.has(`${ch.chapter}:${sv.verse}`));

                  // Split 9:6 translation: before = "...destroyed/killed", loud = "five hundred men."
                  const trans96 = activeTranslations?.['9:6'] || '';
                  // Match the "500 men" portion across languages
                  const trans96SplitPatterns: Record<string, RegExp> = {
                    en: /^(.*?destroyed\s*)(five hundred men\..*)$/i,
                    es: /^(.*?mataron a\s*)(quinientos hombres\..*)$/i,
                    fr: /^(.*?exterminèrent\s*)(cinq cents hommes.*)$/i,
                    it: /^(.*?distrussero\s*)(cinquecent.*)$/i,
                    pt: /^(.*?destruíram\s*)(quinhentos homens\..*)$/i,
                    ru: /^(.*?истребили\s*)(пятьсот человек\..*)$/i,
                    hu: /^(.*?elpusztítottak\s*)(ötszáz embert.*)$/i,
                    de: /^(.*?vernichteten\s*)(fünfhundert Mann\..*)$/i,
                    el: /^(.*?σκότωσαν\s*)(πεντακόσιους άνδρες\..*)$/i,
                    he: /^(.*?וְאַבֵּד\s*)(חֲמֵשׁ מֵאוֹת אִישׁ.*)$/,
                  };
                  const trans96Re = trans96SplitPatterns[lang];
                  const trans96Match = trans96Re ? trans96.match(trans96Re) : null;
                  const trans96Before = trans96Match ? trans96Match[1] : trans96;
                  const trans96Loud = trans96Match ? trans96Match[2] : '';

                  // Compute v10 first word early so we can integrate it into the blocks
                  const v10 = ch.verses.find(sv => sv.verse === 10);
                  const v10text = v10 ? (!showCantillation ? stripCantillation(v10.text) : v10.text) : '';
                  const v10firstSpace = v10text.indexOf(' ');
                  const v10firstWord = v10firstSpace > 0 ? v10text.slice(0, v10firstSpace) : v10text;
                  const v10trans = activeTranslations?.['9:10'] || '';
                  // Match "the ten sons of" across languages
                  const v10SplitPatterns: Record<string, RegExp> = {
                    en: /^(.*?the ten sons of\s*)/i,
                    es: /^(.*?los diez hijos de\s*)/i,
                    fr: /^(.*?les dix fils d['']\s*)/i,
                    it: /^(.*?[Dd]ieci figli d['']\s*)/i,
                    pt: /^(.*?[Oo]s dez filhos de\s*)/i,
                    ru: /^(.*?[Дд]есять сыновей\s*)/i,
                    hu: /^(.*?tíz fiát\s*)/i,
                    de: /^(.*?[Dd]ie zehn Söhne\s*)/i,
                    el: /^(.*?δέκα γιους του Αμάν\s*)/i,
                    he: /^(.*?עֲשֶׂרֶת בְּנֵי הָמָן\s*)/,
                  };
                  const v10Re = v10SplitPatterns[lang];
                  const v10transMatch = v10Re ? v10trans.match(v10Re) : null;
                  const v10transBefore = v10transMatch ? v10transMatch[1] : '';

                  const bneiTranslations = activeTranslations
                    ? [trans96Loud, ...['9:7', '9:8', '9:9'].map(k => activeTranslations[k]), v10transBefore]
                        .filter(Boolean)
                        .join(' ')
                    : null;

                  const sideBySide96 = translationMode === 'both' && lang !== 'he';

                  return [
                    sideBySide96 ? (
                      <div key="9-6-before" class="verse verse-row" data-verse="9:6">
                        <div class="verse-col verse-col-translation" dir="ltr">
                          <sup class="verse-num">{v.verse}</sup>
                          {trans96Before && <span class="verse-translation" dir="ltr">{trans96Before}</span>}
                        </div>
                        <div class="verse-col verse-col-hebrew" dir="rtl">
                          <sup class="verse-num">{toHebrew(v.verse)}</sup>
                          {beforeText}
                        </div>
                      </div>
                    ) : (
                      <span key="9-6-before" class="verse" data-verse="9:6">
                        <sup class="verse-num">{lang === 'he' ? toHebrew(v.verse) : v.verse}</sup>
                        {translationMode !== 'translation' && beforeText}
                        {trans96Before && translationMode !== 'hebrew' && <span class="verse-translation" dir={lang === 'he' ? 'rtl' : 'ltr'}>{trans96Before}</span>}
                      </span>
                    ),
                    <span key="bnei-haman-block" class="verse loud-verse bnei-haman" data-verse="9:7">
                      <span class="loud-label" dir={lang === 'he' ? 'rtl' : 'ltr'}>{t.bneiHamanLabel}</span>
                      {lang !== 'he' && <span class="transliteration-box" dir="ltr">{({
                        en: "Chamesh me'ot ish. V'et Parshandatha, v'et Dalfon, v'et Aspatha, v'et Poratha, v'et Adalya, v'et Aridatha, v'et Parmashta, v'et Arisai, v'et Aridai, v'et Vayzatha. Aseret...",
                        es: "Jamesh meot ish. Veet Parshandatá, veet Dalfón, veet Aspatá, veet Poratá, veet Adalyá, veet Aridatá, veet Parmashtá, veet Arisái, veet Aridái, veet Vayzatá. Aséret...",
                        fr: "Hamesh méot ish. Veète Parshandatha, veète Dalfone, veète Aspatha, veète Poratha, veète Adalya, veète Aridatha, veète Parmashta, veète Arisaï, veète Aridaï, veète Vayzatha. Assérète...",
                        ru: "Хамеш меот иш. Веэт Паршандата, веэт Дальфон, веэт Аспата, веэт Пората, веэт Адалья, веэт Аридата, веэт Пармашта, веэт Арисай, веэт Аридай, веэт Вайзата. Асерет...",
                        pt: "Chamesh meot ish. Veet Parshandatá, veet Dalfón, veet Aspatá, veet Poratá, veet Adalyá, veet Aridatá, veet Parmashtá, veet Arisái, veet Aridái, veet Vayzatá. Asséret...",
                        it: "Chamesh meòt ish. Veèt Parshandathà, veèt Dalfòn, veèt Aspathà, veèt Porathà, veèt Adalyà, veèt Aridathà, veèt Parmashtà, veèt Arisài, veèt Aridài, veèt Vayzathà. Assèret...",
                        hu: "Hámes méot is. Veét Pársándátá, veét Dálfon, veét Ászpátá, veét Porátá, veét Ádáljá, veét Áridátá, veét Pármástá, veét Áriszáj, veét Áridáj, veét Vájzátá. Ászeret...",
                        de: "Chamesch meot isch. Weet Parschandatha, weet Dalfon, weet Aspatha, weet Poratha, weet Adalja, weet Aridatha, weet Parmaschta, weet Arisai, weet Aridai, weet Waisatha. Asseret...",
                        el: "Αμέσς μεότ ισς. Βεέτ Παρσσαντάτα, βεέτ Νταλφόν, βεέτ Ασπατά, βεέτ Ποράτα, βεέτ Ανταλγιά, βεέτ Αριντάτα, βεέτ Παρμασστά, βεέτ Αρισάι, βεέτ Αριντάι, βεέτ Βαϊζατά. Ασέρετ...",
                      } as Record<string, string>)[lang] || "Chamesh me'ot ish. V'et Parshandatha, v'et Dalfon, v'et Aspatha, v'et Poratha, v'et Adalya, v'et Aridatha, v'et Parmashta, v'et Arisai, v'et Aridai, v'et Vayzatha. Aseret..."}</span>}
                      {translationMode !== 'translation' && <>
                        <span class="haman-son">{splitText}</span>
                        {sonsVerses.map(sv => {
                          const svText = !showCantillation ? stripCantillation(sv.text) : sv.text;
                          const names = svText.split(/\s{2,}/).map(n => n.trim()).filter(Boolean);
                          return <span key={`sv-${sv.verse}`} class="haman-verse-group">
                            <sup class="verse-num">{lang === 'he' ? toHebrew(sv.verse) : sv.verse}</sup>
                            {names.map((name, i) => (
                              <span key={`son-${sv.verse}-${i}`} class="haman-son">{name}</span>
                            ))}
                          </span>;
                        })}
                        {v10 && <span class="haman-verse-group">
                          <sup class="verse-num">{lang === 'he' ? toHebrew(10) : 10}</sup>
                          <span class="haman-son">{v10firstWord}</span>
                        </span>}
                      </>}
                      {bneiTranslations && <span class="verse-translation" dir={lang === 'he' ? 'rtl' : 'ltr'}>{bneiTranslations}</span>}
                    </span>,
                  ].filter(Boolean);
                }

                // Verse 9:10: skip first word (rendered in bnei haman block above)
                if (verseKey === '9:10') {
                  const raw = !showCantillation ? stripCantillation(v.text) : v.text;
                  const firstSpace = raw.indexOf(' ');
                  const restText = firstSpace > 0 ? raw.slice(firstSpace + 1) : '';
                  const v10trans = activeTranslations?.['9:10'] || '';
                  const v10RestPatterns: Record<string, RegExp> = {
                    en: /^(.*?the ten sons of\s*)([\s\S]*)$/i,
                    es: /^(.*?los diez hijos de\s*)([\s\S]*)$/i,
                    fr: /^(.*?les dix fils d['']\s*)([\s\S]*)$/i,
                    it: /^(.*?[Dd]ieci figli d['']\s*)([\s\S]*)$/i,
                    pt: /^(.*?[Oo]s dez filhos de\s*)([\s\S]*)$/i,
                    ru: /^(.*?[Дд]есять сыновей\s*)([\s\S]*)$/i,
                    hu: /^(.*?tíz fiát\s*)([\s\S]*)$/i,
                    de: /^(.*?[Dd]ie zehn Söhne\s*)([\s\S]*)$/i,
                    el: /^(.*?δέκα γιους του Αμάν\s*)([\s\S]*)$/i,
                    he: /^(.*?עֲשֶׂרֶת בְּנֵי הָμָן\s*)([\s\S]*)$/,
                  };
                  const v10RestRe = v10RestPatterns[lang];
                  const transMatch = v10RestRe ? v10trans.match(v10RestRe) : null;
                  const transRest = transMatch ? transMatch[2] : v10trans;
                  const customTranslations = transRest ? { '9:10': transRest } as TranslationMap : activeTranslations;
                  const verseResult = [renderVerse(restText, ch.chapter, v.verse, playGragger, chabadMode, false, translationMode, t, lang, customTranslations, activeWord, activeVerse, needsWordSpans)];
                  return verseResult;
                }

                const verseResult = [renderVerse(v.text, ch.chapter, v.verse, playGragger, chabadMode, !showCantillation, translationMode, t, lang, activeTranslations, activeWord, activeVerse, needsWordSpans)];
                const illustration = showIllustrations && ILLUSTRATIONS.find(ill => ill.after === verseKey);
                if (illustration) {
                  verseResult.push(
                    <div class={`illustration${lang === 'he' ? ' illustration-he' : ''}`} key={`ill-${verseKey}`}>
                      <img src={illustration.src} alt={illustration[lang === 'he' ? 'he' : 'en']} loading="lazy" />
                    </div>
                  );
                }
                return verseResult;
              })}
            </div>
          </div>
        ))}

        <div class="blessings-block" data-verse="blessings-after" style={{ fontSize: `${fontSize}rem` }}>
          <h2 class="chapter-heading">{lang === 'he' ? 'ברכה לאחר קריאת המגילה' : 'Blessing After the Reading'}</h2>
          {lang === 'en' && translationMode === 'translation' ? (
            <>
              <div class="blessing-translation">
                <p>Blessed are You, G‑d our L-rd, King of the universe, Who champions our cause, judges our case, avenges our wrongs, exacts retribution for us from our adversaries, and repays all the enemies of our soul. Blessed are You, G‑d, Who exacts retribution for His people Israel from all their oppressors, the G‑d Who delivers.</p>
              </div>
              <div class="blessing-transliteration">
                <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm hah-rahv eht ree-vay-noo vi-hah-dahn eht dee-nay-noo vi-hah-noh-kaym eht neek-mah-tay-noo vi-hah-neef-rah lah-noo mee-tzah-ray-noo vi-hahm-shah-laym gi-mool li-khohl ohvay nahf-shay-noo. bah-rookh ah-tah ah-doh-noi hah-neef-rah lah-moh yee-sׂrah-ayl mee-kahl tzah-ray-hehm hah-ayl hah-moh-shee-ah.</p>
              </div>
              <p class="blessing-response">Respond: Amein</p>
            </>
          ) : lang === 'en' && translationMode === 'both' ? (
            <div class="blessing-side-by-side">
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>Blessed are You, G‑d our L-rd, King of the universe, Who champions our cause, judges our case, avenges our wrongs, exacts retribution for us from our adversaries, and repays all the enemies of our soul. Blessed are You, G‑d, Who exacts retribution for His people Israel from all their oppressors, the G‑d Who delivers.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text">
                    <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָרָב אֶת רִיבֵנוּ, וְהַדָּן אֶת דִּינֵנוּ, וְהַנּוֹקֵם אֶת נִקְמָתֵנוּ, וְהַנִּפְרָע לָנוּ מִצָּרֵינוּ, וְהַמְשַׁלֵּם גְּמוּל לְכָל אוֹיְבֵי נַפְשֵׁנוּ, בָּרוּךְ אַתָּה אֲ-דוֹנָי, הַנִּפְרָע לְעַמּוֹ יִשְׂרָאֵל מִכָּל צָרֵיהֶם, הָאֵ-ל הַמּוֹשִׁיעַ.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>Bah-rookh ah-tah ah-doh-noi eh-loh-hay-noo meh-lekh hah-oh-lahm hah-rahv eht ree-vay-noo vi-hah-dahn eht dee-nay-noo vi-hah-noh-kaym eht neek-mah-tay-noo vi-hah-neef-rah lah-noo mee-tzah-ray-noo vi-hahm-shah-laym gi-mool li-khohl ohvay nahf-shay-noo. bah-rookh ah-tah ah-doh-noi hah-neef-rah lah-moh yee-sׂrah-ayl mee-kahl tzah-ray-hehm hah-ayl hah-moh-shee-ah.</p>
              </div>
              <p class="blessing-response-full">Respond: Amein</p>
            </div>
          ) : (
            <div class="blessing-text">
              <p>בָּרוּךְ אַתָּה אֲ-דוֹנָי אֱ-לֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָרָב אֶת רִיבֵנוּ, וְהַדָּן אֶת דִּינֵנוּ, וְהַנּוֹקֵם אֶת נִקְמָתֵנוּ, וְהַנִּפְרָע לָנוּ מִצָּרֵינוּ, וְהַמְשַׁלֵּם גְּמוּל לְכָל אוֹיְבֵי נַפְשֵׁנוּ, בָּרוּךְ אַתָּה אֲ-דוֹנָי, הַנִּפְרָע לְעַמּוֹ יִשְׂרָאֵל מִכָּל צָרֵיהֶם, הָאֵ-ל הַמּוֹשִׁיעַ.</p>
            </div>
          )}
        </div>

        <div class="blessings-block loud-verse" data-verse="shoshanat" style={{ fontSize: `${fontSize}rem` }}>
          <h2 class="chapter-heading">{lang === 'he' ? 'שׁוֹשַׁנַּת יַעֲקֹב' : 'Shoshanat Yaakov'}</h2>
          {lang === 'en' && translationMode !== 'hebrew' && (
            <span class="loud-label">Everyone says this together</span>
          )}
          {lang === 'en' && translationMode === 'translation' ? (
            <>
              <div class="blessing-translation">
                <p>The rose of Jacob rejoiced and was glad when they together beheld the sky-blue garments of Mordechai.</p>
                <p>You were their salvation forever, and their hope throughout every generation.</p>
                <p>To proclaim that all who hope in You shall never be put to shame, nor shall all who take refuge in You ever be disgraced.</p>
                <p>Cursed is Haman who sought to destroy me; blessed is Mordechai the Jew.</p>
                <p>Cursed is Zeresh, the wife of my terror; blessed is Esther who pleaded for me.</p>
                <p>Cursed are all the wicked; blessed are all the righteous—and also Charvonah is remembered for good.</p>
              </div>
              <div class="blessing-transliteration">
                <p>Shoh-shah-naht yah-ah-kohv tzah-hah-lah vi-sׂah-may-khah. bee-roh-tahm yah-khahd ti-khay-leht mahr-dkhai.</p>
                <p>ti-shoo-ah-tahm hah-yee-tah lah-neh-tzakh vi-teek-vah-tahm bi-khohl dohr vah-dohr.</p>
                <p>li-hoh-dee-ah sheh-kahl koh-veh-khah loh yay-voh-shoo vi-loh yee-kahl-moo lah-neh-tzakh kohl hah-khoh-seem bakh.</p>
                <p>ah-roor hah-mahn ah-shehr bee-kaysh lahb-dee bah-rookh mahr-dkhai hah-yhoo-dee.</p>
                <p>ah-roo-rah zeh-resh ay-sheht mahf-khee-dee bi-roo-khah ehs-tayr bah-ah-dee.</p>
                <p>ah-roo-reem kohl hahr-shah-eem bi-roo-kheem kohl hah-tzah-dee-keem vi-gahm khahr-voh-nah zah-khoor lah-tohv.</p>
              </div>
            </>
          ) : lang === 'en' && translationMode === 'both' ? (
            <div class="blessing-side-by-side">
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>The rose of Jacob rejoiced and was glad when they together beheld the sky-blue garments of Mordechai.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text shoshanat-yaakov">
                    <p>שׁוֹשַׁנַּת יַעֲקֹב צָהֲלָה וְשָׂמֵחָה, בִּרְאוֹתָם יַחַד תְּכֵלֶת מָרְדְּכָי,</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>Shoh-shah-naht yah-ah-kohv tzah-hah-lah vi-sׂah-may-khah. bee-roh-tahm yah-khahd ti-khay-leht mahr-dkhai.</p>
              </div>
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>You were their salvation forever, and their hope throughout every generation.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text shoshanat-yaakov">
                    <p>תְּשׁוּעָתָם הָיִיתָ לָנֶצַח, וְתִקְוָתָם בְּכָל דּוֹר וָדוֹר.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>ti-shoo-ah-tahm hah-yee-tah lah-neh-tzakh vi-teek-vah-tahm bi-khohl dohr vah-dohr.</p>
              </div>
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>To proclaim that all who hope in You shall never be put to shame, nor shall all who take refuge in You ever be disgraced.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text shoshanat-yaakov">
                    <p>לְהוֹדִיעַ שֶׁכָּל קֹוֶיךָ לֹא יֵבֹשׁוּ וְלֹא יִכָּלְמוּ לָנֶצַח כָּל הַחוֹסִים בָּךְ.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>li-hoh-dee-ah sheh-kahl koh-veh-khah loh yay-voh-shoo vi-loh yee-kahl-moo lah-neh-tzakh kohl hah-khoh-seem bakh.</p>
              </div>
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>Cursed is Haman who sought to destroy me; blessed is Mordechai the Jew.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text shoshanat-yaakov">
                    <p>אָרוּר הָמָן אֲשֶׁר בִּקֵשׁ לְאַבְּדִי, בָּרוּךְ מָרְדְּכַי הַיְּהוּדִי.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>ah-roor hah-mahn ah-shehr bee-kaysh lahb-dee bah-rookh mahr-dkhai hah-yhoo-dee.</p>
              </div>
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>Cursed is Zeresh, the wife of my terror; blessed is Esther who pleaded for me.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text shoshanat-yaakov">
                    <p>אֲרוּרָה זֶרֶשׁ אֵשֶׁת מַפְחִידִי, בְּרוּכָה אֶסְתֵּר בַּעֲדִי.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>ah-roo-rah zeh-resh ay-sheht mahf-khee-dee bi-roo-khah ehs-tayr bah-ah-dee.</p>
              </div>
              <div class="blessing-row">
                <div class="blessing-col blessing-col-translation" dir="ltr">
                  <div class="blessing-translation">
                    <p>Cursed are all the wicked; blessed are all the righteous—and also Charvonah is remembered for good.</p>
                  </div>
                </div>
                <div class="blessing-col blessing-col-hebrew" dir="rtl">
                  <div class="blessing-text shoshanat-yaakov">
                    <p>אֲרוּרִים כָּל הָרְשָׁעִים, בְּרוּכִים כָּל הַצַּדִּיקִים,</p>
                    <p>וְגַם חַרְבוֹנָה זָכוּר לַטּוֹב.</p>
                  </div>
                </div>
              </div>
              <div class="blessing-transliteration blessing-transliteration-row">
                <p>ah-roo-reem kohl hahr-shah-eem bi-roo-kheem kohl hah-tzah-dee-keem vi-gahm khahr-voh-nah zah-khoor lah-tohv.</p>
              </div>
            </div>
          ) : (
            <div class="blessing-text shoshanat-yaakov">
              <p>שׁוֹשַׁנַּת יַעֲקֹב צָהֲלָה וְשָׂמֵחָה, בִּרְאוֹתָם יַחַד תְּכֵלֶת מָרְדְּכָי,</p>
              <p>תְּשׁוּעָתָם הָיִיתָ לָנֶצַח, וְתִקְוָתָם בְּכָל דּוֹר וָדוֹר.</p>
              <p>לְהוֹדִיעַ שֶׁכָּל קֹוֶיךָ לֹא יֵבֹשׁוּ וְלֹא יִכָּלְמוּ לָנֶצַח כָּל הַחוֹסִים בָּךְ.</p>
              <p>אָרוּר הָמָן אֲשֶׁר בִּקֵשׁ לְאַבְּדִי, בָּרוּךְ מָרְדְּכַי הַיְּהוּדִי.</p>
              <p>אֲרוּרָה זֶרֶשׁ אֵשֶׁת מַפְחִידִי, בְּרוּכָה אֶסְתֵּר בַּעֲדִי.</p>
              <p>אֲרוּרִים כָּל הָרְשָׁעִים, בְּרוּכִים כָּל הַצַּדִּיקִים,</p>
              <p>וְגַם חַרְבוֹנָה זָכוּר לַטּוֹב.</p>
            </div>
          )}
        </div>
      </div>

      <div class="whats-next-area">
        {showBottomHintEdit ? null : customBottomHint ? (
          <div class="whats-next custom-bottom-content" dir={lang === 'he' ? 'rtl' : 'ltr'} dangerouslySetInnerHTML={{ __html: customBottomHint }} />
        ) : lang !== 'he' && lang !== 'en' ? null : lang === 'he' ? (
          <div class="whats-next" dir="rtl">
            <h2 class="whats-next-title">מה הלאה?</h2>
            <p class="whats-next-intro">חוץ מקריאת המגילה, ישנן עוד שלוש מצוות שיש לקיים אותן ביום פורים:</p>
            <div class="whats-next-item">
              <h3>🎁 מתנות לאביונים – איך עושים?</h3>
              <p>במהלך יום הפורים כל איש ואישה – ורצוי שגם הילדים ישתתפו – נותנים סכום כסף או מתנה לשני אנשים נזקקים (איש או אישה). המינימום הוא לתת לשני עניים, ולפחות שווי של פרוטה לכל אחד. כל המרבה – הרי זה משובח.</p>
              <p>יש להרבות במתנות לאביונים יותר מיתר מצוות הפורים, כי השמחה המפוארת והגדולה ביותר היא לשמח את לב העניים, היתומים, האלמנות והגרים.</p>
            </div>
            <div class="whats-next-item">
              <h3>🍱 משלוח מנות – איך עושים?</h3>
              <p>ביום הפורים שולחים לחברים ולידידים – ואפשר גם לכאלה שיהיו ידידים בעתיד 😉 – שני מוצרי מזון לאדם אחד לפחות.</p>
              <p>ניתן לשלוח כל סוג של מזון, ובלבד שיהיה דבר אכיל: פירות או ירקות, משקאות או מאפים, תבשילים או מוצרים קנויים.</p>
              <p>כל גבר צריך לשלוח לגבר אחד לפחות, וכל אישה לאישה אחת לפחות. אפשר, ואף מומלץ, לשלוח ליותר אנשים. כל המרבה – הרי זה משובח.</p>
            </div>
            <div class="whats-next-item">
              <h3>🎉 משתה ושמחה – סעודת פורים</h3>
              <p>ביום הפורים מצווה לקיים סעודה ומשתה מתוך שמחה מיוחדת וגדולה. פורים הוא מהימים השמחים ביותר בלוח השנה היהודי, ואם שמחים בו כראוי – זוכים להמשיך את השמחה גם לימים הבאים.</p>
              <p>חז"ל קבעו: "חייב אדם לבסומי בפוריא עד דלא ידע בין ארור המן לברוך מרדכי".</p>
              <p>סעודת הפורים מתקיימת ביום, ללא עריכת קידוש. מכבדים את היום בפריסת מפה נאה על השולחן, במאכלים משובחים, ויש הנוהגים לבצוע חלות יפות ולהדליק תאורה או נרות חגיגיים (ללא ברכה).</p>
            </div>
            <p class="whats-next-credit">(באדיבות אתר חב"ד.אורג)</p>
            <p class="whats-next-happy">פורים שמח!</p>
          </div>
        ) : (
          <div class="whats-next" dir="ltr">
            <h2 class="whats-next-title">What's Next?</h2>
            <p class="whats-next-intro">Now that you finished hearing the Megillah, here are the other 3 Purim Mitzvot to remember:</p>
            <div class="whats-next-item">
              <h3>1. Give to the Needy (Matanot LaEvyonim)</h3>
              <p>On Purim day, give money or food to at least two needy people. This mitzvah highlights Jewish unity and caring for others. If you don't know anyone personally, you can give through your synagogue or place money in a charity box. Even children should participate.</p>
            </div>
            <div class="whats-next-item">
              <h3>2. Send Food Gifts (Mishloach Manot)</h3>
              <p>On Purim day, send at least two ready-to-eat food or drink items to at least one friend. This strengthens friendship and community bonds. It's ideal to send the package through a messenger, and children are encouraged to take part.</p>
            </div>
            <div class="whats-next-item">
              <h3>3. Celebrate with a Festive Meal</h3>
              <p>During Purim day, have a joyful meal with family and possibly guests. Traditionally, it includes bread, meat, wine, songs, Torah thoughts, and a spirit of celebration, continuing into the evening.</p>
            </div>
            <p class="whats-next-happy">Happy Purim!</p>
          </div>
        )}
        {session?.role === 'admin' && (
          <button class="edit-hint-btn edit-bottom-hint-btn" onClick={() => setShowBottomHintEdit(!showBottomHintEdit)} title={t.editTapHint}>
            <span class="material-icons" style={{ fontSize: '16px' }}>edit</span>
          </button>
        )}
        {showBottomHintEdit && session?.role === 'admin' && (
          <div class="tap-hint-editor">
            <div class="tinymce-container">
              <textarea id="bottom-hint-tinymce" />
            </div>
            <div class="tap-hint-editor-actions">
              <button class="save-btn" onClick={() => {
                const editor = (window as any).tinymce?.get('bottom-hint-tinymce');
                const html = editor?.getContent() || '';
                const val = html.trim() ? html : null;
                setCustomBottomHint(val);
                session.broadcastSetting('customBottomHint', val);
                setShowBottomHintEdit(false);
                editor?.destroy();
              }}>{t.save}</button>
              <button class="reset-btn" onClick={() => {
                setCustomBottomHint(null);
                session.broadcastSetting('customBottomHint', null);
                setShowBottomHintEdit(false);
                const editor = (window as any).tinymce?.get('bottom-hint-tinymce');
                editor?.destroy();
              }}>{t.resetToDefault}</button>
            </div>
          </div>
        )}
      </div>

      {(soundActive || muted) && (
        <button
          class={`sound-fab${soundActive && !muted ? ' playing' : ''}`}
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          <span class="material-icons">
            {muted ? 'volume_off' : 'volume_up'}
          </span>
        </button>
      )}

      {showQR && session && (() => {
        const shareUrl = `https://megillah.app/live/join?code=${session.code}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
        return (
          <div class="qr-overlay" onClick={() => setShowQR(false)}>
            <div class="qr-modal" dir="ltr" onClick={(e: Event) => e.stopPropagation()}>
              <button class="qr-close" onClick={() => setShowQR(false)}>
                <span class="material-icons">close</span>
              </button>
              <img class="qr-img" src={qrUrl} alt="QR Code" width={260} height={260} />
              <div class="qr-url-box">
                <span class="qr-url">{shareUrl}</span>
                <button class="qr-copy-btn" onClick={() => {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setQrCopied(true);
                    setTimeout(() => setQrCopied(false), 2000);
                  });
                }}>
                  <span class="material-icons">{qrCopied ? 'check' : 'content_copy'}</span>
                  {qrCopied ? t.copied : t.copyLink}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div class="sync-toast">{toast}</div>
      )}

      <style>{`
        .megillah-reader {
          max-width: 100vw;
        }

        .reader-header {
          background: var(--color-burgundy);
          color: var(--color-white);
          padding: 14px 0;
          text-align: center;
          box-shadow: 0 2px 8px rgba(102, 10, 35, 0.3);
          margin: 0 -16px 0;
          position: relative;
          border-radius: 0 0 12px 12px;
        }

        .reader-header.has-session-bar {
          border-radius: 0;
        }

        .reader-header .logo-main {
          display: block;
          font-size: 1.3rem;
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .reader-header .logo-sub {
          display: block;
          font-size: 0.75rem;
          font-weight: 300;
          opacity: 0.85;
          margin-top: 2px;
        }

        .header-link {
          color: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .join-live-btn {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.65rem;
          font-weight: 400;
          color: var(--color-white);
          text-decoration: none;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          padding: 4px 8px;
          white-space: nowrap;
        }

        [dir="rtl"] .join-live-btn {
          left: auto;
          right: 16px;
        }

        .page-title-block {
          margin-bottom: 20px;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--color-burgundy);
          text-align: center;
          margin-bottom: 4px;
        }

        .page-subtitle {
          text-align: center;
          font-size: 0.9rem;
          color: var(--color-text-light);
        }

        .progress-bar-container {
          position: sticky;
          top: 0;
          height: 28px;
          background: var(--color-cream-dark);
          overflow: hidden;
          z-index: 51;
        }

        .progress-bar-fill {
          height: 100%;
          background: rgba(102, 10, 35, 0.35);
          transition: width 0.15s ease-out;
        }

        .progress-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-text);
          white-space: nowrap;
          text-shadow: 0 0 3px var(--color-white), 0 0 3px var(--color-white);
        }

        .toolbar-sticky {
          position: sticky;
          top: 28px;
          z-index: 50;
          margin-bottom: 14px;
        }

        .inline-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          background: var(--color-white);
          border-radius: 0 0 12px 12px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(102, 10, 35, 0.08);
          max-width: 100%;
          overflow: hidden;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 1;
          min-width: 0;
        }

        .toolbar-translation-toggle {
          display: flex;
          background: var(--color-cream-dark, #f0e8e0);
          border-radius: 6px;
          overflow: hidden;
        }

        .toolbar-trans-btn {
          border: none;
          background: none;
          cursor: pointer;
          padding: 4px 6px;
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--color-text-light);
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
        }

        .toolbar-trans-btn.active {
          background: var(--color-burgundy);
          color: var(--color-white);
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }

        .toolbar-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          color: var(--color-text-light);
          border-radius: 50%;
          transition: background 0.2s, color 0.2s;
        }

        .toolbar-icon-btn:hover {
          background: var(--color-cream-dark);
          color: var(--color-text);
        }

        .toolbar-icon-btn .material-icons {
          font-size: 22px;
        }

        .time-popover {
          background: var(--color-white);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 10px;
          box-shadow: 0 2px 12px rgba(102, 10, 35, 0.12);
          text-align: center;
          font-size: 0.85rem;
        }

        .time-input {
          width: 50px;
          margin: 0 8px;
          padding: 2px 6px;
          border: 1px solid var(--color-cream-dark);
          border-radius: 4px;
          font-size: 0.8rem;
          text-align: center;
        }

        .save-time-btn {
          padding: 3px 12px;
          background: var(--color-burgundy);
          color: var(--color-white);
          border: none;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .edit-subtitle-btn {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
          padding: 0;
          vertical-align: middle;
          color: inherit;
        }
        .edit-subtitle-btn:hover {
          opacity: 1;
        }
        .subtitle-popover {
          text-align: start;
        }
        .subtitle-popover .subtitle-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
          font-size: 0.85rem;
        }
        .subtitle-popover .subtitle-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 6px 8px;
          border: 1px solid var(--color-cream-dark);
          border-radius: 6px;
          font-size: 0.85rem;
          margin: 0;
        }
        .subtitle-popover .save-time-btn {
          width: 100%;
        }

        .settings-menu {
          background: var(--color-white);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 14px;
          box-shadow: 0 2px 12px rgba(102, 10, 35, 0.12);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .menu-row {
          font-size: 0.85rem;
        }

        .lang-select {
          margin-inline-start: 8px;
          padding: 2px 6px;
          border: 1px solid var(--color-cream-dark);
          border-radius: 4px;
          font-size: 0.8rem;
        }


        .option-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .option-toggle input {
          display: none;
        }

        .toggle-switch {
          position: relative;
          width: 40px;
          height: 22px;
          background: var(--color-cream-dark);
          border-radius: 11px;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .option-toggle input:checked + .toggle-switch {
          background: var(--color-burgundy);
        }

        .option-toggle input:checked + .toggle-switch::after {
          transform: translateX(18px);
        }

        .option-label {
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--color-text);
        }

        .verses-container.translation-only {
          text-align: start;
          font-family: Arial, 'Heebo', sans-serif;
          font-weight: 400;
          line-height: 1.8;
        }

        .verses-container:not(.with-translation) .verse {
          display: block;
          margin-bottom: 4px;
        }

        .translation-only .verse {
          display: block;
          margin-bottom: 8px;
        }

        .side-by-side .verse-row {
          display: flex;
          flex-wrap: wrap;
          direction: ltr;
          gap: 16px;
          margin-bottom: 12px;
          align-items: flex-start;
          font-size: 0.85em;
        }

        .side-by-side .verse-row > .loud-label {
          flex-basis: 100%;
        }

        .side-by-side .verse-col {
          flex: 1;
          min-width: 0;
        }

        .side-by-side .verse-col-translation {
          flex: 3;
          text-align: left;
          font-weight: 400;
          line-height: 1.6;
        }

        .side-by-side .verse-col-hebrew {
          flex: 2;
          text-align: right;
          line-height: 2;
        }

        .side-by-side .verse-translation {
          display: inline;
          margin: 0;
        }

        .translation-only .verse-translation {
          display: inline;
          margin: 0;
        }

        .size-icon {
          font-size: 20px;
          color: var(--color-burgundy);
        }

        .size-slider {
          -webkit-appearance: none;
          appearance: none;
          flex: 1;
          min-width: 30px;
          max-width: 80px;
          height: 6px;
          background: var(--color-cream-dark);
          border-radius: 3px;
          outline: none;
          direction: ltr;
        }

        .size-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          background: var(--color-burgundy);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(102, 10, 35, 0.3);
        }

        .size-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          background: var(--color-burgundy);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 4px rgba(102, 10, 35, 0.3);
        }

        .hint-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.9rem;
          color: var(--color-gold);
          font-weight: 400;
          margin-bottom: 20px;
          text-align: center;
        }

        .hint-icon {
          font-size: 20px;
        }

        .hint-area {
          position: relative;
          text-align: center;
          margin-bottom: 20px;
        }
        .hint-area .hint-text {
          margin-bottom: 0;
          padding: 0 28px;
        }
        .custom-hint {
          display: block;
          color: var(--color-gold);
          font-size: 0.9rem;
          font-weight: 400;
        }
        .custom-hint p { margin: 4px 0; }
        .custom-hint a { color: var(--color-gold); text-decoration: underline; }
        .custom-hint a[style] { color: #fff; text-decoration: none; }
        .whats-next-area {
          position: relative;
        }
        .custom-bottom-content h2 {
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--color-burgundy);
          margin: 0 0 8px;
        }
        .custom-bottom-content h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-burgundy);
          margin: 14px 0 4px;
        }
        .custom-bottom-content p {
          font-size: 0.85rem;
          color: var(--color-text);
          margin: 0 0 8px;
          line-height: 1.55;
        }
        .custom-bottom-content a { color: var(--color-burgundy); text-decoration: underline; }
        .custom-bottom-content a[style] { color: #fff; text-decoration: none; }
        .whats-next-credit {
          font-size: 0.75rem;
          color: var(--color-text);
          opacity: 0.5;
          text-align: left;
          margin: 12px 0 0;
        }
        .edit-bottom-hint-btn {
          top: 8px;
          right: 8px;
        }
        .edit-hint-btn {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.6;
          padding: 4px;
          position: absolute;
          top: 0;
          right: 0;
        }
        .edit-hint-btn:hover { opacity: 1; }
        .tap-hint-editor {
          position: relative;
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
          text-align: start;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .tap-hint-editor-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .tap-hint-editor-actions button {
          flex: 1;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 400;
        }
        .tap-hint-editor-actions .save-btn {
          background: var(--color-gold);
          color: #1a1a2e;
        }
        .tap-hint-editor-actions .reset-btn {
          background: #eee;
          color: #555;
        }
        .tap-hint-editor-actions .reset-btn:hover {
          background: #ddd;
        }

        .scroll-text {
          background: var(--color-white);
          border-radius: 16px;
          padding: 28px 24px;
          box-shadow: 0 2px 12px rgba(102, 10, 35, 0.1);
          position: relative;
          z-index: 1;
        }

        .chapter-block {
          margin-bottom: 36px;
        }

        .chapter-block:last-child {
          margin-bottom: 0;
        }

        .chapter-heading {
          font-size: 1.3rem;
          font-weight: 900;
          color: var(--color-burgundy);
          text-align: center;
          margin-bottom: 18px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--color-cream-dark);
        }

        .verses-container {
          font-family: Arial, 'Heebo', sans-serif;
          font-weight: 700;
          line-height: 2.4;
          text-align: justify;
        }

        .verses-container.with-translation {
          line-height: 1.8;
          font-weight: 400;
          font-size: 0.85em;
        }

        .verse-num {
          color: var(--color-gold);
          font-size: 0.55em;
          font-weight: 700;
          margin-inline-end: 2px;
          user-select: none;
        }

        .word-active {
          background: rgba(232, 190, 80, 0.35);
          border-radius: 3px;
          transition: background 0.3s ease;
        }

        .word[data-word] {
          transition: background 0.3s ease;
          border-radius: 3px;
        }

        .megillah-reader .scroll-text.admin-session .word[data-word] {
          cursor: default;
          -webkit-user-select: none;
          user-select: none;
        }

        @media (hover: hover) and (pointer: fine) {
          .megillah-reader .scroll-text.admin-session.tracking-on .verse {
            cursor: pointer;
          }
        }

        .haman-name {
          color: #666;
          padding: 2px 5px;
          border: 1.5px dotted #999;
          border-radius: 4px;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          user-select: none;
          display: inline;
        }

        .haman-name:hover {
          color: #444;
          border-color: #666;
        }

        .haman-name.shake {
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-3px) rotate(-2deg); }
          30% { transform: translateX(3px) rotate(2deg); }
          45% { transform: translateX(-2px) rotate(-1deg); }
          60% { transform: translateX(2px) rotate(1deg); }
          75% { transform: translateX(-1px); }
        }

        .haman-splat {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          animation: splat-fly 0.5s ease-out forwards;
        }

        @keyframes splat-fly {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          40% {
            opacity: 1;
            transform: translate(calc(-50% + var(--dx) * 0.6), calc(-50% + var(--dy) * 0.6)) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2);
          }
        }

        .blessings-block {
          margin-bottom: 24px;
          text-align: center;
        }

        .blessing-side-by-side {
          display: flex;
          flex-direction: column;
          gap: 8px;
          direction: ltr;
          text-align: initial;
        }

        .blessing-row {
          display: flex;
          flex-wrap: wrap;
          direction: ltr;
          gap: 16px;
          align-items: flex-start;
          font-size: 0.85em;
        }

        .blessing-row .blessing-col {
          flex: 1;
          min-width: 0;
        }

        .blessing-row .blessing-col-translation {
          flex: 3;
          text-align: left;
          font-weight: 400;
          line-height: 1.6;
        }

        .blessing-row .blessing-col-hebrew {
          flex: 2;
          text-align: right;
          line-height: 2;
          font-weight: 400;
        }

        .blessing-text {
          font-family: Arial, 'Heebo', sans-serif;
          font-weight: 700;
          line-height: 2.4;
        }

        .blessing-unit .blessing-text {
          font-weight: 400;
          font-size: 0.85em;
          line-height: 1.8;
        }

        .blessing-side-by-side .blessing-text {
          font-weight: inherit;
          line-height: inherit;
        }

        .blessing-text p {
          margin-bottom: 6px;
        }

        .blessing-unit {
          margin-bottom: 18px;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(102, 10, 35, 0.1);
        }

        .blessing-unit:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .blessing-translation {
          font-size: 0.95em;
          font-weight: 400;
          color: var(--color-text-light);
          line-height: 1.5;
          direction: ltr;
          text-align: left;
        }

        .blessing-translation p {
          margin-bottom: 6px;
        }

        .blessing-transliteration-row {
          margin-top: -4px;
          margin-bottom: 8px;
        }

        .blessing-transliteration {
          font-size: 0.7em;
          font-style: italic;
          line-height: 1.6;
          color: var(--color-text-light, #555);
          margin-top: 4px;
          direction: ltr;
          text-align: center;
        }

        .blessing-transliteration p {
          margin-bottom: 4px;
        }

        .blessing-response,
        .blessing-response-full {
          text-align: center;
          display: block;
          font-size: 0.65em;
          font-weight: 700;
          color: var(--color-gold);
          background: linear-gradient(135deg, rgba(232, 190, 80, 0.15), rgba(232, 190, 80, 0.25));
          border-radius: 6px;
          padding: 6px 10px;
          margin: 6px 0 12px;
        }

        .shoshanat-yaakov p {
          margin-bottom: 4px;
        }

        .confetti-piece {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          border-radius: 2px;
          animation: confetti-fall 2s ease-out forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) translateX(var(--dx)) rotate(var(--rot));
          }
        }

        .loud-verse {
          display: block;
          background: linear-gradient(135deg, rgba(232, 190, 80, 0.15), rgba(232, 190, 80, 0.25));
          border-radius: 6px;
          padding: 8px 10px 4px;
          border-right: 3px solid var(--color-gold);
          margin: 8px 0;
        }

        .loud-label {
          display: block;
          font-size: 0.65em;
          font-weight: 700;
          color: var(--color-gold);
          margin-bottom: 4px;
          line-height: 1;
        }

        .transliteration-box {
          display: block;
          background: rgba(232, 190, 80, 0.1);
          border: 1px solid rgba(232, 190, 80, 0.3);
          border-radius: 6px;
          padding: 8px 10px;
          margin-bottom: 6px;
          font-size: 0.7em;
          font-style: italic;
          font-weight: 400;
          line-height: 1.5;
          color: var(--color-text);
          text-align: left;
        }

        .side-by-side .transliteration-box {
          flex-basis: 100%;
        }

        .bnei-haman {
          display: block;
          text-align: center;
        }

        .haman-son {
          display: block;
          line-height: 2;
          white-space: nowrap;
        }

        .haman-verse-group {
          display: block;
        }

        .haman-verse-group .haman-son {
          display: inline;
          margin-inline-end: 6px;
          white-space: nowrap;
        }

        .verse-translation {
          display: block;
          font-size: 0.95em;
          font-weight: 400;
          color: var(--color-text-light);
          line-height: 1.5;
          margin: 6px 0 12px;
          text-align: start;
        }

        .person-name {
          color: var(--color-text);
        }

        .whats-next {
          background: var(--color-cream, #f9f5f0);
          border-radius: 12px;
          padding: 24px 20px;
          margin: 32px 0 16px;
          text-align: start;
          dir: ltr;
        }

        .whats-next-title {
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--color-burgundy);
          margin: 0 0 8px;
        }

        .whats-next-intro {
          font-size: 0.9rem;
          color: var(--color-text);
          margin: 0 0 16px;
          line-height: 1.5;
        }

        .whats-next-item {
          margin-bottom: 14px;
        }

        .whats-next-item:last-child {
          margin-bottom: 0;
        }

        .whats-next-item h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-burgundy);
          margin: 0 0 4px;
        }

        .whats-next-item p {
          font-size: 0.85rem;
          color: var(--color-text);
          margin: 0;
          line-height: 1.55;
        }

        .whats-next[dir="rtl"] .whats-next-intro { font-size: 1rem; }
        .whats-next[dir="rtl"] .whats-next-item h3 { font-size: 1.05rem; }
        .whats-next[dir="rtl"] .whats-next-item p { font-size: 0.95rem; }
        .custom-bottom-content[dir="rtl"] h3 { font-size: 1.05rem; }
        .custom-bottom-content[dir="rtl"] p { font-size: 0.95rem; }

        .whats-next-happy {
          font-size: 1.1rem;
          font-weight: 900;
          color: var(--color-burgundy);
          text-align: center;
          margin: 18px 0 0;
        }

        .sync-toast {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-burgundy);
          color: var(--color-white);
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.85rem;
          z-index: 200;
          box-shadow: 0 4px 16px rgba(102, 10, 35, 0.3);
          animation: toast-in 0.25s ease-out;
          text-align: center;
          max-width: 90vw;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .sound-fab {
          position: fixed;
          bottom: 24px;
          inset-inline-end: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-burgundy);
          color: var(--color-white);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 12px rgba(102, 10, 35, 0.35);
          z-index: 100;
          transition: background 0.2s, transform 0.2s;
        }

        .sound-fab:hover {
          transform: scale(1.1);
        }

        .sound-fab .material-icons {
          font-size: 24px;
        }

        .sound-fab.playing {
          animation: fab-pulse 0.6s ease-in-out infinite;
        }

        @keyframes fab-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 3px 12px rgba(102, 10, 35, 0.35); }
          50% { transform: scale(1.15); box-shadow: 0 4px 20px rgba(102, 10, 35, 0.5); }
        }

        .session-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: var(--color-burgundy);
          color: var(--color-white);
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 400;
          margin: 0 -16px;
          border-radius: 0 0 12px 12px;
        }

        .session-code {
          background: none;
          border: none;
          color: var(--color-white);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .qr-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .qr-modal {
          background: white;
          border-radius: 16px;
          padding: 28px 24px 20px;
          max-width: 340px;
          width: 100%;
          text-align: center;
          position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }

        .qr-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: var(--color-text-light);
          cursor: pointer;
          padding: 4px;
        }

        .qr-close:hover {
          color: var(--color-text);
        }

        .qr-img {
          display: block;
          margin: 0 auto 16px;
          border-radius: 8px;
        }

        .qr-url-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-cream, #f9f5f0);
          border: 2px solid var(--color-cream-dark, #e8ddd0);
          border-radius: 8px;
          padding: 8px 12px;
        }

        .qr-url {
          flex: 1;
          font-size: 0.8rem;
          color: var(--color-text);
          word-break: break-all;
          text-align: start;
        }

        .qr-copy-btn {
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

        .qr-copy-btn .material-icons {
          font-size: 16px;
        }

        .qr-copy-btn:hover {
          background: var(--color-burgundy-light);
        }

        .session-role {
          opacity: 0.8;
          font-size: 0.8rem;
        }

        .session-leave {
          background: rgba(255,255,255,0.15);
          color: var(--color-white);
          border: none;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.8rem;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.2s;
        }

        .session-leave:hover {
          background: rgba(255,255,255,0.25);
        }

        .following-banner {
          background: linear-gradient(135deg, rgba(232, 150, 46, 0.15), rgba(232, 150, 46, 0.25));
          color: var(--color-gold);
          text-align: center;
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0 -16px;
        }

        .illustration {
          float: right;
          margin: 8px 0 8px 20px;
          width: 45%;
        }

        .illustration.illustration-he {
          float: left;
          margin: 8px 20px 8px 0;
        }

        .side-by-side .illustration,
        .side-by-side .illustration.illustration-he {
          float: none;
          width: 60%;
          max-width: 400px;
          margin: 16px auto;
        }

        .illustration img {
          width: 100%;
          border-radius: 8px;
        }

        .verse-active {
          background: rgba(232, 190, 80, 0.18);
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .toolbar-icon-btn.tracking-active {
          color: var(--color-burgundy);
        }

        .toolbar-icon-btn.sync-pulse {
          animation: sync-glow 1.2s ease-out;
        }

        @keyframes sync-glow {
          0% { color: var(--color-burgundy); }
          50% { color: rgba(102, 10, 35, 0.7); }
          100% { color: var(--color-burgundy); }
        }

        .tracking-popover {
          background: var(--color-white);
          border-radius: 10px;
          padding: 8px;
          margin-bottom: 10px;
          box-shadow: 0 2px 12px rgba(102, 10, 35, 0.12);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tracking-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--color-text);
          font-size: 0.85rem;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-align: start;
        }

        .tracking-option:hover {
          background: var(--color-cream-dark);
        }

        .tracking-option.active {
          background: var(--color-burgundy);
          color: var(--color-white);
        }

        .tracking-option .material-icons {
          font-size: 20px;
        }

        .mobile-only { display: inline; }

        @media (min-width: 768px) {
          .mobile-only { display: none; }
          .scroll-text {
            padding: 36px 32px;
          }
        }
      `}</style>
    </div>
  );
}
