Få reda på luftföroreningsnivåerna i nära realtid på många platser i världen, inklusive i ditt eget hem.

Lägg till en eller flera virtuella utomhusluftkvalitetsmätare i Homey. Informationen tillhandahålls kostnadsfritt av flera tjänster. Beroende på vilken tjänst och station du väljer tillhandahålls följande parametrar:

* PM1 (partiklar, tillgänglig med Luftdaten)
* PM2.5 (partiklar)
* PM10 (partiklar)
* CO2 (koldioxid, tillgänglig med Luftdaten)
* O3 (ozon)
* SO2 (svaveldioxid)
* NO2 (kvävedioxid)
* CO (kolmonoxid)
* BC (sot/black carbon, endast tillgänglig med LuchtmeetnetNL och OpenAQ i vissa länder)
* Temperatur (tillgänglig med Luftdaten)
* Lufttryck (tillgänglig med Luftdaten)
* Luftfuktighet (tillgänglig med Luftdaten)
* Buller (tillgänglig med Luftdaten)

Information om API-nycklar:
* OpenAQ (v3 API): Hämta en gratis API-nyckel på https://explore.openaq.org/register och ange den i OpenAQ-enhetsinställningarna, eller lämna tomt för att använda den inbyggda Homey-nyckeln.
* WAQI: Valfri anpassad token i enhetsinställningarna, eller lämna tomt för att använda den inbyggda Homey-nyckeln.

Denna app använder:
* OpenAQ API för datahämtning: https://docs.openaq.org/
* Luftdaten / Sensor.Community API för datahämtning: https://sensor.community/se/
* World Air Quality Index (WAQI) API för datahämtning: http://waqi.info/
* Luchtmeetnet NL API för datahämtning: https://api.luchtmeetnet.nl/
* Data från världens miljöskyddsmyndigheter: http://aqicn.org/sources/
