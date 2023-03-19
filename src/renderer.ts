/* eslint-disable @typescript-eslint/no-explicit-any */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
interface NKriptApi {
  encryptFile: (algorithm: string, filePath: string, deleteOriginal: boolean) => Promise<Encryptionresult>;
  decryptFile: (algorithm: string, filePath: string, key: string, iv: string, deleteOriginal: boolean) => Promise<Decryptionresult>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getAvailableCiphers: () => Promise<string[]>;
  cipherRequiresIv: (cipher: string) => Promise<boolean>;
  compileHandlebarsTemplate: <TData>(html: string, data: TData) => Promise<string>;
  loginToKeyVault: (masterPassword: string) => Promise<boolean>;
  logoutOfKeyVault: () => Promise<boolean>;
  getAllSecrets: (decrypt?: boolean) => Promise<Secret[]>;
  getSecret: (secretId: number, decrypt?: boolean) => Promise<Secret>;
  deleteSecret: (secretId: number) => Promise<void>;
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
  keyHash: string;
  ivHash: string;
  filePath?: string;
}

interface MasterPassword {
  id: number;
  passwordHash: string;
  updatedOn: string;
  hint?: string;
  expiresOn?: string;
}

interface SecretTemplate {
  secrets: Secret[];
}

const vaultTemplate = `<div id="key-vault-item-grid" class="grid-container mx-3">
                          {{#each secrets}}
                            <div class="secret grid-item card text-bg-dark">
                              {{#with this}}
                                <div class="card-header d-flex justify-content-between">
                                  <h5 class="secret-display-name align-self-center"><span>{{displayName}}</span><small class="secret-algorithm">({{algorithm}})</small></h5>
                                  <div>
                                    <button data-secret-id="{{id}}" class="me-3 align-self-start un-style show-secret-btn green-hover">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" fill="currentColor" class="bi bi-eye pointer-none" viewBox="0 0 16 16">
                                        <path class="pointer-none" d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                        <path class="pointer-none" d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                      </svg>
                                    </button>
                                    <button class="me-3 align-self-start red-hover un-style hide-secret-btn d-none">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" fill="currentColor" class="bi bi-eye-slash pointer-none" viewBox="0 0 16 16">
                                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                                      </svg>
                                    </button>
                                    <button data-secret-id="{{id}}" class="delete-secret-btn align-self-start un-style">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" fill="currentColor" class="bi bi-trash text-danger pointer-none" viewBox="0 0 16 16">
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div class="card-body">
                                  <div>
                                    <span class="me-2">Key:</span><span class="secret-key">{{keyHash}}</span>
                                  </div>
                                     {{#if ivHash}}
                                  <div>
                                    <span class="me-2">IV:</span><span class="secret-iv">{{ivHash}}</span>
                                  </div>
                                      {{/if}}
                                      {{#if filePath}}
                                  <div>
                                    <span class="me-2">File Path:</span><span class="secret-file-path">{{filePath}}</span>
                                  </div>
                                      {{/if}}
                                </div>
                              {{/with}}
                            </div>
                          {{/each}}
                        </div>`;

class App {
  public get encryptBtn() {
    return this.elements.encryptBtn;
  }

  public get encryptContainer() {
    return this.elements.encryptContainer;
  }

  public get encryptInput() {
    return this.elements.encryptInput;
  }

  public get encryptInputContainer() {
    return this.elements.encryptInputContainer;
  }

  public get encryptSpinner() {
    return this.elements.encryptSpinner;
  }

  public get encryptedKey() {
    return this.elements.encryptedKey;
  }

  public get encryptedOutputPath() {
    return this.elements.encryptedOutputPath;
  }

  public get encryptedAlgorithm() {
    return this.elements.encryptedAlgorithm;
  }

  public get encryptIv() {
    return this.elements.encryptIv;
  }

  public get decryptBtn() {
    return this.elements.decryptBtn;
  }

  public get decryptContainer() {
    return this.elements.decryptContainer;
  }

  public get decryptInput() {
    return this.elements.decryptInput;
  }

  public get decryptInputContainer() {
    return this.elements.decryptInputContainer;
  }

  public get decryptSpinner() {
    return this.elements.decryptSpinner;
  }

  public get keyFc() {
    return this.elements.keyFc;
  }

  public get ivFc() {
    return this.elements.ivFc;
  }

  public get keyFcError() {
    return this.elements.keyFcError;
  }

  public get ivFcError() {
    return this.elements.ivFcError;
  }

