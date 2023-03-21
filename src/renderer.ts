const vaultTemplate = `<div id="key-vault-item-grid" class="grid-container mx-3">
                          {{#each secrets}}
                            <div class="secret grid-item card text-bg-dark">
                              {{#with this}}
                                <div class="card-header d-flex justify-content-between">
                                  <h5 class="secret-display-name align-self-center w-75"><span>{{displayName}}</span><small class="secret-algorithm">({{algorithm}})</small></h5>
                                  <div class="ms-2 w-25 d-flex justify-content-end">
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
                                    <span class="me-2">Key:</span><span class="secret-key">{{key}}</span>
                                  </div>
                                     {{#if iv}}
                                  <div>
                                    <span class="me-2">IV:</span><span class="secret-iv">{{iv}}</span>
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

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App(window.nKriptApi);
  await app.init();
});

class App {
  private get encryptBtn() {
    return this.elements.encryptBtn;
  }

  private get encryptContainer() {
    return this.elements.encryptContainer;
  }

  private get encryptInput() {
    return this.elements.encryptInput;
  }

  private get encryptInputContainer() {
    return this.elements.encryptInputContainer;
  }

  private get encryptSpinner() {
    return this.elements.encryptSpinner;
  }

  private get encryptedKey() {
    return this.elements.encryptedKey;
  }

  private get encryptedOutputPath() {
    return this.elements.encryptedOutputPath;
  }

  private get encryptedAlgorithm() {
    return this.elements.encryptedAlgorithm;
  }

  private get encryptIv() {
    return this.elements.encryptIv;
  }

  private get decryptBtn() {
    return this.elements.decryptBtn;
  }

  private get decryptContainer() {
    return this.elements.decryptContainer;
  }

  private get decryptInput() {
    return this.elements.decryptInput;
  }

  private get decryptInputContainer() {
    return this.elements.decryptInputContainer;
  }

  private get decryptSpinner() {
    return this.elements.decryptSpinner;
  }

  private get keyFc() {
    return this.elements.keyFc;
  }

  private get ivFc() {
    return this.elements.ivFc;
  }

  private get keyFcError() {
    return this.elements.keyFcError;
  }

  private get ivFcError() {
    return this.elements.ivFcError;
  }

  private get decryptError() {
    return this.elements.decryptError;
  }

  private get encryptError() {
    return this.elements.encryptError;
  }

  private get encryptResults() {
    return this.elements.encryptResults;
  }

  private get startoverEncryptButton() {
    return this.elements.startoverEncryptButton;
  }

  private get deleteFileAfterEncrypt() {
    return this.elements.deleteFileAfterEncrypt;
  }

  private get deleteFileAfterEncryptContainer() {
    return this.elements.deleteFileAfterEncryptContainer;
  }

  private get deleteFileAfterDecrypt() {
    return this.elements.deleteFileAfterDecrypt;
  }

  private get deleteFileAfterDecryptContainer() {
    return this.elements.deleteFileAfterDecryptContainer;
  }

  private get clipboardButton() {
    return this.elements.clipboardButton;
  }

  private get clipboardCheckButton() {
    return this.elements.clipboardCheckButton;
  }

  private get startoverDecryptButton() {
    return this.elements.startoverDecryptButton;
  }

  private get decryptedPath() {
    return this.elements.decryptedPath;
  }

  private get decryptResults() {
    return this.elements.decryptResults;
  }

  private get keyFcContainer() {
    return this.elements.keyFcContainer;
  }

  private get ivFcContainer() {
    return this.elements.ivFcContainer;
  }

  private get decryptDuration() {
    return this.elements.decryptDuration;
  }

  private get encryptDuration() {
    return this.elements.encryptDuration;
  }

  private get startDecryptingBtn() {
    return this.elements.startDecryptingBtn;
  }

  private get startDecryptingBtnContainer() {
    return this.elements.startDecryptingBtnContainer;
  }

  private get decryptionInputSelectedFileName() {
    return this.elements.decryptionInputSelectedFileName;
  }

  private get decryptionInputSelectedFileSize() {
    return this.elements.decryptionInputSelectedFileSize;
  }

  private get decryptionInputSelectedFile() {
    return this.elements.decryptionInputSelectedFile;
  }

  private get startEncryptingBtn() {
    return this.elements.startEncryptingBtn;
  }

  private get startEncryptingBtnContainer() {
    return this.elements.startEncryptingBtnContainer;
  }

  private get encryptionInputSelectedFileName() {
    return this.elements.encryptionInputSelectedFileName;
  }

  private get encryptionInputSelectedFileSize() {
    return this.elements.encryptionInputSelectedFileSize;
  }

  private get encryptionInputSelectedFile() {
    return this.elements.encryptionInputSelectedFile;
  }

  private get selectDecryptAlgorithmContainer() {
    return this.elements.selectDecryptAlgorithmContainer;
  }

  private get selectEncryptAlgorithmContainer() {
    return this.elements.selectEncryptAlgorithmContainer;
  }

  private get selectDecryptAlgorithm() {
    return this.elements.selectDecryptAlgorithm;
  }

  private get selectEncryptAlgorithm() {
    return this.elements.selectEncryptAlgorithm;
  }

  private get selectDefaultAlgorithm() {
    return this.elements.selectDefaultAlgorithm;
  }

  private get algorithmToAddFc() {
    return this.elements.algorithmToAddFc;
  }

  private get selectEncrypAlgorithmError() {
    return this.elements.selectEncrypAlgorithmError;
  }

  private get selectDecrypAlgorithmError() {
    return this.elements.selectDecrypAlgorithmError;
  }

  private get encryptRemoveFileButton() {
    return this.elements.encryptRemoveFileButton;
  }

  private get decryptRemoveFileButton() {
    return this.elements.decryptRemoveFileButton;
  }

  private get deleteAfterEncryptDefault() {
    return this.elements.deleteAfterEncryptDefault;
  }

  private get deleteAfterDecryptDefault() {
    return this.elements.deleteAfterDecryptDefault;
  }

  private get vaultBody() {
    return this.elements.vaultBody;
  }

  private get keyToAddFc() {
    return this.elements.keyToAddFc;
  }

  private get addItemPasswordFc() {
    return this.elements.addItemPasswordFc;
  }

  private get keyToAddDisplayNameFc() {
    return this.elements.keyToAddDisplayNameFc;
  }

  private get ivToAddFc() {
    return this.elements.ivToAddFc;
  }

  private get filePathToAddFc() {
    return this.elements.filePathToAddFc;
  }

  private get addVaultItemBtn() {
    return this.elements.addVaultItemBtn;
  }

  private get addVaultItemModel() {
    return this.elements.addVaultItemModel;
  }

  private get changeMasterPasswordModel() {
    return this.elements.changeMasterPasswordModel;
  }

  private get updatePasswordOldPasswordFc() {
    return this.elements.updatePasswordOldPasswordFc;
  }

  private get updatePasswordNewPasswordFc() {
    return this.elements.updatePasswordNewPasswordFc;
  }

  private get changeMasterPasswordBtn() {
    return this.elements.changeMasterPasswordBtn;
  }

  private get showSecretButtons() {
    return document.querySelectorAll("button.show-secret-btn");
  }

  private get hideSecretButtons() {
    return document.querySelectorAll("button.hide-secret-btn");
  }

  private get deleteSecretButtons() {
    return document.querySelectorAll("button.delete-secret-btn");
  }

  private refreshTokenTimeout: NodeJS.Timeout | null = null;

  private _keyVaultLoginContainer?: HTMLElement;
  private get keyVaultLoginContainer() {
    if (this._keyVaultLoginContainer === undefined) {
      this._keyVaultLoginContainer = document.getElementById("key-vault-login-container");
    }
    return this._keyVaultLoginContainer;
  }

  private _keyVaultLoginItemGrid?: HTMLElement;
  private get keyVaultLoginItemGrid() {
    if (this._keyVaultLoginItemGrid === undefined) {
      this._keyVaultLoginItemGrid = document.getElementById("key-vault-item-grid");
    }
    return this._keyVaultLoginItemGrid;
  }

  private _keyVaultLoginButton?: HTMLElement;
  private get keyVaultLoginButton() {
    if (this._keyVaultLoginButton === undefined) {
      this._keyVaultLoginButton = document.getElementById("key-vault-login");
    }
    return this._keyVaultLoginButton;
  }

  private _keyVaultPasswordFc?: HTMLInputElement;
  private get keyVaultPasswordFc() {
    if (this._keyVaultPasswordFc === undefined) {
      this._keyVaultPasswordFc = document.getElementById("keyVaultPasswordFc") as HTMLInputElement;
    }
    return this._keyVaultPasswordFc;
  }

  private _keyVaultPasswordFcError?: HTMLElement;
  private get keyVaultPasswordFcError() {
    if (this._keyVaultPasswordFcError === undefined) {
      this._keyVaultPasswordFcError = document.getElementById("keyVaultPasswordFc-error");
    }
    return this._keyVaultPasswordFcError;
  }

  private _openVault?: HTMLElement;
  private get openVault() {
    if (this._openVault === undefined) {
      this._openVault = document.getElementById("open-vault");
    }
    return this._openVault;
  }

  private _closeVault?: HTMLElement;
  private get closeVault() {
    if (this._closeVault === undefined) {
      this._closeVault = document.getElementById("close-vault");
    }
    return this._closeVault;
  }

  private _keyVaultCollapseSection?: HTMLElement;
  private get keyVaultCollapseSection() {
    if (this._keyVaultCollapseSection === undefined) {
      this._keyVaultCollapseSection = document.getElementById("collapseSecretVault");
    }
    return this._keyVaultCollapseSection;
  }

  private availableCiphers: string[] = [];

  private scroller = new ScrollToElementHelper();

  private fileToEncrypt?: File;
  private fileToDecrypt?: File;

  private elements = this.getElements();

  private vaultSessionTokens: VaultSessionTokens | null = null;

  private get accessToken(): string | undefined {
    return this.vaultSessionTokens?.accessToken;
  }

  constructor(private api: NKriptApi) {}

  public async init() {
    this.availableCiphers = await this.api.getAvailableCiphers();
    await this.setUpDefautltSettings();
    this.addClickListeners();
    this.addChangeListeners();
  }

  private getElements() {
    return {
      encryptBtn: document.getElementById("encrypt-btn"),
      encryptContainer: document.getElementById("encryption-container"),
      encryptInput: document.getElementById("encryption-input") as HTMLInputElement,
      encryptInputContainer: document.getElementById("encryption-input-container"),
      encryptSpinner: document.getElementById("encryption-spinner"),
      encryptedKey: document.getElementById("encrypted-key"),
      encryptedOutputPath: document.getElementById("encrypted-path"),
      encryptedAlgorithm: document.getElementById("encrypted-algorithm"),
      encryptIv: document.getElementById("encrypted-iv"),
      decryptBtn: document.getElementById("decrypt-btn"),
      decryptContainer: document.getElementById("decryption-container"),
      decryptInput: document.getElementById("decryption-input") as HTMLInputElement,
      decryptInputContainer: document.getElementById("decryption-input-container"),
      decryptSpinner: document.getElementById("decryption-spinner"),
      keyFc: document.getElementById("keyFc") as HTMLInputElement,
      ivFc: document.getElementById("ivFc") as HTMLInputElement,
      keyFcError: document.getElementById("keyFc-error"),
      ivFcError: document.getElementById("ivFc-error"),
      decryptError: document.getElementById("decrypt-error"),
      encryptError: document.getElementById("encrypt-error"),
      encryptResults: document.getElementById("encrypt-results"),
      startoverEncryptButton: document.getElementById("startover-encrypt-btn"),
      deleteFileAfterEncrypt: document.getElementById("delete-after-encrypt") as HTMLInputElement,
      deleteFileAfterEncryptContainer: document.getElementById("delete-after-encrypt-container"),
      deleteFileAfterDecrypt: document.getElementById("delete-after-decrypt") as HTMLInputElement,
      deleteFileAfterDecryptContainer: document.getElementById("delete-after-decrypt-container"),
      clipboardButton: document.getElementById("clipboard-btn"),
      clipboardCheckButton: document.getElementById("clipboard-check"),
      startoverDecryptButton: document.getElementById("startover-decrypt-btn"),
      decryptedPath: document.getElementById("decrypted-path"),
      decryptResults: document.getElementById("decrypt-results"),
      keyFcContainer: document.getElementById("key-fc-container"),
      ivFcContainer: document.getElementById("iv-fc-container"),
      decryptDuration: document.getElementById("decrypt-duration"),
      encryptDuration: document.getElementById("encrypt-duration"),
      startDecryptingBtn: document.getElementById("start-decrypting"),
      startDecryptingBtnContainer: document.getElementById("start-decrypting-container"),
      decryptionInputSelectedFileName: document.getElementById("decryption-input-selected-file-name"),
      decryptionInputSelectedFileSize: document.getElementById("decryption-input-selected-file-size"),
      decryptionInputSelectedFile: document.getElementById("decryption-input-selected-file-container"),
      startEncryptingBtn: document.getElementById("start-encrypting"),
      startEncryptingBtnContainer: document.getElementById("start-encrypting-container"),
      encryptionInputSelectedFileName: document.getElementById("encryption-input-selected-file-name"),
      encryptionInputSelectedFileSize: document.getElementById("encryption-input-selected-file-size"),
      encryptionInputSelectedFile: document.getElementById("encryption-input-selected-file-container"),
      selectDecryptAlgorithmContainer: document.getElementById("select-decrypt-algorithm-container"),
      selectEncryptAlgorithmContainer: document.getElementById("select-encrypt-algorithm-container"),
      selectDecryptAlgorithm: document.getElementById("select-decrypt-algorithm") as HTMLSelectElement,
      selectEncryptAlgorithm: document.getElementById("select-encrypt-algorithm") as HTMLSelectElement,
      selectDefaultAlgorithm: document.getElementById("select-default-algorithm") as HTMLSelectElement,
      selectEncrypAlgorithmError: document.getElementById("select-decrypt-algorithm-error"),
      selectDecrypAlgorithmError: document.getElementById("select-encrypt-algorithm-error"),
      encryptRemoveFileButton: document.getElementById("encrypt-remove-file"),
      decryptRemoveFileButton: document.getElementById("decrypt-remove-file"),
      deleteAfterEncryptDefault: document.getElementById("default-delete-after-encrypt") as HTMLInputElement,
      deleteAfterDecryptDefault: document.getElementById("default-delete-after-decrypt") as HTMLInputElement,
      vaultBody: document.getElementById("vault-body"),
      keyToAddFc: document.getElementById("keyToAddFc") as HTMLInputElement,
      addItemPasswordFc: document.getElementById("addItemPasswordFc") as HTMLInputElement,
      keyToAddDisplayNameFc: document.getElementById("keyToAddDisplayNameFc") as HTMLInputElement,
      ivToAddFc: document.getElementById("ivToAddFc") as HTMLInputElement,
      filePathToAddFc: document.getElementById("filePathToAddFc") as HTMLInputElement,
      algorithmToAddFc: document.getElementById("algorithmToAddFc") as HTMLSelectElement,
      addVaultItemBtn: document.getElementById("addVaultItemBtn"),
      addVaultItemModel: new bootstrap.Modal(document.getElementById("addVaultItemModel")),
      mustBeLoggedInVaultHeaderButtons: document.querySelectorAll("button.must-be-logged-in-vault-button"),
      changeMasterPasswordModel: new bootstrap.Modal(document.getElementById("changeMasterPasswordModel")),
      updatePasswordOldPasswordFc: document.getElementById("updatePasswordOldPasswordFc") as HTMLInputElement,
      updatePasswordNewPasswordFc: document.getElementById("updatePasswordNewPasswordFc") as HTMLInputElement,
      changeMasterPasswordBtn: document.getElementById("changeMasterPasswordBtn"),
    };
  }

  private async setUpDefautltSettings() {
    const preferDeleteAfterEncrypt = window.localStorage.getItem("prefer-delete-after-encrypt");
    this.deleteFileAfterEncrypt.checked = preferDeleteAfterEncrypt === null ? false : preferDeleteAfterEncrypt === "1";
    this.deleteAfterEncryptDefault.checked = preferDeleteAfterEncrypt === null ? false : preferDeleteAfterEncrypt === "1";

    const preferDeleteAfterDecrypt = window.localStorage.getItem("prefer-delete-after-decrypt");
    this.deleteFileAfterDecrypt.checked = preferDeleteAfterDecrypt === null ? false : preferDeleteAfterDecrypt === "1";
    this.deleteAfterDecryptDefault.checked = preferDeleteAfterDecrypt === null ? false : preferDeleteAfterDecrypt === "1";

    let defaultAlgorithm: string | null = window.localStorage.getItem("default-algorithm");

    if (defaultAlgorithm === null) {
      window.localStorage.setItem("default-algorithm", "aes-256-cbc");
      defaultAlgorithm = "aes-256-cbc";
    }

    // set default cipher algorithm
    for (const cipher of this.availableCiphers) {
      const encryptOpt = document.createElement("option");
      const decryptOpt = document.createElement("option");
      const defaultOpt = document.createElement("option");
      const toAddOpt = document.createElement("option");

      decryptOpt.value = cipher;
      decryptOpt.innerHTML = cipher;
      encryptOpt.value = cipher;
      encryptOpt.innerHTML = cipher;
      defaultOpt.value = cipher;
      defaultOpt.innerHTML = cipher;
      toAddOpt.value = cipher;
      toAddOpt.innerHTML = cipher;

      // default to default algorithm or hard coded default
      if (cipher === defaultAlgorithm) {
        encryptOpt.selected = true;
        decryptOpt.selected = true;
        defaultOpt.selected = true;
        toAddOpt.selected = true;
      }

      this.selectEncryptAlgorithm.options.add(encryptOpt);
      this.selectDecryptAlgorithm.options.add(decryptOpt);
      this.selectDefaultAlgorithm.options.add(defaultOpt);
      this.algorithmToAddFc.options.add(toAddOpt);
    }

    // store default algorithm on change
    this.selectDefaultAlgorithm.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target) {
        window.localStorage.setItem("default-algorithm", target.value);

        this.selectEncryptAlgorithm.value = target.value;
        this.selectDecryptAlgorithm.value = target.value;
        this.algorithmToAddFc.value = target.value;
      }
    });

    // store default values on changes
    this.deleteAfterEncryptDefault.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target) {
        window.localStorage.setItem("prefer-delete-after-encrypt", target.checked ? "1" : "0");

        this.deleteFileAfterEncrypt.checked = target.checked;
      }
    });

    this.deleteAfterDecryptDefault.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target) {
        window.localStorage.setItem("prefer-delete-after-decrypt", target.checked ? "1" : "0");

        this.deleteFileAfterDecrypt.checked = target.checked;
      }
    });
  }

  private async renderKeyVault(): Promise<void> {
    this.vaultBody.innerHTML = await this.api.compileHandlebarsTemplate<SecretTemplate>(vaultTemplate, {
      secrets: await this.api.getSecrets(this.accessToken),
    });

    this.showSecretButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const btn = e.target as HTMLElement;
        const secret = await this.api.getSecret(parseInt(btn.getAttribute("data-secret-id"), 10), this.accessToken);

        const keyField = btn.parentElement.parentElement.parentElement.querySelector("span.secret-key") as HTMLElement;
        const ivField = btn.parentElement.parentElement.parentElement.querySelector("span.secret-iv") as HTMLElement;
        const hideSecretsBtn = btn.parentElement.parentElement.parentElement.querySelector("button.hide-secret-btn") as HTMLElement;

        keyField.innerText = secret.key;
        ivField.innerText = secret.iv;
        btn.classList.add("d-none");
        hideSecretsBtn.classList.remove("d-none");
      });
    });

    this.hideSecretButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const btn = e.target as HTMLElement;

        const keyField = btn.parentElement.parentElement.parentElement.querySelector("span.secret-key") as HTMLElement;
        const ivField = btn.parentElement.parentElement.parentElement.querySelector("span.secret-iv") as HTMLElement;
        const showSecretsBtn = btn.parentElement.parentElement.parentElement.querySelector("button.show-secret-btn") as HTMLElement;

        keyField.innerText = "**********";
        ivField.innerText = "**********";
        btn.classList.add("d-none");
        showSecretsBtn.classList.remove("d-none");
      });
    });

    this.deleteSecretButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const btn = e.target as HTMLElement;
        await this.api.deleteSecret(parseInt(btn.getAttribute("data-secret-id"), 10), this.accessToken);
        const griContainer = btn.parentElement.parentElement.parentElement.parentElement;
        griContainer.removeChild(btn.parentElement.parentElement.parentElement);
      });
    });
  }

  private async loginToKeyVault() {
    this.keyVaultPasswordFcError.innerText = "";

    const password = this.keyVaultPasswordFc.value;
    if (password.trim() === "") {
      this.keyVaultPasswordFcError.innerText = "Please enter a password";
      return;
    }

    try {
      this.vaultSessionTokens = await this.api.startKeyVaultSession(password);
      this.startRefreshTokenTimer(this.vaultSessionTokens.refreshInMs);
    } catch (err) {
      this.keyVaultPasswordFcError.innerText = err?.message ?? "An unknown error has occured.";
      return;
    }

    // hide the login box and render the vault items
    // scroll the items into view
    this.keyVaultLoginContainer.classList.add("d-none");
    this.keyVaultPasswordFc.value = "";
    await this.renderKeyVault();
    await this.scroller.scrollTo("#key-vault-header", 50);
  }

  private async refreshKeyVaultSession() {
    this.vaultSessionTokens = await this.api.refreshVaultSession(this.vaultSessionTokens);
    this.startRefreshTokenTimer(this.vaultSessionTokens.refreshInMs);
  }

  private async logoutOfKeyVault() {
    await this.api.endKeyVaultSession();
    this.stopRefreshTokenTimer();
    this.vaultSessionTokens = null;

    // hide vault items and show login box again
    this.keyVaultLoginContainer.classList.remove("d-none");
    this.vaultBody.innerHTML = "";
  }

  private addClickListeners() {
    this.changeMasterPasswordBtn.addEventListener("click", async () => this.changeMasterPassword());

    this.addVaultItemBtn.addEventListener("click", async () => this.addVautItem());

    this.openVault.addEventListener("click", async () => {
      await this.scroller.scrollTo("#key-vault-header", 50);
      this.openVault.classList.add("d-none");
    });

    this.closeVault.addEventListener("click", async () => {
      if (this.vaultSessionTokens !== null) {
        await this.logoutOfKeyVault();
      }

      this.openVault.classList.remove("d-none");
    });

    this.keyVaultLoginButton.addEventListener("click", async () => await this.loginToKeyVault());

    this.encryptedOutputPath.addEventListener("click", () => {
      this.api.showItemInFolder(this.encryptedOutputPath.getAttribute("data-path"));
    });

    this.decryptedPath.addEventListener("click", () => {
      this.api.showItemInFolder(this.decryptedPath.getAttribute("data-path"));
    });

    this.encryptBtn.addEventListener("click", () => {
      this.encryptBtn.classList.remove("btn-secondary");
      this.encryptBtn.classList.add("btn-success");

      this.decryptBtn.classList.remove("btn-success");
      this.decryptBtn.classList.add("btn-secondary");

      this.encryptContainer.classList.remove("d-none");
      this.decryptContainer.classList.add("d-none");
    });

    this.decryptBtn.addEventListener("click", () => {
      this.decryptBtn.classList.remove("btn-secondary");
      this.decryptBtn.classList.add("btn-success");

      this.encryptBtn.classList.remove("btn-success");
      this.encryptBtn.classList.add("btn-secondary");

      this.decryptContainer.classList.remove("d-none");
      this.encryptContainer.classList.add("d-none");
    });

    this.startEncryptingBtn.addEventListener("click", async () => {
      this.encryptError.innerText = "";

      const mustDeleteFile = !!this.deleteFileAfterEncrypt.checked;
      // saving spinner
      this.encryptSpinner.classList.remove("d-none");
      this.deleteFileAfterEncryptContainer.classList.add("d-none");
      this.encryptInputContainer.classList.add("d-none");
      this.selectEncryptAlgorithmContainer.classList.add("d-none");
      this.encryptionInputSelectedFile.classList.add("d-none");
      this.startEncryptingBtnContainer.classList.add("d-none");

      const algorithmValue = this.selectEncryptAlgorithm.value;
      let hasErrors = false;

      if (algorithmValue === null || algorithmValue === undefined || algorithmValue.trim().length === 0) {
        this.selectEncrypAlgorithmError.innerText = "Please provide select an algorithm.";
        hasErrors = true;
      }

      if (hasErrors) {
        //show fields again
        this.encryptSpinner.classList.add("d-none");
        this.deleteFileAfterEncryptContainer.classList.remove("d-none");
        this.encryptInputContainer.classList.remove("d-none");
        this.selectEncryptAlgorithmContainer.classList.remove("d-none");
        this.encryptionInputSelectedFile.classList.remove("d-none");
        this.startEncryptingBtnContainer.classList.remove("d-none");
        return;
      }

      this.selectEncrypAlgorithmError.innerText = "";

      const encryptionResult = await this.api
        .encryptFile(algorithmValue, this.fileToEncrypt.path, mustDeleteFile)
        .catch((err) => (this.encryptError.innerText = err.message));

      // hide spinner
      this.encryptSpinner.classList.add("d-none");

      // means error
      if (!this.isEncryptionResult(encryptionResult)) {
        this.deleteFileAfterEncryptContainer.classList.remove("d-none");
        this.encryptInputContainer.classList.remove("d-none");
        this.selectEncryptAlgorithmContainer.classList.remove("d-none");
        this.encryptionInputSelectedFile.classList.remove("d-none");
        this.startEncryptingBtnContainer.classList.remove("d-none");
        return;
      }

      this.encryptDuration.innerText = `${this.formatBytes(this.fileToEncrypt.size)} in ${(encryptionResult.duration / 1000).toFixed(
        2
      )} seconds`;

      this.encryptedKey.innerHTML = `<strong class="text-success me-2">Key:</strong><span>${encryptionResult.key}</span>`;
      this.encryptedKey.setAttribute("data-key", encryptionResult.key);

      this.encryptIv.innerHTML = `<strong class="text-success me-2">IV:</strong><span>${encryptionResult.iv}</span>`;
      this.encryptIv.setAttribute("data-iv", encryptionResult.iv);

      this.encryptedAlgorithm.innerHTML = `<strong class="text-success me-2">Algorithm:</strong><span>${algorithmValue}</span>`;
      this.encryptedAlgorithm.setAttribute("data-algorithm", algorithmValue);

      this.encryptedOutputPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${encryptionResult.filePath}</a>`;
      this.encryptedOutputPath.setAttribute("data-path", encryptionResult.filePath);

      this.encryptResults.classList.remove("d-none");
    });

    this.startDecryptingBtn.addEventListener("click", async () => {
      this.encryptError.innerText = "";

      this.decryptSpinner.classList.remove("d-none");
      this.decryptInputContainer.classList.add("d-none");
      this.deleteFileAfterDecryptContainer.classList.add("d-none");
      this.keyFcContainer.classList.add("d-none");
      this.ivFcContainer.classList.add("d-none");
      this.decryptionInputSelectedFile.classList.add("d-none");
      this.selectDecryptAlgorithmContainer.classList.add("d-none");
      this.startDecryptingBtnContainer.classList.add("d-none");

      const mustDeleteFile = !!this.deleteFileAfterDecrypt.checked;
      const keyValue = this.keyFc.value;
      const ivValue = this.ivFc.value;
      const algorithmValue = this.selectDecryptAlgorithm.value;

      let hasErrors = false;

      if (keyValue === null || keyValue === undefined || keyValue.trim().length === 0) {
        this.keyFcError.innerText = "Please provide a key.";
        hasErrors = true;
      }

      const requiresIv = await this.api.cipherRequiresIv(algorithmValue);

      if (requiresIv && (ivValue === null || ivValue === undefined || ivValue.trim().length === 0)) {
        this.ivFcError.innerText = "Please provide an IV.";
        hasErrors = true;
      }

      if (algorithmValue === null || algorithmValue === undefined || algorithmValue.trim().length === 0) {
        this.selectDecrypAlgorithmError.innerText = "Please provide select an algorithm.";
        hasErrors = true;
      }

      if (hasErrors) {
        // hide spinner
        this.decryptSpinner.classList.add("d-none");
        this.decryptInputContainer.classList.remove("d-none");
        this.deleteFileAfterDecryptContainer.classList.remove("d-none");
        this.selectDecryptAlgorithmContainer.classList.remove("d-none");
        this.decryptionInputSelectedFile.classList.remove("d-none");
        this.selectDecryptAlgorithmContainer.classList.remove("d-none");
        this.startDecryptingBtnContainer.classList.remove("d-none");
        this.keyFcContainer.classList.remove("d-none");
        this.ivFcContainer.classList.remove("d-none");
        this.decryptInput.value = "";
        return;
      }

      this.keyFcError.innerText = "";
      this.ivFcError.innerText = "";
      this.selectDecrypAlgorithmError.innerText = "";

      const decryptResult = await this.api
        .decryptFile(algorithmValue, this.fileToDecrypt.path, keyValue, ivValue, mustDeleteFile)
        .catch((err) => (this.decryptError.innerText = err.message));

      this.decryptSpinner.classList.add("d-none");

      // means error
      if (!this.isDecryptionResult(decryptResult)) {
        // show fields again
        this.decryptInputContainer.classList.remove("d-none");
        this.deleteFileAfterDecryptContainer.classList.remove("d-none");
        this.keyFcContainer.classList.remove("d-none");
        this.ivFcContainer.classList.remove("d-none");
        this.selectDecryptAlgorithmContainer.classList.remove("d-none");
        this.decryptionInputSelectedFile.classList.remove("d-none");
        this.startDecryptingBtnContainer.classList.remove("d-none");
        return;
      }

      this.decryptDuration.innerText = `${this.formatBytes(this.fileToDecrypt.size)} in ${(decryptResult.duration / 1000).toFixed(
        2
      )} seconds`;

      this.decryptedPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${decryptResult.filePath}</a>`;
      this.decryptedPath.setAttribute("data-path", decryptResult.filePath);

      this.decryptResults.classList.remove("d-none");
    });

    this.encryptRemoveFileButton.addEventListener("click", () => {
      this.encryptionInputSelectedFile.classList.add("d-none");
      this.encryptionInputSelectedFileName.innerText = "";
      this.encryptionInputSelectedFileSize.innerText = "";
      this.startEncryptingBtnContainer.classList.add("d-none");
      this.encryptInputContainer.classList.remove("d-none");
    });

    this.decryptRemoveFileButton.addEventListener("click", () => {
      this.decryptionInputSelectedFile.classList.add("d-none");
      this.decryptionInputSelectedFileName.innerText = "";
      this.decryptionInputSelectedFileSize.innerText = "";
      this.startDecryptingBtnContainer.classList.add("d-none");
      this.decryptInputContainer.classList.remove("d-none");
    });

    this.startoverEncryptButton.addEventListener("click", () => {
      this.encryptInput.value = "";
      this.encryptedKey.innerHTML = "";
      this.encryptIv.innerHTML = "";
      this.encryptInputContainer.classList.remove("d-none");
      this.deleteFileAfterEncryptContainer.classList.remove("d-none");
      this.selectEncryptAlgorithmContainer.classList.remove("d-none");
      this.encryptResults.classList.add("d-none");
      this.clipboardButton.classList.remove("d-none");
      this.clipboardCheckButton.classList.add("d-none");
      this.fileToEncrypt = undefined;
    });

    this.startoverDecryptButton.addEventListener("click", () => {
      this.decryptInput.value = "";
      this.decryptedPath.innerHTML = "";
      this.keyFc.value = "";
      this.keyFcContainer.classList.remove("d-none");
      this.ivFc.value = "";
      this.ivFcContainer.classList.remove("d-none");
      this.decryptInputContainer.classList.remove("d-none");
      this.deleteFileAfterDecryptContainer.classList.remove("d-none");
      this.selectDecryptAlgorithmContainer.classList.remove("d-none");
      this.decryptResults.classList.add("d-none");
      this.fileToEncrypt = undefined;
    });

    const copyEncryptionResults = async () => {
      await navigator.clipboard.writeText(
        JSON.stringify({
          key: this.encryptedKey.getAttribute("data-key"),
          iv: this.encryptIv.getAttribute("data-iv"),
          algorithm: this.encryptedAlgorithm.getAttribute("data-algorithm"),
          path: this.encryptedOutputPath.getAttribute("data-path"),
        })
      );
    };

    this.clipboardButton.addEventListener("click", async () => {
      await copyEncryptionResults();

      this.clipboardButton.classList.add("d-none");
      this.clipboardCheckButton.classList.remove("d-none");
    });

    this.clipboardCheckButton.addEventListener("click", async () => {
      await copyEncryptionResults();
    });
  }

  private addChangeListeners() {
    this.encryptInput.addEventListener("change", async (e: Event) => {
      this.encryptError.innerText = "";
      const target = e.target as HTMLInputElement;
      const targetFile = target.files[0];
      if (targetFile) {
        this.fileToEncrypt = targetFile;
        this.encryptionInputSelectedFile.classList.remove("d-none");
        this.encryptionInputSelectedFileName.innerText = targetFile.name;
        this.encryptionInputSelectedFileSize.innerText = this.formatBytes(targetFile.size);
        this.startEncryptingBtnContainer.classList.remove("d-none");
        this.encryptInputContainer.classList.add("d-none");
      } else {
        this.encryptionInputSelectedFile.classList.add("d-none");
        this.encryptionInputSelectedFileName.innerText = "";
        this.encryptionInputSelectedFileSize.innerText = "";
        this.startEncryptingBtnContainer.classList.add("d-none");
      }
    });

    this.decryptInput.addEventListener("change", async (e: Event) => {
      this.decryptError.innerText = "";

      const target = e.target as HTMLInputElement;
      const targetFile = target.files[0];
      if (targetFile) {
        this.fileToDecrypt = targetFile;
        this.decryptionInputSelectedFile.classList.remove("d-none");
        this.decryptionInputSelectedFileName.innerText = targetFile.name;
        this.decryptionInputSelectedFileSize.innerText = this.formatBytes(targetFile.size);
        this.startDecryptingBtnContainer.classList.remove("d-none");
        this.decryptInputContainer.classList.add("d-none");
      } else {
        this.decryptionInputSelectedFile.classList.add("d-none");
        this.decryptionInputSelectedFileName.innerText = "";
        this.decryptionInputSelectedFileSize.innerText = "";
        this.startDecryptingBtnContainer.classList.add("d-none");
      }
    });
  }

  private isEncryptionResult(result: Encryptionresult | NodeJS.ErrnoException): result is Encryptionresult {
    return (
      (<Encryptionresult>result).filePath !== undefined &&
      (<Encryptionresult>result).key !== undefined &&
      (<Encryptionresult>result).iv !== undefined &&
      (<Encryptionresult>result).duration !== undefined
    );
  }

  private isDecryptionResult(result: Decryptionresult | NodeJS.ErrnoException): result is Decryptionresult {
    return (<Decryptionresult>result).filePath !== undefined && (<Decryptionresult>result).duration !== undefined;
  }

  private formatBytes(bytes: number, decimals = 0) {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  private startRefreshTokenTimer(refreshInMs: number) {
    this.refreshTokenTimeout = setTimeout(async () => await this.refreshKeyVaultSession(), refreshInMs);
  }

  private stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }

  private async changeMasterPassword() {
    const oldPassword = this.updatePasswordOldPasswordFc.value;
    const newPassword = this.updatePasswordNewPasswordFc.value;

    if (oldPassword === undefined || oldPassword === null || oldPassword.trim() === "") {
      return;
    }

    if (newPassword === undefined || newPassword === null || newPassword.trim() === "") {
      return;
    }

    if (newPassword.trim().length < 16) {
      // password too small
      return;
    }

    if (newPassword.trim().length > 32) {
      // password too large
      return;
    }

    await this.logoutOfKeyVault();
    await this.api.updateMasterPassword(oldPassword, newPassword);
    this.updatePasswordOldPasswordFc.value = '';
    this.updatePasswordNewPasswordFc.value = '';
    this.changeMasterPasswordModel.hide();
    
  }

  private async addVautItem() {
    const displayName = this.keyToAddDisplayNameFc.value;
    const keyToAdd = this.keyToAddFc.value;
    const ivToAdd = this.ivToAddFc.value;
    let algorithm = this.algorithmToAddFc.value;
    algorithm = algorithm === "-1" ? null : algorithm;
    const filePath = this.filePathToAddFc.value;
    const password = this.addItemPasswordFc.value;

    if (displayName === undefined || displayName === null || displayName.trim() === "") {
      return;
    }

    if (keyToAdd === undefined || keyToAdd === null || keyToAdd.trim() === "") {
      return;
    }

    if (password === undefined || password === null || password.trim() === "") {
      return;
    }

    await this.api.addSecret(password, displayName, algorithm, keyToAdd, ivToAdd, filePath, this.accessToken);

    // re-render the vault items if the vault is open
    if (this.vaultSessionTokens !== null) {
      await this.renderKeyVault();
    }

    // reset and hide add item form
    this.keyToAddFc.value = "";
    this.ivToAddFc.value = "";
    this.keyToAddDisplayNameFc.value = "";
    this.addItemPasswordFc.value = "";
    this.algorithmToAddFc.value = this.selectDefaultAlgorithm.value;
    this.filePathToAddFc.value = "";
    this.addVaultItemModel.hide();
  }
}

class ScrollToElementHelper {
  private _el: HTMLElement | null = null;

  public async scrollTo(selector: string, delayMs: number | null = null, pageHeaderHeight = 192) {
    if (delayMs !== null) {
      await this.delay(delayMs);
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
      behavior: "auto",
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

  private delay = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}
