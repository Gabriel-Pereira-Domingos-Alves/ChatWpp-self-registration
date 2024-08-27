import { Injectable, Logger } from '@nestjs/common';
import { create, Whatsapp } from 'venom-bot';
import { PrismaService } from 'src/database/PrismaService';
import { MessagesService } from './wppMessages.service';

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
    private readonly logger = new Logger(WhatsappService.name);
    private clients: Map<string, ClientSession> = new Map();

    constructor(private prisma: PrismaService, private messagesService: MessagesService) {}

    public async initializeClient(clientName: string): Promise<string> {
        try {
            if (this.clients.has(clientName)) {
                const clientSession = this.clients.get(clientName);
                if (clientSession.status === 'isLogged') {
                    this.logger.log(`Client ${clientName} is already logged in`);
                    return 'Client is already logged in';
                }
                this.logger.log(`Returning existing QR code for client ${clientName}`);
                return clientSession.qrCode;
            }

             await this.prisma.client.upsert({
                where: { id: clientName },
                update: { session: 'notLogged' },
                create: { id: clientName, name: clientName, number: 'clientNumber', session: 'notLogged' },
            });

            return await this.createVenomClient(clientName);
        } catch (error) {
            this.logger.error(`Error initializing client ${clientName}: ${error.message}`, error.stack);
            throw new Error('Failed to initialize client');
        }
    }

    private async createVenomClient(clientName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            create(
                clientName,
                async (base64Qrimg: string) => {
                    this.logger.log('Base64 QR Code generated');
                    if (this.clients.has(clientName)) {
                        this.clients.get(clientName).qrCode = base64Qrimg;
                    } else {
                        this.clients.set(clientName, { client: null, qrCode: base64Qrimg, status: 'notLogged' });
                    }
                    resolve(base64Qrimg);
                },
                async (statusSession: string) => {
                    this.logger.log(`Status Session: ${statusSession}`);
                    const status = statusSession === 'isLogged' ? 'isLogged' : 'notLogged';
                    if (this.clients.has(clientName)) {
                        const clientSession = this.clients.get(clientName);
                        clientSession.status = status;
                        this.clients.set(clientName, clientSession);
                    } else {
                        this.clients.set(clientName, { client: null, qrCode: null, status });
                    }
                    await this.prisma.client.update({
                        where: { id: clientName },
                        data: { session: status },
                    });
                },
                {
                    headless: 'new',
                    logQR: false,
                    autoClose: 60000,
                }
            )
                .then(async (client) => {
                    const clientSession = this.clients.get(clientName);
                    clientSession.client = client;
                    this.clients.set(clientName, clientSession);

                    client.onStateChange(async (state) => {
                        this.logger.log(`Client ${clientName} state changed to: ${state}`);
                        if (state === 'CONNECTED') {
                            clientSession.status = 'isLogged';
                            this.clients.set(clientName, clientSession);
                            await this.prisma.client.update({
                                where: { id: clientName },
                                data: { session: 'isLogged' },
                            });
                        }
                    });

                    client.onMessage(async (message) => {
                        await this.messagesService.handleMessage(message, client);
                    })
                    const isConnected = await client.isConnected();
                    this.logger.log(`Client ${clientName} is connected: ${isConnected}`);
                    if (isConnected) {
                        clientSession.status = 'isLogged';
                        this.clients.set(clientName, clientSession);
                        await this.prisma.client.update({
                            where: { id: clientName },
                            data: { session: 'isLogged' },
                        });
                        resolve('Client is already logged in');
                    } else {
                        resolve(clientSession.qrCode);
                    }
                })
                .catch((error) => {
                    this.logger.error(`Error initializing Venom client for ${clientName}: ${error.message}`, error.stack);
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
            await client.sendText(phoneNumber, message);
            const profile = await client.getContact(phoneNumber);
            const contactName = profile.pushname || profile.name || profile.shortName || 'Unknown';
            await this.prisma.sendMessage.create({
                data: {
                    message,
                    phoneNumber,
                    clientId: clientName,
                    contactName,
                },
            });
        } catch (error) {
            this.logger.error(`Error sending message to ${phoneNumber}: ${error.message}`, error.stack);
            throw new Error('Failed to send message');
        }
    }

    public async getMessages(): Promise<Messages[]> {
        try {
            return await this.prisma.sendMessage.findMany();
        } catch (error) {
            this.logger.error(`Error fetching messages: ${error.message}`, error.stack);
            throw new Error('Failed to fetch messages');
        }
    }

    public async getClients(): Promise<Client[]> {
        try {
            const clients = await this.prisma.client.findMany({
                select: {
                    id: true,
                    name: true,
                    number: true,
                    session: true,
                },
            })
            console.log(clients)
            return clients

        } catch (error) {
            this.logger.error(`Error fetching clients: ${error.message}`, error.stack);
            throw new Error('Failed to fetch clients');
        }
    }

    public async closeClient(clientName: string): Promise<void> {
        if (this.clients.has(clientName)) {
            const clientSession = this.clients.get(clientName);
            if (clientSession.client) {
                try {
                    await clientSession.client.logout();
                    await clientSession.client.close();
                    console.log(`Client ${clientName} logged out and closed successfully`);
                } catch (error) {
                    console.error(`Error while logging out or closing client ${clientName}:`, error);
                } finally {
                    this.clients.delete(clientName);
                    console.log(`Client session for ${clientName} removed from internal map`);

                    try {
                        await this.prisma.sendMessage.deleteMany({
                            where: { clientId: clientName },
                        })
                        await this.prisma.client.delete({
                            where: { id: clientName },
                        });
                        console.log(`Client record for ${clientName} deleted from database`);
                    } catch (error) {
                        console.error(`Error deleting client record for ${clientName} from database:`, error);
                    }
                }
            } else {
                console.log(`Client ${clientName} not initialized`);
                try {
                    this.clients.delete(clientName);
                    console.log(`Client session for ${clientName} removed from internal map`);
                } catch (error) {
                    console.error(`Error deleting client session for ${clientName} from internal map:`, error);
                }
            }
        } else {
            console.log(`Client ${clientName} not found`);
        }
    }

    public async sendTexts(clientId: string, messageId: string, allUsers: boolean=false, dataDelay: number, delayMessage: number=3, placements: Record<string, string>, usersId: string[]): Promise<void> {
        if (!this.clients.has(clientId)) {
            throw new Error('Client not initialized');
        }
        const { client } = this.clients.get(clientId);
    
        try {
            const message = await this.getMessage(messageId);
            const users = allUsers ? await this.getAllUsers() : (usersId || await this.getUsers(placements, dataDelay));
            
            for (const user of users) {
                await client.sendText(user, message);
                await new Promise(resolve => setTimeout(resolve, delayMessage * 1000));
            }
        } catch (error) {
            this.logger.error(`Error fetching messages: ${error.message}`, error.stack);
            throw new Error('Failed to fetch messages');
        }
    }

    public async getMessage(messageId: string): Promise<any> {
        try {
            const message = "aaaaaa"
            return message
        } catch (error) {
            this.logger.error(`Error fetching messages: ${error.message}`, error.stack);
            throw new Error('Failed to fetch messages');
        }
    }


    public async getAllUsers(): Promise<any> {
        try {
            const users = await this.prisma.userState.findMany(
                {
                    select: {
                        userId: true,
                        stage: true
                    }
                }
            );
            return users
        } catch (error) {
            this.logger.error(`Error fetching users: ${error.message}`, error.stack);
            throw new Error('Failed to fetch users');
        }
    }

    public async getUsers(placements: Record<string, string>, dataDelay: number): Promise<any> {
        try {
        const users = await this.prisma.userState.findMany({
            where: {
                AND: [
                    { stage: { in: Object.values(placements) } },
                    { createdAt: { gte: new Date(Date.now() - dataDelay * 86400000) } },
                ],
            },
            select: {
                userId: true,
                stage: true
            }
        });
        return users
        } catch (error) {
        this.logger.error(`Error fetching users: ${error.message}`, error.stack);
        throw new Error('Failed to fetch users');
        }
    }

    public async getGroups(clientId: string): Promise<any> {
        if (!this.clients.has(clientId)) {
            throw new Error('Client not initialized');
        }
        const { client } = this.clients.get(clientId);
    
        try {
            const groups = await client.getAllChatsGroups();
            return groups
        } catch (error) {
            this.logger.error(`Error fetching groups: ${error.message}`, error.stack);
            throw new Error('Failed to fetch groups');
        }
    }

    public async getMembersGroups(clientId: string, groupId: string): Promise<any> {
        if (!this.clients.has(clientId)) {
            throw new Error('Client not initialized');
        }
        const { client } = this.clients.get(clientId);
    
        try {
            const groups = await client.getGroupMembers(groupId, '3000');
            return groups
        } catch (error) {
            this.logger.error(`Error fetching groups: ${error.message}`, error.stack);
            throw new Error('Failed to fetch groups');
        }
    }
}
