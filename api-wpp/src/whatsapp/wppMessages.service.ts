import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/PrismaService';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) {}

    public async handleMessage(clientName: string, message: any): Promise<void> {
        // Remove o sufixo "@c.us" do número de telefone
        const phoneNumber = message.from.replace('@c.us', '');

        // Verifica se o número está cadastrado no banco de dados
        const client = await this.prisma.sendMessage.findFirst({
            where: { phoneNumber: phoneNumber, clientId: clientName },
        });

        if (client) {
            // Loga os detalhes da mensagem
            console.log('Mensagem recebida:', message);
            console.log(`Nome: ${client.contactName}`);

        } else {
            console.log(`Número ${message.from} não está cadastrado.`);
            console.log('Mensagem recebida:', message);
        }
    }
}
