'use strict';
const {contextBridge,ipcRenderer}=require('electron');
// Bu köprü yalnız yerel sunucu seçme penceresine yüklenir; oyun penceresine yüklenmez.
contextBridge.exposeInMainWorld('npngLauncher',Object.freeze({
 preferences:()=>ipcRenderer.invoke('npng:preferences'),
 connect:url=>ipcRenderer.invoke('npng:connect',url),
 onStatus:callback=>{ipcRenderer.on('npng:status',(_,message)=>callback(String(message)))}
}));
