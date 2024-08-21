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
        if (!userState || userState.stage === 'completed') {
            if (message.content.toLowerCase() === 'quero meu ebook sobre manutenção de aegs') {
                await client.sendText(message.from, `Olá ${message.sender.pushname || 'usuário'}, seu nome está correto?`);
        
                if (!userState) {
                    // Cria um novo registro se não existir
                    await this.prisma.userState.create({
                        data: {
                            userId: message.from,
                            stage: 'confirmingName',
                        },
                    });
                } else {
                    // Atualiza o registro existente
                    await this.prisma.userState.update({
                        where: { userId: message.from },
                        data: {
                            stage: 'confirmingName',
                        },
                    });
                }
            }
        } else {
            // Se o usuário já tem um estado salvo, segue o fluxo de conversação
            if (userState.stage === 'confirmingName') {
                const confirmationRegex = /\b(sim|s|yes|y|ok|certo|correto)\b/i;
                const confirmationRegex2 = /\b(não|n|no|nao)\b/i;
                if (confirmationRegex.test(message.content.toLowerCase())){
                    await client.sendText(message.from, 'Por favor, informe seu e-mail.');
                    await this.prisma.userState.update({
                        where: { userId: message.from },
                        data: { stage: 'collectingEmail',
                            name: message.sender.pushname || 'usuário'  // Atualizando o nome
                         },
                    });
                } else if (confirmationRegex2.test(message.content.toLowerCase())) { 
                    await client.sendText(message.from, 'Por favor, informe o nome correto.');
                    await this.prisma.userState.update({
                        where: { userId: message.from },
                        data: { stage: 'collectingName' },
                    });
                } else {
                    await client.sendText(message.from, 'Não entendi. Por favor, responda com sim ou com não.');
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
                await client.sendText(message.from, `Obrigado pelo e-mail! Estamos enviando o curso de manutenção de AEGs agora.`);
                await client.sendFile(
                    message.from,
                    'C:\\Users\\Fred\\Documents\\GitHub\\ChatWpp-self-registration\\api-wpp\\src\\whatsapp\\assets\\ebook-manutencao_aegs.pdf',
                    //'/Users/gabrielalves/Documents/integra/ChatWpp-self-registration/api-wpp/src/whatsapp/assets/ebook-manutencao_aegs.pdf',
                    'ebook-manutencao_aegs',
                    'Ebook de manutenção de AEGs!'
                );
                await new Promise(resolve => setTimeout(resolve, 90000));
                await client.sendText(message.from,
                    'Já que você está interessado em manutenção de airsoft, dê uma olhada neste post que preparamos com todo o cuidado: https://airsoftnews.com.br/desvendando-os-segredos-do-rifle-de-airsoft-um-guia-completo-para-operadores-experientes/?utm_source=whatsapp-cta. Nele, você encontrará uma análise detalhada de todas as peças de uma arma de airsoft. Não perca essa oportunidade de aprofundar ainda mais seu conhecimento!'
                );
                await new Promise(resolve => setTimeout(resolve, 300000));
                    await client.sendText(message.from,
                    'Se você está interessado em receber informações exclusivas, atualizações e dicas valiosas sobre airsoft, junte-se ao nosso grupo de divulgação no WhatsApp! Lá, compartilhamos as novidades mais quentes e você pode se conectar com outros entusiastas do esporte. Não perca a oportunidade de estar sempre por dentro do que está acontecendo. É rápido, fácil e, o melhor de tudo, você vai adorar fazer parte dessa comunidade. Clique no link e entre para o nosso grupo agora: https://chat.whatsapp.com/JtB6wX8aHddDALGzEFgkOg. Estamos esperando por você!'
                );
            }
        }
    }
}