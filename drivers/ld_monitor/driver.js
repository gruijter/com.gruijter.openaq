/*
Copyright 2019 - 2025, Robin de Gruijter (gruijter@hotmail.com)

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
const GenericAQMonitorDriver = require('../generic_aqmonitor_driver');

// service specific properties
const driverSpecifics = {
  service: 'LD',
  apiKey: 'N/A',
};

const searchStrings = {
  pm25: 'P2',
  pm10: 'P1',
  temperature: 'temperature',
  pressure: 'pressure',
  humidity: 'humidity',
  noise: 'noise_LAeq', // (dBA)
};

const capabilities = ['measure_pm25', 'measure_pm10', 'measure_temperature', 'measure_pressure', 'measure_humidity', 'measure_noise'];

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
        // get station ID
        let id = null;
        if (settings && settings.station_loc) {
          const idMatch = settings.station_loc.match(/ID:(\d+)/);
          if (idMatch) id = Number(idMatch[1]);
        }
        // otherwise get all stations in the area
        const dst = settings.dst >= 1 ? settings.dst : 1;
        const options = {
          hostname: 'data.sensor.community', // old: 'api.luftdaten.info'
          path: `/airrohr/v1/filter/area=${settings.lat},${settings.lon},${dst}`,
          headers: {
            // 'Content-Length': 0,
            'Cache-Control': 'no-cache',
            Host: 'data.sensor.community',
            // Origin: 'https://maps.sensor.community',
            // Referer: 'https://maps.sensor.community/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            Accept: '*/*',
            Connection: 'keep-alive',
          },
          method: 'GET',
        };
        if (id) options.path = `/airrohr/v1/sensor/${id}/`;
        // console.log(options);
        const result = await this._makeHttpsRequest(options);
        // console.log(result.statusCode, result.body);
        if (result.statusCode !== 200 || !result.headers['content-type'].includes('application/json')) {
          throw Error('Wrong content type, expected application/json');
        }
        const jsonData = JSON.parse(result.body);
        // console.log('raw:');
        // console.log(util.inspect(jsonData, { depth: null, colors: true }));
        const results = jsonData;
        return Promise.resolve(results);
      } catch (error) {
        return Promise.reject(error.message);
      }
    };

    // returns a normalised values object with at least { parameter: string, value: number }, or {} if not valid
    this.getValue = (device, results, parameter) => {
      // console.log(util.inspect(results, true, 10, true));
      const { settings } = device;
      const searchParam = searchStrings[parameter];
      if (!searchParam) return {};
      const timeAgo = (new Date(Date.now() - (8 * 60 * 60 * 1000)));
      const maxDist = settings.dst * 1000;
      const filtered = results
        .filter((station) => new Date(station.timestamp) > timeAgo) // not older then 8 hrs
        .filter((station) => this.distance(settings.lat, settings.lon, station.location.latitude, station.location.longitude) <= maxDist)
        .filter((station) => { // has the requested parameter
          const found = station.sensordatavalues.filter((dataPoint) => dataPoint.value_type === searchParam);
          return found.length > 0;
        })
        .filter((station) => settings.include_indoor || !station.location.indoor) // include indoor stations or not
        .sort((a, b) => this.distance(settings.lat, settings.lon, a.location.latitude, a.location.longitude) // sort based on distance
          - this.distance(settings.lat, settings.lon, b.location.latitude, b.location.longitude));

      // console.log('filtered and sorted:');
      // console.log(util.inspect(filtered, true, 10, true));

      if (!filtered[0]) return {};
      const [nearest] = filtered // get most recent results from nearest station
        .filter((station) => station.sensor.id === filtered[0].sensor.id)
        .sort((a, b) => new Date(a.timestamp) > new Date(b.timestamp));

      // console.log('nearest:');
      // console.log(util.inspect(nearest, true, 10, true));
      const value = {
        parameter,
        value: Number(nearest.sensordatavalues.filter((dataPoint) => dataPoint.value_type === searchParam)[0].value),
        lastUpdated: new Date(nearest.timestamp),
        location: `ID:${nearest.sensor.id} (${nearest.location.latitude},${nearest.location.longitude})`,
        coordinates: { latitude: nearest.location.latitude, longitude: nearest.location.longitude },
        url: `https://maps.sensor.community/#14/${nearest.location.latitude}/${nearest.location.longitude}`,
        distance: this.distance(settings.lat, settings.lon, nearest.location.latitude, nearest.location.longitude),
      };
      if (parameter === 'pressure') value.value /= 100;
      return value;
    };

    this.discover = async (settings) => {
      try {
        const deviceSets = [
          // {
          //  name: 'LD Monitor @Homey',
          //  includeIndoor: false,
          //  pollingInterval: 1,
          //  dst: settings.dst,
          //  capabilities,
          // },
          // {
          //  name: 'LD Monitor @Homey_with_indoor',
          //  includeIndoor: true,
          //  pollingInterval: 1,
          //  dst: settings.dst,
          //  capabilities,
          // },
        ];
        const results = await this.getRawData({ settings });
        const filtered = results
          .filter((station) => { // has the requested parameter
            const found = station.sensordatavalues.filter((dataPoint) => (dataPoint.value_type === 'P1')
              || (dataPoint.value_type === 'P2'));
            return found.length > 0;
          })
          .filter((station) => !station.location.indoor); // only outdoor sensors
        const uniqueFiltered = filtered.reduce((unique, station) => { // remove doubles
          const sameID = unique.filter((uStation) => uStation.sensor.id === station.sensor.id);
          const found = sameID.length > 0;
          return found ? unique : [...unique, station];
        }, []);
        const sorted = uniqueFiltered.sort((a, b) => { // sort by distance
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
            stationLoc: `ID:${station.sensor.id} (${station.location.latitude},${station.location.longitude})`,
            includeIndoor: false,
            pollingInterval: 1,
            capabilities,
          };
          deviceSets.push(set);
        });
        // console.log(util.inspect(deviceSets, true, null, true));
        return Promise.all(deviceSets);
      } catch (error) {
        return Promise.reject(error);
      }
    };
  }

}

