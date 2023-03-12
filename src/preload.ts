import { contextBridge, ipcRenderer } from "electron";
import { NKriptApi } from "./types/renderer";

contextBridge.exposeInMainWorld("nKriptApi", <NKriptApi>{
  encryptFile: (filePath, deleteOriginal) =>
    ipcRenderer.invoke("encryptFile", [filePath, deleteOriginal]),

  decryptFile: (filePath, key, iv, deleteOriginal) =>
    ipcRenderer.invoke("decryptFile", [filePath, key, iv, deleteOriginal]),

  showItemInFolder: (filePath) =>
    ipcRenderer.invoke("showItemInFolder", [filePath]),
});
