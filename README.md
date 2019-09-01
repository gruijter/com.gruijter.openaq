# Outdoor AirQuality Monitor

Get air quality information from OpenAQ.org

Add one or multiple virtual outdoor air quality meters to Homey. The information is made
available free of charge by [openaq.org]. They collect the following data from real-time
government and research grade sources in over 60 countries:

* PM2.5
* PM10
* O3 (Ozone)
* SO2 (sulfur dioxide)
* NO2 (nitrogen dioxide)
* CO (carbon monoxide)
* BC (black carbon)

![image][mobile-device-image]

### Live data from many locations in the world ###
By default the virtual monitor will be 'installed' at the location of your Homey. But you can
manually add multiple monitors and enter any lociation in the world (lat, lon). The app will
search for a source of data in the vicinity of the set monitor location. You can check here if
there is a datasource available on your location:

[![OpenAQ Coverage Map][openaq-image]][openaq.org]

### Monitor device settings ###
Homey will poll for new data every 10 minutes within 25 Km range. This can be changed in the
device settings. If you want more local information you can reduce the search distance, but
it might lead to receiving less data types or less frequent data updates.

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
* openAQ.org API for data retrieval. See license information here: https://docs.openaq.org/

===============================================================================

Version changelog: [changelog.txt]


[forum]: https://community.athom.com/t/17548
[pp-donate-link]: https://www.paypal.me/gruijter
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif

[openaq.org]: https://openaq.org/#/map
[mobile-device-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/b/b71570724f728c6f20d7588d047ae5f63a5eefdb.jpeg
[openaq-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/3/30e65287eb536b0696aabc2af5741428bf41b1ec.png
[device-settings-image]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/3/3afb6bd5ca14f83a8d7a7c2ab7c079b817691f2c.png
[trigger-flowcards]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/b/bc890611cedbfcdf9c6c2e0353bfad7520d266ab.png
[flow-tokens]: https://aws1.discourse-cdn.com/business4/uploads/athom/original/2X/9/9ff3357c22168adfe79478e9c133914b51150ef7.png

[changelog.txt]: https://github.com/gruijter/com.gruijter.openaq/blob/master/changelog.txt

