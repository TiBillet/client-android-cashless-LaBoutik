# Développement, client android(cordova) cashless LaBoutik

## Cloner le projet
```
git clone https://github.com/TiBillet/client-android-cashless-LaBoutik
```
## configuration du serveur discovery:
- Modifier la variable "server_pin_code" du fichier ".../client-android-cashless-LaBoutik/mobile-app/www/env.js" en fonction de votre serveur discovery.

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
  cordova run androidls
```
  ou   
Supprimer votre application sur l'appareil android

## Obtenir un apk de debug
```
cd .../mobile-app/

# build
cordova build android
```

## Obtenir un apk de production signé
```
cd .../mobile-app/

# générer une clef "myNameKeystore.keystore"
keytool -genkey -v -keystore <myNameKeystore.keystore> -alias <myNameKeystore> -keyalg RSA -keysize 2048 -validity 10000

# build release unsigned
cordova build android --release -- --packageType=apk

# signer
apksigner sign --ks <myNameKeystore.keystore> --ks-pass pass:<passKeystore> --ks-key-alias <myNameKeystore> --v2-signing-enabled true  --v1-signing-enabled true --in /mobile-app/platforms/android/app/build/outputs/apk/debug/app-debug.apk  --out release.apk

# vérifier signature (V1 + V2)
apksigner verify -verbose -v --print-certs release.apk
```

## Debug par wifi
- Activer les options dévelopeur
- Dans options dévelopeur, activer le débugage sans fil
- Sélectionner le menu "Associer l'appareil avec un code d'association" ou équivalant suivant mobile :   
Les infos ip, port et code d'association s'afficheront
- Associer votre mobile et l'ordi avec la commande: 
```
adb pair <ip donné>:< port donné>
```
- Entrer le code d'association   
  retour : Successfully paired to .....

- Vérifier l'association:
```
adb devices
```

- Connecter votre ordi au mobile si perte de connexion avec la commande:
  Attention l'ip et le port pour la connexion au mobile sont affiché dans la page de débugage sans fil. Ne pas utiliser l'ip et le port d'association.
```
adb connect <ip>: < donné>
```

## Attention, pour Sunmi(impression et tiroir caisse)
(à faire après une installation)   
. Appuyer longtemps sur l'icon de l'application "TiBillet LaBoutik" et cliquer sur "infos sur l'appli"
. Cliquer sur "Autorisation"   
. Dans "Non autorisé", cliquer sur  "Appareils à proximité"   
. Cliquer sur "Autoriser"   
