import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly logger = new Logger(EncryptionService.name);

  constructor(private configService: ConfigService) {
    let secretKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secretKey) {
      this.logger.error('ENCRYPTION_KEY is missing! Using fallback (INSECURE)');
      secretKey = 'fallback-key-32-chars-long-!!!';
    }
    
    if (secretKey.length !== 32) {
      this.logger.warn(`ENCRYPTION_KEY length is ${secretKey.length}, expected 32. Adjusting...`);
      if (secretKey.length > 32) {
        secretKey = secretKey.substring(0, 32);
      } else {
        secretKey = secretKey.padEnd(32, '0');
      }
    }
    this.key = Buffer.from(secretKey);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text: string): string {
    if (!text) {
      this.logger.warn('Attempted to decrypt empty/null text');
      return '********';
    }

    try {
      if (typeof text !== 'string' || !text.includes(':')) {
        this.logger.warn(`Invalid encryption format: ${typeof text}`);
        return '********';
      }
      
      const textParts = text.split(':');
      if (textParts.length < 2) {
        this.logger.warn('Invalid encryption format: missing parts');
        return '********';
      }

      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      return '********'; 
    }
  }
}