  public get decryptError() {
    return this.elements.decryptError;
  }

  public get encryptError() {
    return this.elements.encryptError;
  }

  public get encryptResults() {
    return this.elements.encryptResults;
  }

  public get startoverEncryptButton() {
    return this.elements.startoverEncryptButton;
  }

  public get deleteFileAfterEncrypt() {
    return this.elements.deleteFileAfterEncrypt;
  }

  public get deleteFileAfterEncryptContainer() {
    return this.elements.deleteFileAfterEncryptContainer;
  }

  public get deleteFileAfterDecrypt() {
    return this.elements.deleteFileAfterDecrypt;
  }

  public get deleteFileAfterDecryptContainer() {
    return this.elements.deleteFileAfterDecryptContainer;
  }

  public get clipboardButton() {
    return this.elements.clipboardButton;
  }

  public get clipboardCheckButton() {
    return this.elements.clipboardCheckButton;
  }

  public get startoverDecryptButton() {
    return this.elements.startoverDecryptButton;
  }

  public get decryptedPath() {
    return this.elements.decryptedPath;
  }

  public get decryptResults() {
    return this.elements.decryptResults;
  }

  public get keyFcContainer() {
    return this.elements.keyFcContainer;
  }

  public get ivFcContainer() {
    return this.elements.ivFcContainer;
  }

  public get decryptDuration() {
    return this.elements.decryptDuration;
  }

  public get encryptDuration() {
    return this.elements.encryptDuration;
  }

  public get startDecryptingBtn() {
    return this.elements.startDecryptingBtn;
  }

  public get startDecryptingBtnContainer() {
    return this.elements.startDecryptingBtnContainer;
  }

  public get decryptionInputSelectedFileName() {
    return this.elements.decryptionInputSelectedFileName;
  }

  public get decryptionInputSelectedFileSize() {
    return this.elements.decryptionInputSelectedFileSize;
  }

  public get decryptionInputSelectedFile() {
    return this.elements.decryptionInputSelectedFile;
  }

  public get startEncryptingBtn() {
    return this.elements.startEncryptingBtn;
  }

  public get startEncryptingBtnContainer() {
    return this.elements.startEncryptingBtnContainer;
  }

  public get encryptionInputSelectedFileName() {
    return this.elements.encryptionInputSelectedFileName;
  }

  public get encryptionInputSelectedFileSize() {
    return this.elements.encryptionInputSelectedFileSize;
  }

  public get encryptionInputSelectedFile() {
    return this.elements.encryptionInputSelectedFile;
  }

  public get selectDecryptAlgorithmContainer() {
    return this.elements.selectDecryptAlgorithmContainer;
  }

  public get selectEncryptAlgorithmContainer() {
    return this.elements.selectEncryptAlgorithmContainer;
  }

  public get selectDecryptAlgorithm() {
    return this.elements.selectDecryptAlgorithm;
  }

  public get selectEncryptAlgorithm() {
    return this.elements.selectEncryptAlgorithm;
  }

  public get selectDefaultAlgorithm() {
    return this.elements.selectDefaultAlgorithm;
  }
  public get selectEncrypAlgorithmError() {
    return this.elements.selectEncrypAlgorithmError;
  }
  public get selectDecrypAlgorithmError() {
    return this.elements.selectDecrypAlgorithmError;
  }
  public get encryptRemoveFileButton() {
    return this.elements.encryptRemoveFileButton;
  }
  public get decryptRemoveFileButton() {
    return this.elements.decryptRemoveFileButton;
  }
  public get deleteAfterEncryptDefault() {
    return this.elements.deleteAfterEncryptDefault;
  }
  public get deleteAfterDecryptDefault() {
    return this.elements.deleteAfterDecryptDefault;
  }
  public get vaultBody() {
    return this.elements.vaultBody;
  }
  public get showSecretButtons() {
    return document.querySelectorAll('button.show-secret-btn');
  }

  public get hideSecretButtons() {
    return document.querySelectorAll('button.hide-secret-btn');
  }

  public get deleteSecretButtons() {
    return document.querySelectorAll('button.delete-secret-btn');
  }

  private _keyVaultLoginContainer?: HTMLElement;
  public get keyVaultLoginContainer() {
    if (this._keyVaultLoginContainer === undefined) {
      this._keyVaultLoginContainer = document.getElementById('key-vault-login-container');
    }
    return this._keyVaultLoginContainer;
  }

