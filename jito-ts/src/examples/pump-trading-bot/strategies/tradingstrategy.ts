import WebSocket from 'ws';

// Function to send a request to the WebSocket server
function sendRequest(ws: WebSocket) {
    const request = {
        jsonrpc: "2.0",
        id: 420,
        method: "accountSubscribe",
        "params": [
            "Dwwg1n1Z8urA1NMp4mkxYF57JNb9o5rKsk48Q5Rjpump",
            {
            "encoding": "jsonParsed",
            "commitment": "finalized"
            }
        ]
    };
    ws.send(JSON.stringify(request));
}

function websocketHandler() {
    // Create a WebSocket connection
    let ws = new WebSocket('wss://mainnet.helius-rpc.com/?api-key=dbdba8cb-65a7-424b-82ab-9b1363f251ac');

    // Define WebSocket event handlers

    ws.on('open', function open() {
        console.log('WebSocket is open');
        sendRequest(ws); // Send a request once the WebSocket is open
    });

    ws.on('message', function incoming(data) {
        const messageStr = data.toString('utf8');
        console.log('Received:', messageStr);
    });

    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
    });

    ws.on('close', function close() {
        console.log('WebSocket connection closed');
        // connection closed, discard old websocket and create a new one in 5s
    });
}

websocketHandler();