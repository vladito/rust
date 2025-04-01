import WebSocket from 'ws';
import { logger } from './logger';
import { EventEmitter } from 'events';

export class WebSocketService extends EventEmitter {
    private ws: WebSocket | null = null;
    private readonly url: string;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    constructor(url: string) {
        super();
        this.url = url;
    }

    public connect(): void {
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventListeners();
        } catch (error) {
            logger.error('WebSocket connection failed', { error });
            this.handleReconnect();
        }
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.on('open', () => {
            logger.info('WebSocket connected');
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        this.ws.on('message', (data: WebSocket.Data) => {
            try {
                const parsedData = JSON.parse(data.toString());
                this.emit('message', parsedData);
            } catch (error) {
                logger.error('WebSocket message parsing failed', { error, data });
            }
        });

        this.ws.on('error', (error) => {
            logger.error('WebSocket error', { error });
            this.handleReconnect();
        });

        this.ws.on('close', () => {
            logger.info('WebSocket closed');
            this.handleReconnect();
        });
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(() => {
            logger.info('Attempting to reconnect', { attempt: this.reconnectAttempts });
            this.connect();
        }, delay);
    }

    public send(data: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            logger.error('WebSocket not connected');
            return;
        }

        try {
            this.ws.send(JSON.stringify(data));
        } catch (error) {
            logger.error('WebSocket send failed', { error, data });
        }
    }

    public close(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}