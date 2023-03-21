import { compareSync, hashSync } from "bcryptjs";
import * as SqliteDatabase from "better-sqlite3";
import { safeStorage } from "electron";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { decryptPlainText, encryptPlainText, randomHexKey } from "./encryption";
const DEFAULT_MASTER_PASSWORD = "SteamyAvoAndBakedBroccoliIsGood";
const SELECT_ALL_SECRETS_SQL =
  "SELECT rowId as id, displayName, createdOn, algorithm, keyMasterHash, keySessionHash, ivMasterHash, ivSessionHash, filePath FROM secrets";

export class NKriptRepo {
  private accessTokenSigningKey: Buffer | null = null;
  private accessTokenIssuer: Buffer | null = null;

  private refreshTokenSigningKey: Buffer | null = null;
  private refreshTokenIssuer: Buffer | null = null;

  private _sessionKeySubstringSegments: Buffer | null = null;
  private get sessionKeySubstringSegments(): string[] {
    return safeStorage.decryptString(this._sessionKeySubstringSegments).split(",");
  }
  private set sessionKeySubstringSegments(segments: string[]) {
    this._sessionKeySubstringSegments = safeStorage.encryptString(segments.join(","));
  }

  private _sessionIvSubstringSegments: Buffer | null = null;
  private get sessionIvSubstringSegments(): string[] {
    return safeStorage.decryptString(this._sessionIvSubstringSegments).split(",");
  }
  private set sessionIvSubstringSegments(segments: string[]) {
    this._sessionIvSubstringSegments = safeStorage.encryptString(segments.join(","));
  }

  private get utcNow() {
    return new Date().toUTCString();
  }

  private get newSqliteDb() {
    return new SqliteDatabase("./src/assets/db/nkript.db");
  }

  private get isOngoingSession() {
    return (
      this.accessTokenSigningKey !== null &&
      this.accessTokenIssuer !== null &&
      this.refreshTokenSigningKey !== null &&
      this.refreshTokenIssuer !== null
    );
  }

  constructor() {
    const db = this.newSqliteDb;

    db.prepare(
      `CREATE TABLE IF NOT EXISTS masterPassword (
                  id TEXT PRIMARY KEY,
                  passwordHash  TEXT NOT NULL,
                  updatedOn TEXT NOT NULL,
                  hint TEXT,
                  expiresOn TEXT)`
    ).run();

    if (this.getMasterPassword() === undefined) {
      db.prepare(
        `INSERT INTO masterPassword 
                (id, passwordHash, updatedOn, hint,  expiresOn) 
                VALUES (@id, @passwordHash, @updatedOn, @hint, @expiresOn)`
      ).run({
        id: uuidv4(),
        passwordHash: this.hashPassword(DEFAULT_MASTER_PASSWORD),
        updatedOn: this.utcNow,
        hint: null,
        expiresOn: null,
      });
    }

    db.prepare(
      `CREATE TABLE IF NOT EXISTS secrets (
                  displayName  TEXT NOT NULL,
                  createdOn TEXT NOT NULL,
                  algorithm  TEXT,
                  keyMasterHash  TEXT NOT NULL,
                  ivMasterHash  TEXT NOT NULL,
                  keySessionHash  TEXT,
                  ivSessionHash  TEXT,
                  filePath TEXT)`
    ).run();

    db.close();

    return this;
  }

