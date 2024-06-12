import { Injectable } from '@nestjs/common';
import { create, Whatsapp } from 'venom-bot';
import { PrismaService } from 'src/database/PrismaService';

interface ClientSession {
    client: Whatsapp;
    qrCode: string;
    status: string;
}

interface Client {
    id: string;
    name: string;
    number: string;
    session: string;
}

interface Messages {
    id: string;
    message: string;
    phoneNumber: string;
    clientId: string;
    contactName: string;
    createdAt: Date;
}

@Injectable()
export class WhatsappService {
    constructor(private prisma: PrismaService) {}
    private clients: Map<string, ClientSession> = new Map();

    public async initializeClient(clientName: string): Promise<string> {
        if (this.clients.has(clientName)) {
            const clientSession = this.clients.get(clientName);
            if (clientSession.status === 'isLogged') {
                console.log(`Client ${clientName} is already logged in`);
                return 'Client is already logged in';
            }
            console.log(`Returning existing QR code for client ${clientName}`);
            return clientSession.qrCode;
        }

        // Cria o cliente no banco de dados, usando clientName como id
        const clientRecord = await this.prisma.client.upsert({
            where: { id: clientName },
            update: { session: 'notLogged' },
            create: { id: clientName, name: clientName, number: 'clientNumber', session: 'notLogged' },
        });

        return new Promise((resolve, reject) => {
            create(
                clientName, // Usando clientName como session name
                async (base64Qrimg: string) => {
                    console.log('Base64 QR Code: ', base64Qrimg);
                    if (this.clients.has(clientName)) {
                        this.clients.get(clientName).qrCode = base64Qrimg;
                    } else {
                        this.clients.set(clientName, { client: null, qrCode: base64Qrimg, status: 'notLogged' });
                    }
                    resolve(base64Qrimg);
                },
                async (statusSession: string) => {
                    console.log('Status Session: ', statusSession);
                    if (this.clients.has(clientName)) {
                        const clientSession = this.clients.get(clientName);
                        clientSession.status = statusSession === 'isLogged' ? 'isLogged' : 'notLogged';
                        this.clients.set(clientName, clientSession);
                    } else {
                        this.clients.set(clientName, { client: null, qrCode: null, status: statusSession });
                    }
                    await this.prisma.client.update({
                        where: { id: clientName },
                        data: { session: statusSession === 'isLogged' ? 'isLogged' : 'notLogged' },
                    });
                },
                {
                    headless: 'new', // Usando 'new' para o modo headless
                    logQR: false,
                    autoClose: 60000,
                }
            )
                .then(async (client) => {
                    if (this.clients.has(clientName)) {
                        const clientSession = this.clients.get(clientName);
                        clientSession.client = client;
                        this.clients.set(clientName, clientSession);
                    } else {
                        this.clients.set(clientName, { client, qrCode: null, status: 'notLogged' });
                    }

                    // Verificar o estado de login após a inicialização
                    client.onStateChange(async (state) => {
                        console.log(`Client ${clientName} state changed to: ${state}`);
                        if (state === 'CONNECTED') {
                            const clientSession = this.clients.get(clientName);
                            clientSession.status = 'isLogged';
                            this.clients.set(clientName, clientSession);
                            await this.prisma.client.update({
                                where: { id: clientName },
                                data: { session: 'isLogged' },
                            });
                        }
                    });

                    client.isConnected().then(async (isConnected) => {
                        console.log(`Client ${clientName} is connected: ${isConnected}`);
                        if (isConnected) {
                            const clientSession = this.clients.get(clientName);
                            clientSession.status = 'isLogged';
                            this.clients.set(clientName, clientSession);
                            await this.prisma.client.update({
                                where: { id: clientName },
                                data: { session: 'isLogged' },
                            });
                            resolve('Client is already logged in');
                        } else {
                            resolve(this.clients.get(clientName).qrCode);
                        }
                    });
                })
                .catch((error) => {
                    console.error(`Error initializing client ${clientName}:`, error);
                    reject(error);
                });
        });
    }

    public async isClientLogged(clientName: string): Promise<boolean> {
        if (this.clients.has(clientName)) {
            const clientSession = this.clients.get(clientName);
            return clientSession.status === 'isLogged';
        }
        return false;
    }

    public async addNumberToWhatsapp(clientName: string, phoneNumber: string, message: string): Promise<void> {
        if (!this.clients.has(clientName) || !this.clients.get(clientName).client) {
            throw new Error('Client not initialized');
        }
        const { client } = this.clients.get(clientName);
        try {
            await client.sendText(`${phoneNumber}@c.us`, message); 
            const profile = await client.getContact(`${phoneNumber}@c.us`);
            const contactName = profile.pushname || profile.name || profile.shortName || 'Unknown';
            console.log(contactName)
            await this.prisma.sendMessage.create({
                data: {
                    message,
                    phoneNumber,
                    clientId: clientName,
                    contactName: contactName
                },
            });
        } catch (error) {
            console.log(error);
            throw new Error('Failed to send message');
        }
    }

    public async getMessages(): Promise<Messages[]> {
        const messages = await this.prisma.sendMessage.findMany();
        return messages;
    }

    public async getClients(): Promise<Client[]> {
        const clients = await this.prisma.client.findMany({
            select: {
                id: true,
                name: true,
                number: true,
                session: true,
            }
        });
        return clients;
    }

    public async closeClient(clientName: string): Promise<void> {
        if (this.clients.has(clientName)) {
            const clientSession = this.clients.get(clientName);
            if (clientSession.client) {
                try {
                    await clientSession.client.logout();
                    await clientSession.client.close();
                    await this.clients.delete(clientName);
                    console.log(`Client ${clientName} closed`);
                    await this.prisma.client.delete({
                        where: { id: clientName },
                    })
                } catch (error) {
                    console.log(error);
                    await clientSession.client.logout();
                    await this.clients.delete(clientName);
                    console.log(`Client ${clientName} closed`);
                    await this.prisma.client.delete({
                        where: { id: clientName },
                    })
                }
            } else {
                console.log(`Client ${clientName} not found`);
            }
        } else {
            console.log(`Client ${clientName} not found`);
        }
    }
}
