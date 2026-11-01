const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', { load: () => ipcRenderer.invoke('load'), save: data => ipcRenderer.invoke('save', data), getStartup: () => ipcRenderer.invoke('startup:get'), setStartup: enabled => ipcRenderer.invoke('startup:set', enabled) });