  private _keyVaultLoginItemGrid?: HTMLElement;
  public get keyVaultLoginItemGrid() {
    if (this._keyVaultLoginItemGrid === undefined) {
      this._keyVaultLoginItemGrid = document.getElementById('key-vault-item-grid');
    }
    return this._keyVaultLoginItemGrid;
  }

  private _keyVaultLoginButton?: HTMLElement;
  public get keyVaultLoginButton() {
    if (this._keyVaultLoginButton === undefined) {
      this._keyVaultLoginButton = document.getElementById('key-vault-login');
    }
    return this._keyVaultLoginButton;
  }

  private _keyVaultPasswordFc?: HTMLInputElement;
  public get keyVaultPasswordFc() {
    if (this._keyVaultPasswordFc === undefined) {
      this._keyVaultPasswordFc = document.getElementById('keyVaultPasswordFc') as HTMLInputElement;
    }
    return this._keyVaultPasswordFc;
  }

  private _keyVaultPasswordFcError?: HTMLElement;
  public get keyVaultPasswordFcError() {
    if (this._keyVaultPasswordFcError === undefined) {
      this._keyVaultPasswordFcError = document.getElementById('keyVaultPasswordFc-error');
    }
    return this._keyVaultPasswordFcError;
  }

  private _openVault?: HTMLElement;
  public get openVault() {
    if (this._openVault === undefined) {
      this._openVault = document.getElementById('open-vault');
    }
    return this._openVault;
  }

  private _closeVault?: HTMLElement;
  public get closeVault() {
    if (this._closeVault === undefined) {
      this._closeVault = document.getElementById('close-vault');
    }
    return this._closeVault;
  }

  private _keyVaultCollapseSection?: HTMLElement;
  public get keyVaultCollapseSection() {
    if (this._keyVaultCollapseSection === undefined) {
      this._keyVaultCollapseSection = document.getElementById('collapseSecretVault');
    }
    return this._keyVaultCollapseSection;
  }

  public availableCiphers: string[] = [];

  public scroller = new ScrollToElementHelper();

  private fileToEncrypt?: File;
  private fileToDecrypt?: File;

  private elements = this.getElements();

  constructor(private api: NKriptApi) { }

  public async init() {
    this.availableCiphers = await this.api.getAvailableCiphers();
    await this.setUpDefautltSettings();
    this.addClickListeners();
    this.addChangeListeners();
  }

