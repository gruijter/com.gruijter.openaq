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

const GenericAQMonitorDriver = require('../generic_aqmonitor_driver');

const driverSpecifics = {
  service: 'LD',
  apiKey: 'N/A',
};

const searchStrings = {
  pm1: 'P0',
  pm25: 'P2',
  pm10: 'P1',
  co2: 'co2_ppm',
  temperature: 'temperature',
  pressure: 'pressure',
  humidity: 'humidity',
  noise: 'noise_LAeq',
};

const capabilities = ['measure_pm1', 'measure_pm25', 'measure_pm10', 'measure_co2', 'measure_temperature', 'measure_pressure', 'measure_humidity', 'measure_noise'];

class LDMonitorDriver extends GenericAQMonitorDriver {

  onInit() {
    this.log('Luftdaten Monitor Driver started');

    this.ds = driverSpecifics;
    this.timeout = 30000;

    this.getRawData = async (device) => {
      try {
        const { settings } = device;
        let lat = settings ? settings.lat : null;
        let lon = settings ? settings.lon : null;
        if (settings && settings.station_loc) {
          const coordsMatch = settings.station_loc.match(/\(([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)\)/);
          if (coordsMatch) {
            lat = Number(coordsMatch[1]);
            lon = Number(coordsMatch[2]);
          }
        }

        const dst = Math.max(1, Math.ceil((settings && settings.dst) || 1));
        const url = `https://data.sensor.community/airrohr/v1/filter/area=${lat},${lon},${dst}`;

        const headers = {
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
          'User-Agent': 'Homey-OutdoorAirQuality/3.0.0',
        };

        const results = await this._fetchJson(url, { headers }, this.timeout);
        return Array.isArray(results) ? results : [results];
      } catch (error) {
        throw new Error(`Sensor.Community API Error: ${error.message}`);
      }
    };

    this.getValue = (device, results, parameter) => {
      const { settings } = device;
      const searchParam = searchStrings[parameter];
      if (!searchParam || !Array.isArray(results) || results.length === 0) return {};

      const matchesSearch = (dp) => {
        if (searchParam === 'pressure') {
          return dp.value_type === 'pressure' || dp.value_type === 'pressure_at_sealevel';
        }
        if (searchParam === 'co2_ppm') {
          return dp.value_type === 'co2_ppm' || dp.value_type === 'co2';
        }
        return dp.value_type === searchParam;
      };

      const eightHoursAgo = new Date(Date.now() - (8 * 60 * 60 * 1000));
      const maxDistMeters = (settings.dst || 25) * 1000;

      const filtered = results
        .filter((station) => station.location && station.sensordatavalues)
        .filter((station) => new Date(station.timestamp) > eightHoursAgo)
        .filter((station) => this.distance(settings.lat, settings.lon, station.location.latitude, station.location.longitude) <= maxDistMeters)
        .filter((station) => station.sensordatavalues.some(matchesSearch))
        .filter((station) => settings.include_indoor || !station.location.indoor)
        .sort((a, b) => this.distance(settings.lat, settings.lon, a.location.latitude, a.location.longitude)
          - this.distance(settings.lat, settings.lon, b.location.latitude, b.location.longitude));

      if (!filtered[0]) return {};

      const targetSensorId = filtered[0].sensor.id;
      const nearest = filtered
        .filter((st) => st.sensor.id === targetSensorId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      if (!nearest) return {};

      const dataPoint = nearest.sensordatavalues.find(matchesSearch);
      if (!dataPoint) return {};

      let valNum = Number(dataPoint.value);
      if (parameter === 'pressure') valNum /= 100; // Convert Pa to hPa

      const dist = this.distance(settings.lat, settings.lon, nearest.location.latitude, nearest.location.longitude);

      return {
        parameter,
        value: valNum,
        lastUpdated: new Date(nearest.timestamp),
        location: `ID:${nearest.sensor.id} (${nearest.location.latitude},${nearest.location.longitude})`,
        coordinates: { latitude: nearest.location.latitude, longitude: nearest.location.longitude },
        url: `https://maps.sensor.community/#14/${nearest.location.latitude}/${nearest.location.longitude}`,
        distance: Math.round(dist),
      };
    };

    this.discover = async (settings) => {
      try {
        const deviceSets = [];
        const results = await this.getRawData({ settings });

        const filtered = results
          .filter((st) => st.location && !st.location.indoor && st.sensordatavalues)
          .filter((st) => st.sensordatavalues.some((dp) => dp.value_type === 'P1' || dp.value_type === 'P2'));

        const unique = [];
        const seenIds = new Set();
        filtered.forEach((st) => {
          if (!seenIds.has(st.sensor.id)) {
            seenIds.add(st.sensor.id);
            unique.push(st);
          }
        });

        unique.sort((a, b) => {
          const distA = this.distance(settings.lat, settings.lon, a.location.latitude, a.location.longitude);
          const distB = this.distance(settings.lat, settings.lon, b.location.latitude, b.location.longitude);
          return distA - distB;
        });

        unique.slice(0, 5).forEach((station) => {
          const dist = this.distance(settings.lat, settings.lon, station.location.latitude, station.location.longitude);
          deviceSets.push({
            name: `LD Monitor ${station.sensor.id}@${Math.round(dist)}m`,
            lat: Number(station.location.latitude),
            lon: Number(station.location.longitude),
            dst: 0.01,
            stationDst: `${Math.round(dist)}`,
            stationLoc: `ID:${station.sensor.id} (${station.location.latitude},${station.location.longitude})`,
            includeIndoor: false,
            pollingInterval: 1,
            capabilities,
          });
        });

        return deviceSets;
      } catch (error) {
        this.error('LD discover error:', error);
        throw error;
      }
    };
  }

}

module.exports = LDMonitorDriver;
