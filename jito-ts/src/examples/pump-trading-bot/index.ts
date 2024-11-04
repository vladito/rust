import WebSocket from 'ws';
import { CONFIG } from './config';
import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from "bs58";
import fs from 'fs';  // Import fs for file handling
import axios from 'axios';
import fetch from 'node-fetch';

interface MarketMetrics {
    initialMarketCap: number | null;
    highestMarketCap: number | null;
    currentDipLowest: number | null;
    postBuyHighestMarketCap: number | null;
}

interface BotState {
    currentTokenCA: string | null;
    subscribedTokens: Set<string>;
    devPublicKey: string | null;
    processedTokens: Set<string>;    
    marketMetrics: MarketMetrics;
    volumes: Map<string, number>; // Track trading volume for each token
}

class TradingBot {
    ws: WebSocket | null; // Allow ws to be either WebSocket instance or null
    state: BotState;
    web3Connection: Connection;
    purchasedTokens: Map<string, any>;
    timeouts: { holderCheck: null; tradeActivity: null; inactivity: null; };
    solToUsdRate: number | null = null;   

    constructor() {
        this.ws = null; // Initialize the WebSocket property to null
        this.web3Connection = new Connection(CONFIG.RPC_ENDPOINT, 'confirmed');
        this.purchasedTokens = new Map<string, any>();
        this.state = {
            currentTokenCA: null,
            subscribedTokens: new Set(),
            devPublicKey: null,
            processedTokens: new Set(),
            marketMetrics: {
                initialMarketCap: null,
                highestMarketCap: null,
                currentDipLowest: null,
                postBuyHighestMarketCap: null
            }, 
            volumes: new Map<string, number>()       
        };
        this.timeouts = {
            holderCheck: null,
            tradeActivity: null,
            inactivity: null
        };
    }

