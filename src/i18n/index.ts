import texts from './texts.json';
import { getLanguage } from '../config/GlobalEnv';

type TextKey = keyof typeof texts;
type LangCode = 'ko' | 'en' | 'ja';

export const getText = (key: TextKey): string => {
    const lang = getLanguage(); // 'korean' | 'english' | 'japanese'
    const langCode: LangCode =
        lang === 'korean' ? 'ko' : lang === 'japanese' ? 'ja' : 'en';

    const entry = texts[key];
    return entry?.[langCode] ?? entry?.en ?? `❓${key}`;
};
