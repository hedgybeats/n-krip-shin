import { compareSync, hashSync } from 'bcryptjs';
import * as SqliteDatabase from 'better-sqlite3';
import { safeStorage } from 'electron';
import * as os from 'os';
import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import { decryptPlainText, encryptPlainText, randomHexKey } from './encryption';
const DEFAULT_MASTER_PASSWORD = 'SteamyAvoAndBakedBroccoliIsGood';
const SELECT_ALL_SECRETS_SQL = 'SELECT rowId as id, displayName, createdOn, algorithm, keyMasterHash, keySessionHash, ivMasterHash, ivSessionHash, filePath FROM secrets';

export class NKriptRepo {
  private accessTokenSigningKey: Buffer | null = null;
  private accessTokenRandomIssuer: Buffer | null = null;

  private _sessionKeySubstringSegments: Buffer | null = null;
  private get sessionKeySubstringSegments(): string[] {
    return safeStorage.decryptString(this._sessionKeySubstringSegments).split(',');
  }
  private set sessionKeySubstringSegments(segments: string[]) {
    this._sessionKeySubstringSegments = safeStorage.encryptString(segments.join(','));
  }

  private _sessionIvSubstringSegments: Buffer | null = null;
  private get sessionIvSubstringSegments(): string[] {
    return safeStorage.decryptString(this._sessionIvSubstringSegments).split(',');
  }
  private set sessionIvSubstringSegments(segments: string[]) {
    this._sessionIvSubstringSegments = safeStorage.encryptString(segments.join(','));
  }

  private get utcNow() {
    return new Date().toUTCString();
  }

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

    this.sessionKeySubstringSegments = [
      this.randomNumberFromInterval(0, 33).toString(),
      this.randomNumberFromInterval(34, 67).toString(),
      this.randomNumberFromInterval(68, 100).toString()
    ];

    this.sessionIvSubstringSegments = [
      this.randomNumberFromInterval(0, 33).toString(),
      this.randomNumberFromInterval(34, 67).toString(),
      this.randomNumberFromInterval(68, 100).toString()
    ];

    const db = this.connectToDatabase(accessToken);

    const allSecrets = db.prepare(SELECT_ALL_SECRETS_SQL).all() as Secret[];
    allSecrets.forEach(secret => {
      db.prepare('UPDATE secrets SET keySessionHash = @keySessionHash, ivSessionHash = @ivSessionHash WHERE rowId = @id')
        .run(
          {
            id: secret.id,
            keySessionHash: encryptPlainText(decryptPlainText(secret.keyMasterHash, masterPassword), this.stripPartsFromAccessToken(accessToken, this.sessionKeySubstringSegments[0], this.sessionKeySubstringSegments[1], this.sessionKeySubstringSegments[2])),
            ivSessionHash: encryptPlainText(decryptPlainText(secret.ivMasterHash, masterPassword), this.stripPartsFromAccessToken(accessToken, this.sessionIvSubstringSegments[0], this.sessionIvSubstringSegments[1], this.sessionIvSubstringSegments[2]))
          });
    });

    console.log(`Hashed ${allSecrets.length} secrets for the current session. The current session token expires in 1 minutes.`);

    return accessToken;
  }

  public endSession() {
    this.removeSessionData();
    this.accessTokenSigningKey = null;
    this.accessTokenRandomIssuer = null;
    this._sessionKeySubstringSegments = null;
    this._sessionIvSubstringSegments = null;
  }

  public removeSessionData() {
    const db = new SqliteDatabase('./nkript.db');

    const allSecrets = db.prepare(SELECT_ALL_SECRETS_SQL + ' WHERE keySessionHash IS NOT NULL OR ivSessionHash IS NOT NULL').all() as Secret[];
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
          keySessionHash: encryptPlainText(key, this.stripPartsFromAccessToken(accessToken, this.sessionKeySubstringSegments[0], this.sessionKeySubstringSegments[1], this.sessionKeySubstringSegments[2])),
          ivSessionHash: encryptPlainText(iv, this.stripPartsFromAccessToken(accessToken, this.sessionIvSubstringSegments[0], this.sessionIvSubstringSegments[1], this.sessionIvSubstringSegments[2])),
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
      key: decryptPlainText(secret.keySessionHash, this.stripPartsFromAccessToken(accessToken, this.sessionKeySubstringSegments[0], this.sessionKeySubstringSegments[1], this.sessionKeySubstringSegments[2])),
      iv: decryptPlainText(secret.ivSessionHash, this.stripPartsFromAccessToken(accessToken, this.sessionIvSubstringSegments[0], this.sessionIvSubstringSegments[1], this.sessionIvSubstringSegments[2])),
      filePath: secret.filePath
    };
  }

  public deleteSecret(id: number, accessToken: string): void {
    const db = this.connectToDatabase(accessToken);

    db.prepare('DELETE FROM secrets WHERE rowId = @id').run({ id });

    db.close();
  }

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

  private getMasterPassword(): MasterPassword | undefined {
    const db = new SqliteDatabase('./nkript.db');

    const password = db.prepare('SELECT id, passwordHash, updatedOn, hint, expiresOn FROM masterPassword').get() as MasterPassword | undefined;

    db.close();

    return password;
  }

  private isValidMasterPassword(password: string): boolean {
    const masterPassword = this.getMasterPassword();
    if (masterPassword === undefined) {
      return false;
    }

    return compareSync(password, masterPassword.passwordHash);
  }

  private generateAccessToken() {
    this.accessTokenSigningKey = safeStorage.encryptString(randomHexKey());
    this.accessTokenRandomIssuer = safeStorage.encryptString(randomHexKey(16));

    return jwt.sign({
      time: this.utcNow,
      masterPasswordId: this.getMasterPassword().id
    }, safeStorage.decryptString(this.accessTokenSigningKey), { expiresIn: '1m', issuer: safeStorage.decryptString(this.accessTokenRandomIssuer) });
  }

  private validateAccessToken(accessToken: string) {
    if (this.accessTokenSigningKey === null) throw new Error('A session must first be started via the authenticate function by providing the master password.');

    const payload = jwt.verify(accessToken, safeStorage.decryptString(this.accessTokenSigningKey), { issuer: safeStorage.decryptString(this.accessTokenRandomIssuer) });

    console.log(payload);

    if (!payload || (payload as any).masterPasswordId !== this.getMasterPassword().id) throw new Error("Invalid access token");
  }

  private connectToDatabase(accessToken: string) {
    this.validateAccessToken(accessToken);
    return new SqliteDatabase('./nkript.db');
  }

  private stripPartsFromAccessToken(accessToken: string, initial: string, middle: string, final: string) {
    return accessToken.substring(parseInt(initial, 10), parseInt(initial, 10) + 10) +
      accessToken.substring(parseInt(middle, 10), parseInt(middle, 10) + 10) +
      accessToken.substring(parseInt(final, 10), parseInt(final, 10) + 12);
  }

  private hashPassword = (password: string, rounds = 14) => hashSync(password, rounds);

  private randomNumberFromInterval = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
}
