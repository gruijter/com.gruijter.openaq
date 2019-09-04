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
const crypto = require('crypto');

const randomID = () => `AQMonitor_${crypto.randomBytes(3).toString('hex')}`; // e.g AQMonitor_f9b327

class GenericAQMonitorDriver extends Homey.Driver {

	onPairListDevices(data, callback) {
		this.log('pairing started by user');
		const devices = [];
		this.ds.deviceSets.forEach((deviceSet) => {
			const device = {
				name: deviceSet.name,
				data: { id: randomID() },
				settings: {
					service: this.ds.service,
					api_key: this.ds.apiKey,
					lat: Math.round(Homey.ManagerGeolocation.getLatitude() * 100000000) / 100000000,
					lon: Math.round(Homey.ManagerGeolocation.getLongitude() * 100000000) / 100000000,
					dst: 100, //	Radius in kilometres,
					station_dst: 'unknown',	// distance to closest station (m)
					pollingInterval: 10, // minutes
				},
				capabilities: deviceSet.capabilities,
			};
			devices.push(device);
		});
		callback(null, devices);
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
			req.setTimeout(this.timeout || 30000, () => req.abort());
			req.once('error', e => reject(e));
			req.end();
		});
	}

}

module.exports = GenericAQMonitorDriver;