  private getElements() {
    return {
      encryptBtn: document.getElementById('encrypt-btn'),
      encryptContainer: document.getElementById('encryption-container'),
      encryptInput: document.getElementById('encryption-input') as HTMLInputElement,
      encryptInputContainer: document.getElementById('encryption-input-container'),
      encryptSpinner: document.getElementById('encryption-spinner'),
      encryptedKey: document.getElementById('encrypted-key'),
      encryptedOutputPath: document.getElementById('encrypted-path'),
      encryptedAlgorithm: document.getElementById('encrypted-algorithm'),
      encryptIv: document.getElementById('encrypted-iv'),
      decryptBtn: document.getElementById('decrypt-btn'),
      decryptContainer: document.getElementById('decryption-container'),
      decryptInput: document.getElementById('decryption-input') as HTMLInputElement,
      decryptInputContainer: document.getElementById('decryption-input-container'),
      decryptSpinner: document.getElementById('decryption-spinner'),
      keyFc: document.getElementById('keyFc') as HTMLInputElement,
      ivFc: document.getElementById('ivFc') as HTMLInputElement,
      keyFcError: document.getElementById('keyFc-error'),
      ivFcError: document.getElementById('ivFc-error'),
      decryptError: document.getElementById('decrypt-error'),
      encryptError: document.getElementById('encrypt-error'),
      encryptResults: document.getElementById('encrypt-results'),
      startoverEncryptButton: document.getElementById('startover-encrypt-btn'),
      deleteFileAfterEncrypt: document.getElementById('delete-after-encrypt') as HTMLInputElement,
      deleteFileAfterEncryptContainer: document.getElementById('delete-after-encrypt-container'),
      deleteFileAfterDecrypt: document.getElementById('delete-after-decrypt') as HTMLInputElement,
      deleteFileAfterDecryptContainer: document.getElementById('delete-after-decrypt-container'),
      clipboardButton: document.getElementById('clipboard-btn'),
      clipboardCheckButton: document.getElementById('clipboard-check'),
      startoverDecryptButton: document.getElementById('startover-decrypt-btn'),
      decryptedPath: document.getElementById('decrypted-path'),
      decryptResults: document.getElementById('decrypt-results'),
      keyFcContainer: document.getElementById('key-fc-container'),
      ivFcContainer: document.getElementById('iv-fc-container'),
      decryptDuration: document.getElementById('decrypt-duration'),
      encryptDuration: document.getElementById('encrypt-duration'),
      startDecryptingBtn: document.getElementById('start-decrypting'),
      startDecryptingBtnContainer: document.getElementById('start-decrypting-container'),
      decryptionInputSelectedFileName: document.getElementById('decryption-input-selected-file-name'),
      decryptionInputSelectedFileSize: document.getElementById('decryption-input-selected-file-size'),
      decryptionInputSelectedFile: document.getElementById('decryption-input-selected-file-container'),
      startEncryptingBtn: document.getElementById('start-encrypting'),
      startEncryptingBtnContainer: document.getElementById('start-encrypting-container'),
      encryptionInputSelectedFileName: document.getElementById('encryption-input-selected-file-name'),
      encryptionInputSelectedFileSize: document.getElementById('encryption-input-selected-file-size'),
      encryptionInputSelectedFile: document.getElementById('encryption-input-selected-file-container'),
      selectDecryptAlgorithmContainer: document.getElementById('select-decrypt-algorithm-container'),
      selectEncryptAlgorithmContainer: document.getElementById('select-encrypt-algorithm-container'),
      selectDecryptAlgorithm: document.getElementById('select-decrypt-algorithm') as HTMLSelectElement,
      selectEncryptAlgorithm: document.getElementById('select-encrypt-algorithm') as HTMLSelectElement,
      selectDefaultAlgorithm: document.getElementById('select-default-algorithm') as HTMLSelectElement,
      selectEncrypAlgorithmError: document.getElementById('select-decrypt-algorithm-error'),
      selectDecrypAlgorithmError: document.getElementById('select-encrypt-algorithm-error'),
      encryptRemoveFileButton: document.getElementById('encrypt-remove-file'),
      decryptRemoveFileButton: document.getElementById('decrypt-remove-file'),
      deleteAfterEncryptDefault: document.getElementById('default-delete-after-encrypt') as HTMLInputElement,
      deleteAfterDecryptDefault: document.getElementById('default-delete-after-decrypt') as HTMLInputElement,
      vaultBody: document.getElementById('vault-body'),
    };
  }

