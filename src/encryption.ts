import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export const encryptFile = (
  buffer: Buffer
): { key: string; iv: string; file: Buffer } => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);

  return {
    key: key.toString("hex"),
    iv: iv.toString("hex"),
    file: Buffer.concat([cipher.update(buffer), cipher.final()]),
  };
};

export const decryptFile = (
  encrypted: Buffer,
  key: string,
  iv: string
): Buffer => {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

export const handleEncryptFile = async (
  event: Electron.IpcMainInvokeEvent,
  args: (string | boolean)[]
): Promise<{ file: Buffer; filePath: string; key: string; iv: string }> => {
  const filePathToEncrypt = args[0] as string;
  const deleteOriginalFile = args[1] as boolean;

  if (filePathToEncrypt.trim().length === 0) {
    throw new Error("Inavlid filePath!");
  }

  const filePathArr = filePathToEncrypt.split("\\");
  const nameOfFileToEncrypt = filePathArr.pop();
  const ext = nameOfFileToEncrypt.split(".").pop();
  const outputPath = filePathArr.join("\\");

  const fileData = await readFileAsync(filePathToEncrypt);
  const { key, file, iv } = encryptFile(fileData);

  //   await makeDirectoryAsync(outputPath);
  const outputFilePath = path.join(
    outputPath,
    nameOfFileToEncrypt + "(encrypted)." + ext
  );
  await writeFileAsync(outputFilePath, file);

  if (deleteOriginalFile) {
    await deleteFileAsync(filePathToEncrypt);
  }

  return { key, iv, file, filePath: outputFilePath };
};

export const handleDecryptFile = async (
  event: Electron.IpcMainInvokeEvent,
  args: (string | boolean)[]
): Promise<{ file: Buffer; filePath: string }> => {
  const filePathToDecrypt = args[0] as string;
  const decryptKey = args[1] as string;
  const decryptIv = args[2] as string;
  const deleteOriginalFile = args[3] as boolean;

  if (filePathToDecrypt.trim().length === 0) {
    throw new Error("Inavlid filePath!");
  }

  const filePathArr = filePathToDecrypt.split("\\");
  const nameOfFileToEncrypt = filePathArr.pop();
  const ext = nameOfFileToEncrypt.split(".").pop();
  const outputPath = filePathArr.join("\\");

  const fileData = await readFileAsync(filePathToDecrypt);
  const file = decryptFile(fileData, decryptKey, decryptIv);

  //   await makeDirectoryAsync(outputPath);
  const outputFilePath = path.join(
    outputPath,
    nameOfFileToEncrypt + "(decrypted)." + ext
  );

  await writeFileAsync(outputFilePath, file);

  if (deleteOriginalFile) {
    await deleteFileAsync(filePathToDecrypt);
  }

  return { file, filePath: outputFilePath };
};

export const readFileAsync = async (filePath: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });

export const writeFileAsync = async (
  filePath: string,
  file: Buffer,
  attempt = 0,
  newFilePathAttempt?: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    newFilePathAttempt =
      newFilePathAttempt === undefined ? filePath : newFilePathAttempt;

    fs.writeFile(newFilePathAttempt, file, { flag: "wx" }, async (err) => {
      if (err) {
        if (err.code === "EEXIST") {
          attempt++;
          const arr = filePath.split(".");
          const ext = arr.pop();
          const newName = arr.join(".") + `(${attempt})` + `.${ext}`;
          console.log("File exisits. trying again with new name", newName);
          await writeFileAsync(filePath, file, attempt, newName);
        } else {
          reject(err);
        }
      }
      resolve();
    });
  });

export const deleteFileAsync = async (filePath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

export const makeDirectoryAsync = async (
  directory: string,
  recursive = true
): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.mkdir(directory, { recursive }, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
