# Client android(cordova) cashless LaBoutik

## Cloner le projet
```
git clone https://github.com/TiBillet/client-android-cashless-LaBoutik
```
## configuration:
- Modifier la variable "server_pin_code" du fichier ".../client-android-cashless-LaBoutik/mobile-app/www/env.js" en fonction de votre serveur.

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

- Signer apk   
```
cd .../mobile-app/
# générer une clef "TiBillet.keystore"
keytool -genkey -v -keystore myNameKeystore.keystore -alias myNameKeystore -keyalg RSA -keysize 2048 -validity 10000
# build
cordova build android --release -- --packageType=apk --keystore=./myNameKeystore.keystore --storePassword=xxxxxxxxxx --alias=myNameKeystore --password=xxxxxxxxxx
```
## Utilisation

### Premier lancement
- Entrer le code pin de votre serveur et cliquer sur "Valider" (Les données du serveur sont sauvegardées pour la prochaine utilisation).
- Cliquer sur "Lancer l'application".

### Modifier le serveur
- La modification du serveur est identique au "Premier lancement"

### Reset
Le bouton "Reset" permet de supprimer de la configuration le serveur en cours (url affichée), et   
vous demande de rentrer un nouveau code pin.

## Divers
https://cordova.apache.org/docs/en/11.x/guide/platforms/android/:
Android 13 (niveau d'API 33)   
Android 12 (niveaux d'API 31, 32)   
Android 11 (niveau d'API 30)   
Android 10 (niveau d'API 29)   
Android 9 (niveau d'API 22, 28)   
