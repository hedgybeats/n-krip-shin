import { contextBridge, ipcRenderer } from "electron";
import { NKripshinApi } from "./types/renderer";

contextBridge.exposeInMainWorld("nKripShinApi", <NKripshinApi>{
  encryptFile: (filePath, deleteOriginal) =>
    ipcRenderer.invoke("encryptFile", [filePath, deleteOriginal]),
  decryptFile: (filePath, key, iv, deleteOriginal) =>
    ipcRenderer.invoke("decryptFile", [filePath, key, iv, deleteOriginal]),
  closeApp: () => ipcRenderer.invoke("closeApp"),
  minimizeApp: () => ipcRenderer.invoke("minimizeApp"),
  // we can also expose variables, not just functions
});
