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

'use strict';

const Homey = require('homey');
const https = require('https');
// const util = require('util');

function getLatestValue(results, parameter) {
	// filter for all locations in range that report the parameter
	const hasParameter = results.filter((result) => {
		const filteredArray = result.measurements.filter(measurement => measurement.parameter === parameter);
		return filteredArray.length > 0;
	});
	// console.log(util.inspect(hasParameter, { depth: null, colors: true }));
	// get the most recent value that is most nearby, is not zero or negative, is not older then 8 hrs
	const timeAgo = (new Date(Date.now() - (8 * 60 * 60 * 1000))).toISOString();
	const latestValue = hasParameter.reduce((accu, current) => {
		const currentMeasurement = current.measurements.filter(measurement => measurement.parameter === parameter);
		// currentMeasurement[0].city = current.city;
		currentMeasurement[0].location = current.location;
		currentMeasurement[0].coordinates = current.coordinates;
		currentMeasurement[0].distance = current.distance;
		const bmTm = Date.parse(accu.lastUpdated);
		const cmTm = Date.parse(currentMeasurement[0].lastUpdated);
		if (!(currentMeasurement[0].value > 0) || (bmTm >= cmTm)) return accu;
		return currentMeasurement[0];
	}, { lastUpdated: timeAgo });
	return latestValue;
}

function getValues(results) {
	const parameters = ['pm25', 'pm10', 'so2', 'no2', 'o3', 'co', 'bc'];
	const values = [];
	parameters.forEach((parameter) => {
		values.push(getLatestValue(results, parameter));
	});
	return values;
}

class AQMonitorDevice extends Homey.Device {

	// this method is called when the Device is inited
	onInit() {
		this.log(`device init ${this.getClass()} ${this.getName()}}`);
		clearInterval(this.intervalIdDevicePoll);	// if polling, stop polling
		this.settings = this.getSettings();
		this.timeout = 30000;
		this.readings = {};
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
		this.log('AQMonitor device settings changed');
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
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: 'api.openaq.org',
				path: `/v1/latest?coordinates=${this.settings.lat},${this.settings.lon}&radius=${this.settings.dst * 1000}&order_by=distance`,
				headers,
				method: 'GET',
			};
			const jsonData = await this._makeRequest(options);
			// console.log(jsonData);
			const values = getValues(jsonData.results);
			this.log(values);
			values.forEach((value) => {
				this.setCapability(`measure_${value.parameter}`, value.value);
			});
		} catch (error) {
			this.error(error);
		}
	}

	async _makeRequest(options) {
		try {
			const result = await this._makeHttpsRequest(options);
			if (result.statusCode !== 200 || !result.headers['content-type'].includes('application/json')) {
				throw Error('Wrong content type, expected application/json');
			}
			const jsonData = JSON.parse(result.body);
			// console.log(util.inspect(jsonData, { depth: null, colors: true }));
			if (jsonData.results === undefined) {
				throw Error('Invalid response from API');
			}
			return Promise.resolve(jsonData);
		} catch (error) {
			return Promise.reject(error.message);
		}
	}

	_makeHttpsRequest(options) {
		return new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				let resBody = '';
				res.on('data', (chunk) => {
					resBody += chunk;
				});
				res.once('end', () => {
					res.body = resBody;
					return resolve(res); // resolve the request
				});
			});
			req.setTimeout(this.timeout, () => req.abort());
			req.once('error', e => reject(e));
			req.end();
		});
	}

}

module.exports = AQMonitorDevice;
