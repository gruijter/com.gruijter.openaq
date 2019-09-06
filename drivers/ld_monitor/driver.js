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

// const util = require('util');
const GenericAQMonitorDriver = require('../generic_aqmonitor_driver.js');

// service specific properties
const driverSpecifics = {
	service: 'LD',
	apiKey: 'N/A',
};

// add service specific properties and functions
class LDMonitorDriver extends GenericAQMonitorDriver {
	onInit() {
		this.log('Luftdaten Monitor Driver started');

		this.ds = driverSpecifics;
		this.timeout = 30000;
		// get raw data from service in JSON format
		this.getRawData = async (device) => {
			try {
				const { settings } = device;
				const options = {
					hostname: 'api.luftdaten.info',
					path: `/v1/filter/area=${settings.lat},${settings.lon},${settings.dst}`,
					headers: {
						'Content-Length': 0,
					},
					method: 'GET',
				};
				const result = await this._makeHttpsRequest(options);
				if (result.statusCode !== 200 || !result.headers['content-type'].includes('application/json')) {
					throw Error('Wrong content type, expected application/json');
				}
				const jsonData = JSON.parse(result.body);
				// console.log(util.inspect(jsonData, { depth: null, colors: true }));
				const results = jsonData;
				return Promise.resolve(results);
			} catch (error) {
				return Promise.reject(error.message);
			}
		};
		// returns a normalised values object with at least { parameter: string, value: number }, or {} if not valid
		this.getValue = (device, results, parameter) => {
			const { settings } = device;
			let searchParam;
			searchParam = (parameter === 'pm10') ? 'P1' : parameter;
			searchParam = (parameter === 'pm25') ? 'P2' : searchParam;
			if (!searchParam) return {};
			const timeAgo = (new Date(Date.now() - (8 * 60 * 60 * 1000)));
			const filtered = results
				.filter(station => new Date(station.timestamp) > timeAgo)	// not older then 8 hrs
				.filter((station) => {	// has the requested parameter
					const found = station.sensordatavalues.filter(dataPoint => dataPoint.value_type === searchParam);
					return found.length > 0;
				})
				.filter(station => settings.include_indoor || !station.location.indoor);	// include indoor stations or not
			// console.log(util.inspect(filtered, { depth: null, colors: true }));
			const latest = filtered[0];
			const nearest = filtered.reduce((accu, current) => {
				const diff = this.distance(settings.lat, settings.lon, accu.location.latitude, accu.location.longitude)
				- this.distance(settings.lat, settings.lon, current.location.latitude, current.location.longitude);
				return (diff < 0) ? accu : current;
			}, latest);
			if (!nearest) return {};
			const value = {
				parameter,
				value: Number(nearest.sensordatavalues.filter(dataPoint => dataPoint.value_type === searchParam)[0].value),
				lastUpdated: new Date(nearest.timestamp),
				location: `ID:${nearest.sensor.id} (${nearest.location.latitude},${nearest.location.longitude})`,
				coordinates: { latitude: nearest.location.latitude, longitude: nearest.location.longitude },
				url: `https://maps.luftdaten.info/#14/${nearest.location.latitude}/${nearest.location.longitude}`,
				distance: this.distance(settings.lat, settings.lon, nearest.location.latitude, nearest.location.longitude),
			};
			return value;
		};
		this.discover = async (settings) => {
			try {
				const deviceSets = [
					{
						name: 'LD Monitor @Homey',
						includeIndoor: false,
						pollingInterval: 1,
						capabilities: ['measure_pm25', 'measure_pm10'],
					},
					{
						name: 'LD Monitor @Homey_with_indoor',
						includeIndoor: true,
						pollingInterval: 1,
						capabilities: ['measure_pm25', 'measure_pm10'],
					},
				];
				const results = await this.getRawData({ settings });
				const filtered = results
					.filter((station) => {	// has the requested parameter
						const found = station.sensordatavalues.filter(dataPoint => (dataPoint.value_type === 'P1')
							|| (dataPoint.value_type === 'P2'));
						return found.length > 0;
					})
					.filter(station => !station.location.indoor); // only outdoor sensors

				const uniqueFiltered = filtered.reduce((unique, station) => { // remove doubles
					const sameID = unique.filter(uStation => uStation.sensor.id === station.sensor.id);
					const found = sameID.length > 0;
					return found ? unique : [...unique, station];
				}, []);

				const sorted = uniqueFiltered.sort((a, b) => {	// sort by distance
					const distA = this.distance(settings.lat, settings.lon, a.location.latitude, a.location.longitude);
					const distB = this.distance(settings.lat, settings.lon, b.location.latitude, b.location.longitude);
					return distA - distB;
				});
				// add the 5 nearest stations
				sorted.forEach((station, index) => {
					if (index > 4) return;
					const dist = this.distance(settings.lat, settings.lon, station.location.latitude, station.location.longitude);
					const set = {
						name: `LD Monitor ${station.sensor.id}@${dist}m`,
						lat: Number(station.location.latitude),
						lon: Number(station.location.longitude),
						dst: 0.01,
						stationDst: `${Math.round(dist)}`,
						includeIndoor: false,
						pollingInterval: 1,
						capabilities: ['measure_pm25', 'measure_pm10'],
					};
					deviceSets.push(set);
				});
				return deviceSets;
			} catch (error) {
				return Promise.reject(error);
			}
		};
	}
}

