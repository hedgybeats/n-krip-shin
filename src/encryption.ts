import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { createReadStream, createWriteStream, unlink } from "fs";
import { pipeline } from "stream/promises";
import { join } from "path";
import { performance } from "perf_hooks";
import { Decryptionresult, Encryptionresult } from "./types/renderer";

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

const deleteFileAsync = async (filePath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    unlink(filePath, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

const getIncrementalFileName = (filePath: string, attempt: number) => {
  const arr = filePath.split(".");
  const ext = arr.pop();
  return arr.join(".") + `(${attempt})` + `.${ext}`;
};

const generateOutFilePath = (
  filePath: string,
  type: "decrypted" | "encrypted"
): string => {
  const filePathArr = filePath.split("\\");
  const fileNameArr = filePathArr.pop().split(".");
  const ext = fileNameArr.pop();
  const nameOfOutFile = fileNameArr.join(".");
  const outputPath = filePathArr.join("\\");
  return join(outputPath, nameOfOutFile + `(${type}).` + ext);
};

const encryptFileStream = async (
  filePath: string,
  attempt = 0,
  outFilePath?: string
): Promise<Encryptionresult> => {
  if (outFilePath == undefined) {
    outFilePath = generateOutFilePath(filePath, "encrypted");
  }

  const key = randomBytes(32);
  const iv = randomBytes(16);

  const res = await new Promise<Encryptionresult | NodeJS.ErrnoException>(
    (resolve) => {
      pipeline(
        createReadStream(filePath),
        createCipheriv("aes-256-cbc", Buffer.from(key), iv),
        createWriteStream(outFilePath, { flags: "wx" })
      )
        .then(() =>
          resolve({
            key: key.toString("hex"),
            iv: iv.toString("hex"),
            filePath: outFilePath,
            duration: 0,
          })
        )
        .catch((err) => resolve(err));
    }
  );

  if (isEncryptionResult(res)) {
    return res;
  }

  // is an error
  if (res.code === "EEXIST") {
    attempt++;
    const newName = getIncrementalFileName(outFilePath, attempt);
    console.log("File exisits. Trying again with new name", newName);
    return await encryptFileStream(filePath, attempt, newName);
  }

  throw res;
};

const decryptFileStream = async (
  key: string,
  iv: string,
  filePath: string,
  attempt = 0,
  outFilePath?: string
): Promise<Decryptionresult> => {
  if (outFilePath == undefined) {
    outFilePath = generateOutFilePath(filePath, "decrypted");
  }

  const res = await new Promise<Decryptionresult | NodeJS.ErrnoException>(
    (resolve) => {
      pipeline(
        createReadStream(filePath),
        createDecipheriv(
          "aes-256-cbc",
          Buffer.from(key, "hex"),
          Buffer.from(iv, "hex")
        ),
        createWriteStream(outFilePath, { flags: "wx" })
      )
        .then(() =>
          resolve({
            filePath: outFilePath,
            duration: 0,
          })
        )
        .catch((err) => resolve(err));
    }
  );

  if (isDecryptionResult(res)) {
    return res;
  }

  // is an error
  if (res.code === "EEXIST") {
    attempt++;
    const newName = getIncrementalFileName(outFilePath, attempt);
    console.log("File exisits. Trying again with new name", newName);
    return await encryptFileStream(filePath, attempt, newName);
  }

  throw res;
};

export const handleEncryptFile = async (
  _: Electron.IpcMainInvokeEvent,
  args: (string | boolean)[]
): Promise<Encryptionresult> => {
  const start = performance.now();

  const filePathToEncrypt = args[0] as string;
  const deleteOriginalFile = args[1] as boolean;

  if (filePathToEncrypt.trim().length === 0) {
    throw new Error("Inavlid filePath!");
  }

  const encryptionResult = await encryptFileStream(filePathToEncrypt);

  if (deleteOriginalFile) {
    await deleteFileAsync(filePathToEncrypt);
  }

  const end = performance.now();

  encryptionResult.duration = end - start;

  return encryptionResult;
};

export const handleDecryptFile = async (
  _: Electron.IpcMainInvokeEvent,
  args: (string | boolean)[]
): Promise<Decryptionresult> => {
  const start = performance.now();

  const filePathToDecrypt = args[0] as string;
  const decryptKey = args[1] as string;
  const decryptIv = args[2] as string;
  const deleteOriginalFile = args[3] as boolean;

  if (filePathToDecrypt.trim().length === 0) {
    throw new Error("Inavlid filePath!");
  }

  const res = await decryptFileStream(decryptKey, decryptIv, filePathToDecrypt);

  if (deleteOriginalFile) {
    await deleteFileAsync(filePathToDecrypt);
  }

  const end = performance.now();

  res.duration = end - start;
  return res;
};
