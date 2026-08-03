Conoce los niveles de contaminación del aire, en tiempo casi real, en muchos lugares del mundo, incluido tu propio hogar.

Añade uno o varios monitores virtuales de calidad del aire exterior a Homey. La información la proporcionan de forma gratuita varios servicios. Según el servicio y la estación que selecciones, se proporcionan los siguientes parámetros:

* PM1 (partículas finas, disponible con Luftdaten)
* PM2.5 (partículas finas)
* PM10 (partículas finas)
* CO2 (dióxido de carbono, disponible con Luftdaten)
* O3 (ozono)
* SO2 (dióxido de azufre)
* NO2 (dióxido de nitrógeno)
* CO (monóxido de carbono)
* BC (carbono negro, solo disponible con LuchtmeetnetNL y OpenAQ en ciertos países)
* Temperatura (disponible con Luftdaten)
* Presión (disponible con Luftdaten)
* Humedad (disponible con Luftdaten)
* Ruido (disponible con Luftdaten)

Notas sobre la clave API:
* OpenAQ (v3 API): Obtén una clave API gratuita en https://explore.openaq.org/register e introdúcela en los ajustes del dispositivo OpenAQ, o déjala en blanco para usar la clave Homey integrada.
* WAQI: Token personalizado opcional en los ajustes del dispositivo, o déjalo en blanco para usar la clave Homey integrada.

Esta aplicación utiliza:
* API de OpenAQ para la recuperación de datos: https://docs.openaq.org/
* API de Luftdaten / Sensor.Community para la recuperación de datos: https://sensor.community/es/
* API de World Air Quality Index (WAQI) para la recuperación de datos: http://waqi.info/
* API de Luchtmeetnet NL para la recuperación de datos: https://api.luchtmeetnet.nl/
* Datos proporcionados por las Agencias de Protección Ambiental del mundo: http://aqicn.org/sources/
