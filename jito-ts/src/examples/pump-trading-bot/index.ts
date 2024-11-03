import WebSocket from 'ws';
import { CONFIG } from './config';
import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from "bs58";
import fs from 'fs';  // Import fs for file handling

interface MarketMetrics {
    initialMarketCap: number | null;
    highestMarketCap: number | null;
    currentDipLowest: number | null;
    postBuyHighestMarketCap: number | null;
}

interface BotState {
    currentTokenCA: string | null;
    subscriptionActive: boolean;
    devPublicKey: string | null;
    processedTokens: Set<string>;    
    marketMetrics: MarketMetrics;
}

class TradingBot {
    ws: WebSocket | null; // Allow ws to be either WebSocket instance or null
    state: BotState;
    web3Connection: Connection;
    purchasedTokens: Map<string, any>;
    timeouts: { holderCheck: null; tradeActivity: null; inactivity: null; };
    

    constructor() {
        this.ws = null; // Initialize the WebSocket property to null
        this.web3Connection = new Connection(CONFIG.RPC_ENDPOINT, 'confirmed');
        this.purchasedTokens = new Map<string, any>();
        this.state = {
            currentTokenCA: null,
            subscriptionActive: false,
            devPublicKey: null,
            processedTokens: new Set(),
            marketMetrics: {
                initialMarketCap: null,
                highestMarketCap: null,
                currentDipLowest: null,
                postBuyHighestMarketCap: null
            },           
        }
        this.timeouts = {
            holderCheck: null,
            tradeActivity: null,
            inactivity: null
        };
    }

    async initialize() {
        this.setupWebSocket(); // Set up the WebSocket connection
    }

    setupWebSocket() {
        // Create a new WebSocket connection using the URL from the configuration
        this.ws = new WebSocket(CONFIG.WEBSOCKET);

        // Event listener for when the connection is established
        this.ws.on('open', () => {
            console.log('WebSocket connection established');
            // Subscribing to token creation events
            const payload = {
                method: "subscribeNewToken",
            };
            this.ws?.send(JSON.stringify(payload)); // Use optional chaining to safely send the message
        });

        // Event listener for incoming messages
        this.ws.on('message', (data) => this.handleWebSocketMessage(data));

        // Event listener for error handling
        this.ws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });

        // Event listener for connection closure
        this.ws.on('close', () => {
            console.log('WebSocket connection closed');
        });
    }

    async handleWebSocketMessage(data: WebSocket.Data) {
        try {
            const messageString = data.toString();
            const parsedData = JSON.parse(messageString); // Parse the JSON data
            console.log('Received data:', parsedData); // Log the received data
            
            // Add additional logic to handle the parsed data here
            if(parsedData.mint && !this.state.subscriptionActive){
                // New token detected
                this.state.currentTokenCA = parsedData.mint;
                this.state.devPublicKey = parsedData.traderPublicKey;

                console.log("TokenCA: ", this.state.currentTokenCA);
                console.log("DevPublickKey: ", this.state.devPublicKey);

                // Validate token before trading
                if (await this.validateToken(parsedData.mint)) {
                    console.log("Buy coin: ", parsedData.mint);
                    await this.executeBuyStrategy(parsedData.mint);
                }

            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            //this.logError('message_processing_error', error);            
        }
    }

    async validateToken(TokenCA: string) {
        try {
            const token = new PublicKey(TokenCA);
            // Basic validation
            if (!PublicKey.isOnCurve(token)){
                console.log("Invalid public key - not on curve");
                return false;
            }

            // Check if token exists on Solana
            const tokenInfo = await this.web3Connection.getParsedAccountInfo(token);
            console.log("Token info: ", tokenInfo)

            // Check if account exists and has data
            if (!tokenInfo?.value) {
                console.log("Token account doesn't exist");
                //return false;
            }
            
            // Additional checks to avoid scams:
            // 1. Minimum liquidity check
            const liquidity = await this.getLiquidity(TokenCA);
            if (liquidity < CONFIG.TRADE_SETTINGS.minLiquidity) {
                console.log("Insufficient liquidity ", liquidity);
                //return false;
            }

            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    private async getLiquidity(tokenCA: string): Promise<number> {
        try {
            //const pools = await this.findLiquidityPools(tokenCA);

            return 10;
        } catch (error) {
            console.error('Error getting liquidity:', error);
            return 0;
        }
    }

    async executeBuyStrategy(tokenCA: string){
        try {
            // Execute buy
            const buyAmount = CONFIG.TRADE_SETTINGS.maxBuyAmount;
            const buyResult = await this.buyCoin(buyAmount, tokenCA);

            if (buyResult.success) {
                this.purchasedTokens.set(tokenCA, {
                    buyPrice: buyResult.price,
                    timestamp: Date.now(),
                    marketCap: this.state.marketMetrics.initialMarketCap
                });
                
                // Start monitoring for sell conditions
                //this.monitorSellConditions(tokenCA);
            }
            process.exit(0)

        } catch (error) {
            console.error('Buy strategy execution error:', error);
        }
    }

    async buyCoin(tokenAmount: number, tokenCA: string){
        try{
            const response = await fetch('https://pumpportal.fun/api/trade-local', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    publicKey: CONFIG.PUBLIC_KEY,
                    action: "buy",
                    mint: tokenCA,
                    denominatedInSol: "true",
                    amount: 0.001,
                    slippage: CONFIG.TRADE_SETTINGS.slippage,
                    priorityFee: CONFIG.TRADE_SETTINGS.priorityFee,
                    pool: "pump"
                })
            });

            if(response.status === 200){ // successfully generated transaction
                const data = await response.arrayBuffer();
                const tx = VersionedTransaction.deserialize(new Uint8Array(data));
                const signerKeyPair = Keypair.fromSecretKey(bs58.decode(CONFIG.PRIVATE_KEY));
                tx.sign([signerKeyPair]);
                const signature = await this.web3Connection.sendTransaction(tx)
                console.log("Transaction: https://solscan.io/tx/" + signature);

                this.logTrade('buy', {
                    tokenCA,
                    amount: tokenAmount,
                    signature,
                    timestamp: Date.now()
                });

                return { success: true, signature, price: 10 };//await this.getCurrentPrice(tokenCA) };

            } else {
                console.log(response.statusText); // log error
            }
            return { success: false };

        } catch (error) {
            console.error('Buy strategy execution error:', error);
            return { success: false };
        }
    }

    logTrade(type: string, data: { tokenCA: string; amount: number; signature: string; timestamp: number }) {
        const logEntry = {
            type,
            ...data
        };

        fs.appendFileSync(
            CONFIG.PATHS.tradesLog,
            JSON.stringify(logEntry) + '\n'
        );
    }
}

// Start the bot
const bot = new TradingBot();
bot.initialize().catch(error => {
    console.error('Bot initialization error:', error);
    process.exit(1);
});
