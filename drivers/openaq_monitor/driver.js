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

const GenericAQMonitorDriver = require('../generic_aqmonitor_driver.js');

const driverSpecifics = {
	service: 'OpenAQ',
	apiKey: 'N/A',
	deviceSets: [
		{
			name: 'OpenAQ Monitor',
			capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
		},
		{
			name: 'AQMonitor_with_BC',
			capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co', 'measure_bc'],
		},
	],
};

class OpenAQMonitorDriver extends GenericAQMonitorDriver {
	onInit() {
		this.log('OpenAQ Monitor Driver started');

		// add service specific properties and functions
		this.ds = driverSpecifics;
		this.timeout = 30000;
		// get raw data from service in JSON format
		this.getRawData = async (device) => {
			try {
				const { settings } = device;
				const options = {
					hostname: 'api.openaq.org',
					path: `/v1/latest?coordinates=${settings.lat},${settings.lon}&radius=${settings.dst * 1000}&order_by=distance`,
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
				if (jsonData.results === undefined) {
					throw Error('Invalid response from API');
				}
				const { results } = jsonData;
				return Promise.resolve(results);
			} catch (error) {
				return Promise.reject(error.message);
			}
		};
		// returns a normalised values object with at least { parameter: string, value: number }
		this.getValue = (device, results, parameter) => {
			// eslint-disable-next-line no-unused-vars
			const { settings } = device;
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
				currentMeasurement[0].distance = Math.round(current.distance);
				const bmTm = Date.parse(accu.lastUpdated);
				const cmTm = Date.parse(currentMeasurement[0].lastUpdated);
				if (!(currentMeasurement[0].value > 0) || (bmTm >= cmTm)) return accu;
				return currentMeasurement[0];
			}, { lastUpdated: timeAgo });
			return latestValue;
		};

	}
}

module.exports = OpenAQMonitorDriver;

/*
{ meta:
   { name: 'openaq-api',
     license: 'CC BY 4.0',
     website: 'https://docs.openaq.org/',
     page: 1,
     limit: 100,
     found: 105 },
  results:
   [ { location: 'Utrecht-Kardinaal de Jongweg',
       city: 'Utrecht',
       country: 'NL',
       distance: 8532.12283846661,
       measurements:
        [ { parameter: 'no2',
            value: 54.92,
            lastUpdated: '2016-09-08T06:00:00.000Z',
            unit: 'µg/m³',
            sourceName: 'Netherlands',
            averagingPeriod: { value: 1, unit: 'hours' } },
          { parameter: 'pm10',
            value: 19.63,
            lastUpdated: '2016-09-08T06:00:00.000Z',
            unit: 'µg/m³',
            sourceName: 'Netherlands',
            averagingPeriod: { value: 24, unit: 'hours' } },
          { parameter: 'pm25',
            value: 9.280301,
            lastUpdated: '2016-09-08T06:00:00.000Z',
            unit: 'µg/m³',
            sourceName: 'Netherlands',
            averagingPeriod: { value: 24, unit: 'hours' } } ],
       coordinates: { latitude: 52.105, longitude: 5.12446 } },
     { location: 'Utrecht-de Jongweg',
       city: 'Utrecht',
       country: 'NL',
       distance: 8532.12283846661,
       measurements:
        [ { parameter: 'pm25',
            value: 8.406,
            lastUpdated: '2019-09-03T09:00:00.000Z',
            unit: 'µg/m³',
            sourceName: 'Netherlands',
            averagingPeriod: { value: 24, unit: 'hours' } },
          { parameter: 'pm10',
            value: 4.43,
            lastUpdated: '2019-09-03T09:00:00.000Z',
            unit: 'µg/m³',
            sourceName: 'Netherlands',
            averagingPeriod: { value: 24, unit: 'hours' } },
          { parameter: 'no2',
            value: 22.05,
            lastUpdated: '2019-09-03T09:00:00.000Z',
            unit: 'µg/m³',
            sourceName: 'Netherlands',
            averagingPeriod: { value: 1, unit: 'hours' } } ],
       coordinates: { latitude: 52.105, longitude: 5.12446 } },
*/
