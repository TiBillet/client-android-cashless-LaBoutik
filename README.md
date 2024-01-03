# Client android(cordova) cashless LaBoutik

## Cloner le projet
```
git clone https://github.com/TiBillet/client-android-cashless-LaBoutik
```

## Tester sur un appareil android dans "client-android-cashless-LaBoutik/Docker"
- Mettre votre mobile en mode développeur
- Lancer le conteneur "cordova_dev" et y accéder par une console.
```
docker compose up -d
docker exec -ti  cordova_dev bash
```

-  Une fois dans le conteneur, connecter le cordon usb  de votre mobile et lancer la commande:
```
adb devices
```
Autoriser l'accès à l'ordi.   

-Lancer le "build" et le déploiement de l'application
```
cordova run android
```

- Si erreur de signature
```
  adb uninstall coop.tibillet.laboutik
  cordova run android
```
 
- Si votre mobile n'est pas reconnu :   
. Vérifier mobile en mode dévellopeur / activer l'usb   
. Débrancher/ brancher votre mobile et autoriser l'accès à l'ordi   
. vérifier votre connxion mobile   
```
adb devices
```

- Obtenir l'apk   
```
cordova build
```

## Supprimer une configuration:

### Android 11:
- Paramètres / Applis et notifications / Tibillet/LaBoutik / Espace de stockage et cache / vider l'sepace de stockage

### Android 9:
- Paramètres / Applications / Tibillet/LaBoutik  / Stockage / Supprimer les données
- 
