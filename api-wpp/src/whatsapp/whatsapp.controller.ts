import { Controller, Get, Post, Query, Body, Param, Res } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Response } from 'express';

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @Get('qr/:clientId')
    async getQrCode(@Param('clientId') clientId: string, @Res() res: Response) {
        try {
            const isLogged = await this.whatsappService.isClientLogged(clientId);
            if (isLogged) {
                res.status(200).json({ message: 'Client is already logged in' });
            } else {
                const qrCode = await this.whatsappService.initializeClient(clientId);
                res.status(200).json({ qrCode });
            }
        } catch (error) {
            res.status(500).json({ message: 'Failed to get QR code', error: error.message });
        }
    }

    @Get('Clients')
    async getClients(@Res() res: Response) {
        try {
            const clients = await this.whatsappService.getClients();
            console.log(clients)
            res.status(200).json({ clients });
        } catch (error) {
            res.status(500).json({ message: 'Failed to get clients', error: error.message });
        }
    }

    @Post('close/:clientId')
    async closeClient(@Param('clientId') clientId: string, @Res() res: Response) {
        try {
            await this.whatsappService.closeClient(clientId);
            res.status(200).json({ message: 'Client closed successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to close client', error: error.message });
        }
    }

    @Post('add-number/:clientId')
    async addNumberToWhatsapp(@Param('clientId') clientId: string, @Body('phoneNumber') phoneNumber: string, @Body('message') message: string, @Res() res: Response) {
        try {
            await this.whatsappService.addNumberToWhatsapp(clientId, phoneNumber, message);
            res.status(200).json({ message: 'Message send to WhatsApp successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to add number to WhatsApp', error: error.message });
        }
    }

    @Get('messages')
    async getMessages(@Res() res: Response) {
        try {
            const messages = await this.whatsappService.getMessages();
            console.log(messages);
            res.status(200).json({ messages });
        } catch (error) {
            res.status(500).json({ message: 'Failed to get messages', error: error.message });
        }
    }

    @Post('send-texts/:clientId')
    async sendTexts(
        @Res() res: Response,
        @Param('clientId') clientId: string,
        @Query('messageId') messageId: string,
        @Query('allUsers') allUsers?: boolean,
        @Query('dataDelay') dataDelay?: number,
        @Query('delayMessage') delayMessage?: number,
        @Body('placements') placements?: Record<string, string>,
        @Body('usersId') usersId?: string[],
      ) {
        try {
          await this.whatsappService.sendTexts(clientId, messageId, allUsers, dataDelay, delayMessage, placements, usersId);
          res.status(200).json({ message: 'Message sent successfully' });
        } catch (error) {
          res.status(500).json({ message: 'Failed to send message', error: error.message });
        }
      }

    @Get('get-groups')
    async getGroups(
        @Res() res: Response,
        @Query('clientId') clientId: string
    ) {
        try {
            const groups = await this.whatsappService.getGroups(clientId);
            res.status(200).json({ groups });
        } catch (error) {
            res.status(500).json({ message: 'Failed to get groups', error: error.message });
        }
    }
}
