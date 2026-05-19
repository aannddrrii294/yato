import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { AssetGateway } from './asset.gateway';
import { AssetCodeService } from './services/asset-code.service';
import { QrGeneratorService } from './services/qr-generator.service';
import { LabelGeneratorService } from './services/label-generator.service';

@Module({
  controllers: [AssetController],
  providers: [
    AssetService,
    AssetGateway,
    AssetCodeService,
    QrGeneratorService,
    LabelGeneratorService,
  ],
  exports: [AssetService],
})
export class AssetModule {}
