import { compareSync, hashSync } from 'bcryptjs';
import * as SqliteDatabase from 'better-sqlite3';
import { safeStorage } from 'electron';
import * as jwt from 'jsonwebtoken';
import * as uuidv4 from 'uuidv4';
import { decryptPlainText, encryptPlainText, randomHexKey } from './../encryption';
const DEFAULT_MASTER_PASSWORD = 'SteamyAvoAndBakedBroccoliIsGood';

export class NKriptRepo {
  private locked = false;
  private accessTokenSigningKey: Buffer | undefined = undefined;
  private refreshTokenSigningKey: Buffer | undefined = undefined;
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
        .run({ id: uuidv4.uuid(), passwordHash: this.hashPassword(DEFAULT_MASTER_PASSWORD), updatedOn: this.utcNow, hint: null, expiresOn: null });
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

  /**
   * Validate the provided password against what we have in the master password tables. The master password is stored and used.
   * @param masterPassword 
   * @returns A JWT access token vaid for 1 minute
   */
  public authenticate(masterPassword: string): string {
    // validate if master password is correct using bcrypt
    if (!this.isValidMasterPassword(masterPassword)) {
      throw new Error('Invalid master password.');
    }


    // this.generateRefreshToken();

    return this.generateAccessToken();
  }

  // public refreshToken() {
  //   const refreshToken = session.defaultSession.cookies.get({})
  //   const payload = jwt.verify(accessToken, JWT_SECRET_KEY);
  //   if (!payload) throw new Error("Invalid access token");
  //   console.log(payload);

  //   if () {

  //   }
  // }

  // public revokeToken() {

  // }


  public updateMasterPassword(accessToken: string, oldPassword: string, newPassword: string): MasterPassword {
    const db = this.connectToDatabase(accessToken);

    if (!this.isValidMasterPassword(oldPassword)) {
      throw new Error('Old password is not valid');
    }
    db.prepare('UPDATE masterPassword SET id = @id, passwordHash = @passwordHash, updatedOn = @now WHERE id = 1').run({ id: uuidv4.uuid(), passwordHash: this.hashPassword(newPassword), now: this.utcNow });

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
  public addSecret(accessToken: string, displayName: string, algorithm: string, keyHash: string, ivHash: string, filePath: string = null): NKriptRepo {
    const db = this.connectToDatabase(accessToken);

    db
      .prepare(
        `INSERT INTO secrets
            (displayName, createdOn, algorithm, keyHash, ivHash, filePath) VALUES
            (@displayName, @createdOn, @algorithm, @keyHash, @ivHash, @filePath)`
      )
      .run({ displayName, createdOn: this.utcNow, algorithm, keyHash: encryptPlainText(keyHash, this.masterPassword), ivHash: encryptPlainText(ivHash, this.masterPassword), filePath });

    db.close();

    return this;
  }

  /**
   *
   * @param id Get a secret by its id.
   * @param decrypt Whether or not to decrypt the encrypted values of this secret. (Defaults to false).
   * @returns Secret | undefined
   */
  public getSecret(accessToken: string, id: number, decrypt = false): Secret | undefined {
    const db = this.connectToDatabase(accessToken);

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
  public deleteSecret(accessToken: string, id: number): void {
    const db = this.connectToDatabase(accessToken);

    db.prepare('DELETE FROM secrets WHERE rowId = @id').run({ id });

    db.close();
  }

  /**
   * Gets all the secrets stored in the databse.
   * @param decrypt Whether or not to decrypt the encrypted values of this secrets. (Defaults to false).
   * @returns Secret[]
   */
  public getSecrets(accessToken: string, decrypt = false): Secret[] {
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
    const db = this.connectToDatabase(accessToken);

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
    if (safeStorage.isEncryptionAvailable()) {
      this.accessTokenSigningKey = safeStorage.encryptString(randomHexKey());
    }

    return jwt.sign({
      time: this.utcNow,
      masterPasswordId: this.getMasterPassword().id
    }, safeStorage.decryptString(this.accessTokenSigningKey), { expiresIn: 600000 });
  }

  private generateRefreshToken() {
    if (safeStorage.isEncryptionAvailable()) {
      this.refreshTokenSigningKey = safeStorage.encryptString(randomHexKey());
    }

    return jwt.sign({
      time: this.utcNow,
      masterPasswordId: this.getMasterPassword().id
    }, safeStorage.decryptString(this.refreshTokenSigningKey), { expiresIn: 60000 });
  }

  private validateAccessToken(accessToken: string) {
    const payload = jwt.verify(accessToken, safeStorage.decryptString(this.accessTokenSigningKey));
    if (!payload || (payload as any).masterPasswordId !== this.getMasterPassword().id) throw new Error("Invalid access token");
  }

  private connectToDatabase(accessToken: string) {
    this.validateAccessToken(accessToken);
    return new SqliteDatabase('./nkript.db');
  }

  private hashPassword = (password: string, rounds = 14) => hashSync(password, rounds);
}
