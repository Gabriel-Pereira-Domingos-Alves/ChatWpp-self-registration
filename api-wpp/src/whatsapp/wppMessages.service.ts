import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/PrismaService';
import axios from 'axios';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) {}

    public async handleMessage(message: any, client: any): Promise<void> {
        console.log(message);
        try {
            const userState = await this.prisma.userState.findUnique({
                where: { userId: message.from || message.sender.id },
            });

            console.log(userState);

            const now = new Date();
            const createdAt = new Date(userState?.createdAt);
            const minutesSinceLastInteraction = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            if (userState?.stage && minutesSinceLastInteraction > 5 && userState.stage !== 'completed') {
                await this.finalizeConversation(message, client);
                return;
            }

            const ebookRegex = /\b(ebook|Ebook|EBOOK|ebok)\b/i;

            if (!userState) {
                await this.handleInitialMessage(message, client, userState);
                return
            } else if (ebookRegex.test(message.content) && userState.stage === 'completed') {
                await this.finalizeConversation(message, client);
                return
            } else {
                await this.continueConversation(message, client, userState);
            }

        } catch (error) {
            console.log(error);
        }
    }

    private async handleInitialMessage(message: any, client: any, userState: any) {
        const ebookRegex = /\b(ebook|Ebook|EBOOK|ebok)\b/i;

        if (ebookRegex.test(message.content.toLowerCase())) {
            await client.sendText(message.from, `Olá ${message.sender.pushname || 'usuário'}, seu nome está correto?`);

            if (!userState) {
                await this.prisma.userState.create({
                    data: {
                        userId: message.from,
                        stage: 'confirmingName',
                    },
                });
            } else {
                await this.prisma.userState.update({
                    where: { userId: message.from },
                    data: {
                        stage: 'confirmingName',
                    },
                });
            }
        } else {
            console.log('Invalid message content:', message.content);
        }
    }

    private async continueConversation(message: any, client: any, userState: any) {
        switch (userState.stage) {
            case 'confirmingName':
                await this.handleConfirmingName(message, client);
                break;
            case 'collectingName':
                await this.handleCollectingName(message, client);
                break;
            case 'collectingEmail':
                await this.handleCollectingEmail(message, client);
                break;
        }
    }

    private async handleConfirmingName(message: any, client: any) {
        const confirmationRegex = /\b(sim|s|yes|y|ok|certo|correto)\b/i;
        const denialRegex = /\b(não|n|no|nao)\b/i;

        if (confirmationRegex.test(message.content.toLowerCase())) {
            await client.sendText(message.from, 'Por favor, informe seu e-mail.');
            await this.prisma.userState.update({
                where: { userId: message.from },
                data: {
                    stage: 'collectingEmail',
                    name: message.sender.pushname || 'usuário'
                },
            });
        } else if (denialRegex.test(message.content.toLowerCase())) {
            await client.sendText(message.from, 'Por favor, informe o nome correto.');
            await this.prisma.userState.update({
                where: { userId: message.from },
                data: { stage: 'collectingName' },
            });
        } else {
            await client.sendText(message.from, 'Não entendi. Por favor, responda com sim ou com não.');
        }
    }

    private async handleCollectingName(message: any, client: any) {
        await this.prisma.userState.update({
            where: { userId: message.from },
            data: { name: message.content, stage: 'collectingEmail' },
        });
        await client.sendText(message.from, `Nome atualizado para ${message.content}. Agora, por favor, informe seu e-mail.`);
    }

    private async handleCollectingEmail(message: any, client: any) {
        await client.sendText(message.from, `Obrigado pelo e-mail! Estamos enviando o curso de manutenção de AEGs agora.`);

        await this.prisma.userState.update({
            where: { userId: message.from },
            data: { email: message.content},
        });

        await this.finalizeConversation(message, client);
    }

    private async finalizeConversation(message: any, client: any) {
        await this.prisma.userState.update({
            where: { userId: message.from },
            data: { stage: 'completed' },
        });

        await client.sendFile(
            message.from,
            '/home/airsoft/Documentos/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/ebook-manutencao_aegs.pdf',
            //'/Users/gabrielalves/Documents/integra/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/ebook-manutencao_aegs.pdf',
            'ebook-manutencao_aegs',
            'Ebook de manutenção de AEGs!'
        );

        const contact = await this.prisma.userState.findUnique({
            where: { userId: message.from },
            select: { name: true, createdAt: true, userId: true, email: true },
        })

        const url = 'http://192.168.18.38/start_flow';
        const corpo = {
            "name": contact.name,
            "phone_number": contact.userId,
            "email": contact.email,
            "time": contact.createdAt.getTime(),
        };

        axios.post(url, corpo)
        .then(resposta => console.log(resposta.data))
        .catch(erro => console.error(erro));
    }
}
