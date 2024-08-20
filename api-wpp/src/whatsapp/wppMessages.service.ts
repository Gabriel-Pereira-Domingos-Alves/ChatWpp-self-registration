import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/PrismaService';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) {}

    public async handleMessage(message: any, client: any): Promise<void> {
        console.log(message);

        // Verifica o estado atual do usuário no banco de dados
        const userState = await this.prisma.userState.findUnique({
            where: { userId: message.from },
        });

        // Se o usuário não tem um estado salvo, só responde a mensagem "oi"
        if (!userState) {
            if (message.content.toLowerCase() === 'oi') {
                await client.sendText(message.from, `Olá ${message.sender.pushname || 'usuário'}, seu nome está correto? (Responda com Sim ou Não)`);
                await this.prisma.userState.create({
                    data: {
                        userId: message.from,
                        stage: 'confirmingName',
                        name: message.sender.pushname || 'usuário',  // Salvando o nome inicial
                    },
                });
            } else {
                // Se o usuário enviar outra mensagem que não seja "oi", o bot não responde
                return;
            }
        } else {
            // Se o usuário já tem um estado salvo, segue o fluxo de conversação
            if (userState.stage === 'confirmingName') {
                if (message.content.toLowerCase() === 'sim') {
                    await client.sendText(message.from, 'Por favor, informe seu e-mail.');
                    await this.prisma.userState.update({
                        where: { userId: message.from },
                        data: { stage: 'collectingEmail' },
                    });
                } else {
                    await client.sendText(message.from, 'Por favor, informe o nome correto.');
                    await this.prisma.userState.update({
                        where: { userId: message.from },
                        data: { stage: 'collectingName' },
                    });
                }
            } else if (userState.stage === 'collectingName') {
                await this.prisma.userState.update({
                    where: { userId: message.from },
                    data: { name: message.content, stage: 'collectingEmail' },  // Atualizando o nome
                });
                await client.sendText(message.from, `Nome atualizado para ${message.content}. Agora, por favor, informe seu e-mail.`);
            } else if (userState.stage === 'collectingEmail') {
                await this.prisma.userState.update({
                    where: { userId: message.from },
                    data: { email: message.content, stage: 'completed' },  // Salvando o e-mail
                });
                await client.sendText(message.from, `Obrigado pelo e-mail! Estamos enviando o documento agora.`);
                await client.sendFile(
                    message.from,
                    '/Users/gabrielalves/Documents/integra/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/ebook-manutencao_aegs.pdf',
                    'ebook-manutencao_aegs',
                    'O melhor ebook de manutenção de aegs!'
                );
                await this.prisma.userState.delete({ where: { userId: message.from } });
            }
        }
    }
}
