import * as path from 'node:path';
import * as url  from 'node:url';
import os        from 'node:os';
import fs        from 'fs-extra';
import { exec }  from 'node:child_process';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// ─── Widget lib — protégé par try/catch ───────────────────────────────────────
// IMPORTANT : si widgetLibrairy plante, le plugin continue sans widgets
let Widget = null;
try {
    const widgetLib = await import('../../../widgetLibrairy.js');
    Widget = await widgetLib.init();
} catch (e) {
    console.warn('[Jarvis] widgetLibrairy non disponible — mode sans widget.');
}

const widgetFolder    = path.resolve(__dirname, 'assets/widget');
const widgetImgFolder = path.resolve(__dirname, 'assets/images/widget');
const styleFile       = path.resolve(__dirname, 'assets/style.json');
const controlFile     = path.resolve(__dirname, 'assets/control-style.json');

// ─── État global ──────────────────────────────────────────────────────────────
let periphInfo      = [];
let DashboardWindow = null;
let ControlWindow   = null;
let dashboardState  = false;
let controlState    = false;

const CONFIRM_COMMANDS = new Set(['shutdownsystem','restartsystem','logoutsystem','closeallwindows']);

// ─── Commandes OS ─────────────────────────────────────────────────────────────
const CMD = {
    interfacerun:    { win32:{cmd:'C:/progra~1/Rainmeter/Rainmeter.exe'}, linux:{cmd:'/usr/bin/rainmeter'}, darwin:{cmd:'/Applications/Rainmeter.app/Contents/MacOS/Rainmeter'} },
    interfaceclose:  { win32:{cmd:'taskkill',args:'/F /IM Rainmeter.exe'}, darwin:{cmd:'osascript',args:'-e \'quit app "Rainmeter"\''}, linux:{cmd:'pkill',args:'-f rainmeter'} },
    chromerun:       { win32:{cmd:'C:/progra~1/Google/Chrome/Application/chrome.exe',args:'https://www.google.fr/'}, linux:{cmd:'google-chrome',args:'https://www.google.fr/'}, darwin:{cmd:'open',args:'-a "Google Chrome" https://www.google.fr/'} },
    chromeclose:     { win32:{cmd:'taskkill',args:'/F /IM chrome.exe'}, darwin:{cmd:'osascript',args:'-e \'quit app "Google Chrome"\''}, linux:{cmd:'pkill',args:'-f chrome'} },
    vlcrun:          { win32:{cmd:'C:/progra~1/VideoLAN/VLC/vlc.exe'}, linux:{cmd:'vlc'}, darwin:{cmd:'/Applications/VLC.app/Contents/MacOS/VLC'} },
    vlcclose:        { win32:{cmd:'taskkill',args:'/F /IM vlc.exe'}, darwin:{cmd:'osascript',args:'-e \'quit app "VLC"\''}, linux:{cmd:'pkill',args:'-f vlc'} },
    gmailrun:        { win32:{cmd:'C:/progra~1/Google/Chrome/Application/chrome.exe',args:'https://mail.google.com/mail/u/1/#inbox'}, linux:{cmd:'google-chrome',args:'https://mail.google.com/mail/u/1/#inbox'}, darwin:{cmd:'open',args:'-a "Google Chrome" https://mail.google.com/mail/u/1/#inbox'} },
    notepadrun:      { win32:{cmd:'C:/progra~1/Notepad++/notepad++.exe'}, linux:{cmd:'gedit'}, darwin:{cmd:'/System/Applications/TextEdit.app/Contents/MacOS/TextEdit'} },
    notepadclose:    { win32:{cmd:'taskkill',args:'/F /IM notepad++.exe'}, darwin:{cmd:'osascript',args:'-e \'quit app "TextEdit"\''}, linux:{cmd:'pkill',args:'-f notepad\\+\\+|gedit|kate'} },
    wordrun:         { win32:{cmd:'start',args:'winword'}, darwin:{cmd:'open',args:'-a "Microsoft Word"'}, linux:{cmd:'libreoffice',args:'--writer'} },
    wordclose:       { win32:{cmd:'taskkill',args:'/F /IM winword.exe'}, darwin:{cmd:'osascript',args:'-e \'quit app "Microsoft Word"\''}, linux:{cmd:'pkill',args:'-f soffice'} },
    excelrun:        { win32:{cmd:'cmd.exe',args:'/c start excel'}, darwin:{cmd:'open',args:'-a "Microsoft Excel"'}, linux:{cmd:'libreoffice',args:'--calc'} },
    excelclose:      { win32:{cmd:'taskkill',args:'/F /IM excel.exe'}, darwin:{cmd:'osascript',args:'-e \'quit app "Microsoft Excel"\''}, linux:{cmd:'pkill',args:'-f soffice'} },
    outlookrun:      { win32:{cmd:'cmd.exe',args:'/c start outlook'}, darwin:{cmd:'/System/Applications/Mail.app/Contents/MacOS/Mail'}, linux:{cmd:'xdg-email'} },
    outlookclose:    { win32:{cmd:'taskkill',args:'/F /IM Olk.exe'}, darwin:{cmd:'osascript',args:'-e \'quit app "Mail"\''}, linux:{cmd:'pkill',args:'-f evolution|thunderbird'} },
    urlnetflix:      { win32:{cmd:'C:/progra~1/Google/Chrome/Application/chrome.exe',args:'--new-window --app=https://www.netflix.com'}, linux:{cmd:'google-chrome',args:'--new-window https://www.netflix.com'}, darwin:{cmd:'open',args:'https://www.netflix.com'} },
    urlyoutube:      { win32:{cmd:'C:/progra~1/Google/Chrome/Application/chrome.exe',args:'https://www.youtube.com/'}, linux:{cmd:'google-chrome',args:'https://www.youtube.com/'}, darwin:{cmd:'open',args:'-a "Google Chrome" https://www.youtube.com/'} },
    searchinternet:  { win32:{cmd:'powershell.exe',url:'https://www.google.com/search?q='}, darwin:{cmd:'open',url:'https://www.google.com/search?q='}, linux:{cmd:'xdg-open',url:'https://www.google.com/search?q='} },
    powershellrun:   { win32:{cmd:'powershell.exe',args:'-NoExit -Command "Start-Process powershell"'}, linux:{cmd:'pwsh'}, darwin:{cmd:'open',args:'-a PowerShell'} },
    powershellclose: { win32:{cmd:'taskkill',args:'/F /IM powershell.exe'}, linux:{cmd:'pkill',args:'-f pwsh'}, darwin:{cmd:'osascript',args:'-e \'quit app "PowerShell"\''} },
    restartsystem:   { win32:{cmd:'shutdown',args:'/r /f /t 5'}, linux:{cmd:'reboot'}, darwin:{cmd:'osascript',args:'-e "tell application \\"System Events\\" to restart"'} },
    shutdownsystem:  { win32:{cmd:'shutdown',args:'/s /f /t 5'}, linux:{cmd:'shutdown',args:'-h now'}, darwin:{cmd:'osascript',args:'-e "tell application \\"System Events\\" to shut down"'} },
    logoutsystem:    { win32:{cmd:'shutdown',args:'/l'}, linux:{cmd:'gnome-session-quit',args:'--logout --no-prompt'}, darwin:{cmd:'osascript',args:'-e "tell application \\"System Events\\" to log out"'} },
    locksystem:      { win32:{cmd:'rundll32.exe',args:'user32.dll,LockWorkStation'}, linux:{cmd:'xdg-screensaver',args:'lock'}, darwin:{cmd:'osascript',args:'-e "tell application \\"System Events\\" to keystroke \\"q\\" using {control down, command down}"'} },
    hibernatesystem: { win32:{cmd:'shutdown',args:'/h'}, linux:{cmd:'systemctl',args:'hibernate'}, darwin:{cmd:'pmset',args:'sleepnow'} },
    taskmanager:     { win32:{cmd:'taskmgr'}, linux:{cmd:'gnome-system-monitor'}, darwin:{cmd:'open',args:'/Applications/Utilities/Activity Monitor.app'} },
    commandline:     { win32:{cmd:'cmd.exe',args:'/c start cmd.exe'}, linux:{cmd:'x-terminal-emulator'}, darwin:{cmd:'open',args:'/Applications/Utilities/Terminal.app'} },
    closeallwindows: { win32:{cmd:'taskkill',args:'/F /FI "STATUS eq RUNNING"'}, linux:{cmd:'pkill',args:'-f .*'}, darwin:{cmd:'osascript',args:'-e "tell application \\"System Events\\" to set visible of every process to false"'} },
    emptytash:       { win32:{cmd:'powershell.exe',args:'-NoProfile -Command "Clear-RecycleBin -Force"'}, linux:{cmd:'gio',args:'trash --empty'}, darwin:{cmd:'osascript',args:'-e "tell application \\"Finder\\" to empty trash"'} },
    folderun:        { win32:{cmd:'cmd.exe',args:'/c start explorer.exe shell:MyComputerFolder'}, linux:{cmd:'xdg-open',args:'.'}, darwin:{cmd:'open',args:'.'} },
    calculatorrun:   { win32:{cmd:'calc.exe'}, linux:{cmd:'gnome-calculator'}, darwin:{cmd:'open',args:'-a Calculator'} },
    folderdownload:  { win32:{cmd:'cmd.exe',args:'/c start explorer.exe shell:Downloads'}, darwin:{cmd:'open',args:'~/Downloads'}, linux:{cmd:'xdg-open',args:'~/Downloads'} },
    folderdiskc:     { win32:{cmd:'explorer.exe',args:'C:\\'}, darwin:{cmd:'open',args:'/'}, linux:{cmd:'xdg-open',args:'/'} },
    folderdesktop:   { win32:{cmd:'explorer.exe',args:'shell:Desktop'}, darwin:{cmd:'open',args:'~/Desktop'}, linux:{cmd:'xdg-open',args:'~/Desktop'} },
    folderplugins:   { win32:{cmd:'cmd.exe',args:`/c start "" "${path.resolve(__dirname,'..')}"`}, darwin:{cmd:'open',args:`"${path.resolve(__dirname,'..')}"`}, linux:{cmd:'xdg-open',args:`"${path.resolve(__dirname,'..')}"`} },
    folderavatar:    { win32:{cmd:'cmd.exe',args:`/c start "" "${path.resolve(__dirname,'..','..','..','..','..','..') }"`}, darwin:{cmd:'open',args:`"${path.resolve(__dirname,'..','..','..','..','..','..') }"`}, linux:{cmd:'xdg-open',args:`"${path.resolve(__dirname,'..','..','..','..','..','..') }"`} },
    restartclient:   { win32:{cmd:'powershell.exe',args:`-NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'A.V.A.T.A.R-Client' -Force -ErrorAction SilentlyContinue; Start-Sleep -s 5; Start-Process -FilePath 'C:\\avatar\\client\\A.V.A.T.A.R-Client.exe'"`}, darwin:{cmd:'sh',args:`-c "pkill -9 -f 'A.V.A.T.A.R-Client'; sleep 5; open '/Applications/A.V.A.T.A.R-Client.app'"`}, linux:{cmd:'sh',args:`-c "pkill -9 -f 'A.V.A.T.A.R-Client'; sleep 5; nohup ./A.V.A.T.A.R-Client > /dev/null 2>&1 &"`} },
    restartserver:   { win32:{cmd:'powershell.exe',args:`-NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'A.V.A.T.A.R-Server' -Force -ErrorAction SilentlyContinue; Start-Sleep -s 5; Start-Process -FilePath 'C:\\avatar\\server\\A.V.A.T.A.R-Server.exe'"`}, darwin:{cmd:'sh',args:`-c "pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; open '/Applications/A.V.A.T.A.R-Server.app'"`}, linux:{cmd:'sh',args:`-c "pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; nohup ./A.V.A.T.A.R-Server > /dev/null 2>&1 &"`} },
    restartall:      { win32:{cmd:'powershell.exe',args:`-NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'A.V.A.T.A.R-Client','A.V.A.T.A.R-Server' -Force -ErrorAction SilentlyContinue; Start-Sleep -s 5; Start-Process 'C:\\avatar\\client\\A.V.A.T.A.R-Client.exe'; Start-Process 'C:\\avatar\\server\\A.V.A.T.A.R-Server.exe'"`}, darwin:{cmd:'sh',args:`-c "pkill -9 -f 'A.V.A.T.A.R-Client'; pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; open '/Applications/A.V.A.T.A.R-Client.app'; open '/Applications/A.V.A.T.A.R-Server.app'"`}, linux:{cmd:'sh',args:`-c "pkill -9 -f 'A.V.A.T.A.R-Client'; pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; nohup ./A.V.A.T.A.R-Client > /dev/null 2>&1 & nohup ./A.V.A.T.A.R-Server > /dev/null 2>&1 &"`} },
};

