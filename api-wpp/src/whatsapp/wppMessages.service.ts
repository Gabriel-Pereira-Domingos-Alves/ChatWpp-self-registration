import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/PrismaService';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) {}

    public async handleMessage(message: any, client: any): Promise<void> {
        console.log(message);

        const userState = await this.prisma.userState.findUnique({
            where: { userId: message.from },
        });

        if (userState && userState.stage !== 'completed') {
            // Verifica se se passaram mais de 5 minutos desde a última interação
            const now = new Date();
            const createdAt = new Date(userState.createdAt);
            const minutesSinceLastInteraction = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            if (minutesSinceLastInteraction > 5) {
                // Se passaram mais de 5 minutos, envie o ebook e finalize
                await this.finalizeConversation(message, client);
                return;
            }
        }

        if (!userState || userState.stage === 'completed') {
            await this.handleInitialMessage(message, client, userState);
        } else {
            await this.continueConversation(message, client, userState);
        }
    }

    private async handleInitialMessage(message: any, client: any, userState: any) {
        if (message.content.toLowerCase() === 'quero meu ebook sobre manutenção de aegs') {
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

        await this.finalizeConversation(message, client);
    }

    private async finalizeConversation(message: any, client: any) {
        await this.prisma.userState.update({
            where: { userId: message.from },
            data: { email: message.content, stage: 'completed' },
        });
        await client.sendFile(
            message.from,
            //'C:\\Users\\Fred\\Documents\\GitHub\\ChatWpp-self-registration\\api-wpp\\src\\whatsapp\\assets\\',
            '/Users/gabrielalves/Documents/integra/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/ebook-manutencao_aegs.pdf',
            'ebook-manutencao_aegs',
            'Ebook de manutenção de AEGs!'
        );

        // Mensagem adicional após 90 segundos
        await new Promise(resolve => setTimeout(resolve, 90000));
        await client.sendText(message.from,
            'Já que você está interessado em manutenção de airsoft, dê uma olhada neste post que preparamos com todo o cuidado: https://airsoftnews.com.br/desvendando-os-segredos-do-rifle-de-airsoft-um-guia-completo-para-operadores-experientes/?utm_source=whatsapp-cta. Nele, você encontrará uma análise detalhada de todas as peças de uma arma de airsoft. Não perca essa oportunidade de aprofundar ainda mais seu conhecimento!'
        );
        await new Promise(resolve => setTimeout(resolve, 300000));
        await client.sendImage(
            message.from,
            //'C:\\Users\\Fred\\Documents\\GitHub\\ChatWpp-self-registration\\api-wpp\\src\\whatsapp\\assets\\delta.png',
            '/Users/gabrielalves/Documents/integra/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/delta.png',
            'Equipe Delta',
            'A Equipe DELTA AIRSOFT TEAM nasceu em 2017, com raízes profundas no mundo militar e um compromisso inabalável com o esporte. Fundada por Admilson Alves Emidio, um ex-militar do Exército Brasileiro, a DELTA surgiu com o objetivo de proporcionar aos seus integrantes uma experiência autêntica e imersiva de combate simulado. Com uma história marcada por operações bem-sucedidas e um legado construído sobre disciplina, treinamento rigoroso e honra, a DELTA se destaca como uma equipe de elite no cenário do airsoft.conheça mais clicando no link: \n \n https://airsoftnews.com.br/delta-airsoft-team?utm_source=whatsapp&utm_medium=social&utm_campaign=whatsapp-cta',
        )
        // Mensagem final após mais 5 minutos
        await new Promise(resolve => setTimeout(resolve, 900000));
        await client.sendText(message.from,
            'Se você está interessado em receber informações exclusivas, atualizações e dicas valiosas sobre airsoft, junte-se ao nosso grupo de divulgação no WhatsApp! Lá, compartilhamos as novidades mais quentes e você pode se conectar com outros entusiastas do esporte. Não perca a oportunidade de estar sempre por dentro do que está acontecendo. É rápido, fácil e, o melhor de tudo, você vai adorar fazer parte dessa comunidade. Clique no link e entre para o nosso grupo agora: https://chat.whatsapp.com/JtB6wX8aHddDALGzEFgkOg. Estamos esperando por você!'
        );

        await new Promise(resolve => setTimeout(resolve, 2700000));
        await client.sendImage(
            //'C:\\Users\\Fred\\Documents\\GitHub\\ChatWpp-self-registration\\api-wpp\\src\\whatsapp\\assets\\milsin.png',
            '/Users/gabrielalves/Documents/integra/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/milsin.png',
            'Milsin',
            'O airsoft é uma atividade de lazer que vem ganhando cada vez mais adeptos ao redor do mundo. utm_source=email&utm_mediumdes de jogo, o milsim (abreviação de “military simulation”) é uma das mais desafiadoras e imersivas. Este tipo de jogo busca replicar cenários e táticas militares, proporcionando aos participantes uma experiência realista e envolvente. \n \n https://airsoftnews.com.br/milsim-no-airsoft-explorando-os-pros-contras-dificuldades-e-locais-de-jogo-em-belo-horizonte?utm_source=whatsapp&utm_medium=social&utm_campaign=whatsapp-cta'
        )

        await new Promise(resolve => setTimeout(resolve, 2700000));
        await client.sendImage(
            //'C:\\Users\\Fred\\Documents\\GitHub\\ChatWpp-self-registration\\api-wpp\\src\\whatsapp\\assets\\female.png',
            '/Users/gabrielalves/Documents/integra/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/female.png',
            'Mulher Airsoft',
            'O crescimento da participação feminina no airsoft é uma tendência que tem ganhado força nos últimos anos, refletindo a inclusão e a diversidade que cada vez mais permeiam os esportes de ação. Essa presença crescente é um fator extremamente positivo para o esporte como um todo, trazendo uma série de benefícios tanto para as mulheres que ingressam na atividade quanto para o ambiente de jogo em si. \n \n https://airsoftnews.com.br/a-presenca-feminina-no-airsoft/?utm_source=whatsapp&utm_medium=social&utm_campaign=whatsapp-cta'
        )
    }
}
