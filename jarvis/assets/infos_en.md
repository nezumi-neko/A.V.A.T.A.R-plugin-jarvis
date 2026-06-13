# Jarvis Plugin — A.V.A.T.A.R

![jarvis](../../core/plugins/jarvis/assets/images/jarvis.png =100x*)

**Jarvis** is an advanced extension module for the A.V.A.T.A.R framework. It transforms your assistant into a true digital butler capable of controlling your operating system, office software, and hardware devices by voice — and through a visual control panel.

---

## Features

| Feature | Description |
|---|---|
| 🎛️ **Panel widget** | A single button opens the full control panel |
| 🪟 **Control panel** | HTML window with CPU/RAM dashboard + all shortcuts |
| 🗣️ **Button speaks** | Each panel button triggers a spoken response |
| ⏰ **CRON** | RAM alert if usage exceeds configurable threshold + morning report at 8 AM |
| 🌌 **Matrix screensaver** | Launch by voice or from the panel |
| 📸 **Voice screenshot** | Timestamped screenshot saved to the desktop |
| 🔊 **Voice volume control** | Increase / decrease / mute sound |
| 💡 **Brightness control** | Increase / decrease brightness (via nircmd on Windows) |
| 🔗 **Inter-plugin support** | Listens for `Avatar.trigger('jarvis_trigger', ...)` triggers |

---

## Installation

1. Copy this folder into:
   ```
   <AVATAR>/resources/app/core/plugins/jarvis/
   ```

2. Edit `jarvis.prop`:
   - `ollamaPath`: path to `ollama_app.exe`
   - `defaultClient`: name of your main Avatar client
   - `ramAlertThreshold`: RAM threshold in % before spoken alert (default: 90)
   - `morningReport`: spoken report at 8 AM (true/false)

3. Restart Avatar Server

---

## Widget — Configuration in Widget Studio

A **single button** must be configured:

Open **Widget Studio** → **Plugins** tab → **Jarvis**

| Field | Value |
|---|---|
| Name | Jarvis Panel |
| usage_name | Button_control |
| periph_id | jarvis_control_00 |
| Action On | Plugin: `Jarvis` — Parameter: `control` |
| Action Off | Plugin: `Jarvis` — Parameter: `control` |
| Image On | `assets/images/widget/Button_control/On.png` |
| Image Off | `assets/images/widget/Button_control/Off.png` |

> ⚠️ Both **Action On** and **Action Off** fields must contain `control`.  
> One click opens the panel, a second click closes it.

---

## Control Panel

The panel opens when clicking the widget. It displays:

- **Real-time dashboard**: CPU, RAM, Uptime, OS (refreshed every 5 seconds)
- **Action buttons** organized by section:

| Section | Available Buttons |
|---|---|
| Applications | Chrome, VLC, Notepad, Calculator |
| Folders | Desktop, Downloads, Plugins, Avatar |
| System | Lock, Recycle Bin, Tasks, Screensaver |
| AI | Check / Start Ollama |
| Avatar | Client, Server, Restart All, Shutdown PC |

> The **Restart all** and **Shutdown** buttons require double-click confirmation.

---

## Inter-plugins

From any other plugin:

```js
Avatar.trigger('jarvis_trigger', {
    command: 'locksystem',
    client: 'Living room'
});
```

---

## Voice Commands (examples)

- *"increase the volume"*, *"lower the sound"*, *"mute the sound"*
- *"increase brightness"*, *"decrease brightness"*
- *"take a screenshot"*
- *"system diagnostics"*
- *"empty the recycle bin"*
- *"lock the session"*
- *"start the screensaver"*
- *"check ollama"*, *"start ollama"*
- *"restart the client"*, *"restart avatar"*

<br><br>

Version: v2
