import { Injectable } from '@nestjs/common';

@Injectable()
export class LabelGeneratorService {
  generateHtmlLabel(asset: {
    assetCode: string;
    assetType: string;
    hostname?: string;
    qrCodeUrl?: string;
  }): string {
    const hostnameText = asset.hostname || 'N/A';
    const qrUrl = asset.qrCodeUrl || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Asset Label - ${asset.assetCode}</title>
        <style>
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 2.5mm;
            width: 45mm;
            height: 25mm;
            box-sizing: border-box;
            background-color: #ffffff;
            color: #000000;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .qr-container {
            width: 18mm;
            height: 18mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .details {
            width: 23mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .org {
            font-size: 5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 1.5px;
          }
          .code {
            font-size: 8px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 2px;
            letter-spacing: -0.2px;
          }
          .type {
            font-size: 6px;
            font-weight: 700;
            background-color: #f1f5f9;
            color: #334155;
            padding: 1px 3px;
            border-radius: 2px;
            align-self: flex-start;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .hostname {
            font-size: 6px;
            font-weight: 500;
            color: #000000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="qr-container">
          <img src="${qrUrl}" alt="QR" />
        </div>
        <div class="details">
          <div class="org">HermesOps Enterprise</div>
          <div class="code">${asset.assetCode}</div>
          <div class="type">${asset.assetType}</div>
          <div class="hostname">Host: ${hostnameText}</div>
        </div>
      </body>
      </html>
    `;
  }
}
