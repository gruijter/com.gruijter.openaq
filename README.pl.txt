Poznaj poziomy zanieczyszczenia powietrza w czasie prawie rzeczywistym w wielu miejscach na świecie, w tym we własnym domu.

Dodaj jeden lub wiele wirtualnych monitorów jakości powietrza na zewnątrz do Homey. Informacje są udostępniane bezpłatnie przez różne serwisy. W zależności od wybranej usługi i stacji dostarczane są następujące parametry:

* PM1 (pył zawieszony, dostępny w Luftdaten)
* PM2.5 (pył zawieszony)
* PM10 (pył zawieszony)
* CO2 (dwutlenek węgla, dostępny w Luftdaten)
* O3 (ozon)
* SO2 (dwutlenek siarki)
* NO2 (dwutlenek azotu)
* CO (tlenek węgla)
* BC (sadza/black carbon, dostępny tylko w LuchtmeetnetNL i OpenAQ w niektórych krajach)
* Temperatura (dostępna w Luftdaten)
* Ciśnienie (dostępne w Luftdaten)
* Wilgotność (dostępna w Luftdaten)
* Hałas (dostępny w Luftdaten)

Uwagi dotyczące klucza API:
* OpenAQ (v3 API): Uzyskaj darmowy klucz API na stronie https://explore.openaq.org/register i wprowadź go w ustawieniach urządzenia OpenAQ, lub pozostaw puste, aby użyć wbudowanego klucza Homey.
* WAQI: Opcjonalny własny token w ustawieniach urządzenia, lub pozostaw puste, aby użyć wbudowanego klucza Homey.

Ta aplikacja wykorzystuje:
* OpenAQ API do pobierania danych: https://docs.openaq.org/
* Luftdaten / Sensor.Community API do pobierania danych: https://sensor.community/pl/
* World Air Quality Index (WAQI) API do pobierania danych: http://waqi.info/
* Luchtmeetnet NL API do pobierania danych: https://api.luchtmeetnet.nl/
* Dane dostarczane przez światowe agencje ochrony środowiska: http://aqicn.org/sources/
