/*
Copyright 2019 - 2026, Robin de Gruijter (gruijter@hotmail.com)

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
const GenericAQMonitorDriver = require('../generic_aqmonitor_driver');

const driverSpecifics = {
  service: 'WAQI',
  apiKey: '',
};

class WAQIMonitorDriver extends GenericAQMonitorDriver {

  onInit() {
    this.log('WAQI Monitor Driver started');

    this.ds = driverSpecifics;
    this.timeout = 30000;

    this.getRawData = async (device) => {
      try {
        const { settings } = device;
        const token = (settings.api_key && settings.api_key.trim().length > 0)
          ? settings.api_key.trim()
          : Homey.env.WAQI_API_KEY;

        if (!token) {
          throw new Error('No WAQI API key configured');
        }

        const url = `https://api.waqi.info/feed/geo:${settings.lat};${settings.lon}/?token=${token}`;
        const jsonData = await this._fetchJson(url, { headers: { Accept: 'application/json' } }, this.timeout);

        if (jsonData.status !== 'ok' || !jsonData.data) {
          throw new Error(`WAQI API status error: ${jsonData.data || jsonData.status}`);
        }

        return jsonData.data;
      } catch (error) {
        throw new Error(`WAQI API Error: ${error.message}`);
      }
    };

    this.getValue = (device, results, parameter) => {
      const { settings } = device;
      if (!results || !results.iaqi || !results.time) return {};

      const timeAgo = new Date(Date.now() - (8 * 60 * 60 * 1000));
      const lastUpdated = results.time.iso ? new Date(results.time.iso) : new Date(`${results.time.s}${results.time.tz}`);
      if (lastUpdated < timeAgo) return {};

      if (!results.iaqi[parameter] || results.iaqi[parameter].v === undefined) return {};

      const lat = (results.city && results.city.geo) ? results.city.geo[0] : settings.lat;
      const lon = (results.city && results.city.geo) ? results.city.geo[1] : settings.lon;
      const dist = this.distance(settings.lat, settings.lon, lat, lon);

      return {
        parameter,
        value: Number(results.iaqi[parameter].v),
        lastUpdated,
        location: results.city ? results.city.name : 'WAQI Station',
        coordinates: { latitude: lat, longitude: lon },
        url: results.city ? results.city.url : 'https://aqicn.org',
        distance: Math.round(dist),
      };
    };

    this.discover = async (settings) => {
      try {
        const deviceSets = [
          {
            name: 'WAQI Monitor @Homey',
            capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
          },
        ];

        const bounds = this.getBounds(settings.lat, settings.lon, settings.dst || 25);
        const token = (settings.api_key && settings.api_key.trim().length > 0)
          ? settings.api_key.trim()
          : Homey.env.WAQI_API_KEY;

        if (!token) return deviceSets;

        const url = `https://api.waqi.info/map/bounds/?latlng=${bounds.lamin},${bounds.lomin},${bounds.lamax},${bounds.lomax}&token=${token}`;
        const jsonData = await this._fetchJson(url, { headers: { Accept: 'application/json' } }, this.timeout);

        if (jsonData.status === 'ok' && Array.isArray(jsonData.data)) {
          const sorted = jsonData.data.sort((a, b) => {
            const distA = this.distance(settings.lat, settings.lon, a.lat, a.lon);
            const distB = this.distance(settings.lat, settings.lon, b.lat, b.lon);
            return distA - distB;
          });

          sorted.slice(0, 5).forEach((station) => {
            const dist = this.distance(settings.lat, settings.lon, station.lat, station.lon);
            deviceSets.push({
              name: `WAQI Monitor ${station.uid}@${Math.round(dist)}m`,
              lat: Number(station.lat),
              lon: Number(station.lon),
              dst: 0.01,
              stationDst: `${Math.round(dist)}`,
              capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
            });
          });
        }

        return deviceSets;
      } catch (error) {
        this.error('WAQI discover error:', error);
        throw error;
      }
    };
  }

}

module.exports = WAQIMonitorDriver;
