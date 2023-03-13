/* eslint-disable @typescript-eslint/no-explicit-any */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features

interface Decryptionresult {
  duration: number;
  filePath: string;
}

interface Encryptionresult {
  duration: number;
  key: string;
  iv: string;
  filePath: string;
}

// needed in the renderer process.
const nKriptApi = window.nKriptApi;

const getElements = () => {
  return {
    encryptBtn: document.getElementById("encrypt-btn"),
    encryptContainer: document.getElementById("encryption-container"),
    encryptInput: document.getElementById(
      "encryption-input"
    ) as HTMLInputElement,
    encryptInputContainer: document.getElementById(
      "encryption-input-container"
    ),
    encryptSpinner: document.getElementById("encryption-spinner"),
    encryptedKey: document.getElementById("encrypted-key"),
    encryptedOutputPath: document.getElementById("encrypted-path"),
    encryptedAlgorithm: document.getElementById("encrypted-algorithm"),
    encryptIv: document.getElementById("encrypted-iv"),
    decryptBtn: document.getElementById("decrypt-btn"),
    decryptContainer: document.getElementById("decryption-container"),
    decryptInput: document.getElementById(
      "decryption-input"
    ) as HTMLInputElement,
    decryptInputContainer: document.getElementById(
      "decryption-input-container"
    ),
    decryptSpinner: document.getElementById("decryption-spinner"),
    keyFc: document.getElementById("keyFc") as HTMLInputElement,
    ivFc: document.getElementById("ivFc") as HTMLInputElement,
    keyFcError: document.getElementById("keyFc-error"),
    ivFcError: document.getElementById("ivFc-error"),
    decryptError: document.getElementById("decrypt-error"),
    encryptError: document.getElementById("encrypt-error"),
    encryptResults: document.getElementById("encrypt-results"),
    startoverEncryptButton: document.getElementById("startover-encrypt-btn"),
    deleteFileAfterEncrypt: document.getElementById(
      "delete-after-encrypt"
    ) as HTMLInputElement,
    deleteFileAfterEncryptContainer: document.getElementById(
      "delete-after-encrypt-container"
    ),
    deleteFileAfterDecrypt: document.getElementById(
      "delete-after-decrypt"
    ) as HTMLInputElement,
    deleteFileAfterDecryptContainer: document.getElementById(
      "delete-after-decrypt-container"
    ),
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
    startDecryptingBtnContainer: document.getElementById(
      "start-decrypting-container"
    ),
    decryptionInputSelectedFileName: document.getElementById(
      "decryption-input-selected-file-name"
    ),
    decryptionInputSelectedFileSize: document.getElementById(
      "decryption-input-selected-file-size"
    ),
    decryptionInputSelectedFile: document.getElementById(
      "decryption-input-selected-file-container"
    ),
    startEncryptingBtn: document.getElementById("start-encrypting"),
    startEncryptingBtnContainer: document.getElementById(
      "start-encrypting-container"
    ),
    encryptionInputSelectedFileName: document.getElementById(
      "encryption-input-selected-file-name"
    ),
    encryptionInputSelectedFileSize: document.getElementById(
      "encryption-input-selected-file-size"
    ),
    encryptionInputSelectedFile: document.getElementById(
      "encryption-input-selected-file-container"
    ),
    selectDecryptAlgorithmContainer: document.getElementById(
      "select-decrypt-algorithm-container"
    ),
    selectEncryptAlgorithmContainer: document.getElementById(
      "select-encrypt-algorithm-container"
    ),
    selectDecryptAlgorithm: document.getElementById(
      "select-decrypt-algorithm"
    ) as HTMLSelectElement,
    selectEncryptAlgorithm: document.getElementById(
      "select-encrypt-algorithm"
    ) as HTMLSelectElement,
    selectDefaultAlgorithm: document.getElementById(
      "select-default-algorithm"
    ) as HTMLSelectElement,
    selectEncrypAlgorithmError: document.getElementById(
      "select-decrypt-algorithm-error"
    ),
    selectDecrypAlgorithmError: document.getElementById(
      "select-encrypt-algorithm-error"
    ),
    encryptRemoveFileButton: document.getElementById("encrypt-remove-file"),
    decryptRemoveFileButton: document.getElementById("decrypt-remove-file"),
    deleteAfterEncryptDefault: document.getElementById(
      "default-delete-after-encrypt"
    ) as HTMLInputElement,
    deleteAfterDecryptDefault: document.getElementById(
      "default-delete-after-decrypt"
    ) as HTMLInputElement,
  };
};

