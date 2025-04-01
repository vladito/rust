export const CONFIG = {
    RPC_ENDPOINT: 'https://mainnet.helius-rpc.com/?api-key=dbdba8cb-65a7-424b-82ab-9b1363f251ac', // e.g., 'https://api.mainnet-beta.solana.com'
    WEBSOCKET: 'wss://pumpportal.fun/api/data',
    PUBLIC_KEY: '4BW9jw6BtMATXCrd31B9RY9Kf6P31XFFqKb3jvyBizDA',
    PRIVATE_KEY: '8bjuAe6sVQA1m1gi9LDqqKZZ7dt8VmWFoGP5ZRag5Z2RYNiEViREBuwEc9hetALx4MG2QM5Hx7e7hPumPvrDJPW',
    HELIUS_API_KEY: 'dbdba8cb-65a7-424b-82ab-9b1363f251ac',
    JITO_API_KEY: 'YOUR_JITO_API_KEY', // Get this from jito.wtf
    TRADE_SETTINGS: {
        buyFactorRise: 1.10,     // 10% rise before buying
        dipFactor: 0.95,         // 5% dip detection
        postBuyDrop: 0.80,       // 20% maximum drop after buying
        sellProfitRise: 1.30,    // 30% profit target
        inactivityTimeout: 30000, // 30 seconds        
        maxBuyAmount: 5000000,
        slippage: 50,
        priorityFee: 0.001,
        initialHoldTime: 1 * 60 * 1000,
        uniqueHolders: 15,
        minVolume: 20000,
        unsubscribeDelay: 60 * 60 * 1000, // one hour of validation
        solPrice: 199,
        MIN_LIQUIDITY_THRESHOLD: 1000
    },
    PATHS: {
        logFile: '/home/vladoram/projects/jito-ts/logs/dev.txt',
        sellsLog: '/home/vladoram/projects/jito-ts/logs/sells_log.txt',
        tradesLog: '/home/vladoram/projects/jito-ts/logs/trades_log.txt'
    }
};