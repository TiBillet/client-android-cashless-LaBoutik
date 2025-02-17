# Client android(cordova) cashless LaBoutik

## Cloner le projet
```
git clone https://github.com/TiBillet/client-android-cashless-LaBoutik
```
## configuration:
- Modifier la variable "server_pin_code" du fichier ".../client-android-cashless-LaBoutik/mobile-app/www/env.js" en fonction de votre serveur.

## Tester sur un appareil android
- Dans "client-android-cashless-LaBoutik/Docker"; lancer le conteneur "cordova_dev" et y accéder par une console.
```
docker compose up -d
docker exec -ti  cordova_dev bash
```
- Installer la plateforme android et les plugins:
```
./runAdroid
```
Le message "BUILD SUCCESSFUL" confirmera le bon fonctionnement.

- Connecter le cordon usb
- Mettre votre mobile en mode développeur.
- Activer le debuggage usb et autoriser la connexion de votre ordi avec l'appareil android.

```
adb devices
```
retour (appareil ok) :
```
List of devices attached
V3D0245M21902   device
```

-Lancer le "build" et le déploiement de l'application
```
cordova run android
```

- Si erreur de signature
```
  adb uninstall coop.tibillet.laboutik
  cordova run android
```
  ou   
Supprimer votre application sur l'appareil android

## Obtenir un apk signé
```
cd .../mobile-app/
# générer une clef "TiBillet.keystore"
keytool -genkey -v -keystore myNameKeystore.keystore -alias myNameKeystore -keyalg RSA -keysize 2048 -validity 10000
# build
cordova build android --release -- --packageType=apk --keystore=./myNameKeystore.keystore --storePassword=xxxxxxxxxx --alias=myNameKeystore --password=xxxxxxxxxx
```

## Obtenir un apk signé _ test methode 2
```
cordova build android
/usr/local/android-sdk-linux/build-tools/33.0.3/zipalign -f 4 /mobile-app/platforms/android/app/build/outputs/apk/debug/app-debug.apk aligned.apk
apksigner sign --ks TiBillet.keystore --ks-pass pass:<store pass> --ks-key-alias TiBilletKeystore --key-pass pass:<key pass> --v2-signing-enabled --v1-signing-enabled aligned.apk --out release.apk
/usr/local/android-sdk-linux/build-tools/33.0.3/apksigner sign --ks TiBillet.keystore --out release.apk aligned.apk

/usr/local/android-sdk-linux/build-tools/33.0.3/apksigner verify -verbose release.apk
```

## Sunmi D3MINI impression et tiroir caisse
(à faire une fois)   
. Appuyer longtemps sur l'icon de l'application "TiBillet LaBoutik"   
. Sélectionner le menu "Autorisation"   
. Sélectionner "Appareils à proximité"   
. Sélectionner "Autoriser"   
. sortir de "Paramètres"   
