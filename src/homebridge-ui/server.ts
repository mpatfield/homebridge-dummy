import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';

import { getAllTranslations, setLanguage, Translation } from '../i18n/i18n.js';

class DummyConfigUiServer extends HomebridgePluginUiServer {
  constructor() {
    super();
    this.onRequest('i18n', this.i18n.bind(this));
    this.ready();
  }

   
  async i18n(language: string): Promise<Translation> {
    setLanguage(language);
    return getAllTranslations();
  }
}

(() => new DummyConfigUiServer())();