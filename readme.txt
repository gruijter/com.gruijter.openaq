Outdoor AirQuality Monitor

Know the air pollution levels, in near real-time, at many locations in the world.

Add one or multiple virtual outdoor air quality monitors to Homey. The information is made available free of charge by a number of services. Depending on the service and station you
select, the following parameters are provided:

* PM2.5 (particulate matter)
* PM10 (particulate matter)
* O3 (ozone)
* SO2 (sulfur dioxide)
* NO2 (nitrogen dioxide)
* CO (carbon monoxide)
* BC (black carbon, only available with LuchtmeetnetNL and OpenAQ in certain countries)

Air Quality Monitor Device setup:
When adding a device, you can choose which service provider to use. Deciding on which service to use depends on your personal preferences, and mostly if the the service has monitoring
stations nearby. Check the different coverages for your own location in the maps on the forum.

By default the virtual monitor will be 'installed' at the location of your Homey. If you choose the @Homey station, Homey will always search the nearest source of data. If you select any of the
other discovered stations, Homey will always use that particular station as data source. If you want to add a station anywhere else in the world, just add a local station first, and
change the lat/lon in the device settings. After adding a new monitor device, you can manually change the device settings.

OpenAQ Monitor:
This free service provides government and research grade sources in over 60 countries. This service provides the easiest setup. Data is usually updated every hour.

WAQI Monitor:
This service provides government and research grade sources in over 90 countries. It has better coverage then OpenAQ, but it needs an API key. You can get a free API key (see forum for instructions).

Luftdaten Monitor:
Luftdaten is dedicated to fine dust measurement with the Citizen Science project luftdaten.info. Thousands of citizens around the world installed self-built sensors on the outside their home.
The data is limited to only show PM2.5 and PM10, but has a very high update rate up to once every minute. In november 2019 Luftdaten was integrated in sensor.community.

LuchtmeetnetNL:
This service implementation is in ALPHA state, and probably not functional at the moment. The following parameters are additionally provided (Netherlands only):

* NO (nitrogen monoxide)
* C6H6 (benzene)
* C7H8 (toluene)
* C8H10 (xylene)
* H2S (hydrogen sulfide)
* UFP (Ultra fine particles)
* NH3 (Ammonia)

This app uses:
* OpenAQ API for data retrieval. See license information here: https://docs.openaq.org/
* Luftdaten API for data retrieval: https://luftdaten.info/en/home-en/
* World Air Quality Index (WAQI) API for data retrieval: http://waqi.info/
* Data provided by the world's Environmental Protection Agencies: http://aqicn.org/sources/