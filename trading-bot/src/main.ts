import { Connection } from '@solana/web3.js';
import { logger } from './services/logger';
import { MetricsService } from './services/metrics';
import { HealthService } from './services/health';
import { WebSocketService } from './services/websocket';
import { BotState, TradeConfig } from './config/types';
import dotenv from 'dotenv';

dotenv.config();

export class TradingBot {
    private readonly connection: Connection;
    private readonly state: BotState;
    private readonly metrics: MetricsService;
    private readonly health: HealthService;
    private readonly ws: WebSocketService;
    private readonly config: TradeConfig;

    constructor(config: TradeConfig) {
        this.connection = new Connection(process.env.RPC_ENDPOINT!, 'confirmed');
        this.config = config;
        this.metrics = new MetricsService();
        this.health = new HealthService();
        this.ws = new WebSocketService(process.env.WEBSOCKET_URL!);
        
        // Initialize state
        this.state = {
            currentTokenCA: null,
            subscribedTokens: new Set(),
            devPublicKey: null,
            processedTokens: new Set(),
            marketMetrics: {
                initialMarketCap: null,
                highestMarketCap: null,
                currentDipLowest: null,
                postBuyHighestMarketCap: null,
                lastUpdated: null
            },
            volumes: new Map(),
            isActive: false,
            metrics: this.metrics.getMetrics()
        };
    }

    public async initialize(): Promise<void> {
        try {
            logger.info('Initializing trading bot');
            
            // Setup WebSocket handlers
            this.setupWebSocketHandlers();
            
            // Connect WebSocket
            this.ws.connect();
            
            // Setup process handlers
            this.setupProcessHandlers();
            
            this.state.isActive = true;
            logger.info('Trading bot initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize trading bot', { error });
            throw error;
        }
    }

    private setupWebSocketHandlers(): void {
        this.ws.on('message', this.handleWebSocketMessage.bind(this));
        this.ws.on('connected', () => {
            this.health.updateWSStatus(true);
            this.subscribeToTokens();
        });
        this.ws.on('maxReconnectAttemptsReached', this.handleMaxReconnectAttempts.bind(this));
    }
}