  private async setUpDefautltSettings() {
    const preferDeleteAfterEncrypt = window.localStorage.getItem('prefer-delete-after-encrypt');
    this.deleteFileAfterEncrypt.checked = preferDeleteAfterEncrypt === null ? false : preferDeleteAfterEncrypt === '1';
    this.deleteAfterEncryptDefault.checked = preferDeleteAfterEncrypt === null ? false : preferDeleteAfterEncrypt === '1';

    const preferDeleteAfterDecrypt = window.localStorage.getItem('prefer-delete-after-decrypt');
    this.deleteFileAfterDecrypt.checked = preferDeleteAfterDecrypt === null ? false : preferDeleteAfterDecrypt === '1';
    this.deleteAfterDecryptDefault.checked = preferDeleteAfterDecrypt === null ? false : preferDeleteAfterDecrypt === '1';

    let defaultAlgorithm: string | null = window.localStorage.getItem('default-algorithm');

    if (defaultAlgorithm === null) {
      window.localStorage.setItem('default-algorithm', 'aes-256-cbc');
      defaultAlgorithm = 'aes-256-cbc';
    }

    // set default cipher algorithm
    for (const cipher of this.availableCiphers) {
      const encryptOpt = document.createElement('option');
      const decryptOpt = document.createElement('option');
      const defaultOpt = document.createElement('option');

      decryptOpt.value = cipher;
      decryptOpt.innerHTML = cipher;
      encryptOpt.value = cipher;
      encryptOpt.innerHTML = cipher;
      defaultOpt.value = cipher;
      defaultOpt.innerHTML = cipher;

      // default to default algorithm or hard coded default
      if (cipher === defaultAlgorithm) {
        encryptOpt.selected = true;
        decryptOpt.selected = true;
        defaultOpt.selected = true;
      }

      this.selectEncryptAlgorithm.options.add(encryptOpt);
      this.selectDecryptAlgorithm.options.add(decryptOpt);
      this.selectDefaultAlgorithm.options.add(defaultOpt);
    }

    // store default algorithm on change
    this.selectDefaultAlgorithm.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target) {
        window.localStorage.setItem('default-algorithm', target.value);

        this.selectEncryptAlgorithm.value = target.value;
        this.selectDecryptAlgorithm.value = target.value;
      }
    });

    // store default values on changes
    this.deleteAfterEncryptDefault.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target) {
        window.localStorage.setItem('prefer-delete-after-encrypt', target.checked ? '1' : '0');

        this.deleteFileAfterEncrypt.checked = target.checked;
      }
    });

    this.deleteAfterDecryptDefault.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target) {
        window.localStorage.setItem('prefer-delete-after-decrypt', target.checked ? '1' : '0');

        this.deleteFileAfterDecrypt.checked = target.checked;
      }
    });
  }

  private async renderKeyVault(): Promise<void> {
    this.vaultBody.innerHTML = await this.api.compileHandlebarsTemplate<SecretTemplate>(vaultTemplate, {
      secrets: await this.api.getAllSecrets(),
    });


    this.showSecretButtons.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const btn = e.target as HTMLElement;
        const secret = await this.api.getSecret(parseInt(btn.getAttribute('data-secret-id'), 10), true);

        const keyField = btn.parentElement.parentElement.parentElement.querySelector('span.secret-key') as HTMLElement;
        const ivField = btn.parentElement.parentElement.parentElement.querySelector('span.secret-iv') as HTMLElement;
        const hideSecretsBtn = btn.parentElement.parentElement.parentElement.querySelector('button.hide-secret-btn') as HTMLElement;

        keyField.innerText = secret.keyHash;
        ivField.innerText = secret.ivHash;
        btn.classList.add('d-none');
        hideSecretsBtn.classList.remove('d-none');
      });
    });

    this.hideSecretButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const btn = e.target as HTMLElement;

        const keyField = btn.parentElement.parentElement.parentElement.querySelector('span.secret-key') as HTMLElement;
        const ivField = btn.parentElement.parentElement.parentElement.querySelector('span.secret-iv') as HTMLElement;
        const showSecretsBtn = btn.parentElement.parentElement.parentElement.querySelector('button.show-secret-btn') as HTMLElement;

        keyField.innerText = '**********';
        ivField.innerText = '**********';
        btn.classList.add('d-none');
        showSecretsBtn.classList.remove('d-none');
      });
    });

    this.deleteSecretButtons.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const btn = e.target as HTMLElement;
        await this.api.deleteSecret(parseInt(btn.getAttribute('data-secret-id'), 10));
        const griContainer = btn.parentElement.parentElement.parentElement.parentElement;
        griContainer.removeChild(btn.parentElement.parentElement.parentElement);
      });
    });
  }

  private async loginToKeyVault() {
    this.keyVaultPasswordFcError.innerText = '';

    const password = this.keyVaultPasswordFc.value;
    if (password.trim() === '') {
      this.keyVaultPasswordFcError.innerText = 'Please enter a password';
      return;
    }

    const success = await this.api.loginToKeyVault(password);

    if (!success) {
      this.keyVaultPasswordFcError.innerText = 'Invalid password';
      return;
    }

    this.keyVaultLoginContainer.classList.add('d-none');
    this.keyVaultPasswordFc.value = '';
    await this.renderKeyVault();
    await this.scroller.scrollTo('#key-vault-header', 50);
  }

  private async logoutOfKeyVault() {
    await this.api.logoutOfKeyVault();

    this.keyVaultLoginContainer.classList.remove('d-none');
    this.vaultBody.innerHTML = '';
  }

  private addClickListeners() {
    this.openVault.addEventListener('click', async () => {
      await this.scroller.scrollTo('#key-vault-header', 50);
      this.openVault.classList.add('d-none');
    });

    this.closeVault.addEventListener('click', async () => {
      this.logoutOfKeyVault();
      this.openVault.classList.remove('d-none');
    });

    this.keyVaultLoginButton.addEventListener('click', async () => await this.loginToKeyVault());


    this.encryptedOutputPath.addEventListener('click', () => {
      this.api.showItemInFolder(this.encryptedOutputPath.getAttribute('data-path'));
    });

    this.decryptedPath.addEventListener('click', () => {
      this.api.showItemInFolder(this.decryptedPath.getAttribute('data-path'));
    });

    this.encryptBtn.addEventListener('click', () => {
      this.encryptBtn.classList.remove('btn-secondary');
      this.encryptBtn.classList.add('btn-success');

      this.decryptBtn.classList.remove('btn-success');
      this.decryptBtn.classList.add('btn-secondary');

      this.encryptContainer.classList.remove('d-none');
      this.decryptContainer.classList.add('d-none');
    });

    this.decryptBtn.addEventListener('click', () => {
      this.decryptBtn.classList.remove('btn-secondary');
      this.decryptBtn.classList.add('btn-success');

      this.encryptBtn.classList.remove('btn-success');
      this.encryptBtn.classList.add('btn-secondary');

      this.decryptContainer.classList.remove('d-none');
      this.encryptContainer.classList.add('d-none');
    });

    this.startEncryptingBtn.addEventListener('click', async () => {
      this.encryptError.innerText = '';

      const mustDeleteFile = !!this.deleteFileAfterEncrypt.checked;
      // saving spinner
      this.encryptSpinner.classList.remove('d-none');
      this.deleteFileAfterEncryptContainer.classList.add('d-none');
      this.encryptInputContainer.classList.add('d-none');
      this.selectEncryptAlgorithmContainer.classList.add('d-none');
      this.encryptionInputSelectedFile.classList.add('d-none');
      this.startEncryptingBtnContainer.classList.add('d-none');

      const algorithmValue = this.selectEncryptAlgorithm.value;
      let hasErrors = false;

      if (algorithmValue === null || algorithmValue === undefined || algorithmValue.trim().length === 0) {
        this.selectEncrypAlgorithmError.innerText = 'Please provide select an algorithm.';
        hasErrors = true;
      }

      if (hasErrors) {
        //show fields again
        this.encryptSpinner.classList.add('d-none');
        this.deleteFileAfterEncryptContainer.classList.remove('d-none');
        this.encryptInputContainer.classList.remove('d-none');
        this.selectEncryptAlgorithmContainer.classList.remove('d-none');
        this.encryptionInputSelectedFile.classList.remove('d-none');
        this.startEncryptingBtnContainer.classList.remove('d-none');
        return;
      }

      this.selectEncrypAlgorithmError.innerText = '';

      const encryptionResult = await this.api.encryptFile(algorithmValue, this.fileToEncrypt.path, mustDeleteFile).catch((err) => (this.encryptError.innerText = err.message));

      // hide spinner
      this.encryptSpinner.classList.add('d-none');

      // means error
      if (!this.isEncryptionResult(encryptionResult)) {
        this.deleteFileAfterEncryptContainer.classList.remove('d-none');
        this.encryptInputContainer.classList.remove('d-none');
        this.selectEncryptAlgorithmContainer.classList.remove('d-none');
        this.encryptionInputSelectedFile.classList.remove('d-none');
        this.startEncryptingBtnContainer.classList.remove('d-none');
        return;
      }

      this.encryptDuration.innerText = `${this.formatBytes(this.fileToEncrypt.size)} in ${(encryptionResult.duration / 1000).toFixed(2)} seconds`;

      this.encryptedKey.innerHTML = `<strong class="text-success me-2">Key:</strong><span>${encryptionResult.key}</span>`;
      this.encryptedKey.setAttribute('data-key', encryptionResult.key);

      this.encryptIv.innerHTML = `<strong class="text-success me-2">IV:</strong><span>${encryptionResult.iv}</span>`;
      this.encryptIv.setAttribute('data-iv', encryptionResult.iv);

      this.encryptedAlgorithm.innerHTML = `<strong class="text-success me-2">Algorithm:</strong><span>${algorithmValue}</span>`;
      this.encryptedAlgorithm.setAttribute('data-algorithm', algorithmValue);

      this.encryptedOutputPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${encryptionResult.filePath}</a>`;
      this.encryptedOutputPath.setAttribute('data-path', encryptionResult.filePath);

      this.encryptResults.classList.remove('d-none');
    });

    this.startDecryptingBtn.addEventListener('click', async () => {
      this.encryptError.innerText = '';

      this.decryptSpinner.classList.remove('d-none');
      this.decryptInputContainer.classList.add('d-none');
      this.deleteFileAfterDecryptContainer.classList.add('d-none');
      this.keyFcContainer.classList.add('d-none');
      this.ivFcContainer.classList.add('d-none');
      this.decryptionInputSelectedFile.classList.add('d-none');
      this.selectDecryptAlgorithmContainer.classList.add('d-none');
      this.startDecryptingBtnContainer.classList.add('d-none');

      const mustDeleteFile = !!this.deleteFileAfterDecrypt.checked;
      const keyValue = this.keyFc.value;
      const ivValue = this.ivFc.value;
      const algorithmValue = this.selectDecryptAlgorithm.value;

      let hasErrors = false;

      if (keyValue === null || keyValue === undefined || keyValue.trim().length === 0) {
        this.keyFcError.innerText = 'Please provide a key.';
        hasErrors = true;
      }

      const requiresIv = await this.api.cipherRequiresIv(algorithmValue);

      if (requiresIv && (ivValue === null || ivValue === undefined || ivValue.trim().length === 0)) {
        this.ivFcError.innerText = 'Please provide an IV.';
        hasErrors = true;
      }

      if (algorithmValue === null || algorithmValue === undefined || algorithmValue.trim().length === 0) {
        this.selectDecrypAlgorithmError.innerText = 'Please provide select an algorithm.';
        hasErrors = true;
      }

      if (hasErrors) {
        // hide spinner
        this.decryptSpinner.classList.add('d-none');
        this.decryptInputContainer.classList.remove('d-none');
        this.deleteFileAfterDecryptContainer.classList.remove('d-none');
        this.selectDecryptAlgorithmContainer.classList.remove('d-none');
        this.decryptionInputSelectedFile.classList.remove('d-none');
        this.selectDecryptAlgorithmContainer.classList.remove('d-none');
        this.startDecryptingBtnContainer.classList.remove('d-none');
        this.keyFcContainer.classList.remove('d-none');
        this.ivFcContainer.classList.remove('d-none');
        this.decryptInput.value = '';
        return;
      }

      this.keyFcError.innerText = '';
      this.ivFcError.innerText = '';
      this.selectDecrypAlgorithmError.innerText = '';

      const decryptResult = await this.api.decryptFile(algorithmValue, this.fileToDecrypt.path, keyValue, ivValue, mustDeleteFile).catch((err) => (this.decryptError.innerText = err.message));

      this.decryptSpinner.classList.add('d-none');

      // means error
      if (!this.isDecryptionResult(decryptResult)) {
        // show fields again
        this.decryptInputContainer.classList.remove('d-none');
        this.deleteFileAfterDecryptContainer.classList.remove('d-none');
        this.keyFcContainer.classList.remove('d-none');
        this.ivFcContainer.classList.remove('d-none');
        this.selectDecryptAlgorithmContainer.classList.remove('d-none');
        this.decryptionInputSelectedFile.classList.remove('d-none');
        this.startDecryptingBtnContainer.classList.remove('d-none');
        return;
      }

      this.decryptDuration.innerText = `${this.formatBytes(this.fileToDecrypt.size)} in ${(decryptResult.duration / 1000).toFixed(2)} seconds`;

      this.decryptedPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${decryptResult.filePath}</a>`;
      this.decryptedPath.setAttribute('data-path', decryptResult.filePath);

      this.decryptResults.classList.remove('d-none');
    });

    this.encryptRemoveFileButton.addEventListener('click', () => {
      this.encryptionInputSelectedFile.classList.add('d-none');
      this.encryptionInputSelectedFileName.innerText = '';
      this.encryptionInputSelectedFileSize.innerText = '';
      this.startEncryptingBtnContainer.classList.add('d-none');
      this.encryptInputContainer.classList.remove('d-none');
    });

    this.decryptRemoveFileButton.addEventListener('click', () => {
      this.decryptionInputSelectedFile.classList.add('d-none');
      this.decryptionInputSelectedFileName.innerText = '';
      this.decryptionInputSelectedFileSize.innerText = '';
      this.startDecryptingBtnContainer.classList.add('d-none');
      this.decryptInputContainer.classList.remove('d-none');
    });

    this.startoverEncryptButton.addEventListener('click', () => {
      this.encryptInput.value = '';
      this.encryptedKey.innerHTML = '';
      this.encryptIv.innerHTML = '';
      this.encryptInputContainer.classList.remove('d-none');
      this.deleteFileAfterEncryptContainer.classList.remove('d-none');
      this.selectEncryptAlgorithmContainer.classList.remove('d-none');
      this.encryptResults.classList.add('d-none');
      this.clipboardButton.classList.remove('d-none');
      this.clipboardCheckButton.classList.add('d-none');
      this.fileToEncrypt = undefined;
    });

    this.startoverDecryptButton.addEventListener('click', () => {
      this.decryptInput.value = '';
      this.decryptedPath.innerHTML = '';
      this.keyFc.value = '';
      this.keyFcContainer.classList.remove('d-none');
      this.ivFc.value = '';
      this.ivFcContainer.classList.remove('d-none');
      this.decryptInputContainer.classList.remove('d-none');
      this.deleteFileAfterDecryptContainer.classList.remove('d-none');
      this.selectDecryptAlgorithmContainer.classList.remove('d-none');
      this.decryptResults.classList.add('d-none');
      this.fileToEncrypt = undefined;
    });

    const copyEncryptionResults = async () => {
      await navigator.clipboard.writeText(
        JSON.stringify({
          key: this.encryptedKey.getAttribute('data-key'),
          iv: this.encryptIv.getAttribute('data-iv'),
          algorithm: this.encryptedAlgorithm.getAttribute('data-algorithm'),
          path: this.encryptedOutputPath.getAttribute('data-path'),
        })
      );
    };

    this.clipboardButton.addEventListener('click', async () => {
      await copyEncryptionResults();

      this.clipboardButton.classList.add('d-none');
      this.clipboardCheckButton.classList.remove('d-none');
    });

    this.clipboardCheckButton.addEventListener('click', async () => {
      await copyEncryptionResults();
    });
  }

  private addChangeListeners() {
    this.encryptInput.addEventListener('change', async (e: Event) => {
      this.encryptError.innerText = '';
      const target = e.target as HTMLInputElement;
      const targetFile = target.files[0];
      if (targetFile) {
        this.fileToEncrypt = targetFile;
        this.encryptionInputSelectedFile.classList.remove('d-none');
        this.encryptionInputSelectedFileName.innerText = targetFile.name;
        this.encryptionInputSelectedFileSize.innerText = this.formatBytes(targetFile.size);
        this.startEncryptingBtnContainer.classList.remove('d-none');
        this.encryptInputContainer.classList.add('d-none');
      } else {
        this.encryptionInputSelectedFile.classList.add('d-none');
        this.encryptionInputSelectedFileName.innerText = '';
        this.encryptionInputSelectedFileSize.innerText = '';
        this.startEncryptingBtnContainer.classList.add('d-none');
      }
    });

    this.decryptInput.addEventListener('change', async (e: Event) => {
      this.decryptError.innerText = '';

      const target = e.target as HTMLInputElement;
      const targetFile = target.files[0];
      if (targetFile) {
        this.fileToDecrypt = targetFile;
        this.decryptionInputSelectedFile.classList.remove('d-none');
        this.decryptionInputSelectedFileName.innerText = targetFile.name;
        this.decryptionInputSelectedFileSize.innerText = this.formatBytes(targetFile.size);
        this.startDecryptingBtnContainer.classList.remove('d-none');
        this.decryptInputContainer.classList.add('d-none');
      } else {
        this.decryptionInputSelectedFile.classList.add('d-none');
        this.decryptionInputSelectedFileName.innerText = '';
        this.decryptionInputSelectedFileSize.innerText = '';
        this.startDecryptingBtnContainer.classList.add('d-none');
      }
    });
  }

  private isEncryptionResult(result: Encryptionresult | NodeJS.ErrnoException): result is Encryptionresult {
    return (<Encryptionresult>result).filePath !== undefined && (<Encryptionresult>result).key !== undefined && (<Encryptionresult>result).iv !== undefined && (<Encryptionresult>result).duration !== undefined;
  }

  private isDecryptionResult(result: Decryptionresult | NodeJS.ErrnoException): result is Decryptionresult {
    return (<Decryptionresult>result).filePath !== undefined && (<Decryptionresult>result).duration !== undefined;
  }

  private formatBytes(bytes: number, decimals = 0) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

class ScrollToElementHelper {
  private _el: HTMLElement | null = null;

  public async scrollTo(selector: string, delayMs: number | null = null, pageHeaderHeight = 192) {
    if (delayMs !== null) {
      await delay(delayMs);
    }

    this._el = this.findElement(selector);

    if (this._el === null) {
      return;
    }

    const domRect = this.getElRect();
    if (domRect === null) {
      return;
    }

    window.scrollBy({
      top: domRect.top - pageHeaderHeight,
      left: 0,
      behavior: 'auto',
    });
  }

  private getElRect(): DOMRect | null {
    if (this._el === null) {
      return null;
    }
    return this._el.getBoundingClientRect();
  }

  private findElement(selector: string): HTMLElement | null {
    return document.querySelector(selector);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App(window.nKriptApi);
  await app.init();
});
