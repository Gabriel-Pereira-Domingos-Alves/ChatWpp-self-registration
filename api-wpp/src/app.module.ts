import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { PrismaService } from './database/PrismaService';

@Module({
  imports: [WhatsappModule],
  controllers: [AppController, WhatsappController],
  providers: [AppService, WhatsappService, PrismaService],
})
export class AppModule { }