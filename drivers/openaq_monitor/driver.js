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
  service: 'OpenAQ',
  apiKey: '',
};

class OpenAQMonitorDriver extends GenericAQMonitorDriver {

  onInit() {
    this.log('OpenAQ Monitor Driver started');

    this.ds = driverSpecifics;
    this.timeout = 30000;

    this.getHeaders = (settings) => {
      const apiKey = (settings && settings.api_key && settings.api_key.trim().length > 0)
        ? settings.api_key.trim()
        : Homey.env.OPENAQ_API_KEY;

      const headers = {
        Accept: 'application/json',
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      return headers;
    };

    this.getRawData = async (device) => {
      try {
        const { settings } = device;
        const headers = this.getHeaders(settings);

        let locationId = null;
        if (settings && settings.station_loc) {
          const idMatch = settings.station_loc.match(/ID:(\d+)/);
          if (idMatch) locationId = Number(idMatch[1]);
        }

        if (!locationId) {
          // Find closest location by coordinates
          const radiusMeters = Math.round((settings.dst || 100) * 1000);
          const listUrl = `https://api.openaq.org/v3/locations?coordinates=${settings.lat},${settings.lon}&radius=${radiusMeters}&limit=10`;
          const listData = await this._fetchJson(listUrl, { headers }, this.timeout);
          if (listData && listData.results && listData.results.length > 0) {
            // Pick nearest location
            const sorted = listData.results.sort((a, b) => {
              const dA = a.distance !== undefined ? a.distance : this.distance(settings.lat, settings.lon, a.coordinates.latitude, a.coordinates.longitude);
              const dB = b.distance !== undefined ? b.distance : this.distance(settings.lat, settings.lon, b.coordinates.latitude, b.coordinates.longitude);
              return dA - dB;
            });
            locationId = sorted[0].id;
          }
        }

        if (!locationId) {
          throw new Error('No OpenAQ locations found within specified range');
        }

        // Fetch location details (sensor mapping) and latest readings
        const detailsUrl = `https://api.openaq.org/v3/locations/${locationId}`;
        const latestUrl = `https://api.openaq.org/v3/locations/${locationId}/latest`;

        const [detailsRes, latestRes] = await Promise.all([
          this._fetchJson(detailsUrl, { headers }, this.timeout),
          this._fetchJson(latestUrl, { headers }, this.timeout),
        ]);

        const locationData = detailsRes && detailsRes.results && detailsRes.results[0] ? detailsRes.results[0] : {};
        const latestReadings = latestRes && latestRes.results ? latestRes.results : [];

        // Build sensorId -> parameter mapping
        const sensorMap = {};
        if (locationData.sensors) {
          locationData.sensors.forEach((sensor) => {
            if (sensor.parameter && sensor.parameter.name) {
              sensorMap[sensor.id] = sensor.parameter.name.toLowerCase();
            }
          });
        }

        return {
          location: locationData,
          sensorMap,
          readings: latestReadings,
        };
      } catch (error) {
        throw new Error(`OpenAQ API Error: ${error.message}`);
      }
    };

    this.getValue = (device, rawData, parameter) => {
      const { settings } = device;
      if (!rawData || !rawData.readings || !rawData.sensorMap) return {};

      const { location, sensorMap, readings } = rawData;
      const targetParam = parameter.toLowerCase();

      // Find sensor matching parameter
      const matchingSensorIds = Object.keys(sensorMap)
        .filter((sensorId) => sensorMap[sensorId] === targetParam)
        .map(Number);

      if (matchingSensorIds.length === 0) return {};

      const reading = readings.find((r) => matchingSensorIds.includes(r.sensorsId) && r.value > -900);
      let { lat, lon } = settings;
      if (reading.coordinates && reading.coordinates.latitude !== undefined) {
        lat = reading.coordinates.latitude;
        lon = reading.coordinates.longitude;
      } else if (location.coordinates && location.coordinates.latitude !== undefined) {
        lat = location.coordinates.latitude;
        lon = location.coordinates.longitude;
      }
      const dist = this.distance(settings.lat, settings.lon, lat, lon);

      return {
        parameter: targetParam,
        value: Number(reading.value),
        lastUpdated: reading.datetime ? new Date(reading.datetime.utc) : new Date(),
        location: `ID:${location.id || ''} ${location.name || location.locality || ''}`.trim(),
        coordinates: { latitude: lat, longitude: lon },
        url: `https://openaq.org/#/location/${location.id || ''}`,
        distance: Math.round(dist),
      };
    };

    this.discover = async (settings) => {
      try {
        const headers = this.getHeaders(settings);
        const radiusMeters = Math.round((settings.dst || 100) * 1000);
        const url = `https://api.openaq.org/v3/locations?coordinates=${settings.lat},${settings.lon}&radius=${radiusMeters}&limit=20`;

        const data = await this._fetchJson(url, { headers }, this.timeout);
        const results = (data && data.results) ? data.results : [];

        const deviceSets = [
          {
            name: 'OAQ Monitor @Homey',
            capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co'],
          },
          {
            name: 'OAQ Monitor @Homey_with_BC',
            capabilities: ['measure_pm25', 'measure_pm10', 'measure_so2', 'measure_no2', 'measure_o3', 'measure_co', 'measure_bc'],
          },
        ];

        const sorted = results.sort((a, b) => {
          const dA = a.distance !== undefined ? a.distance : this.distance(settings.lat, settings.lon, a.coordinates.latitude, a.coordinates.longitude);
          const dB = b.distance !== undefined ? b.distance : this.distance(settings.lat, settings.lon, b.coordinates.latitude, b.coordinates.longitude);
          return dA - dB;
        });

        sorted.slice(0, 5).forEach((station) => {
          const dist = Math.round(station.distance !== undefined ? station.distance : this.distance(settings.lat, settings.lon, station.coordinates.latitude, station.coordinates.longitude));
          const capabilities = [];
          if (station.sensors) {
            station.sensors.forEach((s) => {
              if (s.parameter && s.parameter.name) {
                const cap = `measure_${s.parameter.name.toLowerCase()}`;
                if (!capabilities.includes(cap)) capabilities.push(cap);
              }
            });
          }
          if (capabilities.length === 0) {
            capabilities.push('measure_pm25', 'measure_pm10', 'measure_no2');
          }

          deviceSets.push({
            name: `OAQ Monitor ${station.locality || station.name}@${dist}m`,
            lat: Number(station.coordinates.latitude),
            lon: Number(station.coordinates.longitude),
            dst: 0.01,
            stationDst: `${dist}`,
            stationLoc: `ID:${station.id} (${station.name})`,
            capabilities,
          });
        });

        return deviceSets;
      } catch (error) {
        this.error('Discover error:', error);
        throw error;
      }
    };
  }

}

module.exports = OpenAQMonitorDriver;
