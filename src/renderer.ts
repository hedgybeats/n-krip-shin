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
    ivFcError,
    keyFcError,
    decryptError,
    encryptError,
    encryptResults,
    decryptInputContainer,
    encryptInputContainer,
    startoverEncryptButton,
    deleteFileAfterEncrypt,
    deleteFileAfterDecrypt,
    encryptedOutputPath,
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
  } = getElements();

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

  encryptInput.addEventListener("change", async (e: Event) => {
    encryptError.innerText = "";
    const target = e.target as HTMLInputElement;
    const targetFile = target.files[0];
    if (targetFile) {
      const mustDeleteFile = !!deleteFileAfterEncrypt.checked;
      // saving spinner
      encryptSpinner.classList.remove("d-none");
      deleteFileAfterEncryptContainer.classList.add("d-none");
      encryptInputContainer.classList.add("d-none");

      const encryptionResult = await nKriptApi
        .encryptFile(targetFile.path, mustDeleteFile)
        .catch((err) => (encryptError.innerText = err.message));

      // hide spinner
      encryptSpinner.classList.add("d-none");

      // means error
      if (!isEncryptionResult(encryptionResult)) {
        deleteFileAfterEncryptContainer.classList.remove("d-none");
        encryptInputContainer.classList.remove("d-none");
        return;
      }

      encryptDuration.innerText = `${formatBytes(targetFile.size)} in ${(
        encryptionResult.duration / 1000
      ).toFixed(2)} seconds`;

      encryptedKey.innerHTML = `<strong class="text-danger me-2">Key:</strong><span>${encryptionResult.key}</span>`;
      encryptedKey.setAttribute("data-key", encryptionResult.key);

      encryptIv.innerHTML = `<strong class="text-danger me-2">IV:</strong><span>${encryptionResult.iv}</span>`;
      encryptIv.setAttribute("data-iv", encryptionResult.iv);

      encryptedOutputPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${encryptionResult.filePath}</a>`;
      encryptedOutputPath.setAttribute("data-path", encryptionResult.filePath);

      encryptResults.classList.remove("d-none");
    }
  });

  decryptInput.addEventListener("change", async (e: Event) => {
    decryptError.innerText = "";

    const target = e.target as HTMLInputElement;
    const targetFile = target.files[0];
    if (targetFile) {
      // show spinner
      decryptSpinner.classList.remove("d-none");
      decryptInputContainer.classList.add("d-none");
      deleteFileAfterDecryptContainer.classList.add("d-none");
      keyFcContainer.classList.add("d-none");
      ivFcContainer.classList.add("d-none");

      const mustDeleteFile = !!deleteFileAfterDecrypt.checked;
      const keyValue = keyFc.value;
      const ivValue = ivFc.value;

      let hasErrors = false;

      if (
        keyValue === null ||
        keyValue === undefined ||
        keyValue.trim().length === 0
      ) {
        keyFcError.innerText = "Please provide a key.";
        hasErrors = true;
      }

      if (
        ivValue === null ||
        ivValue === undefined ||
        ivValue.trim().length === 0
      ) {
        ivFcError.innerText = "Please provide an IV.";
        hasErrors = true;
      }

      if (hasErrors) {
        // hide spinner
        decryptSpinner.classList.add("d-none");
        decryptInputContainer.classList.remove("d-none");
        deleteFileAfterDecryptContainer.classList.remove("d-none");
        keyFcContainer.classList.remove("d-none");
        ivFcContainer.classList.remove("d-none");
        decryptInput.value = "";
        return;
      }

      keyFcError.innerText = "";
      ivFcError.innerText = "";

      const decryptResult = await nKriptApi
        .decryptFile(targetFile.path, keyValue, ivValue, mustDeleteFile)
        .catch((err) => (decryptError.innerText = err.message));

      decryptSpinner.classList.add("d-none");

      // means error
      if (!isDecryptionResult(decryptResult)) {
        // show fields again
        decryptInputContainer.classList.remove("d-none");
        deleteFileAfterDecryptContainer.classList.remove("d-none");
        keyFcContainer.classList.remove("d-none");
        ivFcContainer.classList.remove("d-none");
        return;
      }

      decryptDuration.innerText = `${formatBytes(targetFile.size)} in ${(
        decryptResult.duration / 1000
      ).toFixed(2)} seconds`;

      decryptedPath.innerHTML = `<strong class="text-success me-2">File Path:</strong><a class="text-light underline fst-italic cursor-pointer">${decryptResult.filePath}</a>`;
      decryptedPath.setAttribute("data-path", decryptResult.filePath);

      decryptResults.classList.remove("d-none");
    }
  });

  startoverEncryptButton.addEventListener("click", () => {
    encryptInput.value = "";
    encryptedKey.innerHTML = "";
    encryptIv.innerHTML = "";
    encryptInputContainer.classList.remove("d-none");
    deleteFileAfterEncryptContainer.classList.remove("d-none");
    encryptResults.classList.add("d-none");
    clipboardButton.classList.remove("d-none");
    clipboardCheckButton.classList.add("d-none");
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
    decryptResults.classList.add("d-none");
  });

  clipboardButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(
      JSON.stringify({
        key: encryptedKey.getAttribute("data-key"),
        iv: encryptIv.getAttribute("data-iv"),
        path: encryptedOutputPath.getAttribute("data-path"),
      })
    );

    clipboardButton.classList.add("d-none");
    clipboardCheckButton.classList.remove("d-none");
  });

  clipboardCheckButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(
      JSON.stringify({
        key: encryptedKey.getAttribute("data-key"),
        iv: encryptIv.getAttribute("data-iv"),
        path: encryptedOutputPath.getAttribute("data-path"),
      })
    );
  });
});
