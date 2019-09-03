# Outdoor AirQuality Monitor

Know the air pollution levels, in near real-time, at many locations in the world.

Add one or multiple virtual outdoor air quality monitors to Homey. The information is made
available free of charge by a number of services. Depending on the service and station you
select, the following parameters are provided:

* PM2.5
* PM10
* O3 (Ozone)
* SO2 (sulfur dioxide)
* NO2 (nitrogen dioxide)
* CO (carbon monoxide)
* BC (black carbon, only available with OpenAQ in certain countries)

![image][mobile-device-image]

### Air Quality Monitor Device setup ###
When adding a device, you can choose which service provider to use. Deciding on which service
to use depends on your personal preferences, and mostly if the the service has monitoring
stations nearby. 
By default the virtual monitor will be 'installed' at the location of your Homey. But you can
manually add multiple monitors and enter any location in the world (lat/lon). The app will
search for a source of data in the vicinity of the set monitor location. Check the coverage
for your own location below.

### OpenAQ Monitor ###
This free service provides government and research grade sources in over 60 countries. This
service provides the easiest setup. Homey will poll for new data every 10 minutes within
100 Km range. This can be changed in the device settings. If you want more local information
you can reduce the search distance, but it might lead to receiving less data types or less
frequent data updates.

[![OpenAQ Coverage Map][openaq-image]][openaq-map]

### WAQI Monitor ###
This service provides government and research grade sources in over 90 countries. It has better
coverage then OpenAQ, but it will only provide data from the nearest station. If this station
does not provide all parameters, you can manually enter the lat/lon of another station in the
device settings. Also, you need to enter an API key it in the device settings. You can get a
free API key [here].

[![WAQI Coverage Map][waqi-image]][waqi-map]

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

[mobile-device-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/0/0c3c8fa891ac398ce395c85f6cbdd5eba1d19896.jpeg

[device-settings-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/8/8db52a776ae464a0680aa4a4fce46fc3adcba222.jpeg
[trigger-flowcards]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/0/0ea1821d42cd7b844e1b6eef0a50446dab0990b2.jpeg
[flow-tokens]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/6/6bac3300e8a9b2425d148d01d4fdc7f2873f46ae.jpeg

[changelog.txt]: https://github.com/gruijter/com.gruijter.openaq/blob/master/changelog.txt

