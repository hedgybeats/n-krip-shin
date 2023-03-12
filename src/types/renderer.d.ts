export interface NKripshinApi {
  encryptFile: (
    filePath: string,
    deleteOriginal: boolean
  ) => Promise<{ file: Buffer; filePath: string; key: string; iv: string }>;
  decryptFile: (
    filePath: string,
    key: string,
    iv: string,
    deleteOriginal: boolean
  ) => Promise<{ file: Buffer; filePath: string }>;
  closeApp(): Promise<void>;
  minimizeApp(): Promise<void>;
}

declare global {
  interface Window {
    nKripShinApi: NKripshinApi;
  }
}
