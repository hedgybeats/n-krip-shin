export interface NKriptApi {
  encryptFile: (
    filePath: string,
    deleteOriginal: boolean
  ) => Promise<Encryptionresult>;
  showItemInFolder: (
    filePath: string
  ) => Promise<void>;
  decryptFile: (
    filePath: string,
    key: string,
    iv: string,
    deleteOriginal: boolean
  ) => Promise<Decryptionresult>;
}

interface Encryptionresult {
  duration: number;
  key: string;
  iv: string;
  filePath: string;
}

interface Decryptionresult {
  duration: number;
  filePath: string;
}

declare global {
  interface Window {
    nKriptApi: NKriptApi;
  }
}