  public startSession(masterPassword: string): VaultSessionTokens {
    if (!this.isValidMasterPassword(masterPassword)) {
      throw new Error("Invalid master password.");
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Safe Storage is not available.");
    }

    const tokens = this.generateTokens();

    //use these segments to pick out chars from the access token when encrypting session hashes
    this.sessionKeySubstringSegments = [
      this.randomNumberFromInterval(0, tokens.accessToken.length - 10).toString(),
      this.randomNumberFromInterval(0, tokens.accessToken.length - 11).toString(),
      this.randomNumberFromInterval(0, tokens.accessToken.length - 11).toString(),
    ];

    //use these segments to pick out chars from the access token when encrypting session hashes
    this.sessionIvSubstringSegments = [
      this.randomNumberFromInterval(0, tokens.accessToken.length - 10).toString(),
      this.randomNumberFromInterval(0, tokens.accessToken.length - 11).toString(),
      this.randomNumberFromInterval(0, tokens.accessToken.length - 11).toString(),
    ];

    const encryptKeyKey = this.stripPartsFromAccessToken(
      tokens.accessToken,
      this.sessionKeySubstringSegments[0],
      this.sessionKeySubstringSegments[1],
      this.sessionKeySubstringSegments[2]
    );

    const encryptIvKey = this.stripPartsFromAccessToken(
      tokens.accessToken,
      this.sessionIvSubstringSegments[0],
      this.sessionIvSubstringSegments[1],
      this.sessionIvSubstringSegments[2]
    );

    const db = this.connectToDatabase(tokens.accessToken);

    const allSecrets = db.prepare(SELECT_ALL_SECRETS_SQL).all() as Secret[];
    allSecrets.forEach((secret) => {
      db.prepare("UPDATE secrets SET keySessionHash = @keySessionHash, ivSessionHash = @ivSessionHash WHERE rowId = @id").run({
        id: secret.id,
        keySessionHash: encryptPlainText(decryptPlainText(secret.keyMasterHash, masterPassword), encryptKeyKey),
        ivSessionHash: encryptPlainText(decryptPlainText(secret.ivMasterHash, masterPassword), encryptIvKey),
      });
    });

    console.log(
      `Vault session started.
      Decrypted and re-encrypted ${allSecrets.length} secrets for the current session. 
      The current session token expires in 120 seconds.`
    );

    return tokens;
  }

  public refreshSession(oldTokens: VaultSessionTokens) {
    this.validateOngoingSession();

    this.validateToken(
      oldTokens.accessToken,
      safeStorage.decryptString(this.accessTokenSigningKey),
      safeStorage.decryptString(this.accessTokenIssuer),
      true
    );

    this.validateToken(
      oldTokens.refreshToken,
      safeStorage.decryptString(this.refreshTokenSigningKey),
      safeStorage.decryptString(this.refreshTokenIssuer)
    );

    const newTokens = this.generateTokens();

    const decryptKeyKey = this.stripPartsFromAccessToken(
      oldTokens.accessToken,
      this.sessionKeySubstringSegments[0],
      this.sessionKeySubstringSegments[1],
      this.sessionKeySubstringSegments[2]
    );

    const decryptIvKey = this.stripPartsFromAccessToken(
      oldTokens.accessToken,
      this.sessionIvSubstringSegments[0],
      this.sessionIvSubstringSegments[1],
      this.sessionIvSubstringSegments[2]
    );

    this.sessionKeySubstringSegments = [
      this.randomNumberFromInterval(0, newTokens.accessToken.length - 10).toString(),
      this.randomNumberFromInterval(0, newTokens.accessToken.length - 11).toString(),
      this.randomNumberFromInterval(0, newTokens.accessToken.length - 11).toString(),
    ];

    this.sessionIvSubstringSegments = [
      this.randomNumberFromInterval(0, newTokens.accessToken.length - 10).toString(),
      this.randomNumberFromInterval(0, newTokens.accessToken.length - 11).toString(),
      this.randomNumberFromInterval(0, newTokens.accessToken.length - 11).toString(),
    ];

    const ecnryptKeyKey = this.stripPartsFromAccessToken(
      newTokens.accessToken,
      this.sessionKeySubstringSegments[0],
      this.sessionKeySubstringSegments[1],
      this.sessionKeySubstringSegments[2]
    );

    const ecnryptIvKey = this.stripPartsFromAccessToken(
      newTokens.accessToken,
      this.sessionIvSubstringSegments[0],
      this.sessionIvSubstringSegments[1],
      this.sessionIvSubstringSegments[2]
    );

    const db = this.connectToDatabase(newTokens.accessToken);

    const allSecrets = db.prepare(SELECT_ALL_SECRETS_SQL).all() as Secret[];
    allSecrets.forEach((secret) => {
      db.prepare("UPDATE secrets SET keySessionHash = @keySessionHash, ivSessionHash = @ivSessionHash WHERE rowId = @id").run({
        id: secret.id,
        keySessionHash: encryptPlainText(decryptPlainText(secret.keySessionHash, decryptKeyKey), ecnryptKeyKey),
        ivSessionHash: encryptPlainText(decryptPlainText(secret.ivSessionHash, decryptIvKey), ecnryptIvKey),
      });
    });

    console.log(
      `Vault session refreshed.\n
       Decrypted and re-encrypted ${allSecrets.length} secrets for the new session.\n
       The new session token expires in 120 seconds.`
    );

    return newTokens;
  }

