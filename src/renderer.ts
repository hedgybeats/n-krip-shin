// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.
const api = window.nKripShinApi;

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
  } = getElements();

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
    const target = e.target as HTMLInputElement;
    if (target.files[0]) {
      const mustDeleteFile = !!deleteFileAfterEncrypt.checked;
      encryptSpinner.classList.remove("d-none");
      const encryptionResult = await api
        .encryptFile(target.files[0].path, mustDeleteFile)
        .catch((err) => (encryptError.innerText = err.message));

      encryptSpinner.classList.add("d-none");

      // means error
      if (encryptionResult.key === undefined) {
        return;
      }

      encryptedKey.innerHTML = `<strong class="text-danger me-2"">Key:</strong><span>${encryptionResult.key}</span>`;
      encryptedKey.setAttribute("data-key", encryptionResult.key);

      encryptIv.innerHTML = `<strong class="text-danger me-2"">IV:</strong><span>${encryptionResult.iv}</span>`;
      encryptIv.setAttribute("data-iv", encryptionResult.iv);

      encryptedOutputPath.innerHTML = `<strong class="text-success me-2"">File Path:</strong><span>${encryptionResult.filePath}</span>`;
      encryptedOutputPath.setAttribute("data-path", encryptionResult.filePath);

      encryptInputContainer.classList.add("d-none");
      deleteFileAfterEncryptContainer.classList.add("d-none");
      encryptResults.classList.remove("d-none");
    }
  });

  decryptInput.addEventListener("change", async (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files[0]) {
      decryptSpinner.classList.remove("d-none");

      const mustDeleteFile = !!deleteFileAfterDecrypt.checked;
      const keyValue = keyFc.value;
      const ivValue = ivFc.value;

      let hasErrors = false;

      console.log(keyValue);
      console.log(ivValue);

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
        decryptSpinner.classList.add("d-none");
        decryptInput.value = "";
        return;
      }

      keyFcError.innerText = "";
      ivFcError.innerText = "";

      const decryptResult = await api
        .decryptFile(target.files[0].path, keyValue, ivValue, mustDeleteFile)
        .catch((err) => (decryptError.innerText = err.message));

      decryptSpinner.classList.add("d-none");

      // means error
      if (decryptResult.filePath === undefined) {
        return;
      }

      decryptedPath.innerHTML = `<strong class="text-success me-2"">File Path:</strong><span>${decryptResult.filePath}</span>`;
      decryptedPath.setAttribute("data-path", decryptResult.filePath);

      decryptInputContainer.classList.add("d-none");
      deleteFileAfterDecryptContainer.classList.add("d-none");
      keyFcContainer.classList.add("d-none");
      ivFcContainer.classList.add("d-none");
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

function getElements() {
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
  };
}
