import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from 'src/database/PrismaService';
import { MessagesService } from './wppMessages.service';
@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService, MessagesService]
})
export class WhatsappModule {}
