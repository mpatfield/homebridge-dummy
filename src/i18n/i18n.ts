import merge from 'lodash.merge';

import de from './de.js';
import el from './el.js';
import en from './en.js';
import es from './es.js';
import ru from './ru.js';
import vi from './vi.js';

export enum Language {
  DE = 'de',
  EL = 'el',
  EN = 'en',
  ES = 'es',
  RU = 'ru',
  VI = 'vi',
}

const Translations = {
  [Language.DE]: de,
  [Language.EL]: el,
  [Language.EN]: en,
  [Language.ES]: es,
  [Language.RU]: ru,
  [Language.VI]: vi,
};

type Translation = typeof en;

export function getTranslation(language: Language): Record<string, string | object> {
  return Translations[language] ?? {};
}

export function getStrings(language: Language): Translation {
  return merge({}, en, getTranslation(language));
}

export let strings: Translation = en;

export function setLanguage(language?: string) {

  let isoLang = language;
  if (isoLang === undefined || isoLang.trim().length === 0 || isoLang === 'auto') {
    isoLang = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];
  }

  const currentLanguage = isoLang in Translations ? isoLang as Language : Language.EN;

  if (currentLanguage !== Language.EN) {
    strings = getStrings(currentLanguage);
  }
}
