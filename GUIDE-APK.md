# Application Android — mode d'emploi

## Comment ça marche
1. GitHub construit l'APK tout seul (fichier `.github/workflows/build-apk.yml`).
2. Il le publie dans l'onglet **Releases** du dépôt sous le nom `CaptureMedia.apk`.
3. Le bouton « Télécharger l'app » du site pointe vers `.../releases/latest/download/CaptureMedia.apk`,
   donc toujours vers la dernière version.
4. L'application affiche votre site (GitHub Pages) en plein écran : quand vous ajoutez des vidéos dans
   `videos.js` et que vous faites `git push`, l'appli est mise à jour sans reconstruire l'APK.

## Première fois
1. `git add .` · `git commit -m "Appli Android"` · `git push`
2. GitHub > dépôt > **Settings > Pages** : activer la publication (branche main, dossier /root).
   Le site doit répondre sur https://riochimorasame.github.io/ACTUMEDIA/
   (sinon, corriger l'adresse dans `capacitor.config.json`, ligne "url").
3. GitHub > **Actions > Construire l'APK Android > Run workflow**. Compter 5 à 8 minutes.
4. Vérifier : onglet **Releases** > fichier `CaptureMedia.apk`.
5. Le dépôt doit être **public**, sinon les visiteurs ne pourront pas télécharger l'APK.

## Clé de signature (à faire avant de diffuser)
Sans clé, l'APK s'installe mais chaque nouvelle version a une signature différente : les utilisateurs devraient
désinstaller puis réinstaller. Avec votre clé, les mises à jour s'installent par-dessus.

Dans PowerShell (Java 17 requis pour `keytool`) :
```
keytool -genkeypair -v -keystore capturemedia.keystore -alias capturemedia -keyalg RSA -keysize 2048 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes("capturemedia.keystore")) | Set-Clipboard
```
Puis GitHub > **Settings > Secrets and variables > Actions > New repository secret** :
- `KEYSTORE_BASE64` : coller le contenu du presse-papiers
- `KEYSTORE_PASSWORD` : le mot de passe choisi
- `KEY_ALIAS` : `capturemedia`
- `KEY_PASSWORD` : le même mot de passe

**Gardez le fichier .keystore et le mot de passe en lieu sûr (hors du dépôt). Si vous les perdez, plus de mises à jour possibles.**

## Nouvelle version de l'APK
Seulement si vous changez l'icône, le nom ou la configuration : relancer le workflow (Run workflow).
