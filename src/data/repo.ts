import { compareSync, hashSync } from 'bcryptjs';
import * as SqliteDatabase from 'better-sqlite3';
import { safeStorage } from 'electron';
import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import { decryptPlainText, encryptPlainText, randomHexKey } from './../encryption';
const DEFAULT_MASTER_PASSWORD = 'SteamyAvoAndBakedBroccoliIsGood';
const SELECT_ALL_SECRETS_SQL = 'SELECT rowId as id, displayName, createdOn, algorithm, keyMasterHash, keySessionHash, ivMasterHash, ivSessionHash, filePath FROM secrets';

export class NKriptRepo {
  private accessTokenSigningKey: Buffer | null = null;
  private sessionKeySubstringStart: number | null = null;
  private sessionIvSubstringStart: number | null = null;
  private get utcNow() {
    return new Date().toUTCString();
  }

  /**
   * Scaffold the MasterPassword and Secrets tables if they do not exist. Add the default master password if it doesnt exist.
   */
  constructor() {
    const db = new SqliteDatabase('./nkript.db');

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
      db
        .prepare(
          `INSERT INTO masterPassword 
                (id, passwordHash, updatedOn, hint,  expiresOn) 
                VALUES (@id, @passwordHash, @updatedOn, @hint, @expiresOn)`
        )
        .run({ id: uuid.v4(), passwordHash: this.hashPassword(DEFAULT_MASTER_PASSWORD), updatedOn: this.utcNow, hint: null, expiresOn: null });
    }

    db
      .prepare(
        `CREATE TABLE IF NOT EXISTS secrets (
                  displayName  TEXT NOT NULL,
                  createdOn TEXT NOT NULL,
                  algorithm  TEXT NOT NULL,
                  keyMasterHash  TEXT NOT NULL,
                  ivMasterHash  TEXT NOT NULL,
                  keySessionHash  TEXT,
                  ivSessionHash  TEXT,
                  filePath TEXT)`
      )
      .run();

    db.close();

