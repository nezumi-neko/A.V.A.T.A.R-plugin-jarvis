# Plugin Jarvis — A.V.A.T.A.R

![jarvis](../../core/plugins/jarvis/assets/images/jarvis.png =100x*)

**Jarvis** est un module d'extension avancé pour le framework A.V.A.T.A.R. Il transforme votre assistant en un véritable majordome numérique capable de piloter votre système d'exploitation, vos logiciels de bureautique et vos périphériques matériels par la voix — et via un panneau de contrôle visuel.

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🎛️ **Widget panneau** | Un seul bouton ouvre le panneau de contrôle complet |
| 🪟 **Panneau de contrôle** | Fenêtre HTML avec dashboard CPU/RAM + tous les raccourcis |
| 🗣️ **Speaks sur boutons** | Chaque bouton du panneau déclenche une réponse vocale |
| ⏰ **CRON** | Alerte RAM si > seuil configurable + rapport matinal à 8h |
| 🌌 **Écran de veille Matrix** | Lancement vocal ou via le panneau |
| 📸 **Screenshot vocal** | Capture d'écran horodatée sur le bureau |
| 🔊 **Volume vocal** | Monte / baisse / coupe le son |
| 💡 **Luminosité** | Monte / baisse (via nircmd sous Windows) |
| 🔗 **Inter-plugins** | Écoute les triggers `Avatar.trigger('jarvis_trigger', ...)` |

---

## Installation

1. Copier ce dossier dans :
   ```
   <AVATAR>/resources/app/core/plugins/jarvis/
   ```

2. Éditer `jarvis.prop` :
   - `ollamaPath` : chemin vers `ollama_app.exe`
   - `defaultClient` : nom de votre client Avatar principal
   - `ramAlertThreshold` : seuil RAM en % avant alerte vocale (défaut : 90)
   - `morningReport` : rapport vocal à 8h (true/false)

3. Redémarrer Avatar Server

---

## Widget — Configuration dans Widget Studio

Un **seul bouton** à configurer :

Ouvrir **Widget Studio** → onglet **Plugins** → **Jarvis**

| Champ | Valeur |
|---|---|
| Nom | Panneau Jarvis |
| usage_name | Button_control |
| periph_id | jarvis_control_00 |
| Action On | Plugin : `Jarvis` — Paramètre : `control` |
| Action Off | Plugin : `Jarvis` — Paramètre : `control` |
| Image On | `assets/images/widget/Button_control/On.png` |
| Image Off | `assets/images/widget/Button_control/Off.png` |

> ⚠️ Les champs **Action On** et **Action Off** doivent tous les deux contenir `control`.  
> Un clic ouvre le panneau, un deuxième clic le ferme.

---

## Panneau de contrôle

Le panneau s'ouvre en cliquant sur le widget. Il affiche :

- **Dashboard en temps réel** : CPU, RAM, Uptime, OS (rafraîchi toutes les 5s)
- **Boutons d'action** organisés par section :

| Section | Boutons disponibles |
|---|---|
| Applications | Chrome, VLC, Notepad, Calculatrice |
| Dossiers | Bureau, Téléchargements, Plugins, Avatar |
| Système | Verrouiller, Corbeille, Tâches, Économiseur |
| IA | Vérifier / Démarrer Ollama |
| Avatar | Client, Serveur, Tout restart, Éteindre PC |

> Les boutons **Restart all** et **Éteindre** demandent une confirmation en deux clics.

---

## Inter-plugins

Depuis n'importe quel autre plugin :

```js
Avatar.trigger('jarvis_trigger', {
    command: 'locksystem',
    client: 'Living room'
});
```

---

## Commandes vocales (exemples)

- *"monte le volume"*, *"baisse le son"*, *"coupe le son"*
- *"augmente la luminosité"*, *"baisse la luminosité"*
- *"prends une capture d'écran"*
- *"diagnostic système"*
- *"vide la corbeille"*
- *"verrouille la session"*
- *"lance l'écran de veille"*
- *"vérifie ollama"*, *"démarre ollama"*
- *"redémarre le client"*, *"redémarre avatar"*

<br><br>

Version : v2