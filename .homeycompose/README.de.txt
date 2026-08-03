Erfahren Sie die Luftverschmutzungswerte in nahezu Echtzeit an vielen Orten auf der ganzen Welt sowie an Ihrem eigenen Zuhause.

Fügen Sie ein oder mehrere virtuelle Außenluftqualitätsmessgeräte zu Homey hinzu. Die Informationen werden von verschiedenen Diensten kostenlos zur Verfügung gestellt. Je nach ausgewähltem Dienst und Station werden folgende Parameter bereitgestellt:

* PM1 (Feinstaub, verfügbar bei Luftdaten)
* PM2.5 (Feinstaub)
* PM10 (Feinstaub)
* CO2 (Kohlendioxid, verfügbar bei Luftdaten)
* O3 (Ozon)
* SO2 (Schwefeldioxid)
* NO2 (Stickstoffdioxid)
* CO (Kohlenmonoxid)
* BC (Ruß, nur verfügbar bei LuchtmeetnetNL und OpenAQ in bestimmten Ländern)
* Temperatur (verfügbar bei Luftdaten)
* Luftdruck (verfügbar bei Luftdaten)
* Luftfeuchtigkeit (verfügbar bei Luftdaten)
* Lärm (verfügbar bei Luftdaten)

Hinweise zu API-Schlüsseln:
* OpenAQ (v3 API): Holen Sie sich einen kostenlosen API-Schlüssel unter https://explore.openaq.org/register und tragen Sie ihn in den OpenAQ-Geräteeinstellungen ein, oder lassen Sie das Feld leer, um den integrierten Homey-Schlüssel zu verwenden.
* WAQI: Optionaler eigener Token in den Geräteeinstellungen, oder lassen Sie das Feld leer, um den integrierten Homey-Schlüssel zu verwenden.

Diese App verwendet:
* OpenAQ API zur Datenabfrage: https://docs.openaq.org/
* Luftdaten / Sensor.Community API zur Datenabfrage: https://sensor.community/de/
* World Air Quality Index (WAQI) API zur Datenabfrage: http://waqi.info/
* Luchtmeetnet NL API zur Datenabfrage: https://api.luchtmeetnet.nl/
* Daten der weltweiten Umweltschutzbehörden: http://aqicn.org/sources/
