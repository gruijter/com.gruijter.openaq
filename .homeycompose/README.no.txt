Finn luftforurensningsnivåene i tilnærmet sanntid på mange steder i verden, inkludert i ditt eget hjem.

Legg til en eller flere virtuelle utendørs luftkvalitetsmålere i Homey. Informasjonen stilles gratis til rådighet av flere tjenester. Avhengig av valgt tjeneste og stasjon oppgis følgende parametere:

* PM1 (svevestøv, tilgjengelig med Luftdaten)
* PM2.5 (svevestøv)
* PM10 (svevestøv)
* CO2 (karbondioksid, tilgjengelig med Luftdaten)
* O3 (ozon)
* SO2 (svoveldioksid)
* NO2 (nitrogendioksid)
* CO (karbonmonoksid)
* BC (sot/black carbon, kun tilgjengelig med LuchtmeetnetNL og OpenAQ i enkelte land)
* Temperatur (tilgjengelig med Luftdaten)
* Lufttrykk (tilgjengelig med Luftdaten)
* Luftfuktighet (tilgjengelig med Luftdaten)
* Støy (tilgjengelig med Luftdaten)

Merknader om API-nøkler:
* OpenAQ (v3 API): Hent en gratis API-nøkkel på https://explore.openaq.org/register og skriv den inn i OpenAQ-enhetsinnstillingene, eller la feltet stå tomt for å bruke den innebygde Homey-nøkkelen.
* WAQI: Valgfri egendefinert token i enhetsinnstillingene, eller la feltet stå tomt for å bruke den innebygde Homey-nøkkelen.

Denne appen bruker:
* OpenAQ API for datahenting: https://docs.openaq.org/
* Luftdaten / Sensor.Community API for datahenting: https://sensor.community/no/
* World Air Quality Index (WAQI) API for datahenting: http://waqi.info/
* Luchtmeetnet NL API for datahenting: https://api.luchtmeetnet.nl/
* Data levert av verdens miljøvernbyråer: http://aqicn.org/sources/
