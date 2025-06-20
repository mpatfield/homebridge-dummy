
import { IHomebridgePluginUi } from '@homebridge/plugin-ui-utils/ui.interface';
import { Translation } from '../i18n/i18n.js';

declare const homebridge: IHomebridgePluginUi;

const i18n_replacements: Record<string, string> = {
  arrow: '&rarr;',
  github: '<a target="_blank" href="https://github.com/mpatfield/homebridge-dummy/">GitHub</a>',
};

const translateHtml = (strings: Translation) => {
  document.querySelectorAll('[i18n]').forEach(element => {

    const key = element.getAttribute('i18n') as keyof typeof strings.config;
    let string = strings.config[key] as string;

    const token = element.getAttribute('i18n_replace');
    if (token) {
      string = string.replace('%s', i18n_replacements[token]);
    }
    element.innerHTML = string;
  });
};

const translateSchema = (strings: Translation) => {

  const tags = ['span', 'label', 'legend', 'option', 'p'];
  const elements = Array.from(
    window.parent.document.querySelectorAll(tags.join(',')),
  ).sort((a, b) => {
    return tags.indexOf(a.tagName.toLowerCase()) - tags.indexOf(b.tagName.toLowerCase());
  });

  elements.forEach(element => {
    let newHtml = element.innerHTML;
    newHtml = newHtml.replaceAll(
      /\$\{config\.(title|description|enumNames)\.([^}]+)\}/g,
      (match, type: keyof typeof strings.config, key) => {
        if (
          strings.config[type] &&
          typeof strings.config[type] === 'object' &&
          key in (strings.config[type] as Record<string, string>)
        ) {
          return (strings.config[type] as Record<string, string>)[key];
        }
        return match;
      },
    );
    if (element.innerHTML !== newHtml) {
      element.innerHTML = newHtml;
    }
  });
};

const updateLegacyAccessoryNames = () => {

  const legend = Array.from(window.parent.document.querySelectorAll('fieldset legend'))
    .find(el => el.textContent?.includes('Legacy Accessory'));

  if (legend) {
    const fieldset = legend.closest('fieldset');
    const input = fieldset?.querySelector('input[type="text"][name="name"]') as HTMLInputElement | null;
    if (input && input.value) {
      legend.textContent = input.value;
    }
  }
};

const showSettings = async (strings: Translation) => {
  homebridge.showSpinner();
  document.getElementById('pageIntro')!.style.display = 'none';
  document.getElementById('support')!.style.display = 'block';

  const observer = new MutationObserver(() => {
    updateLegacyAccessoryNames();
    translateSchema(strings);
  });

  observer.observe(
    window.parent.document.body,
    { childList: true, subtree: true },
  );

  homebridge.showSchemaForm();
  homebridge.hideSpinner();
};

const showIntro = (strings: Translation) => {
  const introContinue = document.getElementById('introContinue') as HTMLButtonElement;
  introContinue.addEventListener('click', async () => {
    showSettings(strings);
  });
  document.getElementById('pageIntro')!.style.display = 'block';
  homebridge.hideSpinner();
};

(async () => {
  homebridge.showSpinner();
  try {
    const language = await homebridge.i18nCurrentLang();
    const strings = await homebridge.request('i18n', language);
    translateHtml(strings);

    const config = await homebridge.getPluginConfig();
    if (config.length) {
      await showSettings(strings);
    } else {
      showIntro(strings);
    }
  } catch (err) {
    homebridge.toast.error((err as Error).message);
    homebridge.hideSpinner();
  }
})();
