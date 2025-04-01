export interface MarketMetrics {
    initialMarketCap: number | null;
    highestMarketCap: number | null;
    currentDipLowest: number | null;
    postBuyHighestMarketCap: number | null;
    lastUpdated: Date | null;
}

export interface TradeConfig {
    buyFactorRise: number;
    dipFactor: number;
    postBuyDrop: number;
    sellProfitRise: number;
    inactivityTimeout: number;
    maxBuyAmount: number;
    slippage: number;
    priorityFee: number;
    initialHoldTime: number;
    uniqueHolders: number;
    minVolume: number;
    unsubscribeDelay: number;
    solPrice: number;
}

export interface BotState {
    currentTokenCA: string | null;
    subscribedTokens: Set<string>;
    devPublicKey: string | null;
    processedTokens: Set<string>;    
    marketMetrics: MarketMetrics;
    volumes: Map<string, number>;
    isActive: boolean;
    metrics: Metrics;
}

export interface TradeLog {
    type: 'buy' | 'sell';
    tokenCA: string;
    amount: number;
    signature: string;
    timestamp: number;
    price: number;
}

export interface Metrics {
    tradesExecuted: number;
    successfulTrades: number;
    failedTrades: number;
    averageLatency: number;
    profitLoss: number;
}

export interface HealthCheck {
    lastPing: Date;
    wsConnected: boolean;
    activeTokens: number;
    cpuUsage: number;
    memoryUsage: number;
}
