# Client_cashless_mobile_cordova

## cloner le projet
https://github.com/TiBillet/client_cashless_mobile_cordova

## Tester sur un appareil android dans "clinet_cashless_mobile_cordova/Docker"
- Lancer le conteneur "cordova_dev" et y accéder par une console.
```
docker compose up -d
docker exec -ti  cordova_dev bash
```

- Une fois dans le conteneur, lancer le "build front" et l'installation de l'application
```
cordova run android
```

- Si erreur de signature
```
  adb uninstall coop.tibillet.laboutik
  cordova run android
```
 
- Si votre mobile n'est pas reconnu :   
. mobile en mode dévellopeur / activer l'usb   
. débrancher/ brancher votre mobile et autoriser l'accès à l'ordi   
. vérifier votre connxion mobile   
```
adb devices
```

- Obtenir l'apk   
```
cordova build
```

## Configuration:
Le fichier de configuration ".../client_cashless_mobile_cordova/mobile-app/www/config.json"  
est charger puis sauvegarder une fois automatiquement dans le fichier ".../Documents/config.json" de votre mobile.   
Vous gérez ensuite le changement de serveur et de nom de l'appareil en sauvegardant par l'appui du bouton "Enregistrer".   
En supprimnt le cache de l'application le fichier ".../client_cashless_mobile_cordova/mobile-app/www/config.json"  
sera pris en compte de nouveau.

## Infos, sécurité (Content Security Policy, tag 'meta' dans index.html)
content:   
- Gère les connexions = "connect-src" autorisées :     
  . localhost   
  . https://filaos.re/api/connect   

- Gère les scriptes = "script-src" autorisés :
  . localhost

- Gère les fontes = "font-src" autorisées :  
  . 'self' = locale   
  . https://fonts.gstatic.com/   

- Gère les feuilles de style = "style-src"   
  . 'self'   
  . https://fonts.googleapis.com/
  . 'unsafe-inline' = le style codé dans une feuille de style chargé
