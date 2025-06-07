import en from './en.js';
import zz from './zz.js';

export enum Language {
  EN = 'en',
  ZZ = 'zz'
}

const Translations: Record<Language, Translation> = {
  [Language.EN]: en,
  [Language.ZZ]: zz,
};

export type Translation = typeof en;

let currentLanguage: Language = Language.EN;

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(i18nLang: string) {

  let language = Language.EN;
  switch(i18nLang) {
  case Language.EN:
    language = Language.EN;
    break;
  case Language.ZZ:
    language = Language.ZZ;
    break;
  }

  currentLanguage = Translations[language] ? language : Language.EN;
}

export function getAllTranslations(): Translation {
  return Translations[currentLanguage];
}

const translations = new Proxy({} as Translation, {
  get(_target, prop: string) {
    return (
      Translations[currentLanguage][prop as keyof Translation] ??
      Translations[Language.EN][prop as keyof Translation]
    );
  },
});

export { translations as strings };