    async initialize() {
        this.solToUsdRate = await this.updateSolToUsdRate();
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
            // connection closed, discard old websocket and create a new one in 5s
            this.ws = null
            setTimeout(this.setupWebSocket, 5000)
        });
    }

    async handleWebSocketMessage(data: WebSocket.Data) {
        try {
            const messageString = data.toString();
            const parsedData = JSON.parse(messageString); // Parse the JSON data
            
            // Token minted
            if(parsedData.mint && !this.state.subscribedTokens.has(parsedData.mint)){
                console.log('Mint created:', parsedData);

                // New token detected
                this.state.currentTokenCA = parsedData.mint;
                this.state.devPublicKey = parsedData.traderPublicKey;

                console.log("TokenCA: ", this.state.currentTokenCA);
                console.log("DevPublickKey: ", this.state.devPublicKey);

                // Subscribe to token trade events for the newly minted token
                this.subscribeToTokenTrade(parsedData.mint);

                // Validate token before trading
                if (await this.validateToken(parsedData.mint)) {
                    console.log("Buy coin: ", parsedData.mint);
                    await this.executeBuyStrategy(parsedData.mint);
                }
            }
            else if ((parsedData.txType === 'buy' || parsedData.txType === 'sell') && parsedData.mint) {
                console.log('Transaction data:', parsedData)
                // Extract tokenAmount and market price data from the parsed message
                const tokenCA = parsedData.mint;
                const tokenAmount = parsedData.tokenAmount;
                
                // Calculate price per token using vSolInBondingCurve or other price data
                const pricePerToken = parsedData.vSolInBondingCurve / parsedData.vTokensInBondingCurve;

                if (this.solToUsdRate === null) {
                    console.error('SOL to USD rate is not available, cannot calculate transaction volume.');
                    this.solToUsdRate = CONFIG.TRADE_SETTINGS.solPrice;
                }

                // Calculate transaction volume as tokenAmount * pricePerToken
                const transactionVolume = tokenAmount * pricePerToken * this.solToUsdRate; 

                // Initialize the volume tracker if it doesn't exist yetclear

                if (!this.state.volumes.has(tokenCA)) {
                    this.state.volumes.set(tokenCA, 0);
                }

                // Accumulate volume for the token
                const currentVolume = this.state.volumes.get(tokenCA) ?? 0;
                this.state.volumes.set(tokenCA, currentVolume + transactionVolume);

                console.log(`Updated volume for ${tokenCA}: ${this.state.volumes.get(tokenCA)} USD`);
            }
            else{
                // Use case for when subscription
                console.log('Received data:', parsedData);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            //this.logError('message_processing_error', error);            
        }
    }

    subscribeToTokenTrade(TokenCA: string) {
        const payload = {
            method: "subscribeTokenTrade",
            keys: [TokenCA]
        };
        this.ws?.send(JSON.stringify(payload));
        console.log(`Subscribed to trade events for token: ${TokenCA}`);
        this.state.subscribedTokens.add(TokenCA);
    }

    unSubscribeToTokenTrade(TokenCA: string) {
        const payload = {
            method: "unsubscribeTokenTrade",
            keys: [TokenCA]
        };
        this.ws?.send(JSON.stringify(payload));
        console.log(`Unsubscribed to trade events for token: ${TokenCA}`);
        this.state.subscribedTokens.add(TokenCA);
    }

    async validateToken(TokenCA: string): Promise<boolean> {
        const startTime = Date.now(); // Record the start time
    
        try {
            let uniqueHolders = 0;
            let currentVolume = this.state.volumes.get(TokenCA) || 0;
    
            while (true) {
                // Check if the elapsed time exceeds the unsubscribe delay
                if (Date.now() - startTime > CONFIG.TRADE_SETTINGS.unsubscribeDelay) {
                    console.log(`Time exceeded 1 hour while validating token ${TokenCA}. Unsubscribing from token.`);
                    this.unSubscribeToTokenTrade(TokenCA); // Unsubscribe from the token
                    return false; // Return false after unsubscribing
                }
    
                // Update the unique holders count
                uniqueHolders = await this.getUniqueHoldersCount(TokenCA);
                console.log(`Token ${TokenCA} has ${uniqueHolders} holders.`);
    
                // Check the trading volume
                currentVolume = this.state.volumes.get(TokenCA) || 0;
                console.log(`Token ${TokenCA} has trading volume of $${currentVolume}.`);
    
                // Check conditions for passing both rules
                if (uniqueHolders > CONFIG.TRADE_SETTINGS.uniqueHolders && currentVolume > CONFIG.TRADE_SETTINGS.minVolume) {
                    console.log(`Token ${TokenCA} has passed both rules: ${uniqueHolders} holders and trading volume of $${currentVolume}.`);
                    return true; // Both conditions are met
                } else {
                    // If not, wait for the specified time before rechecking
                    console.log(`Token ${TokenCA} is not valid yet. Rechecking in 1 minute...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.TRADE_SETTINGS.initialHoldTime)); // Wait for 1 minute
                }
            }
        } catch (error) {
            console.error('Token validation error:', error);
            return false; // Return false in case of an error
        }
    }   
    
    async getUniqueHoldersCount(TokenCA: string) {
        try {
            const url = `https://mainnet.helius-rpc.com/?api-key=` + CONFIG.HELIUS_API_KEY;
            let page = 1;
            // allOwners will store all the addresses that hold the token
            let allOwners = new Set();

            while (true) {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "getTokenAccounts",
                        id: "helius-test",
                        params: {
                        page: page,
                        limit: 1000,
                        displayOptions: {},
                        //mint address for the token we are interested in
                        mint: TokenCA,
                        },
                    }),
                });
                const data = await response.json();

                // Pagination logic. 
                if (!data.result || data.result.token_accounts.length === 0) {
                    console.log(`No more results. Total pages: ${page - 1}`);
                    break;
                }
                console.log(`Processing results from page ${page}`);
                // Adding unique owners to a list of token owners. 
                data.result.token_accounts.forEach((account: { owner: unknown; }) =>
                    allOwners.add(account.owner)
                );
                page++;
            }
            console.log("Owners: ", allOwners);
            return allOwners.size;
        } catch (error) {
            console.error('Error fetching token holders:', error);
            throw error;
        }
    }
 
    // Function to get the SOL price in USD using Helius API
    async updateSolToUsdRate(): Promise<number | null> {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`); // Handle non-2xx responses
            }

            const data = await response.json();

            // Check if data and the expected properties exist
            if (data && data.solana && data.solana.usd !== undefined) {
                this.solToUsdRate = data.solana.usd; // Update the last rate
                return this.solToUsdRate; // Return the current rate
            } else {
                console.error('Unexpected response structure:', data);
                return this.solToUsdRate; // Return the last successful rate if available
            }
        } catch (error) {
            console.error('Error updating SOL to USD rate:', error);
            return this.solToUsdRate; // Return the last successful rate if an error occurs
        }
    }

    async executeBuyStrategy(tokenCA: string){
        try {
            // Execute buy
            const buyAmount = CONFIG.TRADE_SETTINGS.maxBuyAmount;
            // const buyResult = await this.buyCoin(buyAmount, tokenCA);

            // if (buyResult.success) {
            //     this.purchasedTokens.set(tokenCA, {
            //         buyPrice: buyResult.price,
            //         timestamp: Date.now(),
            //         marketCap: this.state.marketMetrics.initialMarketCap
            //     });
                
            //     // Start monitoring for sell conditions
            //     //this.monitorSellConditions(tokenCA);
            // }
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
                    amount: 0.00001,
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

                const responseGetCurrentPrice = await this.getCurrentPrice(tokenCA);
                const price = responseGetCurrentPrice.price;
                const tokensReceived = responseGetCurrentPrice.tokensReceived;

                this.logTrade('buy', {
                    tokenCA,
                    amount: tokensReceived,
                    signature,
                    timestamp: Date.now()
                });

                return { success: true, signature, price: price };

            } else {
                console.log(response.statusText); // log error
            }
            return { success: false };

        } catch (error) {
            console.error('Buy strategy execution error:', error);
            return { success: false };
        }
    }

    async getCurrentPrice(tokenCA: string, signature?: string): Promise<{ price: number; tokensReceived: number }> {
        try {
            // If we have a signature, wait for transaction confirmation and get details
            if (signature) {
                // Wait for transaction confirmation
                await this.web3Connection.confirmTransaction(signature, 'confirmed');
                
                // Fetch transaction details from Helius
                const response = await fetch(
                    `https://api.helius.xyz/v0/transactions/?api-key=${CONFIG.HELIUS_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            transactions: [signature]
                        })
                    }
                );
    
                const data = await response.json();
                const txDetails = data[0];
    
                // Parse token transfers from the transaction
                const tokenTransfers = txDetails.tokenTransfers;
                if (!tokenTransfers) {
                    throw new Error("No token transfers found in transaction");
                }
    
                // Find the token transfer for our token
                const transfer = tokenTransfers.find((t: { mint: string; }) => t.mint === tokenCA);
                if (!transfer) {
                    throw new Error("Target token transfer not found");
                }
    
                // Calculate price from native token amount and tokens received
                const solAmount = txDetails.nativeTransfers
                    .filter((t: { fromUserAccount: string; }) => t.fromUserAccount === CONFIG.PUBLIC_KEY)
                    .reduce((sum: any, t: { amount: any; }) => sum + t.amount, 0) / 1e9; // Convert lamports to SOL
    
                const tokensReceived = transfer.tokenAmount;
                const price = solAmount / tokensReceived;
    
                return {
                    price,
                    tokensReceived
                };
            }
            else {
                return { price: 0, tokensReceived: 0 };
            }    
        } catch (error) {
            console.error('Error getting current price:', error);
            return { price: 0, tokensReceived: 0 };
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
