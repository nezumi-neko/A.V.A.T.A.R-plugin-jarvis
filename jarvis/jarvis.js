import * as path from 'node:path';
import * as url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let Locale;

// Configuration centralisée des commandes par OS
const CONFIG_COMMANDS = {
	// --- APPLICATIONS ---
	  interfacerun: {
		win32: { cmd: 'C:/progra~1/Rainmeter/Rainmeter.exe' },
		linux: { cmd: '/usr/bin/rainmeter' },
		darwin: { cmd: '/Applications/Rainmeter.app/Contents/MacOS/Rainmeter' }
	  },
	  interfaceclose: {
		win32: { cmd: 'taskkill', args: '/F /IM Rainmeter.exe' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "Rainmeter"\'' },
		linux: { cmd: 'pkill', args: '-f rainmeter' }
	  },
	  chromerun: {
		win32: { cmd: 'C:/progra~1/Google/Chrome/Application/chrome.exe', args: 'https://www.google.fr/' },
		linux: { cmd: 'google-chrome', args: 'https://www.google.fr/' },
		darwin: { cmd: 'open', args: '-a "Google Chrome" https://www.google.fr/' }
	  },
	  chromeclose: {
		win32: { cmd: 'taskkill', args: '/F /IM chrome.exe' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "Google Chrome"\'' },
		linux: { cmd: 'pkill', args: '-f chrome' }
	  },
	  vlcrun: {
		win32: { cmd: 'C:/progra~1/VideoLAN/VLC/vlc.exe' },
		linux: { cmd: 'vlc' },
		darwin: { cmd: '/Applications/VLC.app/Contents/MacOS/VLC' }
	  },
	  vlcclose: {
		win32: { cmd: 'taskkill', args: '/F /IM vlc.exe' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "VLC"\'' },
		linux: { cmd: 'pkill', args: '-f vlc' }
	  },
	  gmailrun: {
		win32: { cmd: 'C:/progra~1/Google/Chrome/Application/chrome.exe', args: 'https://mail.google.com/mail/u/1/#inbox' },
		linux: { cmd: 'google-chrome', args: 'https://mail.google.com/mail/u/1/#inbox' },
		darwin: { cmd: 'open', args: '-a "Google Chrome" https://mail.google.com/mail/u/1/#inbox' }
	  },
	  notepadrun: {
		win32: { cmd: 'C:/progra~1/Notepad++/notepad++.exe' },
		linux: { cmd: 'notepad++' },
		darwin: { cmd: '/System/Applications/TextEdit.app/Contents/MacOS/TextEdit' }
	  },
	  notepadclose: {
		win32: { cmd: 'taskkill', args: '/F /IM notepad++.exe' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "TextEdit"\'' },
		linux: { cmd: 'pkill', args: '-f notepad\\+\\+|gedit|kate' }
	  },
	// --- BUREAUTIQUE ---
	  wordrun: {
		win32: { cmd: 'start', args: 'winword' },
		darwin: { cmd: 'open', args: '-a "Microsoft Word"' },
		linux: { cmd: 'libreoffice', args: '--writer' } 
	  },
	  wordclose: {
		win32: { cmd: 'taskkill', args: '/F /IM winword.exe' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "Microsoft Word"\'' },
		linux: { cmd: 'pkill', args: '-f word' }
	  },
	  excelrun: {
		win32: { cmd: 'cmd.exe', args: '/c start excel' },
		darwin: { cmd: 'open', args: '-a "Microsoft Excel"' },
		linux: { cmd: 'libreoffice', args: '--calc' } 
	  },
	  excelclose: {
		win32: { cmd: 'taskkill', args: '/F /IM excel.exe' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "Microsoft Excel"\'' },
		linux: { cmd: 'pkill', args: '-f libreoffice' }
	  },
	  outlookrun: {
		win32: { cmd: 'cmd.exe', args: '/c start outlook' },
		darwin: { cmd: '/System/Applications/Mail.app/Contents/MacOS/Mail' },
		linux: { cmd: 'xdg-email' }
	  },
	  outlookclose: {
		win32: { cmd: 'taskkill', args: '/F /IM Olk.exe' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "Mail"\'' },
		linux: { cmd: 'pkill', args: '-f evolution|thunderbird' }
	  },
	// --- SITE INTERNET ---
	  urlnetflix: {
		win32: { cmd: 'C:/progra~1/Google/Chrome/Application/chrome.exe', args: '--new-window --app=https://www.netflix.com' },
		linux: { cmd: 'google-chrome', args: '--new-window https://www.netflix.com' },
		darwin: { cmd: 'open', args: 'https://www.netflix.com' }
	  },
	// --- APPLIS WINDOWS ---
	  powershellrun: {
		win32: { cmd: 'powershell.exe', args: '-NoExit -Command "Start-Process powershell"' },
		linux: { cmd: 'pwsh' },
		darwin: { cmd: 'open', args: '-a PowerShell' }
	  },
	  powershellclose: {
		win32: { cmd: 'taskkill', args: '/F /IM powershell.exe' },
		linux: { cmd: 'pkill', args: '-f pwsh' },
		darwin: { cmd: 'osascript', args: '-e \'quit app "PowerShell"\'' }
	  },
	  restartsystem: {
		win32: { cmd: 'shutdown', args: '/r /f /t 0' },
		linux: { cmd: 'reboot' },
		darwin: { cmd: 'osascript', args: '-e "tell application \\"System Events\\" to restart"' }
	  },
	  shutdownsystem: {
		win32: { cmd: 'shutdown', args: '/s /f /t 0' },
		linux: { cmd: 'shutdown', args: '-h now' },
		darwin: { cmd: 'osascript', args: '-e "tell application \\"System Events\\" to shut down"' }
	  },
	  logoutsystem: {
		win32: { cmd: 'shutdown', args: '/l' },
		linux: { cmd: 'gnome-session-quit', args: '--logout --no-prompt' },
		darwin: { cmd: 'osascript', args: '-e "tell application \\"System Events\\" to log out"' }
	  },
	  locksystem: {
		win32: { cmd: 'rundll32.exe', args: 'user32.dll,LockWorkStation' },
		linux: { cmd: 'xdg-screensaver', args: 'lock' },
		darwin: { cmd: 'osascript', args: '-e "tell application \\"System Events\\" to keystroke \\"q\\" using {control down, command down}"' }
	  },
	  hibernatesystem: {
		win32: { cmd: 'shutdown', args: '/h' },
		linux: { cmd: 'systemctl', args: 'hibernate' },
		darwin: { cmd: 'pmset', args: 'sleepnow' }
	  },
	  controlpanel: {
		win32: { cmd: 'control' },
		linux: { cmd: 'xdg-settings', args: '--open settings' },
		darwin: { cmd: 'open', args: '/System/Library/PreferencePanes' }
	  },
	  taskmanager: {
		win32: { cmd: 'taskmgr' },
		linux: { cmd: 'gnome-system-monitor' },
		darwin: { cmd: 'open', args: '/Applications/Utilities/Activity Monitor.app' }
	  },
	  commandline: {
		win32: { cmd: 'cmd.exe', args: '/c start cmd.exe' },
		linux: { cmd: 'x-terminal-emulator' },
		darwin: { cmd: 'open', args: '/Applications/Utilities/Terminal.app' }
	  },
	  closeallwindows: {
		win32: { cmd: 'taskkill', args: '/F /FI "STATUS eq RUNNING"' },
		linux: { cmd: 'pkill', args: '-f .*' },
		darwin: { cmd: 'osascript', args: '-e "tell application \\"System Events\\" to set visible of every process to false"' }
	  },  
	// --- EXPLORATEUR ---
	  folderun: {
		win32: { cmd: 'cmd.exe', args: '/c start explorer.exe shell:MyComputerFolder' },
		linux: { cmd: 'xdg-open', args: '.' },
		darwin: { cmd: 'open', args: '.' }
	  },
	  newfolder: {
		win32: { cmd: 'cmd.exe', args: '/c "mkdir %USERPROFILE%\\Desktop\\Nouveau_Dossier"' } // Crée un dossier sur le bureau
	  },
	  calculatorrun: {
		win32: { cmd: 'calc.exe' }
	  },
	  folderdownload: {
		win32: { cmd: 'cmd.exe', args: '/c start explorer.exe shell:Downloads' },
		darwin: { cmd: 'open', args: '~/Downloads' },
		linux: { cmd: 'xdg-open', args: '~/Downloads' }
	  },
	  folderdiskc: {
		win32: { cmd: 'explorer.exe', args: 'C:\\' }, // Ouvre la racine du disque C
		darwin: { cmd: 'open', args: '/' },
		linux: { cmd: 'xdg-open', args: '/' }
	  },
	  folderdesktop: {
		win32: { cmd: 'explorer.exe', args: 'shell:Desktop' }, // Ouvre le Bureau
		darwin: { cmd: 'open', args: '~/Desktop' }
	  },
	  folderplugins: {
		win32: { cmd: 'cmd.exe', args: `/c start "" "${path.join(__dirname, '..')}"` },	// Remonte d'un cran pour ouvrir le dossier "plugins"
		darwin: { cmd: 'open', args: path.join(__dirname, '..') },
		linux: { cmd: 'xdg-open', args: path.join(__dirname, '..') }
	  },
	  folderavatar: {
		win32: { cmd: 'cmd.exe', args: `/c start "" "${path.join(__dirname, '..', '..', '..', '..', '..', '..')}"` },	// Remonte de deux crans pour ouvrir la racine d'Avatar
		darwin: { cmd: 'open', args: path.join(__dirname, '..', '..', '..', '..', '..', '..') },
		linux: { cmd: 'xdg-open', args: path.join(__dirname, '..', '..', '..', '..', '..', '..') }
	  },
	// --- A.V.A.Y.A.R ---  
	  restartclient: {
		win32: { cmd: 'powershell.exe', args: `-NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'A.V.A.T.A.R-Client' -Force -ErrorAction SilentlyContinue; Start-Sleep -s 5; Start-Process -FilePath 'C:\\avatar\\client\\A.V.A.T.A.R-Client.exe' -WorkingDirectory 'C:\\avatar\\client'"` },
		darwin: { cmd: 'sh', args: `-c "pkill -9 -f 'A.V.A.T.A.R-Client'; sleep 5; open '/Applications/A.V.A.T.A.R-Client.app'"` },
		linux: { cmd: 'sh', args: `-c "pkill -9 -f 'A.V.A.T.A.R-Client'; sleep 5; cd '/home/$USER/avatar/client' && nohup ./A.V.A.T.A.R-Client > /dev/null 2>&1 &"` }
	  },
	  restartserver: {
		win32: { cmd: 'powershell.exe', args: `-NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'A.V.A.T.A.R-Server' -Force -ErrorAction SilentlyContinue; Start-Sleep -s 5; Start-Process -FilePath 'C:\\avatar\\server\\A.V.A.T.A.R-Server.exe' -WorkingDirectory 'C:\\avatar\\server'"` },
		darwin: { cmd: 'sh', args: `-c "pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; open '/Applications/A.V.A.T.A.R-Server.app'"` },
		linux: { cmd: 'sh', args: `-c "pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; cd '/home/$USER/avatar/server' && nohup ./A.V.A.T.A.R-Server > /dev/null 2>&1 &"` }
	  },
	  restartall: {
		win32: { cmd: 'powershell.exe', args: `-NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'A.V.A.T.A.R-Client' -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'A.V.A.T.A.R-Server' -Force -ErrorAction SilentlyContinue; Start-Sleep -s 5; Start-Process -FilePath 'C:\\avatar\\client\\A.V.A.T.A.R-Client.exe' -WorkingDirectory 'C:\\avatar\\client'; Start-Process -FilePath 'C:\\avatar\\server\\A.V.A.T.A.R-Server.exe' -WorkingDirectory 'C:\\avatar\\server'"` },
		darwin: { cmd: 'sh', args: `-c "pkill -9 -f 'A.V.A.T.A.R-Client'; pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; open '/Applications/A.V.A.T.A.R-Client.app'; open '/Applications/A.V.A.T.A.R-Server.app'"` },
		linux: { cmd: 'sh', args: `-c "pkill -9 -f 'A.V.A.T.A.R-Client'; pkill -9 -f 'A.V.A.T.A.R-Server'; sleep 5; cd '/home/$USER/avatar/client' && nohup ./A.V.A.T.A.R-Client > /dev/null 2>&1 &; cd '/home/$USER/avatar/server' && nohup ./A.V.A.T.A.R-Server > /dev/null 2>&1 &"` }
	  }
};

