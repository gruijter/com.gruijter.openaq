/* eslint-disable class-methods-use-this */
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
const crypto = require('crypto');

const randomID = () => `AQMonitor_${crypto.randomBytes(3).toString('hex')}`;

class GenericAQMonitorDriver extends Homey.Driver {

  async onPairListDevices() {
    this.log('pairing started by user');
    try {
      const homeyLat = Math.round(this.homey.geolocation.getLatitude() * 100000000) / 100000000;
      const homeyLon = Math.round(this.homey.geolocation.getLongitude() * 100000000) / 100000000;
      const options = {
        lat: homeyLat,
        lon: homeyLon,
        dst: 25,
      };
      const deviceSets = await this.discover(options);
      const devices = deviceSets.map((set) => ({
        name: set.name,
        data: { id: randomID() },
        settings: {
          service: this.ds.service,
          api_key: this.ds.apiKey || '',
          lat: set.lat || homeyLat,
          lon: set.lon || homeyLon,
          dst: set.dst || 25,
          include_indoor: set.includeIndoor || false,
          pollingInterval: set.pollingInterval || 10,
          station_loc: set.stationLoc || 'unknown',
          station_dst: set.stationDst || 'unknown',
        },
        capabilities: set.capabilities,
      }));
      return devices;
    } catch (error) {
      this.error('Pairing error:', error);
      throw error;
    }
  }

  distance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const toRad = Math.PI / 180;
    const dLat = (Number(lat2) - Number(lat1)) * toRad;
    const dLon = (Number(lon2) - Number(lon1)) * toRad;
    const a = (Math.sin(dLat / 2) ** 2)
      + Math.cos(Number(lat1) * toRad) * Math.cos(Number(lat2) * toRad) * (Math.sin(dLon / 2) ** 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  getBounds(lat1, lon1, rangeKm) {
    const radLat = Number(lat1) * (Math.PI / 180);
    const radLon = Number(lon1) * (Math.PI / 180);
    const radDist = Number(rangeKm) / 6371;

    const minLat = radLat - radDist;
    const maxLat = radLat + radDist;
    const minLon = radLon - radDist / Math.cos(radLat);
    const maxLon = radLon + radDist / Math.cos(radLat);

    const toDeg = 180 / Math.PI;
    return {
      lamin: minLat * toDeg,
      lomin: minLon * toDeg,
      lamax: maxLat * toDeg,
      lomax: maxLon * toDeg,
    };
  }

  async _fetchJson(url, options = {}, timeoutMs = 30000) {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      let detail = '';
      try {
        const bodyText = await response.text();
        if (bodyText) {
          try {
            const json = JSON.parse(bodyText);
            detail = json.message || json.detail || json.error || bodyText;
          } catch (_) {
            detail = bodyText.substring(0, 100);
          }
        }
      } catch (_) {}
      const msg = detail ? `HTTP ${response.status}: ${detail}` : `HTTP Error ${response.status}`;
      throw new Error(msg);
    }

    return response.json();
  }

  // Backwards compatible wrapper for existing calls if needed
  async _makeHttpsRequest(options, postData, timeout = 30000) {
    const protocol = options.protocol || 'https:';
    const host = options.hostname || options.host;
    const path = options.path || '';
    const url = `${protocol}//${host}${path}`;
    const fetchOpts = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    if (postData) fetchOpts.body = postData;

    const response = await fetch(url, {
      ...fetchOpts,
      signal: AbortSignal.timeout(timeout),
    });

    const body = await response.text();
    const headers = {};
    response.headers.forEach((val, key) => {
      headers[key] = val;
    });

    return {
      statusCode: response.status,
      headers,
      body,
    };
  }

}

module.exports = GenericAQMonitorDriver;
