/* eslint-disable prefer-destructuring */
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
const crypto = require('crypto');

class AQMonitorDriver extends Homey.Driver {

	onInit() {
		this.log('AQMonitor driver started');
	}

	onPairListDevices(data, callback) {
		this.log('pairing started from frontend');
		const id1 = `AQMonitor_${crypto.randomBytes(3).toString('hex')}`; // e.g AQMonitor_f9b327
		const id2 = `AQMonitor_${crypto.randomBytes(3).toString('hex')}`; // e.g AQMonitor_f9b327
		const devices = [
			{
				name: 'AQMonitor',
				data: { id1 },
				settings: {
					lat: Math.round(Homey.ManagerGeolocation.getLatitude() * 100000000) / 100000000,
					lon: Math.round(Homey.ManagerGeolocation.getLongitude() * 100000000) / 100000000,
					dst: 20, //	Radius in kilometres,
					pollingInterval: 15, // minutes
				},
				capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
			},
			{
				name: 'AQMonitor_with_BC',
				data: { id2 },
				settings: {
					lat: Math.round(Homey.ManagerGeolocation.getLatitude() * 100000000) / 100000000,
					lon: Math.round(Homey.ManagerGeolocation.getLongitude() * 100000000) / 100000000,
					dst: 20, //	Radius in kilometres,
					pollingInterval: 15, // minutes
				},
				capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co', 'measure_bc'],
			},
		];
		callback(null, devices);
	}

}

module.exports = AQMonitorDriver;
