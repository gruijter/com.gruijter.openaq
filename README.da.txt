Se luftforureningsniveauerne i næsten realtid på mange steder i verden, herunder dit eget hjem.

Tilføj en eller flere virtuelle udendørs luftkvalitetsmålere til Homey. Oplysningerne stilles gratis til rådighed af en række tjenester. Afhængigt af den valgte tjeneste og station leveres følgende parametre:

* PM1 (partikler, tilgængelig med Luftdaten)
* PM2.5 (partikler)
* PM10 (partikler)
* CO2 (carbondioxid, tilgængelig med Luftdaten)
* O3 (ozon)
* SO2 (svovldioxid)
* NO2 (kvælstofdioxid)
* CO (carbonmonoxid)
* BC (sod/black carbon, kun tilgængelig med LuchtmeetnetNL og OpenAQ i visse lande)
* Temperatur (tilgængelig med Luftdaten)
* Lufttryk (tilgængelig med Luftdaten)
* Luftfugtighed (tilgængelig med Luftdaten)
* Støj (tilgængelig med Luftdaten)

Bemærkninger om API-nøgler:
* OpenAQ (v3 API): Hent en gratis API-nøgle på https://explore.openaq.org/register og indtast den i OpenAQ-enhedsindstillingerne, eller lad den være tom for at bruge den indbyggede Homey-nøgle.
* WAQI: Valgfri tilpasset token i enhedsindstillingerne, eller lad den være tom for at bruge den indbyggede Homey-nøgle.

Denne app bruger:
* OpenAQ API til datahentning: https://docs.openaq.org/
* Luftdaten / Sensor.Community API til datahentning: https://sensor.community/da/
* World Air Quality Index (WAQI) API til datahentning: http://waqi.info/
* Luchtmeetnet NL API til datahentning: https://api.luchtmeetnet.nl/
* Data leveret af verdens miljøbeskyttelsesagenturer: http://aqicn.org/sources/
