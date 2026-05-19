import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrGeneratorService {
  private readonly logger = new Logger(QrGeneratorService.name);

  async generateQrCodeDataUrl(text: string): Promise<string> {
    try {
      // Sesuai dengan spesifikasi keamanan, kita hanya menyimpan assetCode dalam bentuk plain-text di QR
      const dataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff',
        },
      });
      return dataUrl;
    } catch (error: any) {
      this.logger.error(`Failed to generate QR Code for text ${text}: ${error.message}`);
      throw new Error('QR Code generation failed');
    }
  }
}
