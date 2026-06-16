const vi = {

  button: {
    doublePressTitle: 'Double Press',
    longPressTitle: 'Long Press',
    singlePressTitle: 'Single Press',
  },

  command: {
    badSyncCommand: '%s sync command must produce valid JSON`', // accessory name
    unsupportedCharacteristic: '%s trying to sync unsupported characteristic %s', // accessory name, variable name
  },

  config: {

    enumNames: {
      homekit: 'HomeKit (Default)',
      matter: 'Matter (Beta)',
      pushover: 'Pushover (pushover.net)',
    },

    title: {
      commandSync: 'Sync Command',
      protocol: 'Protocol',
      syncSchedule: 'Sync Schedule',
    },

  },

  startup: {
    matterDisabled: 'Matter is currently disabled. Please enable Matter in the %s parent bridge.', // plugin name
    matterGroups: 'Groups are not yet supported for Matter accessories',
    matterUnavailable: 'Matter is not available with this version of Homebridge. Please update to Homebridge v2.0+ to use Matter with %s.', // plugin name
    newHomeKitAccessory: 'Adding new HomeKit accessory:',
    newMatterAccessory: 'Adding new Matter accessory:',
    removeHomeKitAccessory: 'Removing HomeKit accessory:',
    removeMatterAccessory: 'Removing Matter accessory:',
    restoringHomeKitAccessory: 'Restoring HomeKit accessory:',
    restoringMatterAccessory: 'Restoring Matter accessory:',
    unsupportedProtocol: 'Unsupported protocol %s. Must be one of: %s', // protocol, list of protocols
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
    autoFuture: 'Setting %s to Auto…', // accessory name
    coolFuture: 'Setting %s to Cool…', // accessory name
    heatFuture: 'Setting %s to Heat…', // accessory name
    offFuture: 'Setting %s to Off…', // accessory name
  },

  webhook: {
    validRange: 'The %s characteristic expects a number value between %s and %s', // command name, number, number
    validValues: 'Valid values for the %s characteristic command are:', // command name
  },
};

export default vi;