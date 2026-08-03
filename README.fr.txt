Connaissez les niveaux de pollution de l'air, en temps quasi réel, dans de nombreux endroits du monde, y compris à votre domicile.

Ajoutez un ou plusieurs moniteurs virtuels de qualité de l'air extérieur à Homey. Les informations sont mises à disposition gratuitement par plusieurs services. Selon le service et la station sélectionnés, les paramètres suivants sont fournis :

* PM1 (particules fines, disponible avec Luftdaten)
* PM2.5 (particules fines)
* PM10 (particules fines)
* CO2 (dioxyde de carbone, disponible avec Luftdaten)
* O3 (ozone)
* SO2 (dioxyde de soufre)
* NO2 (dioxyde d'azote)
* CO (monoxyde de carbone)
* BC (carbone noir, uniquement disponible avec LuchtmeetnetNL et OpenAQ dans certains pays)
* Température (disponible avec Luftdaten)
* Pression (disponible avec Luftdaten)
* Humidité (disponible avec Luftdaten)
* Bruit (disponible avec Luftdaten)

Remarques sur les clés API :
* OpenAQ (v3 API) : Obtenez une clé API gratuite sur https://explore.openaq.org/register et saisissez-la dans les paramètres de l'appareil OpenAQ, ou laissez vide pour utiliser la clé Homey intégrée.
* WAQI : Jeton personnalisé optionnel dans les paramètres de l'appareil, ou laissez vide pour utiliser la clé Homey intégrée.

Cette application utilise :
* API OpenAQ pour la récupération des données : https://docs.openaq.org/
* API Luftdaten / Sensor.Community pour la récupération des données : https://sensor.community/fr/
* API World Air Quality Index (WAQI) pour la récupération des données : http://waqi.info/
* API Luchtmeetnet NL pour la récupération des données : https://api.luchtmeetnet.nl/
* Données fournies par les agences mondiales de protection de l'environnement : http://aqicn.org/sources/
