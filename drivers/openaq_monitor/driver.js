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

const driverSpecifics = {
  service: 'OpenAQ',
  apiKey: 'N/A',
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
          path: `/v2/latest?coordinates=${settings.lat},${settings.lon}&radius=${settings.dst * 1000}`,
          headers: {
            'Content-Length': 0,
          },
          method: 'GET',
        };
        const result = await this._makeHttpsRequest(options);
        if (result.statusCode !== 200) throw Error(result.statusCode);
        if (!result.headers['content-type'].includes('application/json')) {
          throw Error('Wrong content type, expected application/json');
        }
        const jsonData = JSON.parse(result.body);
        // console.log(util.inspect(jsonData, { depth: null, colors: true }));
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
        const filteredArray = result.measurements.filter((measurement) => measurement.parameter === parameter);
        return filteredArray.length > 0;
      });
      // console.log(util.inspect(hasParameter, { depth: null, colors: true }));
      // get the most recent value that is most nearby, is not zero or negative, is not older then 8 hrs
      const timeAgo = (new Date(Date.now() - (8 * 60 * 60 * 1000))).toISOString();
      const latestValue = hasParameter.reduce((accu, current) => {
        const currentMeasurement = current.measurements.filter((measurement) => measurement.parameter === parameter);
        currentMeasurement[0].location = current.location;
        currentMeasurement[0].coordinates = current.coordinates;
        const dist = this.distance(settings.lat, settings.lon, current.coordinates.latitude, current.coordinates.longitude);
        currentMeasurement[0].distance = Math.round(dist);
        const bmTm = Date.parse(accu.lastUpdated);
        const cmTm = Date.parse(currentMeasurement[0].lastUpdated);
        if (!(currentMeasurement[0].value > 0) || (bmTm >= cmTm)) return accu;
        return currentMeasurement[0];
      }, { lastUpdated: timeAgo });
      return latestValue;
    };
    this.discover = async (settings) => {
      try {
        const deviceSets = [
          {
            name: 'OAQ Monitor @Homey',
            capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
          },
          {
            name: 'OAQ monitor @Homey_with_BC',
            capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co', 'measure_bc'],
          },
        ];
        const results = await this.getRawData({ settings });
        const timeAgo = new Date(Date.now() - (8 * 60 * 60 * 1000)); // 8 hours
        const withData = results.filter((station) => {
          const hasData = station.measurements.filter((measurement) => (measurement.value > 0)
            && (Date.parse(measurement.lastUpdated) > timeAgo));
          return hasData.length > 0;
        });
        const sorted = withData.sort((a, b) => this.distance(settings.lat, settings.lon, a.coordinates.latitude, a.coordinates.longitude)
          - this.distance(settings.lat, settings.lon, b.coordinates.latitude, b.coordinates.longitude));
        // add the 5 nearest stations
        sorted.forEach((station, index) => {
          if (index > 4) return;
          const dist = this.distance(settings.lat, settings.lon, station.coordinates.latitude, station.coordinates.longitude);
          const set = {
            name: `OAQ Monitor ${station.city || station.location}@${Math.round(dist)}m`,
            lat: Number(station.coordinates.latitude),
            lon: Number(station.coordinates.longitude),
            dst: 0.01,
            stationDst: `${Math.round(dist)}`,
            capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
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

module.exports = OpenAQMonitorDriver;

/*
{
  "meta": {
    "name": "openaq-api",
    "license": "CC BY 4.0d",
    "website": "https://u50g7n0cbj.execute-api.us-east-1.amazonaws.com/",
    "page": 1,
    "limit": 100,
    "found": 93
  },
  "results": [
    {
      "location": "Botlek-Spoortunnel",
      "city": "Botlek",
      "country": "NL",
      "coordinates": {
        "latitude": 51.8701,
        "longitude": 4.31806
      },
      "measurements": [
        {
          "parameter": "no2",
          "value": -995,
          "lastUpdated": "2016-03-24T08:00:00+00:00",
          "unit": "µg/m³"
        },
        {
          "parameter": "pm25",
          "value": -995,
          "lastUpdated": "2016-03-24T08:00:00+00:00",
          "unit": "µg/m³"
        },
        {
          "parameter": "pm10",
          "value": -995,
          "lastUpdated": "2016-03-24T08:00:00+00:00",
          "unit": "µg/m³"
        }
      ]
    },
    {
      "location": "Leiden-Willem de Zwijgerlaan",
      "city": "Leiden",
      "country": "NL",
      "coordinates": {
        "latitude": 52.1678,
        "longitude": 4.50756
      },
      "measurements": [
        {
          "parameter": "pm10",
          "value": 18.99,
          "lastUpdated": "2015-09-14T04:00:00+00:00",
          "unit": "µg/m³"
        }
      ]
    },
    {
      "location": "Balk-Trophornsterweg",
      "city": "Balk",
      "country": "NL",
      "coordinates": {
        "latitude": 52.9169,
        "longitude": 5.57349
      },
      "measurements": [
        {
          "parameter": "o3",
          "value": 57.27,
          "lastUpdated": "2021-02-27T03:00:00+00:00",
          "unit": "µg/m³"
        },
        {
          "parameter": "pm10",
          "value": -7.09,
          "lastUpdated": "2021-02-27T03:00:00+00:00",
          "unit": "µg/m³"
        },
        {
          "parameter": "no2",
          "value": 3.09,
          "lastUpdated": "2021-02-27T03:00:00+00:00",
          "unit": "µg/m³"
        }
      ]
    },
*/

/* V1 (oud)
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
