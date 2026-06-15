import { IHomebridgePluginUi } from '@homebridge/plugin-ui-utils/ui.interface';

import { PLUGIN_ALIAS } from '../homebridge/settings.js';

import { FadeOutType, OnState, ScheduleType, SensorBehavior } from '../model/enums.js';
import { HomeKitType } from '../model/homekit.js';
import { DummyConfig, DummyPlatformConfig, LightbulbConfig, OnOffConfig } from '../model/types.js';

declare const homebridge: IHomebridgePluginUi;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let strings: any = { __I18N_REPLACE__ : '' };

function getParentDocument(): Document | undefined {
  try {
    return window.parent.document;
  } catch (err) {
    console.warn('Unable to access parent document (cross-origin). Some UI features disabled.');
    return undefined;
  }
}

function translateHtml() {
  document.querySelectorAll('[i18n]').forEach(element => {
    const key = element.getAttribute('i18n') as string;
    element.innerHTML = strings[key];
  });
};

function updateAccessoryNames(): boolean {

  const parentDocument = getParentDocument();
  if (!parentDocument) {
    return false;
  }

  const legends = Array.from(parentDocument.querySelectorAll('fieldset legend'));

  let listenerAdded = false;

  for(const legend of legends) {
    const fieldset = legend.closest('fieldset');
    const input = fieldset?.querySelector('input[type="text"][name="name"]') as HTMLInputElement | null;
    if (input && legend.textContent !== (input.value || strings.accessory)) {
      const textNode = Array.from(legend.childNodes).find(n => n.nodeType === Node.TEXT_NODE) as Text | undefined;
      const name = input.value !== '' ? input.value : strings.accessory;
      if (textNode && textNode.nodeValue !== name) {
        textNode.nodeValue = name;
      }
    }

    if (input && !input.dataset.accessoryNameListener) {
      input.addEventListener('input', () => updateAccessoryNames());
      input.dataset.accessoryNameListener = 'true';
      listenerAdded = true;
    }
  }

  return listenerAdded;
}

