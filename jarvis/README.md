# Jarvis Plugin v2.0 — A.V.A.T.A.R

## Installation

1. Copier ce dossier dans :
   ```
   <AVATAR>/resources/app/core/plugins/jarvis/
   ```

2. Éditer `jarvis.prop` :
   - `ollamaPath` : chemin vers `ollama_app.exe`
   - `defaultClient` : nom de votre client Avatar principal
   - `ramAlertThreshold` : seuil RAM en % avant alerte vocale (défaut : 90)
   - `morningReport` : rapport vocal automatique à 8h (true/false)

3. Redémarrer Avatar Server

---

## Widget — Configuration dans Widget Studio

Un **seul bouton** à configurer.

Ouvrir **Widget Studio** → onglet **Plugins** → **Jarvis**

| Champ | Valeur |
|---|---|
| Nom | Panneau Jarvis |
| usage_name | `Button_control` |
| periph_id | `jarvis_control_00` |
| Action On — Paramètre | `control` |
| Action Off — Paramètre | `control` |
| Image On | `assets/images/widget/Button_control/On.png` |
| Image Off | `assets/images/widget/Button_control/Off.png` |

> ⚠️ Les deux champs Action On et Action Off doivent contenir `control`.

---

## Exemples de commandes vocales

Chaque phrase déclenche une action **et** une réponse vocale de Jarvis.

### 🌐 Applications
> *"Sarah, ouvre Chrome"*
> *"Sarah, lance le navigateur Chrome"*
> *"Sarah, ouvre VLC"*
> *"Sarah, lance Netflix"*
> *"Sarah, ouvre Gmail"*

### 📁 Dossiers
> *"Sarah, ouvre le bureau"*
> *"Sarah, ouvre le dossier des téléchargements"*
> *"Sarah, ouvre le dossier des plugins"*
> *"Sarah, ouvre le dossier Avatar"*

### 🖥️ Système
> *"Sarah, verrouille la session"*
> *"Sarah, vide la corbeille"*
> *"Sarah, gestionnaire des tâches"*
> *"Sarah, lance l'écran de veille"*
> *"Sarah, diagnostic système"*
> *"Sarah, éteins le PC"*
> *"Sarah, redémarre le PC"*

### 🔊 Volume & luminosité
> *"Sarah, monte le volume"*
> *"Sarah, baisse le son"*
> *"Sarah, coupe le son"*
> *"Sarah, augmente la luminosité"*
> *"Sarah, baisse la luminosité"*

### 📸 Capture & recherche
> *"Sarah, prends une capture d'écran"*
> *"Sarah, cherche la météo de Paris"*
> *"Sarah, recherche les actualités du jour"*

### 🤖 IA & Avatar
> *"Sarah, vérifie ollama"*
> *"Sarah, démarre ollama"*
> *"Sarah, redémarre le client"*
> *"Sarah, redémarre avatar"*

### 🎛️ Panneau de contrôle
> *"Sarah, ouvre le panneau Jarvis"*
> *"Sarah, affiche le panneau Jarvis"*

---

## Changelog

### v2.0 (actuel)
- ✅ Widget : un Panneau Jarvis
- ✅ Dashboard CPU/RAM/Uptime/OS intégré directement dans le panneau de contrôle
- ✅ Speaks vocaux sur chaque bouton du panneau HTML (lus depuis `fr.pak` / `en.pak`)
- ✅ CRON toutes les 5 minutes : alerte RAM configurable + rapport matinal à 8h
- ✅ Commandes vocales : volume, luminosité, screenshot, notification système
- ✅ Confirmation vocale pour les actions irréversibles (shutdown, restart, close all)
- ✅ Inter-plugins via `Avatar.trigger('jarvis_trigger', { command, client })`

### v1.0
- ✅ Commandes vocales système : verrouiller, déconnecter, redémarrer, éteindre, hibernation
- ✅ Gestion de session Windows via `rundll32`, `shutdown`, PowerShell
- ✅ Lancement / fermeture d'applications : Chrome, VLC, Word, Excel, Outlook, Notepad++
- ✅ Raccourcis dossiers : Bureau, Téléchargements, Disque C, Plugins, Avatar
- ✅ Recherche internet vocale avec `Avatar.askme` si aucun terme détecté
- ✅ Contrôle lecteur CD/DVD via `nircmd`
- ✅ Écran de veille Matrix (`matrix.scr`)
- ✅ Sites directs : Netflix, YouTube, Gmail
- ✅ Redémarrage client/serveur Avatar
- ✅ Architecture multi-plateforme Windows / macOS / Linux
