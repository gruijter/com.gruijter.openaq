# Outdoor AirQuality Monitor

Know the air pollution levels, in near real-time, at many locations in the world.

Add one or multiple virtual outdoor air quality monitors to Homey. The information is made
available free of charge by a number of services. Depending on the service and station you
select, the following parameters are provided:

* PM2.5 (particulate matter)
* PM10 (particulate matter)
* O3 (ozone)
* SO2 (sulfur dioxide)
* NO2 (nitrogen dioxide)
* CO (carbon monoxide)
* BC (black carbon, only available with LuchtmeetnetNL and OpenAQ in certain countries)
* Temperature (only available with Luftdaten)
* Pressure (only available with Luftdaten)
* Humidity (only available with Luftdaten)

![image][mobile-device-image]

### Air Quality Monitor Device setup ###
When adding a device, you can choose which service provider to use. Deciding on which service
to use depends on your personal preferences, and mostly if the the service has monitoring
stations nearby. Check the different coverages for your own location in the maps below.

![image][add-device]

By default the virtual monitor will be 'installed' at the location of your Homey. If you choose
the @Homey station, Homey will always search the nearest source of data. If you select any of the
other discovered stations, Homey will always use that particular station as data source.
If you want to add a station anywhere else in the world, just add a local station first, and
change the lat/lon in the device settings.

![image][discovered]


### OpenAQ Monitor ###
This free service provides government and research grade sources in over 60 countries. This
service provides the easiest setup. Data is usually updated every hour.

[![OpenAQ Coverage Map][openaq-image]][openaq-map]

### WAQI Monitor ###
This service provides government and research grade sources in over 90 countries. It has better
coverage then OpenAQ, but it needs an API key. You can get a free API key [here].

[![WAQI Coverage Map][waqi-image]][waqi-map]

### Luftdaten Monitor ###
Luftdaten is dedicated to fine dust measurement with the Citizen Science project luftdaten.info.
Thousands of citizens around the world installed self-built sensors on the outside their home.
The data is limited to only show PM2.5 and PM10, but has a very high update rate up to once
every minute. In november 2019 Luftdaten was integrated in sensor.community.

[![LD Coverage Map][ld-image]][ld-map]

### LuchtmeetnetNL ###
This service implementation is in ALPHA state, and probably not functional at the moment.
the following parameters are provided (Netherlands only):

* NO (nitrogen monoxide)
* C6H6 (benzene)
* C7H8 (toluene)
* C8H10 (xylene)
* H2S (hydrogen sulfide)
* UFP (Ultra fine particles)
* NH3 (Ammonia)


### Manually changing device settings ###
After adding a new monitor device, you can change the device settings.

![image][device-settings-image]

### Creating a flow ###
You can trigger a flow on every change in value:

![image][trigger-flowcards]

The measured data is available as token cards:

![image][flow-tokens]


### Donate: ###
If you like the app you can show your appreciation by posting it in the [forum].
If you really like the app you can buy me a beer.

[![Paypal donate][pp-donate-image]][pp-donate-link]

This app uses:
* OpenAQ API for data retrieval. See license information here: https://docs.openaq.org/
* Luftdaten API for data retrieval: https://luftdaten.info/en/home-en/
* World Air Quality Index (WAQI) API for data retrieval: http://waqi.info/
* Data provided by the world's Environmental Protection Agencies: http://aqicn.org/sources/

===============================================================================

Version changelog: [changelog.txt]


[forum]: https://community.athom.com/t/17548
[pp-donate-link]: https://www.paypal.me/gruijter
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif

[openaq-map]: https://openaq.org/#/map
[openaq-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/c/cac597cf447eb628060eca732c9125f0439c39a7.jpeg

[waqi-map]: http://aqicn.org/nearest
[waqi-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/6/604388f07d54be99d4658ab5a9ebb988fc499d27.jpeg
[here]: http://aqicn.org/data-platform/token/#/

[ld-map]: https://maps.sensor.community/#2/0/0
[ld-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/9/9417995ddd2875423bac02fbc35deff413005af4.jpeg

[add-device]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/e/e92f7d5a1043622325236307dce3e2ee5ce139e0.png
[discovered]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/f/f8ed8249d710fac26ef155ad7b5ddb7923991345.jpeg
[mobile-device-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/0/0c3c8fa891ac398ce395c85f6cbdd5eba1d19896.jpeg

[device-settings-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/8/8db52a776ae464a0680aa4a4fce46fc3adcba222.jpeg
[trigger-flowcards]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/0/0ea1821d42cd7b844e1b6eef0a50446dab0990b2.jpeg
[flow-tokens]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/6/6bac3300e8a9b2425d148d01d4fdc7f2873f46ae.jpeg

[changelog.txt]: https://github.com/gruijter/com.gruijter.openaq/blob/master/changelog.txt

