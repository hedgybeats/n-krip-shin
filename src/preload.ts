import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nKriptApi', <NKriptApi>{
  encryptFile: (algorithm, filePath, deleteOriginal) => ipcRenderer.invoke('encryptFile', [algorithm, filePath, deleteOriginal]),

  decryptFile: (algorithm, filePath, key, iv, deleteOriginal) => ipcRenderer.invoke('decryptFile', [algorithm, filePath, key, iv, deleteOriginal]),

  showItemInFolder: (filePath) => ipcRenderer.invoke('showItemInFolder', [filePath]),

  getAvailableCiphers: () => ipcRenderer.invoke('getAvailableCiphers'),

  cipherRequiresIv: (cipher: string) => ipcRenderer.invoke('cipherRequiresIv', [cipher]),

  compileHandlebarsTemplate: <TData>(html: string, data: TData) => ipcRenderer.invoke('compileHandlebarsTemplate', [html, data]),

  startKeyVaultSession: (masterPassword: string) => ipcRenderer.invoke('startKeyVaultSession', [masterPassword]),

  endKeyVaulSession: () => ipcRenderer.invoke('endKeyVaulSession'),

  getSecrets: (accessToken: string) => ipcRenderer.invoke('getSecrets', [accessToken]),

  getSecret: (secretId: number, accessToken: string) => ipcRenderer.invoke('getSecret', [secretId, accessToken]),

  deleteSecret: (secretId: number, accessToken: string) => ipcRenderer.invoke('deleteSecret', [secretId, accessToken]),

  addSecret: (masterPassword: string, accessToken: string, displayName: string, algorithm: string, key: string, iv: string, filePath: string = undefined) => ipcRenderer.invoke('addSecret', [masterPassword, accessToken, displayName, algorithm, key, iv, filePath])
});
