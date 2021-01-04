/* eslint-disable max-len */
/*
Copyright 2019 - 2021, Robin de Gruijter (gruijter@hotmail.com)

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
const querystring = require('querystring');
const GenericAQMonitorDriver = require('../generic_aqmonitor_driver.js');

const driverSpecifics = {
	service: 'LuchtmeetnetNL',
	apiKey: 'N/A',
	capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co', 'measure_bc',
		'measure_no', 'measure_c6h6', 'measure_c7h8', 'measure_c8h10', 'measure_h2s', 'measure_ufp', 'measure_nh3'],
};

class LMNMonitorDriver extends GenericAQMonitorDriver {
	onInit() {
		this.log('LMN (NL) Monitor Driver started');

		// add service specific properties and functions
		this.ds = driverSpecifics;
		this.timeout = 30000;
		// get raw data from service in JSON format
		this.requestData = async (path, query) => {
			try {
				let page = 1;
				const maxPage = 50;
				let lastPage = 1;
				let data = [];
				do {
					const options = {
						hostname: 'api.luchtmeetnet.nl',
						path: `/open_api${path}?page=${page}&${query}`,
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
					if (!jsonData.data) {
						throw Error(`Invalid response from API. ${jsonData.message}`);
					}
					// console.log(util.inspect(jsonData, { depth: null, colors: true }));
					lastPage = jsonData.pagination ? jsonData.pagination.last_page : 1;
					page += 1;
					if (Array.isArray(jsonData.data)) {
						data = data.concat(jsonData.data);
					} else data.push(jsonData.data);
				} while (page < lastPage || page > maxPage);

				if (data.length === 1 && data[0].components) {	// apparently this is a station
					return Promise.resolve(data[0]);
				}
				return Promise.all(data);
			} catch (error) {
				return Promise.reject(error.message);
			}
		};
		// get all stations in NL, with distance to Homey device, and latest 8H measurements
		this.getAllStations = async (device) => {
			try {
				const { settings } = device;

				// get all measurements from past 8 hours
				const timeAgo = (new Date(Date.now() - (8 * 60 * 60 * 1000))).toISOString();
				const now = new Date(Date.now()).toISOString();
				const getMeasurementsPath = '/measurements';
				const query = {
					start: timeAgo,
					end: now,
				};
				const allMeasurements = await this.requestData(getMeasurementsPath, querystring.encode(query));

				// get all station names
				const stationListPath = '/stations/';
				const stationList = await this.requestData(stationListPath);

				// get all stations
				const stationsPromise = [];
				stationList.forEach((station) => {
					const stationInfo = new Promise(async (resolve, reject) => {
						try {
							const stationInfoPath = `/stations/${station.number}`;
							const info = await this.requestData(stationInfoPath)
								.catch((error) => { throw error; });
							// add distance
							info.dst = this.distance(settings.lat, settings.lon, info.geometry.coordinates[0], info.geometry.coordinates[1]);
							// add measurements
							const measurements = allMeasurements.filter((measurement) => measurement.station_number === station.number);
							const lastMeasurements = {};
							info.components.forEach((component) => {
								const compMeasurements = measurements.filter((measurement) => measurement.formula === component);
								if (compMeasurements.length > 0) {
									const first = {
										value: compMeasurements[0].value,
										timestamp_measured: compMeasurements[0].timestamp_measured,
									};
									const comp = component.toLowerCase();
									lastMeasurements[comp] = compMeasurements.reduce((accu, current) => {
										if (new Date(accu.timestamp_measured) > new Date(current.timestamp_measured)) {
											return accu;
										}
										return {
											value: current.value,
											timestamp_measured: current.timestamp_measured,
										};
									}, first);
								}
							});
							info.measurements = lastMeasurements;
							Object.assign(station, info);
							return resolve(station);
						} catch (error) {
							return reject(error);
						}
					});
					stationsPromise.push(stationInfo);
				});
				const stations = await Promise.all(stationsPromise);

				// sort by distance
				stations.sort((a, b) => a.dst - b.dst);
				return Promise.resolve(stations);
			} catch (error) {
				return Promise.reject(error.message);
			}
		};
		// get raw data from service in JSON format
		this.getRawData = async (device) => {
			try {
				// get all stations
				const stations = await this.getAllStations(device);
				// closest station:
				const closestStation = stations[0] || {};
				// console.log(util.inspect(closestStation, { depth: null, colors: true }));
				return Promise.resolve(closestStation);	// measurements from nearest station in last 8 hours
			} catch (error) {
				return Promise.reject(error);
			}
		};
		// returns a normalised values object with at least { parameter: string, value: number }
		this.getValue = (device, results, parameter) => {
			const { settings } = device;
			// select the nearest station
			const station = results;
			if (!station.measurements || !Object.keys(station.measurements).includes(parameter)) return {};
			const lastMeasurements = station.measurements;
			const value = {
				parameter,
				value: Number(lastMeasurements[parameter].value),
				lastUpdated: new Date(lastMeasurements[parameter].timestamp_measured),
				location: `${station.number} (${settings.lat},${settings.lon})`,
				coordinates: { latitude: settings.lat, longitude: settings.lon },
				url: `http://maps.google.com/maps?q=loc:${settings.lat},${settings.lon}`,
				distance: `${station.dst}`,
			};
			return value;
		};
		this.discover = async (settings) => {
			try {
				const deviceSets = [
					{
						name: 'LMN Monitor @Homey',
						capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
					},
				];
				const stations = await this.getAllStations({ settings });
				// add the 5 nearest stations
				stations.forEach((station, index) => {
					if (index > 4) return;
					const capabilities = [];
					station.components.forEach((component) => capabilities.push(`measure_${component.toLowerCase()}`));
					const set = {
						name: `LMN Monitor ${station.number}@${Math.round(station.dst)}m`,
						lat: Number(station.geometry.coordinates[0]),
						lon: Number(station.geometry.coordinates[1]),
						dst: 0.01,
						stationDst: `${station.dst}`,
						capabilities,
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

module.exports = LMNMonitorDriver;

/*

rawData[station]:

{ number: 'NL10636',
  location: 'Utrecht-Kardinaal de Jongweg',
  description:
   { EN: 'Measuring station Utrecht-Kardinaal de Jongweg is classified as a street station. The air quality at this location is largely determined by road traffic emissions. The Kardinaal de Jongweg is a very busy street in Utrecht. The National Institute for Public Health and the Environment (RIVM) is measuring the air quality at this location.',
     NL: 'Meetstation Kardinaal de Jongweg in Utrecht is een straatstation. Op deze locatie wordt de luchtkwaliteit voor een belangrijk deel bepaald door de uitstoot van het wegverkeer. De Kardinaal de Jongweg is een zeer drukke straat in Utrecht. Het RIVM meet hier de luchtkwaliteit.' },
  municipality: null,
  url: '',
  organisation: 'RIVM',
  geometry: { type: 'Point', coordinates: [ 52.105031, 5.124464 ] },
  type: 'traffic',
  province: 'Utrecht',
  year_start: '',
  components: [ 'PM25', 'NO', 'PM10', 'NO2' ],
  dst: 8530,
  measurements:
   { pm25:
      { value: 4.18612,
        timestamp_measured: '2019-09-08T17:00:00+00:00' },
     no: { value: 1.57, timestamp_measured: '2019-09-08T17:00:00+00:00' },
     pm10:
      { value: 31.31,
        timestamp_measured: '2019-09-08T17:00:00+00:00' },
     no2: { value: 4.4, timestamp_measured: '2019-09-08T17:00:00+00:00' } } }

/measurements :

[ { formula: 'PS',
    station_number: 'NL49022',
    value: 11930,
    timestamp_measured: '2019-09-08T13:00:00+00:00' },
  { formula: 'C8H10',
    station_number: 'NL49704',
    value: 0,
    timestamp_measured: '2019-09-08T13:00:00+00:00' },
  { formula: 'NO2',
    station_number: 'NL49704',
    value: 3.6,
    timestamp_measured: '2019-09-08T13:00:00+00:00' },
  { formula: 'PM25',
	station_number: 'NL49704',

/stations/NL01489 :
{ data:
	{ year_start: '2011',
		municipality: null,
		type: 'regional',
		url: '',
		province: 'Limburg',
		location: 'Horst a/d Maas - Hoogheide ',
		organisation: 'Provincie Limburg',
		geometry: { type: 'Point', coordinates: [ 51.45412, 6.10821 ] },
		components: [ 'PM25', 'PM10', 'NO2', 'NO', 'O3', 'NH3'],
		description: {
			NL: 'Meetstation Horst aan de Maas- Hoogheide is een achtergrondstation. Op deze locatie wonen weinig mensen en er zijn geen drukke wegen, havens of industriegebieden in de buurt. De Provincie Limburg meet hier de luchtkwaliteit in samenwerking met de gemeente Horst aan de Maas.',
			EN: 'Measuring station Horst aan de Maas- Hoogheide is classified as a background station. A few people live at this location and there are no busy roads, ports or industrial areas in the immediate vicinity. The Province of Limburg is measuring the air quality at this location in collaboration with the municipality of Horst aan de Maas.'
		}
	}
}

/stations :
{ data:
	[	{ location: 'Ridderkerk-A16', number: 'NL01489' },
		{ location: 'Ridderkerk-Voorweg', number: 'NL01912' },
		{ location: 'Rotterdam-Bentinckplein', number: 'NL10448' },
		{ location: 'Rotterdam-Botlek_A15', number: 'NL01483' },
		{ location: 'Rotterdam-Geulhaven', number: 'NL01484' },
		{ location: 'Rotterdam-Hoogvliet', number: 'NL01485' },
		{ location: 'Rotterdam-Pernis', number: 'NL01486' },
		{ location: 'Rotterdam-Pleinweg', number: 'NL01487' },
		{ location: 'Rotterdam-Schiedamsevest', number: 'NL10418' },
		{ location: 'Rotterdam-Statenweg', number: 'NL01493' },
		{ location: 'Rotterdam-Vasteland', number: 'NL01492' },
		{ location: 'Rotterdam-Zwartewaalstraat', number: 'NL01488' },
		{ location: 'Schiedam-A.Arienstraat', number: 'NL01494' },
		{ location: 'Schipluiden', number: 'NL10411' },
		{ location: 'Spaarnwoude-Machineweg', number: 'NL49703' },
		{ location: 'Strijensas Buitendijk', number: 'NL53020' },
		{ location: 'Utrecht-Constant Erzeijstraat', number: 'NL10639' },
		{ location: 'Utrecht-Griftpark', number: 'NL10643' },
		{ location: 'Utrecht-Kardinaal de Jongweg', number: 'NL10636' },
		{ location: 'Valthermond-Noorderdiep', number: 'NL10929' },
		{ location: 'Veldhoven-Europalaan', number: 'NL10247' },
		{ location: 'Velsen-Reyndersweg', number: 'NL49573' },
		{ location: 'Velsen-Staalstraat', number: 'NL49572' },
		{ location: 'Vlaardingen-Floreslaan', number: 'NL10433' },
		{ location: 'Vlaardingen-Lyceumlaan', number: 'NL10416' }
	],
pagination:
	{	next_page: 5,
		first_page: 1,
		prev_page: 3,
		page_list: [ 1, 2, 3, 4, 5 ],
		last_page: 5,
		current_page: 4
	}
}

*/
