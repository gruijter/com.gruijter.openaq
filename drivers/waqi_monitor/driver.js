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
const GenericAQMonitorDriver = require('../generic_aqmonitor_driver.js');

// service specific properties
const driverSpecifics = {
	service: 'WAQI',
	apiKey: Homey.env.WAQI_API_KEY || 'demo',	// registered to homey@gruijter
	deviceSets: [
		{
			name: 'WAQI Monitor',
			capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
		},
	],
};

const distance = (lat1, lon1, lat2, lon2) => {
	if ((lat1 === lat2) && (lon1 === lon2)) {
		return 0;
	}
	const radlat1 = Math.PI * lat1 / 180;
	const radlat2 = Math.PI * lat2 / 180;
	const theta = lon1 - lon2;
	const radtheta = Math.PI * theta / 180;
	let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	if (dist > 1) {
		dist = 1;
	}
	dist = Math.acos(dist);
	dist = dist * 180 / Math.PI;
	dist = dist * 60 * 1.1515 * 1.609344 * 1000; // in meters
	return Math.round(dist);
};

class AQICNMonitorDriver extends GenericAQMonitorDriver {
	onInit() {
		this.log('AQICN Monitor Driver started');

		// add service specific properties and functions
		this.ds = driverSpecifics;
		this.timeout = 30000;
		// get raw data from service in JSON format
		this.getRawData = async (device) => {
			try {
				const { settings } = device;
				const options = {
					hostname: 'api.waqi.info',
					path: `/feed/geo:${settings.lat};${settings.lon}/?token=${settings.apiKey}`,
					headers: {
						'Content-Length': 0,
					},
					method: 'GET',
				};
				const result = await this._makeHttpsRequest(options);
				const jsonData = JSON.parse(result.body);
				// console.log(util.inspect(jsonData, { depth: null, colors: true }));
				if (result.statusCode !== 200 || !result.headers['content-type'].includes('application/json')) {
					throw Error('Wrong content type, expected application/json');
				}
				if (jsonData.status !== 'ok') {
					throw Error(`Invalid response from API: ${JSON.stringify(jsonData)}`);
				}
				const results = jsonData.data;
				return Promise.resolve(results);
			} catch (error) {
				return Promise.reject(error.message);
			}
		};
		// returns a normalised values object with at least { parameter: string, value: number }, or {} if not valid
		this.getValue = (device, results, parameter) => {
			const { settings } = device;
			// older then 8 hrs
			const timeAgo = (new Date(Date.now() - (8 * 60 * 60 * 1000)));
			const lastUpdated = new Date(`${results.time.s}${results.time.tz}`);
			if (lastUpdated < timeAgo) {
				return {};
			}
			// parameter not present
			if (!results.iaqi[parameter]) {
				return {};
			}
			const value = {
				parameter,
				value: results.iaqi[parameter].v,
				lastUpdated,
				location: results.city.name,
				coordinates: { latitude: results.city.geo[0], longitude: results.city.geo[1] },
				url: results.city.url,
				distance: distance(settings.lat, settings.lon, results.city.geo[0], results.city.geo[1]),
			};
			return value;
		};
	}
}

module.exports = AQICNMonitorDriver;

/*
{ status: 'ok',
  data:
   { aqi: 25,
     idx: 4586,
     attributions:
      [ { url: 'http://www.luchtmeetnet.nl/',
          name: 'RIVM - Rijksinstituut voor Volksgezondheid en Milieum, Landelijk Meetnet Luchtkwaliteit' },
        { url: 'https://waqi.info/',
          name: 'World Air Quality Index Project' } ],
     city:
      { geo: [ 52.20153, 4.987444 ],
        name: 'Snelweg, Breukelen',
        url: 'https://aqicn.org/city/netherland/breukelen/snelweg' },
     dominentpol: 'pm25',
     iaqi:
      { h: { v: 77.5 },	// humidity
        no2: { v: 12 },
        o3: { v: 11.4 },
        p: { v: 1023.8 },	// pressure
        pm10: { v: 8 },
        pm25: { v: 25 },
        t: { v: 19.5 },	// temperature
        w: { v: 0.6 },	// wind
        wg: { v: 5.5 } },	// wind gusts?
     time: { s: '2019-09-03 10:00:00', tz: '+02:00', v: 1567504800 },
	 debug: { sync: '2019-09-03T17:45:41+09:00' } } }
*/