  public endSession() {
    this.accessTokenSigningKey = null;
    this.refreshTokenSigningKey = null;
    this.accessTokenIssuer = null;
    this.refreshTokenIssuer = null;
    this._sessionKeySubstringSegments = null;
    this._sessionIvSubstringSegments = null;
    this.removeSessionData();
  }

  public updateMasterPassword(oldPassword: string, newPassword: string): void {
    const db = this.newSqliteDb;

    if (!this.isValidMasterPassword(oldPassword)) {
      throw new Error("Old password is not valid");
    }

    db.prepare("UPDATE masterPassword SET id = @id, passwordHash = @passwordHash, updatedOn = @now").run({
      id: uuidv4(),
      passwordHash: this.hashPassword(newPassword),
      now: this.utcNow,
    });

    // re-encrypt all secrets with new master password
    const allSecrets = db.prepare(SELECT_ALL_SECRETS_SQL).all() as Secret[];
    allSecrets.forEach((secret) => {
      db.prepare("UPDATE secrets SET keyMasterHash = @keyMasterHash, ivMasterHash = @ivMasterHash WHERE rowId = @id").run({
        id: secret.id,
        keyMasterHash: encryptPlainText(decryptPlainText(secret.keyMasterHash, oldPassword), newPassword),
        ivMasterHash: encryptPlainText(decryptPlainText(secret.ivMasterHash, oldPassword), newPassword),
      });
    });

    db.close();
  }

  public addSecret(
    masterPassword: string,
    displayName: string,
    algorithm: string,
    key: string,
    iv: string,
    filePath?: string,
    accessToken?: string
  ): void {
    if (!this.isValidMasterPassword(masterPassword)) {
      throw new Error("Invalid master password.");
    }
    const db = !accessToken ? this.newSqliteDb : this.connectToDatabase(accessToken);

    db.prepare(
      `INSERT INTO secrets
            (displayName, createdOn, algorithm, keyMasterHash, keySessionHash, ivMasterHash, ivSessionHash, filePath) VALUES
            (@displayName, @createdOn, @algorithm, @keyMasterHash, @keySessionHash, @ivMasterHash, @ivSessionHash, @filePath)`
    ).run({
      displayName,
      createdOn: this.utcNow,
      algorithm,
      keyMasterHash: encryptPlainText(key, masterPassword),
      ivMasterHash: encryptPlainText(iv, masterPassword),
      keySessionHash:
        accessToken === undefined
          ? null
          : encryptPlainText(
              key,
              this.stripPartsFromAccessToken(
                accessToken,
                this.sessionKeySubstringSegments[0],
                this.sessionKeySubstringSegments[1],
                this.sessionKeySubstringSegments[2]
              )
            ),
      ivSessionHash:
        accessToken === undefined
          ? null
          : encryptPlainText(
              iv,
              this.stripPartsFromAccessToken(
                accessToken,
                this.sessionIvSubstringSegments[0],
                this.sessionIvSubstringSegments[1],
                this.sessionIvSubstringSegments[2]
              )
            ),
      filePath,
    });

    db.close();
  }

  public getSecret(secretId: number, accessToken: string): SecretDto | undefined {
    const db = this.connectToDatabase(accessToken);

    const secret = db
      .prepare(
        "SELECT rowId as id, displayName, createdOn, algorithm, keySessionHash, ivSessionHash, filePath FROM secrets WHERE rowId = @secretId"
      )
      .get({ secretId }) as Secret | undefined;

    db.close();

    return {
      id: secret.id,
      createdOn: secret.createdOn,
      displayName: secret.displayName,
      algorithm: secret.algorithm,
      key: decryptPlainText(
        secret.keySessionHash,
        this.stripPartsFromAccessToken(
          accessToken,
          this.sessionKeySubstringSegments[0],
          this.sessionKeySubstringSegments[1],
          this.sessionKeySubstringSegments[2]
        )
      ),
      iv: decryptPlainText(
        secret.ivSessionHash,
        this.stripPartsFromAccessToken(
          accessToken,
          this.sessionIvSubstringSegments[0],
          this.sessionIvSubstringSegments[1],
          this.sessionIvSubstringSegments[2]
        )
      ),
      filePath: secret.filePath,
    };
  }

  public deleteSecret(id: number, accessToken: string): void {
    const db = this.connectToDatabase(accessToken);

    db.prepare("DELETE FROM secrets WHERE rowId = @id").run({ id });

    db.close();
  }

