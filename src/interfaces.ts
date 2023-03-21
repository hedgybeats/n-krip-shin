interface NKriptApi {
  encryptFile: (algorithm: string, filePath: string, deleteOriginal: boolean) => Promise<Encryptionresult>;

  decryptFile: (algorithm: string, filePath: string, key: string, iv: string, deleteOriginal: boolean) => Promise<Decryptionresult>;

  showItemInFolder: (filePath: string) => Promise<void>;

  getAvailableCiphers: () => Promise<string[]>;

  cipherRequiresIv: (cipher: string) => Promise<boolean>;

  compileHandlebarsTemplate: <TData>(html: string, data: TData) => Promise<string>;

  startKeyVaultSession: (masterPassword: string) => Promise<VaultSessionTokens>;

  refreshVaultSession: (oldTokens: VaultSessionTokens) => Promise<VaultSessionTokens>;

  endKeyVaultSession: () => Promise<void>;

  updateMasterPassword(oldPassword: string, newPassword: string): Promise<void>;

  setMasterPassword(newPassword: string): Promise<void>;

  getSecrets: (accessToken: string) => Promise<SecretDto[]>;

  hasSetMasterPassword: () => Promise<boolean>;

  getSecret: (secretId: number, accessToken: string) => Promise<SecretDto>;

  deleteSecret: (secretId: number, accessToken: string) => Promise<void>;

  addSecret: (
    masterPassword: string,
    displayName: string,
    algorithm: string,
    key: string,
    iv: string,
    filePath?: string,
    accessToken?: string
  ) => Promise<void>;
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

interface Secret {
  id: number;
  displayName: string;
  createdOn: string;
  algorithm: string;
  keyMasterHash: string;
  ivMasterHash: string;
  keySessionHash: string;
  ivSessionHash: string;
  filePath?: string;
}

interface SecretDto {
  id: number;
  displayName: string;
  createdOn: string;
  algorithm: string;
  key: string;
  iv: string;
  filePath?: string;
}

interface MasterPassword {
  id: string;
  passwordHash: string;
  updatedOn: string;
  hint?: string;
  expiresOn?: string;
}

interface SecretTemplate {
  secrets: SecretDto[];
}

interface VaultSessionTokens {
  accessToken: string;
  refreshInMs: number;
  refreshToken: string;
}
