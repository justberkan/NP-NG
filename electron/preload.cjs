'use strict';
const {contextBridge,ipcRenderer}=require('electron');
// Bu köprü yalnız yerel sunucu seçme penceresine yüklenir; oyun penceresine yüklenmez.
contextBridge.exposeInMainWorld('npngLauncher',Object.freeze({
 preferences:()=>ipcRenderer.invoke('npng:preferences'),
 connect:(url,options)=>ipcRenderer.invoke('npng:connect',url,options),
 probe:url=>ipcRenderer.invoke('npng:probe',url),
 saveSettings:options=>ipcRenderer.invoke('npng:settings',options),
 diagnostics:()=>ipcRenderer.invoke('npng:diagnostics'),
 exportReport:()=>ipcRenderer.invoke('npng:export'),
 chooseFolder:()=>ipcRenderer.invoke('npng:folder'),
 startLocal:()=>ipcRenderer.invoke('npng:start-local'),
 ghFetch:()=>ipcRenderer.invoke('npng:gh-fetch'),
 ghPublish:url=>ipcRenderer.invoke('npng:gh-publish',url),
 onStatus:callback=>{ipcRenderer.on('npng:status',(_,message)=>callback(String(message)))}
}));
