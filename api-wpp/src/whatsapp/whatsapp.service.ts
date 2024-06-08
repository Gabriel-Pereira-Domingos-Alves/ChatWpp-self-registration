import { Injectable } from '@nestjs/common';
import { create, Whatsapp } from 'venom-bot';
import { PrismaService } from 'src/database/PrismaService';

interface ClientSession {
    client: Whatsapp;
    qrCode: string;
    status: string;
}

interface Client{
    id: string;
    name: string;
    number: string;
    session: string;
}

@Injectable()
export class WhatsappService {
    constructor(private prisma: PrismaService) {}
    private clients: Map<string, ClientSession> = new Map();

    public async initializeClient(clientId: string): Promise<string> {
        if (this.clients.has(clientId)) {
            const clientSession = this.clients.get(clientId);
            if (clientSession.status === 'isLogged') {
                console.log(`Client ${clientId} is already logged in`);
                return 'Client is already logged in';
            }
            console.log(`Returning existing QR code for client ${clientId}`);
            return clientSession.qrCode;
        }

        return new Promise((resolve, reject) => {
            create(
                clientId,
                async (base64Qrimg: string) => {
                    console.log('Base64 QR Code: ', base64Qrimg);
                    if (this.clients.has(clientId)) {
                        this.clients.get(clientId).qrCode = base64Qrimg;
                    } else {
                        this.clients.set(clientId, { client: null, qrCode: base64Qrimg, status: 'notLogged' });
                    }
                    await this.prisma.client.upsert({
                        where: { id: clientId },
                        update: { session: 'notLogged' },
                        create: { id: clientId, name: clientId, number: 'Client Number', session: 'notLogged' },
                    });
                    resolve(base64Qrimg);
                },
                async (statusSession: string) => {
                    console.log('Status Session: ', statusSession);
                    if (this.clients.has(clientId)) {
                        const clientSession = this.clients.get(clientId);
                        clientSession.status = statusSession === 'isLogged' ? 'isLogged' : 'notLogged';
                        this.clients.set(clientId, clientSession);
                    } else {
                        this.clients.set(clientId, { client: null, qrCode: null, status: statusSession });
                    }
                    try {
                        await this.prisma.client.update({
                            where: { id: clientId },
                            data: { session: statusSession === 'isLogged' ? 'isLogged' : 'notLogged' },
                        });
                    } catch (error) {
                        if (error.code === 'P2025') {
                            await this.prisma.client.create({
                                data: { id: clientId, name: clientId, number: 'Client Number', session: statusSession === 'isLogged' ? 'isLogged' : 'notLogged' },
                            });
                        } else {
                            throw error;
                        }
                    }
                },
                {
                    headless: 'new', // Usando 'new' para o modo headless
                    logQR: false,
                    autoClose: 60000,
                }
            )
                .then(async (client) => {
                    if (this.clients.has(clientId)) {
                        const clientSession = this.clients.get(clientId);
                        clientSession.client = client;
                        this.clients.set(clientId, clientSession);
                    } else {
                        this.clients.set(clientId, { client, qrCode: null, status: 'notLogged' });
                    }

                    // Verificar o estado de login após a inicialização
                    client.onStateChange(async (state) => {
                        console.log(`Client ${clientId} state changed to: ${state}`);
                        if (state === 'CONNECTED') {
                            const clientSession = this.clients.get(clientId);
                            clientSession.status = 'isLogged';
                            this.clients.set(clientId, clientSession);
                            await this.prisma.client.update({
                                where: { id: clientId },
                                data: { session: 'isLogged' },
                            });
                        }
                    });

                    client.isConnected().then(async (isConnected) => {
                        console.log(`Client ${clientId} is connected: ${isConnected}`);
                        if (isConnected) {
                            const clientSession = this.clients.get(clientId);
                            clientSession.status = 'isLogged';
                            this.clients.set(clientId, clientSession);
                            await this.prisma.client.update({
                                where: { id: clientId },
                                data: { session: 'isLogged' },
                            });
                            resolve('Client is already logged in');
                        } else {
                            resolve(this.clients.get(clientId).qrCode);
                        }
                    });
                })
                .catch((error) => {
                    console.error(`Error initializing client ${clientId}:`, error);
                    reject(error);
                });
        });
    }

    public async isClientLogged(clientId: string): Promise<boolean> {
        if (this.clients.has(clientId)) {
            const clientSession = this.clients.get(clientId);
            return clientSession.status === 'isLogged';
        }
        return false;
    }

    public async addNumberToWhatsapp(clientId: string, phoneNumber: string, message: string): Promise<void> {
        if (!this.clients.has(clientId) || !this.clients.get(clientId).client) {
            throw new Error('Client not initialized');
        }
        const { client } = this.clients.get(clientId);
        try {
            await client.sendText(`${phoneNumber}@c.us`, message);
            await this.prisma.sendMessage.create({
                data: {
                    message,
                    phoneNumber,
                    clientId,
                },
            });
        } catch (error) {
            console.log(error);
            throw new Error('Failed to send message');
        }
    }

    public async getClients(): Promise<Client[]> {
        const clients = await this.prisma.client.findMany({
            select: {
                id: true,
                name: true,
                number: true,
                session: true,
            }
        })
        console.log(clients);
        return clients;
    }

    public async closeClient(clientId: string): Promise<void> {
        if (this.clients.has(clientId)) {
            const clientSession = this.clients.get(clientId);
            if (clientSession.client) {
                await clientSession.client.close();
                //await clientSession.client.logout();
                this.clients.delete(clientId);
                console.log(`Client ${clientId} closed`);
            } else {
                console.log(`Client ${clientId} not found`);
            }
        } else {
            console.log(`Client ${clientId} not found`);
        }
    }
}
