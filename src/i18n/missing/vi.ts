const vi = {

  command: {
    badSyncCommand: '%s sync command must produce valid JSON`', // accessory name
    unsupportedCharacteristic: '%s trying to sync unsupported characteristic %s', // accessory name, variable name
  },

  config: {

    title: {
      commandSync: 'Sync Command',
      syncSchedule: 'Sync Schedule',
    },

  },

  syncSchedule: {
    badType: '%s has invalid sync schedule type %s. Must be one of: %s', // accessory name, input, list of type names
    badUnits: '%s sync schedule has invalid time units %s. Must be one of: %s', // accessory name, input, list of unit names
    cancel: 'Cancelled sync schedule timer for %s', // accessory name
    cron: '%s starting sync schedule cronjob', // accessory name
    expired: '%s sync schedule timer expired while restarting. Synchronizing now…', // accessory name
    invalidCron: '%s sync schedule has an invalid cron expression %s', // accessory name, cron string
    resume: '%s resuming sync schedule timer', // accessory name
    sunTime: '%s will synchronize at %s', // accessory name, time
    timeHours: '% will synchronize in %s hours', // accessory name, number
    timeMilliseconds: '%s will synchronize in %s milliseconds', // accessory name, number
    timeMinutes: '%s will synchronize in %s minutes', // accessory name, number
    timeSeconds: '%s will synchronize in %s seconds', // accessory name, number
  },

  thermostat: {
    auto: '%s set to Auto', // accessory name
    coolFuture: 'Settings %s to Cool…',
    heatFuture: 'Settings %s to Heat…',
    offFuture: 'Settings %s to Off…',
  },

  webhook: {
    validRange: 'The %s characteristic expects a number value between %s and %s', // command name, number, number
    validValues: 'Valid values for the %s characteristic command are:', // command name
  },
};

export default vi;