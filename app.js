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

const Homey = require('homey');
const Logger = require('./captureLogs');

class App extends Homey.App {

  onInit() {
    process.env.LOG_LEVEL = 'info'; // info or debug
    if (!this.logger) this.logger = new Logger({ name: 'log', length: 200, homey: this.homey });
    this.log('OpenAQ app is running!');

    // register some listeners
    process.on('unhandledRejection', (error) => {
      this.error('unhandledRejection! ', error);
    });
    process.on('uncaughtException', (error) => {
      this.error('uncaughtException! ', error);
    });
    this.homey
      .on('unload', () => {
        this.log('app unload called');
        // save logs to persistant storage
        this.logger.saveLogs();
      })
      .on('memwarn', () => {
        this.log('memwarn!');
      });
    // do garbage collection every 10 minutes
    // this.intervalIdGc = setInterval(() => {
    //  global.gc();
    // }, 1000 * 60 * 10);
  }

  //  stuff for frontend API
  deleteLogs() {
    return this.logger.deleteLogs();
  }

  getLogs() {
    return this.logger.logArray;
  }

}

module.exports = App;

/*
LINKS:

OpenAQ:
https://docs.openaq.org/
https://github.com/openaq/openaq-info/blob/master/FAQ.md#license

WAQI/AQICN:
https://aqicn.org/api/
https://aqicn.org/json-api/doc/
waqi.info
http://aqicn.org/sources/

Luftdaten / Sensor Community
luftdaten.info
https://maps.luftdaten.info/#2/0/0
https://github.com/opendata-stuttgart/meta/wiki/APIs

from 2020:
https://sensor.community/
https://maps.sensor.community/data/v2/data.dust.min.json

Luchtmeetnet.nl:
https://www.luchtmeetnet.nl/static/pdf/open_data.pdf
https://api-docs.luchtmeetnet.nl/?version=latest
http://geodata.rivm.nl/geoserver/wms?
https://www.luchtmeetnet.nl/stations/alle-provincies/alle-gemeentes/alle-stoffen

*/