function generateUUID() {

  if (typeof crypto !== 'undefined') {

    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    if (crypto.getRandomValues) {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = crypto.getRandomValues(new Uint8Array(1))[0] & 0xf;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function updateConfigsWithUUIDs(configs: DummyPlatformConfig[]) {

  let changed = false;

  configs.forEach( (config) => {
    config.accessories?.forEach( (accessoryConfig) => {

      if (accessoryConfig.id === undefined) {
        accessoryConfig.id = generateUUID();
        changed = true;
      }
    });
  });

  if (changed) {
    await homebridge.updatePluginConfig(configs);
  }
}

function findNextByName(element: Element, name: string): Element | undefined {

  const parentDocument = getParentDocument();
  if (!parentDocument) {
    return undefined;
  }

  const walker = parentDocument.createTreeWalker(parentDocument.body, NodeFilter.SHOW_ELEMENT);

  let found = false;
  while (walker.nextNode()) {
    if (walker.currentNode === element) {
      found = true;
      break;
    }
  }

  while (found && walker.nextNode()) {
    const node = walker.currentNode as Element;
    if (node.getAttribute('name') === name) {
      return node;
    }
  }

  return undefined;
}

let accessories: DummyConfig[] = [];
async function updateConditionDropdowns(configs?: DummyPlatformConfig[]) {

  const parentDocument = getParentDocument();
  if (!parentDocument) {
    return;
  }

  const accessoryIdInputs = parentDocument.querySelectorAll('[name="accessoryId"]');
  if (accessoryIdInputs.length === 0) {
    return;
  }

  if (configs === undefined) {
    configs = await homebridge.getPluginConfig() as DummyPlatformConfig[];
  }

  const newAccessories: DummyConfig[] = [];

  for (const config of configs) {
    const populated = (config.accessories ?? []).filter( (accessory) => accessory.id && accessory.name &&
    ![
      HomeKitType.HumiditySensor,
      HomeKitType.StatelessProgrammableSwitch,
      HomeKitType.TemperatureSensor,
      HomeKitType.Thermostat,
    ].includes(accessory.type));
    newAccessories.push(...populated);
  }

  let accessoriesChanged = false;
  if (accessories.length !== newAccessories.length) {
    accessories = newAccessories;
    accessoriesChanged = true;
  } else {
    accessories.forEach( (accessory, index) => {
      const compare = newAccessories[index];
      if (accessory.name !== compare.name || accessory.type !== compare.type || accessory.id !== compare.id) {
        accessories = newAccessories;
        accessoriesChanged = true;
      }
    });
  }

  accessoryIdInputs.forEach(element => {

    const idInput = element as HTMLInputElement;

    let accessorySelect = idInput.parentElement?.querySelector('select.form-select[data-accessory-name-select="true"]') as HTMLSelectElement;

    if (accessorySelect && accessorySelect.dataset.accessoryNameSelect !== 'true') {
      console.error('Unable to retrieve accessory name selector');
      return;
    }

    if (!accessorySelect) {
      accessorySelect = document.createElement('select');
      accessorySelect.className = 'form-select';

      accessorySelect.dataset.accessoryNameSelect = 'true';

      idInput.hidden = true;

      accessorySelect.addEventListener('change', () => {
        if (accessorySelect.selectedIndex === -1) {
          idInput.value = '';
        } else {
          const accessoryId = accessories[accessorySelect.selectedIndex].id;
          idInput.value = accessoryId;
        }
        idInput.dispatchEvent(new Event('input', { bubbles: true }));
      });

      idInput.parentElement?.appendChild(accessorySelect);
    }

    if (accessoriesChanged || accessorySelect.length === 0) {

      accessorySelect.length = 0;

      accessories.forEach(accessory => {
        const option = document.createElement('option');
        option.text = accessory.name;
        accessorySelect.add(option);
      });
    }

    const accessoryIndex = idInput.value.length ? accessories.findIndex( (accessory) => accessory.id === idInput.value) : -1;
    if (accessoryIndex === -1) {
      accessorySelect.selectedIndex = -1;
    } else {
      accessorySelect.selectedIndex = accessoryIndex ;

      const accessory = accessories[accessoryIndex];

      const stateSelect = findNextByName(accessorySelect, 'accessoryState') as HTMLSelectElement;
      if (!stateSelect) {
        console.error('Unable to find accessory state selector');
        return;
      }

      if (stateSelect.length !== 7) {
        console.error('Accessory state selector has an unexpected number of options');
        return;
      }

      const noneOption = stateSelect.options[0];
      const onOption = stateSelect.options[1];
      const offOption = stateSelect.options[2];
      const openOption = stateSelect.options[3];
      const closedOption = stateSelect.options[4];
      const lockedOption = stateSelect.options[5];
      const unlockedOption = stateSelect.options[6];

      noneOption.hidden = true;
      onOption.hidden = true;
      offOption.hidden = true;
      openOption.hidden = true;
      closedOption.hidden = true;
      lockedOption.hidden = true;
      unlockedOption.hidden = true;

      switch (accessory.type) {
      case HomeKitType.HumidifierDehumidifier:
      case HomeKitType.Lightbulb:
      case HomeKitType.Outlet:
      case HomeKitType.Switch:
      case HomeKitType.Valve:
        onOption.hidden = false;
        offOption.hidden = false;
        if (stateSelect.selectedIndex !== 1 && stateSelect.selectedIndex !== 2) {
          stateSelect.selectedIndex = -1;
          stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        break;
      case HomeKitType.Door:
      case HomeKitType.GarageDoorOpener:
      case HomeKitType.Window:
      case HomeKitType.WindowCovering:
        openOption.hidden = false;
        closedOption.hidden = false;
        if (stateSelect.selectedIndex !== 3 && stateSelect.selectedIndex !== 4) {
          stateSelect.selectedIndex = -1;
          stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        break;
      case HomeKitType.LockMechanism:
        if (stateSelect.selectedIndex !== 5 && stateSelect.selectedIndex !== 6) {
          stateSelect.selectedIndex = -1;
          stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        lockedOption.hidden = false;
        unlockedOption.hidden = false;
        break;
      case HomeKitType.Thermostat:
      default:
        return;
      }
    }
  });
}

async function migrateDeprecatedFields(configs: DummyPlatformConfig[]) {

  let changed = false;

  configs.forEach( (config) => {

    if (config.webhookPort !== undefined) {
      config.webhookConfig = config.webhookConfig ?? {};
      config.webhookConfig.port = config.webhookConfig.port ?? config.webhookPort;
      config.webhookPort = undefined;
      changed = true;
    }

    config.accessories?.forEach( (accessoryConfig) => {

      if ('defaultOn' in accessoryConfig) {
        (accessoryConfig as OnOffConfig).defaultState = accessoryConfig.defaultOn ? OnState.ON : OnState.OFF;
        accessoryConfig.defaultOn = undefined;
        changed = true;
      }

      const currentSensor = accessoryConfig.sensor;
      if (currentSensor?.timerControlled !== undefined) {
        if (currentSensor.behavior === undefined) {
          currentSensor.behavior = currentSensor.timerControlled ? SensorBehavior.TIMER : SensorBehavior.MIRROR;
        }
        currentSensor.timerControlled = undefined;
        changed = true;
      }

      if (accessoryConfig.enableWebook !== undefined) {
        accessoryConfig.enableWebhook = accessoryConfig.enableWebook;
        accessoryConfig.enableWebook = undefined;
        changed = true;
      }

      const lightbulbConfig = accessoryConfig as LightbulbConfig;
      if (lightbulbConfig.defaultBrightness !== undefined) {
        lightbulbConfig.isDimmer = true;
        lightbulbConfig.defaultBrightness = undefined;
        changed = true;
      }

      if (typeof lightbulbConfig.fadeOut === 'boolean' && lightbulbConfig.fadeOut === true) {
        const autoReset = lightbulbConfig.autoReset;
        if (autoReset?.type === ScheduleType.TIMEOUT && autoReset?.time !== undefined && autoReset.units !== undefined) {
          lightbulbConfig.fadeOut = {
            type: FadeOutType.FIXED,
            time: autoReset.time,
            units: autoReset.units,
          };
          lightbulbConfig.autoReset = undefined;
        } else {
          lightbulbConfig.fadeOut = undefined;
        }
        changed = true;
      }
    });
  });

  if (changed) {
    await homebridge.updatePluginConfig(configs);
  }
}

async function showSettings() {
  document.getElementById('intro')!.style.display = 'none';
  document.getElementById('migration')!.style.display = 'none';

  document.getElementById('header')!.style.display = 'block';
  document.getElementById('support')!.style.display = 'block';

  const parentDocument = getParentDocument();
  if (parentDocument) {

    const observer = new MutationObserver(() => {
      if (updateAccessoryNames()) {
        updateConditionDropdowns();
        observer.disconnect();
      }
    });

    observer.observe(
      parentDocument,
      { childList: true, subtree: true },
    );
  }

  homebridge.addEventListener('configChanged', async (evt: Event) => {
    updateAccessoryNames();

    const configs = (evt as MessageEvent).data as DummyPlatformConfig[];
    await updateConfigsWithUUIDs(configs);
    await updateConditionDropdowns(configs);
  });

  homebridge.showSchemaForm();
  homebridge.hideSpinner();
  homebridge.enableSaveButton();
}

function showMigration() {
    document.getElementById('header')!.style.display = 'none';
    document.getElementById('intro')!.style.display = 'none';
    document.getElementById('migration')!.style.display = 'block';

    const continueButton = document.getElementById('continue') as HTMLButtonElement;
    continueButton.addEventListener('click', async () => {
      showSettings();
    });
}

function showIntro() {

  document.getElementById('header')!.style.display = 'block';

  const noButton = document.getElementById('showSettings') as HTMLButtonElement;
  noButton.addEventListener('click', async () => {
    showSettings();
  });

  const yesButton = document.getElementById('showMigration') as HTMLButtonElement;
  yesButton.addEventListener('click', () => {
    showMigration();
  });

  document.getElementById('intro')!.style.display = 'block';

  homebridge.hideSpinner();
}

(() => {
  homebridge.disableSaveButton();
  homebridge.showSpinner();
})();

(async () => {

  const language = await homebridge.i18nCurrentLang();
  strings = (language in strings) ? strings[language] : strings.en;
  translateHtml();

  const configs = await homebridge.getPluginConfig() as DummyPlatformConfig[];
  if (configs.length) {
    await migrateDeprecatedFields(configs);
    showSettings();
  } else {
    await homebridge.updatePluginConfig([{ name: PLUGIN_ALIAS }]);
    showIntro();
  }
})();