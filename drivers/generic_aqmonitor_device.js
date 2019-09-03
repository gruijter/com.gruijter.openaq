/*
Copyright 2019, Robin de Gruijter (gruijter@hotmail.com)

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

/* eslint-disable prefer-destructuring */

'use strict';

const Homey = require('homey');
// const util = require('util');

// const setTimeoutPromise = util.promisify(setTimeout);

class GenericAQMonitorDevice extends Homey.Device {

	// this method is called when the Device is inited
	async onInitDevice() {
		this.log(`device init ${this.getClass()} ${this.getName()}`);
		clearInterval(this.intervalIdDevicePoll);	// if polling, stop polling
		this.settings = await this.getSettings();
		// add driver functions
		const driver = this.getDriver();
		this.getRawData = driver.getRawData;
		this.getValue = driver.getValue;
		// start scanning
		this.scan();
		this.intervalIdDevicePoll = setInterval(async () => {
			try {
				this.scan();
			} catch (error) { this.log('intervalIdDevicePoll error', error); }
		}, 1000 * 60 * this.getSetting('pollingInterval'));
	}

	// this method is called when the Device is added
	onAdded() {
		this.log(`AQMonitor added: ${this.getData().id}`);
	}

	// this method is called when the Device is deleted
	onDeleted() {
		this.log(`AQMonitor deleted: ${this.getData().id}`);
		clearInterval(this.intervalIdDevicePoll);
	}

	// this method is called when the user has changed the device's settings in Homey.
	onSettings(newSettingsObj, oldSettingsObj, changedKeysArr, callback) {
		// first stop polling the device, then start init after short delay
		clearInterval(this.intervalIdDevicePoll);
		this.log(`${this.getData().id} device settings changed`);
		this.setAvailable()
			.catch(this.error);
		setTimeout(() => {
			this.onInit();
		}, 10000);
		callback(null, true);
	}

	setCapability(capability, value) {
		if (this.hasCapability(capability)) {
			this.setCapabilityValue(capability, value)
				.catch((error) => {
					this.log(error, capability, value);
				});
		}
	}

	async scan() {
		try {
			const device = this;
			const rawData = await this.getRawData(device)
				.catch((error) => {
					this.setSettings({ station_dst: error.toString() });
					throw error;
				});
			const capabilities = this.getCapabilities();
			// ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co', 'measure_bc']
			const values = [];
			capabilities.forEach((capability) => {
				values.push(this.getValue(device, rawData, capability.replace('measure_', '')));
			});
			this.log(values);
			values.forEach((value) => {
				this.setCapability(`measure_${value.parameter}`, value.value);
				if (value.distance) {
					this.setSettings({ station_dst: value.distance.toString() });
				}
				if (value.location) {
					this.setSettings({ station_loc: value.location });
				}
			});
		} catch (error) {
			this.error(error);
		}
	}

}

module.exports = GenericAQMonitorDevice;