export async function init() {
  if (!await Avatar.lang.addPluginPak('jarvis')) {
    return error('jarvis: unable to load language pak files');
  }
}

export async function action(data, callback) {
  try {
    Locale = await Avatar.lang.getPak('jarvis', data.language);
    if (!Locale) {
      throw new Error(`jarvis: Unable to find the '${data.language}' language pak.`);
    }

    const commandName = data?.action?.command;
    if (!commandName) {
      throw new Error('jarvis: missing action.command');
    }

    const osConfig = CONFIG_COMMANDS[commandName]?.[process.platform];
	
	const clientPath = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'client', 'A.V.A.T.A.R-Client.exe');
info("=== TEST CHEMIN CLIENT ===");
info("Le chemin calculé est :", clientPath);

    // 1- Commandes standards
    if (osConfig) {
        Avatar.speak(Locale.get(`message.${commandName}`), data.client, () => {
			Avatar.runApp(osConfig.cmd, data.client, osConfig.args || '');
		});
	}

    // 2- Screensaver
    else if (commandName === 'screensaver') {
      const scPath = process.platform === 'win32'
        ? path.join(__dirname, 'bin', 'matrixcode', 'screensaver.bat')
        : path.join(__dirname, 'bin', 'matrixcode', process.platform, 'screensaver.sh');

	  Avatar.speak(Locale.get('message.screensaver'), data.client, () => {
		Avatar.runApp(scPath, data.client, '/p');     
	  });
    }

    // 3- Lecteur CD
   else if (['lecteurcdopen', 'lecteurcdclose'].includes(commandName)) {
        const driveLetter = Config?.modules?.jarvis?.lettercd || 'D';
        const nircmd = path.join(__dirname, 'nircmd', 'nircmdc.exe');

        Avatar.speak(Locale.get(`message.${commandName}`), data.client);

        switch (commandName) {
            case 'lecteurcdopen':
                Avatar.runApp(nircmd, data.client, `cdrom open ${driveLetter}:`);
                break;
            case 'lecteurcdclose':
                Avatar.runApp(nircmd, data.client, `cdrom close ${driveLetter}:`);
                break;
        }
    }
	
    // 4- Erreur
    else {
      Avatar.speak(Locale.get('message.errorcommand'), data.client);
    }

	info("jarvis:", data.action.command, L.get("plugin.from"), data.client);

  } catch (err) {
    if (data?.client) Avatar.Speech.end(data.client);
    error('jarvis error:', err?.message || err);
  } finally {
    callback();
  }
}