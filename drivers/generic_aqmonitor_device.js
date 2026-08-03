/*
Copyright 2019 - 2026, Robin de Gruijter (gruijter@hotmail.com)

This file is part of com.gruijter.openaq.

com.gruijter.openaq is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

com.gruijter.openaq is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with com.gruijter.openaq.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const Homey = require('homey');

class GenericAQMonitorDevice extends Homey.Device {

  async onInitDevice() {
    this.log(`device init ${this.getClass()} ${this.getName()}`);
    if (this.intervalIdDevicePoll) {
      clearInterval(this.intervalIdDevicePoll);
      this.intervalIdDevicePoll = null;
    }
    this.settings = await this.getSettings();

    // Migrate missing capabilities to existing devices
    const driverCaps = this.driver && this.driver.manifest && this.driver.manifest.capabilities;
    if (Array.isArray(driverCaps)) {
      for (const capability of driverCaps) {
        if (!this.hasCapability(capability)) {
          this.log(`Adding missing capability ${capability} to ${this.getName()}`);
          await this.addCapability(capability).catch((error) => this.error(`Error adding capability ${capability}:`, error));
        }
      }
    }

    // initial scan
    await this.scan();

    const intervalMinutes = Math.max(1, this.getSetting('pollingInterval') || 10);
    this.intervalIdDevicePoll = setInterval(async () => {
      try {
        await this.scan();
      } catch (error) {
        this.error('Polling error:', error);
      }
    }, 1000 * 60 * intervalMinutes);
  }

  onAdded() {
    this.log(`${this.getData().id} added: ${this.getName()}`);
  }

  onDeleted() {
    this.log(`${this.getData().id} deleted: ${this.getName()}`);
    if (this.intervalIdDevicePoll) {
      clearInterval(this.intervalIdDevicePoll);
      this.intervalIdDevicePoll = null;
    }
  }

  onUninit() {
    if (this.intervalIdDevicePoll) {
      clearInterval(this.intervalIdDevicePoll);
      this.intervalIdDevicePoll = null;
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log(`${this.getData().id} ${this.getName()} settings changed:`, changedKeys);
    if (this.intervalIdDevicePoll) {
      clearInterval(this.intervalIdDevicePoll);
      this.intervalIdDevicePoll = null;
    }
    this.settings = newSettings;
    setImmediate(async () => {
      await this.onInitDevice();
    });
  }

  setCapability(capability, value) {
    if (this.hasCapability(capability) && value !== undefined && value !== null && !Number.isNaN(value)) {
      this.setCapabilityValue(capability, value)
        .catch((error) => {
          this.error(`Error setting ${capability}:`, error);
        });
    }
  }

  async scan() {
    try {
      const device = { settings: this.getSettings(), name: this.getName(), id: this.getData().id };
      const rawData = await this.driver.getRawData(device);

      const capabilities = this.getCapabilities();
      const values = capabilities.map((capability) => {
        const param = capability.replace('measure_', '');
        return this.driver.getValue(device, rawData, param);
      });

      let updatedDst = null;
      let updatedLoc = null;

      values.forEach((val) => {
        if (val && val.parameter && val.value !== undefined && val.value !== null) {
          this.setCapability(`measure_${val.parameter}`, val.value);
          if (val.distance && !updatedDst) {
            updatedDst = val.distance.toString();
          }
          if (val.location && !updatedLoc) {
            updatedLoc = val.location;
          }
        }
      });

      const newSettings = {};
      if (updatedDst) newSettings.station_dst = updatedDst;
      if (updatedLoc) newSettings.station_loc = updatedLoc;
      if (Object.keys(newSettings).length > 0) {
        await this.setSettings(newSettings).catch(() => {});
      }

      await this.setAvailable();
    } catch (error) {
      this.error('Scan failed:', error);
      const msg = typeof error === 'string' ? error : (error.message || 'Error fetching data');
      await this.setUnavailable(msg).catch(() => {});
    }
  }

}

module.exports = GenericAQMonitorDevice;