  public getSecrets(accessToken: string): SecretDto[] {
    const db = this.connectToDatabase(accessToken);

    const secrets = db.prepare("SELECT rowId as id, displayName, createdOn, algorithm, filePath FROM secrets").all() as Secret[];

    db.close();

    return secrets.map((s) => {
      return {
        id: s.id,
        createdOn: s.createdOn,
        displayName: s.displayName,
        algorithm: s.algorithm,
        key: "**********",
        iv: "**********",
        filePath: s.filePath,
      };
    });
  }

  private getMasterPassword(): MasterPassword | undefined {
    const db = this.newSqliteDb;

    const password = db.prepare("SELECT id, passwordHash, updatedOn, hint, expiresOn FROM masterPassword").get() as
      | MasterPassword
      | undefined;

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

  private removeSessionData() {
    const db = this.newSqliteDb;

    const allSecrets = db
      .prepare(SELECT_ALL_SECRETS_SQL + " WHERE keySessionHash IS NOT NULL OR ivSessionHash IS NOT NULL")
      .all() as Secret[];
    allSecrets.forEach((secret) => {
      db.prepare("UPDATE secrets SET keySessionHash = NULL, ivSessionHash = NULL WHERE rowId = @id").run({
        id: secret.id,
      });
    });

    console.log(
      `Vault session ended.\n
       Removed the encrypted session hashes for ${allSecrets.length} secrets.`
    );
  }

  /**Set a new master password id and return it. */
  private updateMasterPassswordId(id: string | undefined = undefined): string {
    const db = this.newSqliteDb;
    id = id === undefined ? uuidv4() : id;
    db.prepare("UPDATE masterPassword SET id = @id, updatedOn = @now").run({
      id,
      now: this.utcNow,
    });
    return id;
  }

  private generateTokens(): VaultSessionTokens {
    const newMasterPasswordId = this.updateMasterPassswordId();

    this.accessTokenSigningKey = safeStorage.encryptString(randomHexKey());
    this.accessTokenIssuer = safeStorage.encryptString(randomHexKey(16));

    const accessToken = jwt.sign(
      {
        time: this.utcNow,
        masterPasswordIdHash: this.hashPassword(newMasterPasswordId, 4),
      },
      safeStorage.decryptString(this.accessTokenSigningKey),
      {
        expiresIn: "2m",
        issuer: safeStorage.decryptString(this.accessTokenIssuer),
      }
    );

    this.refreshTokenSigningKey = safeStorage.encryptString(randomHexKey());
    this.refreshTokenIssuer = safeStorage.encryptString(randomHexKey(16));

    const refreshToken = jwt.sign(
      {
        time: this.utcNow,
        masterPasswordIdHash: this.hashPassword(newMasterPasswordId, 4),
      },
      safeStorage.decryptString(this.refreshTokenSigningKey),
      {
        expiresIn: "3m",
        issuer: safeStorage.decryptString(this.refreshTokenIssuer),
      }
    );

    return {
      accessToken,
      refreshToken,
      refreshInMs: 10000,
    };
  }

  private validateToken(token: string, signingKey: string, issuer: string, ignoreExpiration = false) {
    const payload = jwt.verify(token, signingKey, { issuer, ignoreExpiration });

    // validate jwt and make sure masterPasswordIdHash can be dehashed using the currentid of the master password
    if (!payload) throw new Error("Invalid token");

    // validate jwt and make sure masterPasswordIdHash can be dehashed using the currentid of the master password
    if (!compareSync(this.getMasterPassword().id, (payload as jwt.JwtPayload).masterPasswordIdHash))
      throw new Error("Invalid token params");
  }

  private validateOngoingSession() {
    if (!this.isOngoingSession) {
      throw new Error("A session must first be started by providing the master password.");
    }
  }

  private connectToDatabase(accessToken: string) {
    this.validateOngoingSession();

    this.validateToken(
      accessToken,
      safeStorage.decryptString(this.accessTokenSigningKey),
      safeStorage.decryptString(this.accessTokenIssuer)
    );
    return this.newSqliteDb;
  }

  private stripPartsFromAccessToken(accessToken: string, initial: string, middle: string, final: string) {
    return (
      accessToken.substring(parseInt(initial, 10), parseInt(initial, 10) + 10) +
      accessToken.substring(parseInt(middle, 10), parseInt(middle, 10) + 11) +
      accessToken.substring(parseInt(final, 10), parseInt(final, 10) + 11)
    );
  }

  private hashPassword = (password: string, rounds = 14) => hashSync(password, rounds);

  private randomNumberFromInterval = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
}