module.exports = LDMonitorDriver;

/*

path: '/data/v2/data.dust.min.json', // average of all measurements per sensor of the last 5 minutes, dust sensors only

path: `/v1/filter/area=${settings.lat},${settings.lon},${settings.dst}`, // all measurements of the last 5 minutes filtered by query
type: {}, // comma separated list of sensor types, i.e. 'SDS011,BME280'
area: {lat,lon,distance}, // all sensors within a max. radius (km?) {lat,lon,distance}
box: {lat1,lon1,lat2,lon2}, // all sensors in a 'box' with the given coordinates
country: {countryCode}, // i.e. 'BE, DE, NL, ...'


[ { id: 4767756759,
    sampling_rate: null,
    timestamp: '2019-09-03 20:13:54',
    location:
     { id: 13208,
       latitude: '51.044',
       longitude: '13.746',
       altitude: '',
       country: 'DE',
       exact_location: 0,
       indoor: 1 },
    sensor:
     { id: 36,
       pin: '1',
       sensor_type: { id: 14, name: 'SDS011', manufacturer: 'Nova Fitness' } },
    sensordatavalues: [ { id: 10122094561, value: '40.80', value_type: 'humidity' } ] },
  { id: 4767756688,
    sampling_rate: null,
    timestamp: '2019-09-03 20:13:53',
    location:
     { id: 13208,
       latitude: '51.044',
       longitude: '13.746',
       altitude: '',
       country: 'DE',
       exact_location: 0,
       indoor: 1 },
    sensor:
     { id: 36,
       pin: '1',
       sensor_type: { id: 14, name: 'SDS011', manufacturer: 'Nova Fitness' } },
    sensordatavalues:
     [ { id: 10122094401, value: '0.00', value_type: 'P1' },
       { id: 10122094402, value: '0.00', value_type: 'P2' } ] },
  { id: 4767756759,
    sampling_rate: null,
    timestamp: '2019-09-03 20:13:54',
    location:
     { id: 13208,
       latitude: '51.044',
       longitude: '13.746',
       altitude: '',
       country: 'DE',
       exact_location: 0,
       indoor: 1 },
    sensor:
     { id: 36,
       pin: '1',
       sensor_type: { id: 14, name: 'SDS011', manufacturer: 'Nova Fitness' } },
    sensordatavalues:
     [ { id: 10122094558, value: '27.00', value_type: 'temperature' } ] },
  { id: 4767897022,
    sampling_rate: null,
    timestamp: '2019-09-03 20:33:25',
    location:
     { id: 16232,
       latitude: '48.8',
       longitude: '9.002',
       altitude: '365.6',
       country: 'DE',
       exact_location: 0,
       indoor: 0 },
    sensor:
     { id: 92,
       pin: '1',
       sensor_type: { id: 14, name: 'SDS011', manufacturer: 'Nova Fitness' } },
    sensordatavalues:
     [ { id: 10122391666, value: '4.10', value_type: 'P1' },
       { id: 10122391670, value: '2.35', value_type: 'P2' } ] },
  { id: 4767898407,
    sampling_rate: null,
    timestamp: '2019-09-03 20:33:36',
    location:
     { id: 16228,
       latitude: '48.8',
       longitude: '9.002',
       altitude: '365.6',
       country: 'DE',
       exact_location: 0,
       indoor: 0 },
    sensor:
     { id: 211,
       pin: '1',
       sensor_type: { id: 14, name: 'SDS011', manufacturer: 'Nova Fitness' } },
    sensordatavalues:
     [ { id: 10122394611, value: '4.95', value_type: 'P1' },
       { id: 10122394612, value: '3.80', value_type: 'P2' } ] }

*/
