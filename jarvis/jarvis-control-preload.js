const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('jarvisControlAPI', {
    onInit:   (cb) => ipcRenderer.on('jarvis-control-init', (_e,d) => cb(d)),
    onUpdate: (cb) => ipcRenderer.on('jarvis-update',       (_e,d) => cb(d)),
    getData:  ()   => ipcRenderer.invoke('jarvis-control-getdata'),
    doAction: (a)  => ipcRenderer.send('jarvis-control-action', a),
    close:    ()   => ipcRenderer.send('jarvis-control-close')
});
