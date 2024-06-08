import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from 'src/database/PrismaService';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService]
})
export class WhatsappModule {}
