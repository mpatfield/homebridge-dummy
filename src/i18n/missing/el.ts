const el = {

  config: {

    enumNames: {
      carbonDioxideSensor:'Carbon Dioxide Sensor',
      carbonMonoxideSensor: 'Carbon Monoxide Sensor',
      contactSensor: 'Contact Sensor',
      leakSensor: 'Leak Sensor',
      motionSensor: 'Motion Sensor',
      occupancySensor: 'Occupancy Sensor',
      smokeSensor: 'Smoke Sensor',
    },

    title: {
      commandActive: 'Active Command',
      commandInactive: 'Inactive Command',
    },

  },

  sensor: {

    carbonDioxide: {
      labelActive: 'Abnormal',
      labelInactive: 'Normal',
    },

    carbonMonoxide: {
      labelActive: 'Abnormal',
      labelInactive: 'Normal',
    },

    contact: {
      labelActive: 'Not Detected / Open',
      labelInactive: 'Detected / Closed',
    },

    doa: '%s will never be triggered as currently configured. Did you mean to enable webhooks or add a schedule?',

    leak: {
      labelActive: 'Detected',
      labelInactive: 'Not Detected',
    },

    motion: {
      labelActive: 'Detected',
      labelInactive: 'Not Detected',
    },

    occupancy: {
      labelActive: 'Detected',
      labelInactive: 'Not Detected',
    },

    smoke: {
      labelActive: 'Detected',
      labelInactive: 'Not Detected',
    },

  },

};

export default el;