// ═════════════════════════════════════════════════════════════════════════════
// INIT
// ═════════════════════════════════════════════════════════════════════════════
export async function init() {
    if (!await Avatar.lang.addPluginPak('jarvis')) {
        return error('jarvis: unable to load language pak files');
    }

    // ── Widgets — seulement si widgetLib est disponible ───────────────────────
    if (Widget) {
        periphInfo.push({
            Buttons: [
                { name:'Panneau Jarvis', value_type:'button', usage_name:'Button_control', periph_id:'jarvis_control_00', notes:'Panneau de contrôle Jarvis' }
            ]
        });
    }

    // ── Écoute inter-plugins ──────────────────────────────────────────────────
    Avatar.listen('jarvis_trigger', async (data) => {
        if (data?.command) {
            info(`[Jarvis] trigger: ${data.command}`, 'Jarvis');
            const c = CMD[data.command]?.[process.platform];
            if (c) Avatar.runApp(c.cmd, data.client || Config.default?.client, c.args || '');
        }
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// WIDGET — lifecycle Avatar
// ═════════════════════════════════════════════════════════════════════════════
export async function onClose(widgets) {
    if (Widget && Config.modules.jarvis.widget?.display === true) {
        await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.jarvis);
        if (widgets) await Widget.saveWidgets(widgets);
    }
    _saveWinState(DashboardWindow, styleFile);
    _saveWinState(ControlWindow,   controlFile);
}

export async function getWidgetsOnLoad() {
    if (!Widget || Config.modules.jarvis.widget?.display !== true) return;
    await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.jarvis);
    const widgets = await Widget.getWidgets();
    return { plugin: 'jarvis', widgets, Config: Config.modules.jarvis };
}

export async function readyToShow() {
    // Restaurer état fenêtres
    const sp = _loadJson(styleFile);
    dashboardState = sp?.start === true;
    if (dashboardState) openDashboard();

    const cp = _loadJson(controlFile);
    controlState = cp?.start === true;
    if (controlState) openControlPanel();

    // Rafraîchir état visuel des boutons
    if (Widget) {
        Avatar.Interface.refreshWidgetInfo({ plugin:'jarvis', id:'jarvis_control_00' });
    }
}

// ── getNewButtonState : retourne 'On' ou 'Off' selon l'état ──────────────────
// Avatar appelle cette méthode pour choisir quelle image afficher (On.png / Off.png)
export async function getNewButtonState(arg) {
    // Avatar envoie periphId (I majuscule) d'après les logs
    // ex: { plugin:'jarvis', periphId:'jarvis_control_00', value:'On', ... }
    const id = arg?.periphId || arg?.periph_id || '';
    if (id === 'jarvis_control_00') {
        // Retourner l'état OPPOSÉ : Avatar bascule l'image au prochain rafraîchissement
        return controlState ? 'On' : 'Off';
    }
    return 'On';
}

export async function getPeriphInfo() {
    return periphInfo;
}

// ── widgetAction ─────────────────────────────────────────────────────────────
// Logs confirmés : { description:"On"|"Off", action:"control", plugin:"Jarvis" }
//   action      = paramètre Widget Studio ("control")
//   description = état cliqué ("On" ou "Off")
export async function widgetAction(even) {
    info(`[Jarvis] widgetAction: ${JSON.stringify(even.value)}`, 'Jarvis');

    const param = (even.value?.action      || '').toLowerCase(); // "control"
    const state = (even.value?.description || '').toLowerCase(); // "on" ou "off"
    const isOn  = (state === 'on');

    info(`[Jarvis] param="${param}" state="${state}" isOn=${isOn}`, 'Jarvis');

    if (param === 'control') {
        controlState = isOn;
        if (controlState && !ControlWindow)  { openControlPanel(); return; }
        if (!controlState && ControlWindow)  { ControlWindow.destroy(); return; }
        return;
    }

    warn(`[Jarvis] widgetAction non reconnu — param="${param}" state="${state}"`);
}

// ═════════════════════════════════════════════════════════════════════════════
// CRON — toutes les 5 minutes
// ═════════════════════════════════════════════════════════════════════════════
export async function cron() {
    try {
        const cfg      = Config.modules.jarvis;
        const seuil    = cfg.ramAlertThreshold ?? 90;
        const ram      = calcRam();

        // Alerte RAM
        if (ram >= seuil) {
            const clients = Avatar.getAllClients?.() || [];
            const target  = clients.find(c => !Avatar.isVirtualClient(c)) || cfg.defaultClient;
            if (target) {
                const L = await Avatar.lang.getPak('jarvis', Config.language);
                Avatar.speak(
                    L ? L.get(['message.ramAlert', String(ram)])
                      : `Attention, mémoire vive à ${ram} pourcent.`,
                    target
                );
                warn(`[Jarvis CRON] Alerte RAM: ${ram}%`);
            }
        }

        // Rapport matinal à 8h
        const now = new Date();
        if (now.getHours() === 8 && now.getMinutes() < 5 && cfg.morningReport === true) {
            await morningReport();
        }

        // Mise à jour des fenêtres ouvertes
        const data = await getSysData();
        if (DashboardWindow) DashboardWindow.webContents.send('jarvis-update', data);
        if (ControlWindow)   ControlWindow.webContents.send('jarvis-update',   data);

    } catch (err) {
        error('[Jarvis CRON]', err.message);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTION (commandes vocales)
// ═════════════════════════════════════════════════════════════════════════════
export async function action(data, callback) {
    try {
        const Locale = await Avatar.lang.getPak('jarvis', data.language);
        if (!Locale) throw new Error(`jarvis: pak '${data.language}' introuvable`);

        const cmd = data?.action?.command;
        if (!cmd) throw new Error('jarvis: missing action.command');

        // ── Recherche internet ─────────────────────────────────────────────────
        if (cmd === 'searchinternet') {
            const skip = ['start','search','research','run','launch','of','a','for','on','internet','google','web','please','cherche','recherche','lance','ouvre','sur','le','la','les','de','du','un','une','pour','dans','avec'];
            const terms = (data.tokens||[]).filter(t => !skip.includes(t.toLowerCase())).join(' ').trim();
            const doSearch = (q) => {
                const c   = CMD.searchinternet[process.platform];
                const url = `${c.url}${q.replace(/\s+/g,'+')}`;
                const run = process.platform === 'win32'
                    ? `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process 'chrome.exe' -ArgumentList '${url}'"`
                    : `${c.cmd} "${url}"`;
                Avatar.runApp(run, data.client, (err) => {
                    Avatar.speak(err ? Locale.get('message.interneterr') : `${Locale.get('message.searchinternet')} ${q}`, data.client, () => callback());
                });
            };
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            if (terms.length > 0) return doSearch(terms);
            return Avatar.askme(Locale.get('message.internetask'), data.client,
                {'*':'generic','annuler':'done'}, 20, (ans, end) => {
                    end(data.client);
                    ans?.includes('generic:') ? doSearch(ans.split(':')[1]) : Avatar.speak(Locale.get('message.internetcancel'), data.client, () => callback());
                });
        }

        // ── Diagnostic système ─────────────────────────────────────────────────
        if (cmd === 'systemdiag') {
            const s = cpuSnap();
            setTimeout(async () => {
                const cpu = calcCpu(s, cpuSnap()), ram = calcRam(), disk = await getDiskInfo(), up = fmtUptime(os.uptime());
                info(`[Jarvis] CPU:${cpu}% RAM:${ram}%`, L.get('plugin.from'), data.client);
                Avatar.speak(`${Locale.get('message.systemdiag')} ${Locale.get(['message.diagDetail',String(cpu),String(ram),disk,up])}`, data.client, () => callback());
            }, 1000);
            return;
        }

        // ── Ollama ─────────────────────────────────────────────────────────────
        if (cmd === 'checkollama') {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            return checkOllama(data.client, Locale, callback);
        }

        // ── Screensaver ────────────────────────────────────────────────────────
        if (cmd === 'screensaver') {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            return Avatar.speak(Locale.get('message.screensaver'), data.client, () => {
                launchScreensaver();
                callback();
            });
        }

        // ── Lecteur CD ─────────────────────────────────────────────────────────
        if (['lecteurcdopen','lecteurcdclose'].includes(cmd)) {
            const dl = Config?.modules?.jarvis?.lettercd || 'D';
            const ni = path.resolve(__dirname, 'nircmd', 'nircmdc.exe');
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            return Avatar.speak(Locale.get(`message.${cmd}`), data.client, () => { Avatar.runApp(ni, data.client, `cdrom ${cmd==='lecteurcdopen'?'open':'close'} ${dl}:`); callback(); });
        }

        // ── Nouveau dossier ────────────────────────────────────────────────────
        if (cmd === 'newfolder') {
            const p = path.join(os.homedir(), 'Desktop', `Nouveau dossier ${new Date().toISOString().slice(0,10)}`);
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            return Avatar.speak(Locale.get('message.newfolder'), data.client, () => {
                Avatar.runApp(process.platform==='win32'?'powershell.exe':'sh', data.client,
                    process.platform==='win32'?`-Command "New-Item -ItemType Directory -Path '${p}'"`:  `-c "mkdir -p '${p}'"`,
                    () => callback());
            });
        }

        // ── Volume ─────────────────────────────────────────────────────────────
        if (['volumeup','volumedown','volumemute'].includes(cmd)) {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            return Avatar.speak(Locale.get(`message.${cmd}`), data.client, () => { execVolume(cmd, data.client); callback(); });
        }

        // ── Luminosité ─────────────────────────────────────────────────────────
        if (['brightnessup','brightnessdown'].includes(cmd)) {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            return Avatar.speak(Locale.get(`message.${cmd}`), data.client, () => { execBrightness(cmd, data.client); callback(); });
        }

        // ── Screenshot ─────────────────────────────────────────────────────────
        if (cmd === 'screenshot') {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            const dest = path.join(os.homedir(),'Desktop',`capture_${new Date().toISOString().replace(/[:.]/g,'-')}.png`);
            let run, args;
            if (process.platform==='win32') { run='powershell.exe'; args=`-NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $s=[System.Windows.Forms.Screen]::PrimaryScreen; $b=New-Object System.Drawing.Bitmap($s.Bounds.Width,$s.Bounds.Height); $g=[System.Drawing.Graphics]::FromImage($b); $g.CopyFromScreen($s.Bounds.Location,[System.Drawing.Point]::Empty,$s.Bounds.Size); $b.Save('${dest}')"`;
            } else if (process.platform==='darwin') { run='screencapture'; args=dest; }
            else { run='scrot'; args=dest; }
            return Avatar.speak(Locale.get('message.screenshot'), data.client, () => { Avatar.runApp(run, data.client, args, () => callback()); });
        }

        // ── Notification ───────────────────────────────────────────────────────
        if (cmd === 'notification') {
            const msg = (data.tokens||[]).join(' ').trim() || 'Notification Jarvis';
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            sendNotif('Jarvis', msg, data.client);
            return Avatar.speak(Locale.get('message.notification'), data.client, () => callback());
        }

        // ── Dashboard fenêtre ──────────────────────────────────────────────────
        if (cmd === 'dashboard') {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            if (DashboardWindow) { DashboardWindow.destroy(); return Avatar.speak(Locale.get('message.dashboardclose'), data.client, () => callback()); }
            await openDashboard();
            return Avatar.speak(Locale.get('message.dashboard'), data.client, () => callback());
        }

        // ── Panneau de contrôle fenêtre ────────────────────────────────────────
        if (cmd === 'jarviscontrol') {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            if (ControlWindow) { ControlWindow.destroy(); return Avatar.speak(Locale.get('message.controlclose'), data.client, () => callback()); }
            await openControlPanel();
            return Avatar.speak(Locale.get('message.controlopen'), data.client, () => callback());
        }

        // ── Commandes irréversibles avec confirmation ──────────────────────────
        if (CONFIRM_COMMANDS.has(cmd)) {
            return Avatar.askme(Locale.get(`message.confirm_${cmd}`) || Locale.get('message.confirm_default'), data.client,
                {'oui':'yes','yes':'yes','non':'no','no':'no','annuler':'no'}, 15,
                (ans, end) => {
                    end(data.client);
                    if (ans === 'yes') {
                        const c = CMD[cmd]?.[process.platform];
                        if (c) { info('[jarvis]:', cmd, L.get('plugin.from'), data.client); Avatar.speak(Locale.get(`message.${cmd}`), data.client, () => { Avatar.runApp(c.cmd, data.client, c.args||''); callback(); }); }
                        else Avatar.speak(Locale.get('message.errorcommand'), data.client, () => callback());
                    } else Avatar.speak(Locale.get('message.cancelled'), data.client, () => callback());
                });
        }

        // ── Commandes standards ────────────────────────────────────────────────
        const c = CMD[cmd]?.[process.platform];
        if (c) {
            info('[jarvis]:', cmd, L.get('plugin.from'), data.client);
            return Avatar.speak(Locale.get(`message.${cmd}`), data.client, () => { Avatar.runApp(c.cmd, data.client, c.args||''); callback(); });
        }

        // ── Commande inconnue ──────────────────────────────────────────────────
        info('[jarvis]: commande inconnue:', cmd, L.get('plugin.from'), data.client);
        Avatar.speak(Locale.get('message.errorcommand'), data.client, () => callback());

    } catch (err) {
        error('jarvis error:', err?.message || err);
        callback();
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════
function cpuSnap() {
    return os.cpus().reduce((a,c) => { a.idle+=c.times.idle; a.total+=Object.values(c.times).reduce((x,y)=>x+y,0); return a; },{idle:0,total:0});
}
function calcCpu(s,e) { return Math.round(100-(100*(e.idle-s.idle)/(e.total-s.total)))||0; }
function calcRam()    { const t=os.totalmem(),f=os.freemem(); return Math.round(((t-f)/t)*100); }
function fmtUptime(s) { return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}min`; }

function getDiskInfo() {
    return new Promise(res => {
        if (process.platform === 'win32') {
            exec(`powershell -NoProfile -Command "(Get-PSDrive C | Select-Object -ExpandProperty Free)/1GB"`,
                (e,o) => res(e ? 'N/A' : `${Math.round(parseFloat(o.trim()))} Go libres`));
        } else {
            try { const s=fs.statfsSync('/'); res(`${Math.round(s.bfree*s.bsize/1e9)} Go libres`); }
            catch { res('N/A'); }
        }
    });
}

async function getSysData() {
    const start = cpuSnap();
    return new Promise(res => {
        setTimeout(() => {
            const cpu=calcCpu(start,cpuSnap()), ram=calcRam();
            res({ cpu, ram, totalRam:Math.round(os.totalmem()/1e9), freeRam:Math.round(os.freemem()/1e9), uptime:fmtUptime(os.uptime()), platform:process.platform });
        }, 500);
    });
}

function execVolume(cmd, client) {
    const nircmd = path.resolve(__dirname, 'nircmd', 'nircmdc.exe');
    if (process.platform==='win32') {
        Avatar.runApp(nircmd, client, cmd==='volumemute'?'mutesysvolume 2':`changesysvolume ${cmd==='volumeup'?'+2000':'-2000'}`);
    } else if (process.platform==='linux') {
        Avatar.runApp('pactl', client, `set-sink-volume @DEFAULT_SINK@ ${cmd==='volumeup'?'+10%':cmd==='volumedown'?'-10%':'toggle'}`);
    } else {
        const v = cmd==='volumeup'?'output volume (output volume of (get volume settings) + 10)':cmd==='volumedown'?'output volume (output volume of (get volume settings) - 10)':'output muted not (output muted of (get volume settings))';
        Avatar.runApp('osascript', client, `-e "set volume ${v}"`);
    }
}

function execBrightness(cmd, client) {
    const nircmd = path.resolve(__dirname, 'nircmd', 'nircmdc.exe');
    if (process.platform==='win32') Avatar.runApp(nircmd, client, `changebrightness ${cmd==='brightnessup'?'20':'-20'}`);
    else if (process.platform==='linux') {
        exec(`xrandr --listmonitors | awk 'NR==2{print $4}'`, (e,m) => {
            if (!e && m.trim()) Avatar.runApp('xrandr', client, `--output ${m.trim()} --brightness ${cmd==='brightnessup'?'1.0':'0.5'}`);
        });
    } else Avatar.runApp('osascript', client, `-e 'tell application "System Preferences" to activate'`);
}

function sendNotif(title, msg, client) {
    if (process.platform==='win32') {
        Avatar.runApp('powershell.exe', client, `-NoProfile -Command "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime]|Out-Null; $t=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); $t.SelectSingleNode('//text[@id=1]').InnerText='${title}'; $t.SelectSingleNode('//text[@id=2]').InnerText='${msg}'; [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Jarvis').Show([Windows.UI.Notifications.ToastNotification]::new($t))"`);
    } else if (process.platform==='linux') {
        Avatar.runApp('notify-send', client, `"${title}" "${msg}"`);
    } else {
        Avatar.runApp('osascript', client, `-e 'display notification "${msg}" with title "${title}"'`);
    }
}

// ── launchScreensaver : UN SEUL endroit de lancement ─────────────────────────
function launchScreensaver() {
    if (process.platform === 'win32') {
        const scrPath = path.resolve(__dirname, 'bin', 'matrixcode', 'matrix.scr');
        info(`[Jarvis] Screensaver: ${scrPath}`, 'Jarvis');
        exec(`"${scrPath}" /s`);
    }
}

// Messages vocaux pour les boutons du panneau HTML
const PANEL_SPEAKS = {
    chromerun:       "J'ouvre Chrome.",
    vlcrun:          "Je lance VLC.",
    notepadrun:      "J'ouvre l'éditeur.",
    calculatorrun:   "Voilà la calculatrice.",
    folderdesktop:   "J'ouvre le bureau.",
    folderdownload:  "Voilà vos téléchargements.",
    folderplugins:   "J'ouvre le dossier des plugins.",
    folderavatar:    "J'ouvre le dossier Avatar.",
    locksystem:      "Je verrouille la session.",
    emptytash:       "Je vide la corbeille.",
    taskmanager:     "J'ouvre le gestionnaire des tâches.",
    screensaver:     "Je lance l'écran de veille.",
    checkollama:     "Je vérifie Ollama.",
    restartclient:   "Je redémarre le client Avatar.",
    restartserver:   "Je redémarre le serveur Avatar.",
    restartall:      "Réinitialisation d'Avatar en cours.",
    shutdownsystem:  "J'éteins le système.",
};

function runCmd(name) {
    const client = Config.default?.client || Config.modules.jarvis.defaultClient || 'default';

    // Speak associé au bouton si disponible
    const msg = PANEL_SPEAKS[name];
    if (msg) Avatar.speak(msg, client);

    // Exécution de la commande
    if (name === 'screensaver') { launchScreensaver(); return; }
    if (name === 'checkollama') { checkOllama(client); return; }

    const c = CMD[name]?.[process.platform];
    if (c) Avatar.runApp(c.cmd, client, c.args||'');
    else if (!msg) warn(`[Jarvis] runCmd: commande inconnue "${name}"`);
}

async function checkOllama(client, Locale, callback) {
    try {
        const res = await fetch('http://127.0.0.1:11434/api/tags');
        if (res.ok) {
            if (Locale && callback) Avatar.speak(Locale.get('message.ollamaok'), client, () => callback());
            else info('[Jarvis] Ollama OK', 'Jarvis');
        } else throw new Error();
    } catch {
        const p = Config?.modules?.jarvis?.ollamaPath;
        if (p && process.platform==='win32') {
            if (Locale && callback) Avatar.speak(Locale.get('message.ollamarun'), client, () => { Avatar.runApp('powershell.exe', client, `-Command "Start-Process '${p}'"`, () => callback()); });
            else Avatar.runApp('powershell.exe', client, `-Command "Start-Process '${p}'"`);
        } else if (Locale && callback) Avatar.speak(Locale.get('message.ollamanostart'), client, () => callback());
    }
}

async function morningReport() {
    const clients = Avatar.getAllClients?.() || [];
    const target  = clients.find(c => !Avatar.isVirtualClient(c));
    if (!target) return;
    const Locale = await Avatar.lang.getPak('jarvis', Config.language);
    if (!Locale) return;
    const s = cpuSnap();
    setTimeout(() => {
        Avatar.speak(Locale.get(['message.morningReport', String(new Date().getHours()), String(calcCpu(s,cpuSnap())), String(calcRam()), fmtUptime(os.uptime())]), target);
    }, 500);
}

function _saveWinState(win, file) {
    try {
        if (win) { const p=win.getPosition(); fs.writeJsonSync(file,{x:p[0],y:p[1],start:true}); }
        else {
            let d={}; try { d=fs.readJsonSync(file,{throws:false})||{}; } catch {}
            d.start=false; fs.writeJsonSync(file,d);
        }
    } catch {}
}

function _loadJson(file) {
    try { return fs.existsSync(file) ? fs.readJsonSync(file,{throws:false}) : null; }
    catch { return null; }
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
const openDashboard = async () => {
    if (DashboardWindow) return DashboardWindow.show();
    const prop  = _loadJson(styleFile);
    const style = {
        parent:Avatar.Interface.mainWindow(), frame:false, movable:true, resizable:false,
        minimizable:false, alwaysOnTop:false, show:false,
        width:  Config.modules.jarvis.dashboard?.width  || 420,
        height: Config.modules.jarvis.dashboard?.height || 280,
        opacity:Config.modules.jarvis.dashboard?.opacity ?? 1,
        ...(prop?.x !== undefined ? {x:prop.x,y:prop.y} : {}),
        icon: path.resolve(__dirname,'assets','images','jarvis.png'),
        webPreferences:{ preload:path.resolve(__dirname,'jarvis-preload.js') },
        title:'Jarvis Dashboard'
    };
    DashboardWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname,'jarvis-dashboard.html'), false);
    DashboardWindow.once('ready-to-show', async () => {
        DashboardWindow.show();
        DashboardWindow.webContents.send('jarvis-init', await getSysData());
        if (Config.modules.jarvis.dashboard?.devTools) DashboardWindow.webContents.openDevTools();
    });
    Avatar.Interface.ipcMain().handle('jarvis-getdata', async () => await getSysData());
    DashboardWindow.on('closed', () => {
        dashboardState = false;
        Avatar.Interface.ipcMain().removeHandler('jarvis-getdata');
        Avatar.Interface.ipcMain().removeAllListeners('jarvis-close');
        if (Widget) Avatar.Interface.refreshWidgetInfo({plugin:'jarvis',id:'jarvis_dash_01'});
        DashboardWindow = null;
    });
    Avatar.Interface.ipcMain().on('jarvis-close', () => { if (DashboardWindow) DashboardWindow.destroy(); });
};

// ═════════════════════════════════════════════════════════════════════════════
// PANNEAU DE CONTRÔLE
// ═════════════════════════════════════════════════════════════════════════════
const openControlPanel = async () => {
    if (ControlWindow) return ControlWindow.show();
    const prop  = _loadJson(controlFile);
    const style = {
        parent:Avatar.Interface.mainWindow(), frame:false, movable:true, resizable:false,
        minimizable:false, alwaysOnTop:false, show:false,
        width:320, height:860,
        opacity:Config.modules.jarvis.controlPanel?.opacity ?? 0.97,
        ...(prop?.x !== undefined ? {x:prop.x,y:prop.y} : {}),
        icon: path.resolve(__dirname,'assets','images','jarvis.png'),
        webPreferences:{ preload:path.resolve(__dirname,'jarvis-control-preload.js') },
        title:'Jarvis Control'
    };
    ControlWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname,'jarvis-control.html'), false);
    ControlWindow.once('ready-to-show', async () => {
        ControlWindow.show();
        ControlWindow.webContents.send('jarvis-control-init', await getSysData());
        if (Config.modules.jarvis.controlPanel?.devTools) ControlWindow.webContents.openDevTools();
    });
    Avatar.Interface.ipcMain().handle('jarvis-control-getdata', async () => await getSysData());
    Avatar.Interface.ipcMain().on('jarvis-control-action', (_e, action) => {
        info(`[Jarvis Control] ${action}`, 'Jarvis');
        if (action === 'dashboard') { openDashboard(); return; }
        if (action === 'close')     { ControlWindow?.destroy(); return; }
        runCmd(action);
    });
    ControlWindow.on('closed', () => {
        controlState = false;
        Avatar.Interface.ipcMain().removeHandler('jarvis-control-getdata');
        Avatar.Interface.ipcMain().removeAllListeners('jarvis-control-action');
        Avatar.Interface.ipcMain().removeAllListeners('jarvis-control-close');
        if (Widget) Avatar.Interface.refreshWidgetInfo({plugin:'jarvis',id:'jarvis_control_00'});
        ControlWindow = null;
    });
    Avatar.Interface.ipcMain().on('jarvis-control-close', () => { if (ControlWindow) ControlWindow.destroy(); });
};