    return this;
  }


  public startSession(masterPassword: string): string {
    if (!this.isValidMasterPassword(masterPassword)) throw new Error('Invalid master password.');

    if (!safeStorage.isEncryptionAvailable()) throw new Error('Safe Storage is not available.');

    const accessToken = this.generateAccessToken();

    // set to random number between 0 and 100
    this.sessionKeySubstringStart = Math.floor(Math.random() * 101);
    console.log(this.sessionKeySubstringStart);

    // set to random number between 0 and 100
    this.sessionIvSubstringStart = Math.floor(Math.random() * 101);
    console.log(this.sessionIvSubstringStart);

    const db = this.connectToDatabase(accessToken);

    const allSecrets = db.prepare(SELECT_ALL_SECRETS_SQL).all() as Secret[];
    allSecrets.forEach(secret => {
      db.prepare('UPDATE secrets SET keySessionHash = @keySessionHash, ivSessionHash = @ivSessionHash WHERE rowId = @id')
        .run(
          {
            id: secret.id,
            keySessionHash: encryptPlainText(decryptPlainText(secret.keyMasterHash, masterPassword), accessToken.substring(this.sessionKeySubstringStart, this.sessionKeySubstringStart + 32)),
            ivSessionHash: encryptPlainText(decryptPlainText(secret.ivMasterHash, masterPassword), accessToken.substring(this.sessionIvSubstringStart, this.sessionIvSubstringStart + 32))
          });
    });

    return accessToken;
  }

  public endSession() {
    this.removeSessionData();
    this.accessTokenSigningKey = null;
    this.sessionKeySubstringStart = null;
    this.sessionIvSubstringStart = null;
  }

  public removeSessionData() {
    const db = new SqliteDatabase('./nkript.db');

    const allSecrets = db.prepare(SELECT_ALL_SECRETS_SQL).all() as Secret[];
    allSecrets.forEach(secret => {
      db.prepare('UPDATE secrets SET keySessionHash = NULL, ivSessionHash = NULL WHERE rowId = @id')
        .run(
          {
            id: secret.id
          });
    });

    console.log(`Removed session hashes for ${allSecrets.length} secrets.`);
  }

  public updateMasterPassword(accessToken: string, oldPassword: string, newPassword: string): MasterPassword {
    const db = this.connectToDatabase(accessToken);

    if (!this.isValidMasterPassword(oldPassword)) {
      throw new Error('Old password is not valid');
    }

    db.prepare('UPDATE masterPassword SET id = @id, passwordHash = @passwordHash, updatedOn = @now').run({ id: uuid.v4(), passwordHash: this.hashPassword(newPassword), now: this.utcNow });

    const password = this.getMasterPassword();

    db.close()

    return password;
  }

  public addSecret(masterPassword: string, accessToken: string, displayName: string, algorithm: string, key: string, iv: string, filePath: string = null): void {
    const db = this.connectToDatabase(accessToken);

    db
      .prepare(
        `INSERT INTO secrets
            (displayName, createdOn, algorithm, keyMasterHash, keySessionHash, ivMasterHash, ivSessionHash, filePath) VALUES
            (@displayName, @createdOn, @algorithm, @keyMasterHash, @keySessionHash, @ivMasterHash, @ivSessionHash, @filePath)`
      )
      .run(
        {
          displayName,
          createdOn: this.utcNow,
          algorithm,
          keyMasterHash: encryptPlainText(key, masterPassword),
          ivMasterHash: encryptPlainText(iv, masterPassword),
          keySessionHash: encryptPlainText(key, accessToken.substring(this.sessionKeySubstringStart, this.sessionKeySubstringStart + 32)),
          ivSessionHash: encryptPlainText(iv, accessToken.substring(this.sessionIvSubstringStart, this.sessionIvSubstringStart + 32)),
          filePath
        });

    db.close();
  }

  public getSecret(secretId: number, accessToken: string): SecretDto | undefined {
    const db = this.connectToDatabase(accessToken);

    const secret = db.prepare('SELECT rowId as id, displayName, createdOn, algorithm, keySessionHash, ivSessionHash, filePath FROM secrets WHERE rowId = @secretId')
      .get({ secretId }) as Secret | undefined;

    db.close();

    return {
      id: secret.id,
      createdOn: secret.createdOn,
      displayName: secret.displayName,
      algorithm: secret.algorithm,
      key: decryptPlainText(secret.keySessionHash, accessToken.substring(this.sessionKeySubstringStart, this.sessionKeySubstringStart + 32)),
      iv: decryptPlainText(secret.ivSessionHash, accessToken.substring(this.sessionIvSubstringStart, this.sessionIvSubstringStart + 32)),
      filePath: secret.filePath
    };
  }

  /**
 * Delete a secret by its id.
 * @param id The id of the secret to delete.
 */
  public deleteSecret(id: number, accessToken: string): void {
    const db = this.connectToDatabase(accessToken);

    db.prepare('DELETE FROM secrets WHERE rowId = @id').run({ id });

    db.close();
  }

  /**
   * Gets all the secrets stored in the databse.
   * @param decrypt Whether or not to decrypt the encrypted values of this secrets. (Defaults to false).
   * @returns Secret[]
   */
  public getSecrets(accessToken: string): SecretDto[] {
    const db = this.connectToDatabase(accessToken);

    const secrets = db.prepare('SELECT rowId as id, displayName, createdOn, algorithm, filePath FROM secrets').all() as Secret[];

    db.close();


    return secrets.map((s) => {
      return {
        id: s.id,
        createdOn: s.createdOn,
        displayName: s.displayName,
        algorithm: s.algorithm,
        key: '**********',
        iv: '**********',
        filePath: s.filePath
      }
    });
  }

  /**
   * @returns The master password for the application.
   */
  private getMasterPassword(): MasterPassword | undefined {
    const db = new SqliteDatabase('./nkript.db');

    const password = db.prepare('SELECT id, passwordHash, updatedOn, hint, expiresOn FROM masterPassword').get() as MasterPassword | undefined;

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

  /**
   * Create a jwt token based of the id of the master password that expires in one minute. 
   * The token is signed by a random signing key each time.
   * @returns Jason Web Token
   */
  private generateAccessToken() {
    this.accessTokenSigningKey = safeStorage.encryptString(randomHexKey());

    return jwt.sign({
      time: this.utcNow,
      masterPasswordId: this.getMasterPassword().id
    }, safeStorage.decryptString(this.accessTokenSigningKey), { expiresIn: 600000 });
  }

  private validateAccessToken(accessToken: string) {
    if (this.accessTokenSigningKey === null) throw new Error('A session must first be started via the authenticate function by providing the master password.');

    const payload = jwt.verify(accessToken, safeStorage.decryptString(this.accessTokenSigningKey));
    if (!payload || (payload as any).masterPasswordId !== this.getMasterPassword().id) throw new Error("Invalid access token");
  }

  private connectToDatabase(accessToken: string) {
    this.validateAccessToken(accessToken);
    return new SqliteDatabase('./nkript.db');
  }

  private hashPassword = (password: string, rounds = 14) => hashSync(password, rounds);
}
