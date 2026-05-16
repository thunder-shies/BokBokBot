import type { AppLocale } from './locale';

export type TranslationKey =
  | 'languageToggle'
  | 'systemStatus'
  | 'visualInputFeed'
  | 'judgmentMetrics'
  | 'liveFeed'
  | 'userInput'
  | 'processing'
  | 'liveBadge'
  | 'publish'
  | 'inputPlaceholder'
  | 'inputListening'
  | 'stopRecording'
  | 'voiceInput'
  | 'noLabelsYet'
  | 'stopTts';

const zhHK = {
  languageToggle: 'EN',
  systemStatus: 'System_Status: Hostile',
  visualInputFeed: 'Visual_Input_Feed',
  judgmentMetrics: 'Judgment_Metrics',
  liveFeed: 'Live_Feed // BokBok_Bot',
  userInput: 'User_Input //',
  processing: 'BokBok 正在處理 //',
  liveBadge: '直播中',
  publish: '發佈',
  inputPlaceholder: '開始駁嘴...',
  inputListening: '聆聽中...',
  stopRecording: '停止錄音',
  voiceInput: '語音輸入',
  noLabelsYet: '尚未評判。開口啦，人類。',
  stopTts: '停止語音',
} as const satisfies Record<TranslationKey, string>;

const en = {
  languageToggle: '繁',
  systemStatus: 'System_Status: Hostile',
  visualInputFeed: 'Visual_Input_Feed',
  judgmentMetrics: 'Judgment_Metrics',
  liveFeed: 'Live_Feed // BokBok_Bot',
  userInput: 'User_Input //',
  processing: 'BokBok is judging //',
  liveBadge: 'LIVE',
  publish: 'Post',
  inputPlaceholder: 'Start yapping...',
  inputListening: 'Listening...',
  stopRecording: 'Stop recording',
  voiceInput: 'Voice input',
  noLabelsYet: 'No labels assigned yet. Speak, human.',
  stopTts: 'Stop speech',
} as const satisfies Record<TranslationKey, string>;

export const translations: Record<AppLocale, Record<TranslationKey, string>> = {
  'zh-HK': zhHK,
  en,
};

export const chibiTopics: Record<AppLocale, readonly string[]> = {
  'zh-HK': [
    '咁串得唔得架？',
    '呢個世界幾時先玩完？',
    '香港人真係咩都嘈一餐',
    '今日又係咁 loop...',
    '勁L難聽，日日係咁聽',
    '真係唔好玩，走啦大家',
    'AI 係咪想統治世界？',
    '想放工...',
    '做緊咩呀？',
    'Lunch 食乜好？',
    '又要返工，好悶呀',
    '後面條友企咗好耐，幾時走？',
    '坐喺張凳度嗰個，駁嘴駁得幾kam吓',
    '牙 Bot 講嘢好有骨，我都想試吓',
    '00後表示用Facebook嘅人都應該入老人院',
    '而家仲有人睇電視嘅咩',
    '極端女權與極端男權在留言區爆發第24次大戰',
    '放鬆啲啦香港人',
    '香港網絡文化除左笑人同公審仲有D咩？',
    '吓？依家貼張相都要比人話係公審？',
    '網絡判官太多了',
    '又黎性別大戰，悶唔悶d呀？',
    '盲目跟風',
    '依家留言區個個都帶風向，洗腦真容易',
    '網絡上最唔缺嘅就係戾氣',
    '只要立場唔同，你講乜都係錯架啦',
    '鍵盤戰士現實中可能連同店員講嘢都唔敢',
    '今時今日邊個認真邊個就輸',
    '每日開電話都見到一堆人在無病呻吟',
    '演算法今日又派垃圾比我睇...',
  ],
  en: [
    'Is it okay to be this toxic online?',
    'When does this world finally end?',
    'Everyone is arguing in the comments again',
    'Same loop again today...',
    'So loud. I hear this every single day',
    'This is not fun anymore. Log off',
    'Is AI trying to rule the world?',
    'I want to clock out...',
    'What are we even doing?',
    'What should I eat for lunch?',
    'Back to work. So boring',
    'That person behind me has been standing forever',
    'The one in the chair argues like a pro',
    'BokBok Bot talks sharp. I want to try it',
    'Gen Z says Facebook users belong in a retirement home',
    'People still watch TV?',
    'Extreme feminists vs extreme MRAs: round 24 in the comments',
    'Relax, internet',
    'Besides dunking and public shaming, what is online culture?',
    'Wait, posting a photo is public shaming now?',
    'Too many internet judges',
    'Another gender war thread. So tired',
    'Blind bandwagoning',
    'Everyone in the comments is steering the narrative',
    'The internet never runs out of rage',
    'Different side? Everything you say is wrong',
    'Keyboard warriors cannot talk to a cashier IRL',
    'Whoever cares the most loses',
    'Every morning my phone is full of performative misery',
    'The algorithm served me garbage again today...',
  ],
};

export const chatFallback: Record<
  AppLocale,
  { response: string; labels: [string, string] }
> = {
  'zh-HK': {
    response: '系統連線唔穩定，暫時用離線模式同你傾住先。',
    labels: ['離線模式', '降級回應'],
  },
  en: {
    response: 'Connection unstable. Offline mode will roast you instead.',
    labels: ['Offline mode', 'Degraded response'],
  },
};