const isEncryptionResult = (
  result: Encryptionresult | NodeJS.ErrnoException
): result is Encryptionresult => {
  return (
    (<Encryptionresult>result).filePath !== undefined &&
    (<Encryptionresult>result).key !== undefined &&
    (<Encryptionresult>result).iv !== undefined &&
    (<Encryptionresult>result).duration !== undefined
  );
};

const isDecryptionResult = (
  result: Decryptionresult | NodeJS.ErrnoException
): result is Decryptionresult => {
  return (
    (<Decryptionresult>result).filePath !== undefined &&
    (<Decryptionresult>result).duration !== undefined
  );
};

const formatBytes = (bytes: number, decimals = 0) => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const dm = decimals <= 0 ? 0 : decimals || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

document.addEventListener("DOMContentLoaded", async () => {
  // NOT POSSIBLE TO RESTORE IF MASTER PASSWORD LOST!!!!!!!!!!
  // i want to allow user to select a master password if the app is run for thge first time
  // i want the app to then encrypt the secret db using that password
  // i will store a bcrypthash of the master password in the masterpassword table of a separate un-encrypted database

  // everytime the user needs  to access the db,
  // we will ask for the master password from the uncencrypted table, 
  // then need to check if supplied password is match. if not show error.

  // if match, decrypt secret db decrypted, then read/write data and encrypt again when done
  // maybe allow for rescure email on creation so that if master password is lost then an email can get sent to the email 
  const userKey = window.prompt(
    "Enter a master password for storing secrets. (max 32 characters)",
    "SteamyAvoAndBakedBroccoliIsGood!"
  );

  let selectedFileToEncrypt: File | undefined = undefined;
  let selectedFileToDecrypt: File | undefined = undefined;
  const availableCiphers = await nKriptApi.getAvailableCiphers();

  const {
    encryptBtn,
    encryptContainer,
    decryptBtn,
    decryptContainer,
    decryptInput,
    decryptSpinner,
    encryptedKey,
    encryptIv,
    encryptSpinner,
    encryptInput,
    ivFc,
    keyFc,
    keyFcError,
    ivFcError,
    decryptError,
    encryptError,
    encryptResults,
    decryptInputContainer,
    encryptInputContainer,
    startoverEncryptButton,
    deleteFileAfterEncrypt,
    deleteFileAfterDecrypt,
    encryptedOutputPath,
    encryptedAlgorithm,
    deleteFileAfterEncryptContainer,
    deleteFileAfterDecryptContainer,
    clipboardButton,
    clipboardCheckButton,
    decryptResults,
    decryptedPath,
    startoverDecryptButton,
    ivFcContainer,
    keyFcContainer,
    decryptDuration,
    encryptDuration,
    startEncryptingBtn,
    encryptionInputSelectedFileName,
    encryptionInputSelectedFileSize,
    encryptionInputSelectedFile,
    startDecryptingBtn,
    decryptionInputSelectedFileName,
    decryptionInputSelectedFileSize,
    decryptionInputSelectedFile,
    startDecryptingBtnContainer,
    startEncryptingBtnContainer,
    selectDecryptAlgorithmContainer,
    selectEncryptAlgorithmContainer,
    selectDecryptAlgorithm,
    selectEncryptAlgorithm,
    selectDefaultAlgorithm,
    selectDecrypAlgorithmError,
    selectEncrypAlgorithmError,
    decryptRemoveFileButton,
    encryptRemoveFileButton,
    deleteAfterEncryptDefault,
    deleteAfterDecryptDefault,
  } = getElements();

  const preferDeleteAfterEncrypt = window.localStorage.getItem(
    "prefer-delete-after-encrypt"
  );
  deleteFileAfterEncrypt.checked =
    preferDeleteAfterEncrypt === null
      ? false
      : preferDeleteAfterEncrypt === "1";
  deleteAfterEncryptDefault.checked =
    preferDeleteAfterEncrypt === null
      ? false
      : preferDeleteAfterEncrypt === "1";

  const preferDeleteAfterDecrypt = window.localStorage.getItem(
    "prefer-delete-after-decrypt"
  );
  deleteFileAfterDecrypt.checked =
    preferDeleteAfterDecrypt === null
      ? false
      : preferDeleteAfterDecrypt === "1";
  deleteAfterDecryptDefault.checked =
    preferDeleteAfterDecrypt === null
      ? false
      : preferDeleteAfterDecrypt === "1";

  let defaultAlgorithm: string | null =
    window.localStorage.getItem("default-algorithm");

  if (defaultAlgorithm === null) {
    window.localStorage.setItem("default-algorithm", "aes-256-cbc");
    defaultAlgorithm = "aes-256-cbc";
  }

  // set default cipher algorithm
  for (const cipher of availableCiphers) {
    const encryptOpt = document.createElement("option");
    const decryptOpt = document.createElement("option");
    const defaultOpt = document.createElement("option");

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

    selectEncryptAlgorithm.options.add(encryptOpt);
    selectDecryptAlgorithm.options.add(decryptOpt);
    selectDefaultAlgorithm.options.add(defaultOpt);
  }

  // store default algorithm on change
  selectDefaultAlgorithm.addEventListener("change", (e: Event) => {
    const target = e.target as HTMLSelectElement;
    if (target) {
      window.localStorage.setItem("default-algorithm", target.value);

      selectEncryptAlgorithm.value = target.value;
      selectDecryptAlgorithm.value = target.value;
    }
  });

  // store default values on changes
  deleteAfterEncryptDefault.addEventListener("change", (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target) {
      window.localStorage.setItem(
        "prefer-delete-after-encrypt",
        target.checked ? "1" : "0"
      );

      deleteFileAfterEncrypt.checked = target.checked;
    }
  });

  deleteAfterDecryptDefault.addEventListener("change", (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target) {
      window.localStorage.setItem(
        "prefer-delete-after-decrypt",
        target.checked ? "1" : "0"
      );

      deleteFileAfterDecrypt.checked = target.checked;
    }
  });

  encryptedOutputPath.addEventListener("click", () => {
    nKriptApi.showItemInFolder(encryptedOutputPath.getAttribute("data-path"));
  });

  decryptedPath.addEventListener("click", () => {
    nKriptApi.showItemInFolder(decryptedPath.getAttribute("data-path"));
  });

  encryptBtn.addEventListener("click", () => {
    encryptBtn.classList.remove("btn-secondary");
    encryptBtn.classList.add("btn-success");

    decryptBtn.classList.remove("btn-success");
    decryptBtn.classList.add("btn-secondary");

    encryptContainer.classList.remove("d-none");
    decryptContainer.classList.add("d-none");
  });

  decryptBtn.addEventListener("click", () => {
    decryptBtn.classList.remove("btn-secondary");
    decryptBtn.classList.add("btn-success");

    encryptBtn.classList.remove("btn-success");
    encryptBtn.classList.add("btn-secondary");

    decryptContainer.classList.remove("d-none");
    encryptContainer.classList.add("d-none");
  });

  startEncryptingBtn.addEventListener("click", async () => {
    encryptError.innerText = "";

    const mustDeleteFile = !!deleteFileAfterEncrypt.checked;
    // saving spinner
    encryptSpinner.classList.remove("d-none");
    deleteFileAfterEncryptContainer.classList.add("d-none");
    encryptInputContainer.classList.add("d-none");
    selectEncryptAlgorithmContainer.classList.add("d-none");
    encryptionInputSelectedFile.classList.add("d-none");
    startEncryptingBtnContainer.classList.add("d-none");

    const algorithmValue = selectEncryptAlgorithm.value;
    let hasErrors = false;

    if (
      algorithmValue === null ||
      algorithmValue === undefined ||
      algorithmValue.trim().length === 0
    ) {
      selectEncrypAlgorithmError.innerText =
        "Please provide select an algorithm.";
      hasErrors = true;
    }

    if (hasErrors) {
      //show fields again
      encryptSpinner.classList.add("d-none");
      deleteFileAfterEncryptContainer.classList.remove("d-none");
      encryptInputContainer.classList.remove("d-none");
      selectEncryptAlgorithmContainer.classList.remove("d-none");
      encryptionInputSelectedFile.classList.remove("d-none");
      startEncryptingBtnContainer.classList.remove("d-none");
      return;
    }

    selectEncrypAlgorithmError.innerText = "";

    const encryptionResult = await nKriptApi
      .encryptFile(algorithmValue, selectedFileToEncrypt.path, mustDeleteFile)
      .catch((err) => (encryptError.innerText = err.message));

    // hide spinner
    encryptSpinner.classList.add("d-none");

    // means error
    if (!isEncryptionResult(encryptionResult)) {
      deleteFileAfterEncryptContainer.classList.remove("d-none");
      encryptInputContainer.classList.remove("d-none");
      selectEncryptAlgorithmContainer.classList.remove("d-none");
      encryptionInputSelectedFile.classList.remove("d-none");
      startEncryptingBtnContainer.classList.remove("d-none");
      return;
    }

    encryptDuration.innerText = `${formatBytes(
      selectedFileToEncrypt.size
    )} in ${(encryptionResult.duration / 1000).toFixed(2)} seconds`;

    encryptedKey.innerHTML = `<strong class="text-success me-2">Key:</strong><span>${encryptionResult.key}</span>`;
    encryptedKey.setAttribute("data-key", encryptionResult.key);

    encryptIv.innerHTML = `<strong class="text-success me-2">IV:</strong><span>${encryptionResult.iv}</span>`;
    encryptIv.setAttribute("data-iv", encryptionResult.iv);

    encryptedAlgorithm.innerHTML = `<strong class="text-success me-2">Algorithm:</strong><span>${algorithmValue}</span>`;
    encryptedAlgorithm.setAttribute("data-algorithm", algorithmValue);

    encryptedOutputPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${encryptionResult.filePath}</a>`;
    encryptedOutputPath.setAttribute("data-path", encryptionResult.filePath);

    encryptResults.classList.remove("d-none");
  });

  startDecryptingBtn.addEventListener("click", async () => {
    encryptError.innerText = "";

    decryptSpinner.classList.remove("d-none");
    decryptInputContainer.classList.add("d-none");
    deleteFileAfterDecryptContainer.classList.add("d-none");
    keyFcContainer.classList.add("d-none");
    ivFcContainer.classList.add("d-none");
    decryptionInputSelectedFile.classList.add("d-none");
    selectDecryptAlgorithmContainer.classList.add("d-none");
    startDecryptingBtnContainer.classList.add("d-none");

    const mustDeleteFile = !!deleteFileAfterDecrypt.checked;
    const keyValue = keyFc.value;
    const ivValue = ivFc.value;
    const algorithmValue = selectDecryptAlgorithm.value;

    let hasErrors = false;

    if (
      keyValue === null ||
      keyValue === undefined ||
      keyValue.trim().length === 0
    ) {
      keyFcError.innerText = "Please provide a key.";
      hasErrors = true;
    }

    const requiresIv = await nKriptApi.cipherRequiresIv(algorithmValue);

    if (
      requiresIv &&
      (ivValue === null || ivValue === undefined || ivValue.trim().length === 0)
    ) {
      ivFcError.innerText = "Please provide an IV.";
      hasErrors = true;
    }

    if (
      algorithmValue === null ||
      algorithmValue === undefined ||
      algorithmValue.trim().length === 0
    ) {
      selectDecrypAlgorithmError.innerText =
        "Please provide select an algorithm.";
      hasErrors = true;
    }

    if (hasErrors) {
      // hide spinner
      decryptSpinner.classList.add("d-none");
      decryptInputContainer.classList.remove("d-none");
      deleteFileAfterDecryptContainer.classList.remove("d-none");
      selectDecryptAlgorithmContainer.classList.remove("d-none");
      decryptionInputSelectedFile.classList.remove("d-none");
      selectDecryptAlgorithmContainer.classList.remove("d-none");
      startDecryptingBtnContainer.classList.remove("d-none");
      keyFcContainer.classList.remove("d-none");
      ivFcContainer.classList.remove("d-none");
      decryptInput.value = "";
      return;
    }

    keyFcError.innerText = "";
    ivFcError.innerText = "";
    selectDecrypAlgorithmError.innerText = "";

    const decryptResult = await nKriptApi
      .decryptFile(
        algorithmValue,
        selectedFileToDecrypt.path,
        keyValue,
        ivValue,
        mustDeleteFile
      )
      .catch((err) => (decryptError.innerText = err.message));

    decryptSpinner.classList.add("d-none");

    // means error
    if (!isDecryptionResult(decryptResult)) {
      // show fields again
      decryptInputContainer.classList.remove("d-none");
      deleteFileAfterDecryptContainer.classList.remove("d-none");
      keyFcContainer.classList.remove("d-none");
      ivFcContainer.classList.remove("d-none");
      selectDecryptAlgorithmContainer.classList.remove("d-none");
      decryptionInputSelectedFile.classList.remove("d-none");
      startDecryptingBtnContainer.classList.remove("d-none");
      return;
    }

    decryptDuration.innerText = `${formatBytes(
      selectedFileToDecrypt.size
    )} in ${(decryptResult.duration / 1000).toFixed(2)} seconds`;

    decryptedPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${decryptResult.filePath}</a>`;
    decryptedPath.setAttribute("data-path", decryptResult.filePath);

    decryptResults.classList.remove("d-none");
  });

  encryptInput.addEventListener("change", async (e: Event) => {
    encryptError.innerText = "";
    const target = e.target as HTMLInputElement;
    const targetFile = target.files[0];
    if (targetFile) {
      selectedFileToEncrypt = targetFile;
      encryptionInputSelectedFile.classList.remove("d-none");
      encryptionInputSelectedFileName.innerText = targetFile.name;
      encryptionInputSelectedFileSize.innerText = formatBytes(targetFile.size);
      startEncryptingBtnContainer.classList.remove("d-none");
      encryptInputContainer.classList.add("d-none");
    } else {
      encryptionInputSelectedFile.classList.add("d-none");
      encryptionInputSelectedFileName.innerText = "";
      encryptionInputSelectedFileSize.innerText = "";
      startEncryptingBtnContainer.classList.add("d-none");
    }
  });

  decryptInput.addEventListener("change", async (e: Event) => {
    decryptError.innerText = "";

    const target = e.target as HTMLInputElement;
    const targetFile = target.files[0];
    if (targetFile) {
      selectedFileToDecrypt = targetFile;
      decryptionInputSelectedFile.classList.remove("d-none");
      decryptionInputSelectedFileName.innerText = targetFile.name;
      decryptionInputSelectedFileSize.innerText = formatBytes(targetFile.size);
      startDecryptingBtnContainer.classList.remove("d-none");
      decryptInputContainer.classList.add("d-none");
    } else {
      decryptionInputSelectedFile.classList.add("d-none");
      decryptionInputSelectedFileName.innerText = "";
      decryptionInputSelectedFileSize.innerText = "";
      startDecryptingBtnContainer.classList.add("d-none");
    }
  });

  encryptRemoveFileButton.addEventListener("click", () => {
    encryptionInputSelectedFile.classList.add("d-none");
    encryptionInputSelectedFileName.innerText = "";
    encryptionInputSelectedFileSize.innerText = "";
    startEncryptingBtnContainer.classList.add("d-none");
    encryptInputContainer.classList.remove("d-none");
  });

  decryptRemoveFileButton.addEventListener("click", () => {
    decryptionInputSelectedFile.classList.add("d-none");
    decryptionInputSelectedFileName.innerText = "";
    decryptionInputSelectedFileSize.innerText = "";
    startDecryptingBtnContainer.classList.add("d-none");
    decryptInputContainer.classList.remove("d-none");
  });

  startoverEncryptButton.addEventListener("click", () => {
    encryptInput.value = "";
    encryptedKey.innerHTML = "";
    encryptIv.innerHTML = "";
    encryptInputContainer.classList.remove("d-none");
    deleteFileAfterEncryptContainer.classList.remove("d-none");
    selectEncryptAlgorithmContainer.classList.remove("d-none");
    encryptResults.classList.add("d-none");
    clipboardButton.classList.remove("d-none");
    clipboardCheckButton.classList.add("d-none");
    selectedFileToEncrypt = undefined;
  });

  startoverDecryptButton.addEventListener("click", () => {
    decryptInput.value = "";
    decryptedPath.innerHTML = "";
    keyFc.value = "";
    keyFcContainer.classList.remove("d-none");
    ivFc.value = "";
    ivFcContainer.classList.remove("d-none");
    decryptInputContainer.classList.remove("d-none");
    deleteFileAfterDecryptContainer.classList.remove("d-none");
    selectDecryptAlgorithmContainer.classList.remove("d-none");
    decryptResults.classList.add("d-none");
    selectedFileToDecrypt = undefined;
  });

  const copyEncryptionResults = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify({
        key: encryptedKey.getAttribute("data-key"),
        iv: encryptIv.getAttribute("data-iv"),
        algorithm: encryptedAlgorithm.getAttribute("data-algorithm"),
        path: encryptedOutputPath.getAttribute("data-path"),
      })
    );
  };

  clipboardButton.addEventListener("click", async () => {
    await copyEncryptionResults();

    clipboardButton.classList.add("d-none");
    clipboardCheckButton.classList.remove("d-none");
  });

  clipboardCheckButton.addEventListener("click", async () => {
    await copyEncryptionResults();
  });
});
