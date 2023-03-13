export interface NKriptApi {
  encryptFile: (
    algorithm: string,
    filePath: string,
    deleteOriginal: boolean
  ) => Promise<Encryptionresult>;
  decryptFile: (
    algorithm: string,
    filePath: string,
    key: string,
    iv: string,
    deleteOriginal: boolean
  ) => Promise<Decryptionresult>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getAvailableCiphers: () => Promise<string[]>;
  cipherRequiresIv: (cipher: string) => Promise<boolean>;
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
