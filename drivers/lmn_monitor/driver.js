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
  service: 'LuchtmeetnetNL',
  apiKey: 'N/A',
  capabilities: [
    'measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3',
    'measure_co', 'measure_bc', 'measure_no', 'measure_c6h6', 'measure_c7h8',
    'measure_c8h10', 'measure_h2s', 'measure_ufp', 'measure_nh3',
  ],
};

class LMNMonitorDriver extends GenericAQMonitorDriver {

  onInit() {
    this.log('LMN (NL) Monitor Driver started');

    this.ds = driverSpecifics;
    this.timeout = 30000;

    this.getRawData = async (device) => {
      try {
        const { settings } = device;
        let stationNumber = null;
        if (settings && settings.station_loc) {
          const match = settings.station_loc.match(/(NL\d+)/i);
          if (match) stationNumber = match[1].toUpperCase();
        }

        if (!stationNumber) {
          // Find nearest station if not set
          const stationListRes = await this._fetchJson('https://api.luchtmeetnet.nl/open_api/stations', {}, this.timeout);
          const list = (stationListRes && stationListRes.data) ? stationListRes.data : [];
          if (list.length === 0) throw new Error('No Luchtmeetnet stations available');

          const sorted = list.sort((a, b) => {
            const latA = a.geometry ? a.geometry.coordinates[0] : 0;
            const lonA = a.geometry ? a.geometry.coordinates[1] : 0;
            const latB = b.geometry ? b.geometry.coordinates[0] : 0;
            const lonB = b.geometry ? b.geometry.coordinates[1] : 0;
            return this.distance(settings.lat, settings.lon, latA, lonA)
              - this.distance(settings.lat, settings.lon, latB, lonB);
          });
          stationNumber = sorted[0].number;
        }

        const [infoRes, measurementsRes] = await Promise.all([
          this._fetchJson(`https://api.luchtmeetnet.nl/open_api/stations/${stationNumber}`, {}, this.timeout).catch(() => null),
          this._fetchJson(`https://api.luchtmeetnet.nl/open_api/stations/${stationNumber}/measurements?page=1`, {}, this.timeout),
        ]);

        const stationInfo = (infoRes && infoRes.data) ? infoRes.data : {};
        const measurements = (measurementsRes && measurementsRes.data) ? measurementsRes.data : [];

        // Build latest measurement per formula
        const latestByFormula = {};
        measurements.forEach((m) => {
          const formula = m.formula ? m.formula.toLowerCase() : null;
          if (formula && m.value !== undefined && m.value !== null) {
            const currentLatest = latestByFormula[formula];
            const mTime = new Date(m.timestamp_measured).getTime();
            if (!currentLatest || mTime > currentLatest.time) {
              latestByFormula[formula] = {
                value: Number(m.value),
                time: mTime,
                timestamp: m.timestamp_measured,
              };
            }
          }
        });

        const lat = stationInfo.geometry ? stationInfo.geometry.coordinates[0] : settings.lat;
        const lon = stationInfo.geometry ? stationInfo.geometry.coordinates[1] : settings.lon;
        const dist = this.distance(settings.lat, settings.lon, lat, lon);

        return {
          stationNumber,
          info: stationInfo,
          measurements: latestByFormula,
          lat,
          lon,
          distance: dist,
        };
      } catch (error) {
        throw new Error(`LMN API Error: ${error.message}`);
      }
    };

    this.getValue = (device, rawData, parameter) => {
      if (!rawData || !rawData.measurements) return {};

      const paramKey = parameter.toLowerCase();
      const measurement = rawData.measurements[paramKey];
      if (!measurement) return {};

      return {
        parameter: paramKey,
        value: measurement.value,
        lastUpdated: new Date(measurement.timestamp),
        location: `${rawData.stationNumber} (${rawData.info.location || ''})`.trim(),
        coordinates: { latitude: rawData.lat, longitude: rawData.lon },
        url: `https://www.luchtmeetnet.nl/stations/${rawData.stationNumber}`,
        distance: `${Math.round(rawData.distance)}`,
      };
    };

    this.discover = async (settings) => {
      try {
        const deviceSets = [
          {
            name: 'LMN Monitor @Homey',
            capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
          },
        ];

        const stationListRes = await this._fetchJson('https://api.luchtmeetnet.nl/open_api/stations', {}, this.timeout);
        const list = (stationListRes && stationListRes.data) ? stationListRes.data : [];

        const sorted = list
          .filter((st) => st.geometry && st.geometry.coordinates)
          .sort((a, b) => {
            const distA = this.distance(settings.lat, settings.lon, a.geometry.coordinates[0], a.geometry.coordinates[1]);
            const distB = this.distance(settings.lat, settings.lon, b.geometry.coordinates[0], b.geometry.coordinates[1]);
            return distA - distB;
          });

        sorted.slice(0, 5).forEach((station) => {
          const dist = this.distance(settings.lat, settings.lon, station.geometry.coordinates[0], station.geometry.coordinates[1]);
          const capabilities = (station.components || []).map((comp) => `measure_${comp.toLowerCase()}`);
          if (capabilities.length === 0) {
            capabilities.push('measure_pm25', 'measure_pm10', 'measure_no2');
          }

          deviceSets.push({
            name: `LMN Monitor ${station.number}@${Math.round(dist)}m`,
            lat: Number(station.geometry.coordinates[0]),
            lon: Number(station.geometry.coordinates[1]),
            dst: 0.01,
            stationDst: `${Math.round(dist)}`,
            stationLoc: `${station.number} (${station.location || ''})`,
            capabilities,
          });
        });

        return deviceSets;
      } catch (error) {
        this.error('LMN discover error:', error);
        throw error;
      }
    };
  }

}

module.exports = LMNMonitorDriver;
