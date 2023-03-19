import { compareSync, hashSync } from 'bcryptjs';
import * as SqliteDatabase from 'better-sqlite3';
import { decryptPlainText, encryptPlainText } from './../encryption';

export class NKriptRepo {
  private locked = false;
  private masterPassword: string | undefined;

  constructor(defaultMasterPassword: string) {
    const db = this.connectToDatabase();

    db
      .prepare(
        `CREATE TABLE IF NOT EXISTS masterPassword (
                  id INT PRIMARY KEY,
                  passwordHash  TEXT NOT NULL,
                  updatedOn TEXT NOT NULL,
                  hint TEXT,
                  expiresOn TEXT)`
      )
      .run();



    if (this.getMasterPassword() === undefined) {
      console.log('Seeding default master password!');
      db
        .prepare(
          `INSERT INTO masterPassword 
                (id, passwordHash, updatedOn, hint,  expiresOn) 
                VALUES (@id, @passwordHash, @updatedOn, @hint, @expiresOn)`
        )
        .run({ id: 1, passwordHash: this.hashPassword(defaultMasterPassword), updatedOn: new Date().toUTCString(), hint: null, expiresOn: null });
    }

    db
      .prepare(
        `CREATE TABLE IF NOT EXISTS secrets (
                  displayName  TEXT NOT NULL,
                  createdOn TEXT NOT NULL,
                  algorithm  TEXT NOT NULL,
                  keyHash  TEXT NOT NULL,
                  ivHash  TEXT NOT NULL,
                  filePath TEXT)`
      )
      .run();

    db.close();

    return this;
  }

  public lock(): void {
    this.masterPassword = undefined;
    this.locked = false;
  }

  public unlock(masterPassword: string): void {
    if (!this.isValidMasterPassword(masterPassword)) {
      throw new Error('Invalid master password.');
    }

    this.masterPassword = masterPassword;
  }

  public updateMasterPassword(oldPassword: string, newPassword: string): MasterPassword {
    this.ensureUnlocked();

    const db = this.connectToDatabase();

    if (!this.isValidMasterPassword(oldPassword)) {
      throw new Error('Old password is not valid');
    }
    db.prepare('UPDATE masterPassword SET passwordHash = @passwordHash, updatedOn = @now WHERE id = 1').run({ passwordHash: this.hashPassword(newPassword), now: new Date().toUTCString() });

    const password = this.getMasterPassword();

    db.close()

    return password;
  }

  /**
   * Adds a secret to the databse, encrypting its keyn and iv using the master password.
   * @param displayName A user friendly display name for the kept secret.
   * @param algorithm The algorithm used to encrypt the file this key is for.
   * @param keyHash The key to store (will be encrypted using master password).
   * @param ivHash The iv to store (will be encrypted using master password).
   * @param filePath The output path of the encrypted file.
   * @returns An reference to the NKript repo.
   */
  public addSecret(displayName: string, algorithm: string, keyHash: string, ivHash: string, filePath: string = null): NKriptRepo {
    this.ensureUnlocked();

    const db = this.connectToDatabase();

    db
      .prepare(
        `INSERT INTO secrets
            (displayName, createdOn, algorithm, keyHash, ivHash, filePath) VALUES
            (@displayName, @createdOn, @algorithm, @keyHash, @ivHash, @filePath)`
      )
      .run({ displayName, createdOn: new Date().toUTCString(), algorithm, keyHash: encryptPlainText(keyHash, this.masterPassword), ivHash: encryptPlainText(ivHash, this.masterPassword), filePath });

    db.close();

    return this;
  }

  /**
   *
   * @param id Get a secret by its id.
   * @param decrypt Whether or not to decrypt the encrypted values of this secret. (Defaults to false).
   * @returns Secret | undefined
   */
  public getSecret(id: number, decrypt = false): Secret | undefined {
    this.ensureUnlocked();

    const db = this.connectToDatabase();

    const secret = db.prepare('SELECT rowId as id, displayName, createdOn, algorithm, keyHash, ivHash, filePath FROM secrets WHERE rowId = @id').get({ id }) as Secret | undefined;

    secret.keyHash = decrypt ? decryptPlainText(secret.keyHash, this.masterPassword) : '**********';
    secret.ivHash = decrypt ? decryptPlainText(secret.ivHash, this.masterPassword) : '**********';

    db.close();

    return secret;
  }

  /**
 * Delete a secret by its id.
 * @param id The id of the secret to delete.
 */
  public deleteSecret(id: number): void {
    this.ensureUnlocked();

    const db = this.connectToDatabase();

    db.prepare('DELETE FROM secrets WHERE rowId = @id').run({ id });

    db.close();
  }

  /**
   * Gets all the secrets stored in the databse.
   * @param decrypt Whether or not to decrypt the encrypted values of this secrets. (Defaults to false).
   * @returns Secret[]
   */
  public getSecrets(decrypt = false): Secret[] {
    this.ensureUnlocked();

    const db = this.connectToDatabase();

    const secrets = db.prepare('SELECT rowId as id, displayName, createdOn, algorithm, keyHash, ivHash, filePath FROM secrets').all() as Secret[];

    db.close();

    return secrets.map((s) => {
      s.keyHash = decrypt ? decryptPlainText(s.keyHash, this.masterPassword) : '**********';
      s.ivHash = decrypt ? decryptPlainText(s.ivHash, this.masterPassword) : '**********';
      return s;
    });
  }

  /**
   * @returns The master password for the application.
   */
  private getMasterPassword(): MasterPassword | undefined {
    const db = this.connectToDatabase();

    const password = db.prepare('SELECT passwordHash, updatedOn, hint, expiresOn FROM masterPassword WHERE id = 1').get() as MasterPassword | undefined;

    db.close();

    return password;
  }

  /**
   * Compares the provided password with the stored master password and verify if they match.
   * @param password The password to compare against the master password.
   * @returns True if the password matches, otherwise false.
   */
  private isValidMasterPassword(password: string): boolean {
    const masterPassword = this.getMasterPassword();
    if (masterPassword === undefined) {
      return false;
    }

    return compareSync(password, masterPassword.passwordHash);
  }

  private ensureUnlocked(): void {
    if (this.locked || this.masterPassword === undefined) {
      throw new Error('Repo is in a locked state! Unlock the repo via the open method and provide a valid master password.');
    }
  }

  private connectToDatabase() {
    return new SqliteDatabase('./nkript.db', { fileMustExist: false });
  }

  private hashPassword = (password: string, rounds = 14) => hashSync(password, rounds);
}
