import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("nKriptApi", <NKriptApi>{
  encryptFile: (algorithm, filePath, deleteOriginal) =>
    ipcRenderer.invoke("encryptFile", [algorithm, filePath, deleteOriginal]),

  decryptFile: (algorithm, filePath, key, iv, deleteOriginal) =>
    ipcRenderer.invoke("decryptFile", [
      algorithm,
      filePath,
      key,
      iv,
      deleteOriginal,
    ]),

  showItemInFolder: (filePath) =>
    ipcRenderer.invoke("showItemInFolder", [filePath]),

  getAvailableCiphers: () => ipcRenderer.invoke("getAvailableCiphers"),

  cipherRequiresIv: (cipher: string) =>
    ipcRenderer.invoke("cipherRequiresIv", [cipher]),

  compileHandlebarsTemplate: <TData>(html: string, data: TData) =>
    ipcRenderer.invoke("compileHandlebarsTemplate", [html, data]),
});
