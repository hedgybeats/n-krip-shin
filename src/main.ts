/* eslint-disable @typescript-eslint/no-var-requires */
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import {
  handleEncryptFile,
  handleDecryptFile,
  getAvailableCiphers,
  cipherRequiresIv,
} from "./encryption";
import { shell } from "electron";
import { compileHandlebarsTemplate } from "./templating";
import * as Database from"better-sqlite3";
const db = new Database("src/nkript.db");
db.pragma("journal_mode = WAL");

// let key = "SteamyAvoAndBakedBroccoliIsGood!";

// key = createHash("sha256").update(key).digest("base64").substring(0, 33);
// console.log(key);

// const appDir = dirname(require.main.filename);

// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const bcrypt = require("bcrypt");
// const noDb = !existsSync("src/app.db");

// db.prepare(
//   `CREATE TABLE IF NOT EXISTS secrets (
//     displayName  TEXT PRIMARY KEY,
//     createdOn TEXT NOT NULL,
//     algorithm  TEXT NOT NULL,
//     keyHash  TEXT NOT NULL,
//     ivHash  TEXT NOT NULL,
//     filePath TEXT)`

// ).run();

// db.prepare(
//     `INSERT INTO secrets 
//      (displayName, createdOn, algorithm, key, iv, filePath) 
//      (@displayName, @createdOn, @algorithm, @key, @iv, @filePath)`
//   )
//   .run('LMS PROD backup','2022-02-02 10:50','aes-256-cbc','6516514459854984984984','56165151451', 'C:\\uhguyg\\uyg');

//   const secret= db.prepare('SELECT displayName, createdOn,algorithm, keyHash, ivHash, filePath FROM secrets').get();

//   console.log(secret);

// db.close();

// if (noDb) {
//   console.log("Encrypting database");
//   encryptFileStream(
//     "aes-256-cbc",
//     join(appDir, "src/app.db"),
//     undefined,
//     undefined,
//     true
//   );
// }

// setTimeout(() => {
//   // decryptFileStream(
//   //   "aes-256-cbc",
//   //   join(appDir, "src/app.db"),
//   //   undefined,
//   //   undefined,
//   //   true
//   // );

//     db.each(
//     "SELECT rowid AS id, name, keyHash, ivHash FROM secrets",
//     (err, row) => {
//       console.log(row.id + ": " + row.info);
//     }
//   );
// }, 10000);

// const bcryptHash = async (password: string, saltRounds = 10) =>
//   new Promise((resolve, reject) => {
//     bcrypt.hash(password, saltRounds, function (err: unknown, hash: string) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(hash);
//       }
//     });
//   });

// const addSecretToDb = async (
//   secretName: string,
//   key: string,
//   hash: string,
//   secretPassword: string
// ) => {
//   const keyHash = await bcryptHash(secretPassword);

//   const stmt = db.prepare("INSERT INTO secrets VALUES (?, ?, ?)");
//   stmt.run(secretName, secretPassword);
//   stmt.finalize();
// };

// required to stop app opening up twice when installing via squirel
if (require("electron-squirrel-startup")) app.quit();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
    icon: "src/assets/icons/icon.ico",
    autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(join(__dirname, "../index.html"));
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle("compileHandlebarsTemplate", (_, args) =>
    compileHandlebarsTemplate(args[0], args[1])
  );
  ipcMain.handle("decryptFile", handleDecryptFile);
  ipcMain.handle("encryptFile", handleEncryptFile);
  ipcMain.handle("showItemInFolder", (_, args) =>
    shell.showItemInFolder(args[0])
  );
  ipcMain.handle("getAvailableCiphers", () => getAvailableCiphers());
  ipcMain.handle("cipherRequiresIv", (_, args) => cipherRequiresIv(args[0]));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

//TODO Allow for a folder to be encrypted as a feature
//TODO Investigate progress bar for large files
//TODO Secret vault with a master password
//TODO save to vault shortcut
// NOT POSSIBLE TO RESTORE IF MASTER PASSWORD LOST!!!!!!!!!!
// i want to allow user to select a master password if the app is run for thge first time
// i want the app to then encrypt the secret db using that password
// i will store a bcrypthash of the master password in the masterpassword table of a separate un-encrypted database

// everytime the user needs  to access the db,
// we will ask for the master password from the uncencrypted table,
// then need to check if supplied password is match. if not show error.

// if match, decrypt secret db decrypted, then read/write data and encrypt again when done
// maybe allow for rescure email on creation so that if master password is lost then an email can get sent to the email

//  const userKey = window.prompt(
// "Enter a master password for storing secrets. (max 32 characters)",
//  "SteamyAvoAndBakedBroccoliIsGood!"
//);