module.exports = LDMonitorDriver;

/*
2025 docs: https://api-sensor-community.bessarabov.com/

12_2022 API info: https://github.com/opendata-stuttgart/meta/wiki/APIs

website: https://sensor.community/
LD station database: https://public.opendatasoft.com/explore/dataset/api-luftdateninfo/

api info: https://luftdaten.info/faq/#toggle-id-8
GitHub api info: https://github.com/opendata-stuttgart/meta/wiki/APIs

Wir stellen die Daten der Sensoren als JSON-Dateien bereit, die jede Minute aktualisiert werden.
Alle Sensorenwerte der letzten 5 Minuten -> http://api.luftdaten.info/static/v1/data.json
Werte der letzten 5 Minuten eines bestimmten Sensors -> http://api.luftdaten.info/v1/sensor/sensorid/

[ { id: 5935220196,
    location:
     { country: 'BE',
       id: 15177,
       indoor: 0,
       longitude: '4.412',
       altitude: '72.8',
       exact_location: 0,
       latitude: '50.844' },
    sensordatavalues:
     [ { id: 12607161900, value: '29.57', value_type: 'P1' },
       { value: '16.87', id: 12607161901, value_type: 'P2' },
       [length]: 2 ],
    sensor:
     { id: 27796,
       pin: '1',
       sensor_type: { manufacturer: 'Nova Fitness', name: 'SDS011', id: 14 } },
    sampling_rate: null,
    timestamp: '2020-01-01 10:57:01' },
  { location:
     { latitude: '51.842',
       exact_location: 0,
       id: 11774,
       country: 'NL',
       altitude: '30.9',
       indoor: 0,
       longitude: '5.858' },
    id: 5935220194,
    sensordatavalues:
     [ { value_type: 'temperature', id: 12607161896, value: '2.40' },
       { value_type: 'humidity', id: 12607161897, value: '99.90' },
       [length]: 2 ],
    sensor:
     { id: 23210,
       pin: '7',
       sensor_type: { name: 'DHT22', id: 9, manufacturer: 'various' } },
    timestamp: '2020-01-01 10:57:01',
    sampling_rate: null },
  { sensordatavalues:
     [ { value_type: 'temperature', id: 12607161885, value: '10.30' },
       { value_type: 'humidity', value: '94.80', id: 12607161886 },
       [length]: 2 ],
    location:
     { latitude: '50.796',
       exact_location: 0,
       country: 'DE',
       id: 2018,
       indoor: 0,
       longitude: '7.132',
       altitude: '53.0' },
    id: 5935220189,
    timestamp: '2020-01-01 10:57:01',
    sampling_rate: null,
    sensor:
     { sensor_type: { id: 9, name: 'DHT22', manufacturer: 'various' },
       id: 4008,
       pin: '7' } },
  { sensordatavalues:
     [ { value: '4.30', id: 12607161880, value_type: 'temperature' },
       { value_type: 'humidity', value: '74.50', id: 12607161884 },
       [length]: 2 ],
    location:
     { latitude: '50.98868222751',
       id: 14536,
       country: 'DE',
       indoor: 0,
       altitude: '50.4',
       longitude: '7.03727155924',
       exact_location: 1 },
    id: 5935220187,
    timestamp: '2020-01-01 10:57:01',
    sampling_rate: null,
    sensor:
     { sensor_type: { manufacturer: 'various', id: 9, name: 'DHT22' },
       id: 26988,
       pin: '7' } },
  { location:
     { latitude: '50.98935082139',
       exact_location: 1,
       id: 20361,
       country: 'BE',
       altitude: '14.7',
       indoor: 0,
       longitude: '4.80760484934' },
    id: 5935220172,
    sensordatavalues:
     [ { value_type: 'temperature', value: '5.30', id: 12607161847 },
       { value: '78.90', id: 12607161848, value_type: 'humidity' },
       [length]: 2 ],
    sensor:
     { sensor_type: { manufacturer: 'various', name: 'DHT22', id: 9 },
       id: 34083,
       pin: '7' },
    timestamp: '2020-01-01 10:57:01',
    sampling_rate: null },

*/

/*
DOESNT WORK ANYMORE???

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
