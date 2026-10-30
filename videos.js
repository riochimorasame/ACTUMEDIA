/* =====================================================================
   CAPTURE MÉDIA — LISTE DES VIDÉOS
   =====================================================================
   C'est LE seul fichier à modifier pour mettre à jour le site.

   1) VIDÉO À LA UNE (hero)
      Collez le lien YouTube complet (ou juste l'ID) entre les guillemets.

   2) GRILLE DES REPORTAGES
      Ajoutez un bloc { ... } par vidéo :
        url       : lien YouTube (watch?v=..., youtu.be/..., shorts/... ou ID)
        title     : titre affiché sur la carte
        category  : "enquetes" | "societe" | "jeunesse"
        desc      : (optionnel) petite description sous le titre
        date      : (optionnel) ex : "12 oct. 2026"

   La miniature est récupérée automatiquement depuis YouTube.
   ===================================================================== */

window.CAPTURE_CONFIG = {

  channelUrl: "https://www.youtube.com/@CAPTUREMEDIAA-d5b",
  whatsappChannel: "https://www.whatsapp.com/channel/0029VbCO0avGzzKJohCfbw0F",
  whatsappNumber: "22891075151",

  // Lien de téléchargement de l'application Android (APK publié sur GitHub Releases).
  // Ce lien pointe toujours vers la DERNIÈRE version construite.
  apkUrl: "https://github.com/riochimorasame/ACTUMEDIA/releases/latest/download/CaptureMedia.apk",

  // --- Vidéo à la une -------------------------------------------------
  featured: {
    url: "https://www.youtube.com/watch?v=YYxBAZuAO48",
    title: "Stationnement des taxis interdit sur la Nationale N°2 (Hollandô, Pirogue…)"
  },

  // --- Grille des reportages -----------------------------------------
  // Pour afficher la miniature, ajoutez url: "https://www.youtube.com/watch?v=XXXXXXXXXXX".
  videos: [
    { url: "https://www.youtube.com/watch?v=97rst385OFM", title: "Stationnement des taxis interdit sur la Nationale N°2 (Hollandô, Pirogue…)", category: "societe" },
    { url: "https://www.youtube.com/watch?v=azzBTF2QMnY", title: "MIRLINDA : 20 ANS DE CARRIÈRE !", category: "jeunesse" },
    { url: "https://www.youtube.com/watch?v=6aeoOpdABTs", title: "Quartier de Bè : Raser ou rénover ?", category: "societe" },
    { url: "https://www.youtube.com/watch?v=7G_At8KIK-Y", title: "Affaire Dame GNAKADE : il faut un geste juste.", category: "enquetes" },
    { url: "https://www.youtube.com/watch?v=lZHSeQItcUY", title: "À IPJ, c'est du vrai !", category: "jeunesse" },
    { url: "https://www.youtube.com/watch?v=fRaRfd5BJgo", title: "Est-ce que tout le monde arrive très tôt à identifier son talent ?!", category: "jeunesse" },
    { url: "https://www.youtube.com/watch?v=9-L7Jlm7Xyo", title: "ISSTES : Une Première Historique au Togo 🇹🇬", category: "jeunesse" },
    { url: "https://www.youtube.com/watch?v=RBHOHyJPOpw", title: "TOGO: Le calvaire des usagers de la route KPALA-MISSION TOVÉ", category: "enquetes" },
    { url: "https://www.youtube.com/watch?v=h_2pRGIerLY", title: "Centre Islamique du Togo : 18 mois sans salaire", category: "enquetes" },
    { url: "https://www.youtube.com/watch?v=TAqW2Pz-2J0", title: "Les 04 drôles de domaines dans lesquels Gnassingbe Eyadema était PREMIER de sa promotion.", category: "societe" },
    { url: "https://www.youtube.com/watch?v=lqGyTgJl5_c", title: "08.02.2026 l Manif Adétikopé-TOGO", category: "societe" }
  ]
};
