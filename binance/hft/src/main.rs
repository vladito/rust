use std::time::{SystemTime, UNIX_EPOCH};

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use reqwest::Client;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;

// Replace with your Binance API Key and Secret
const API_KEY: &str = "MyR8wbo7ukF01985fI11pa1QHneFZfN8ZPOr28MZHFSGW6qJVPOosBuP8JKqAQMx";
const API_SECRET: &str = "FX8ZJu8D2Z0W6ZgY9fe1vEyeJGp5WcRZlSq1hh7iJOve20oDkcR1QK5yFJBtbjux";

// WebSocket endpoint for price updates (BTCUSDT)
const BINANCE_WS_ENDPOINT: &str = "wss://stream.binance.com:9443/ws/btcusdt@trade";

// Binance REST API base URL
const BINANCE_API_URL: &str = "https://testnet.binance.vision";

// Connect to Binance WebSocket to receive real-time market data
async fn connect_to_websocket() {
    let (mut socket, _) = connect_async(BINANCE_WS_ENDPOINT)
        .await
        .expect("Failed to connect to Binance WebSocket");
    
    println!("Connected to Binance WebSocket");

    while let Some(msg) = socket.next().await{
        match msg{
            Ok(Message::Text(text)) => {
                println!("WebSocket Message: {}", &text);
            }            
            Ok(Message::Ping(ping)) => {
                println!("Ping!");
                socket.send(Message::Pong(ping)).await.unwrap();
            }
            Err(e) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
            Ok(_) => {}
        }
    }
}

// Place a Buy or Sell order using Binance REST API
async fn place_order(
    symbol: &str,
    side: &str,
    quantity: &str,
    price: &str,
) -> Result<serde_json::Value, reqwest::Error> {
    let client = Client::new();
    let timestamp = get_server_time();

    // Prepare the query string for the order
    let query_string = format!(
        "symbol={}&side={}&type=LIMIT&timeInForce=GTC&quantity={}&price={}&recvWindow=5000&timestamp={}",
        symbol, side, quantity, price, timestamp
    ); 

    // Sign the query string with HMAC-SHA256
    let signature = sign(&query_string, API_SECRET);

    // Create the final URL
    let url = format!("{}/api/v3/order?{}&signature={}", BINANCE_API_URL, query_string, signature);

    // Send the POST request
    let response = client
        .post(&url)
        .header("X-MBX-APIKEY", API_KEY)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    // Return `Ok(response)` which fits the expected return type
    Ok(response)
}

fn get_server_time() -> u64 {
    let start = SystemTime::now();
    let since_the_epoch = start.duration_since(UNIX_EPOCH).expect("Time went backwards");
    since_the_epoch.as_millis() as u64
}

// Sign the query string using HMAC-SHA256
fn sign(query_string: &str, secret: &str) -> String {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(query_string.as_bytes());
    let result = mac.finalize();
    let code_bytes = result.into_bytes();
    hex::encode(code_bytes)
}

#[tokio::main]
async fn main() {
    //Task 1: WebSocket for real-time data    
    let websocket_task =tokio::spawn(async move{
        connect_to_websocket().await;
    });

    // Task 2: Place an order via API (example: limit buy order)
    let order_response = place_order("BTCUSDT", "BUY", "0.001", "80000").await;
    match order_response {
        Ok(res) => println!("Order Response: {:?}", res),
        Err(e) => eprintln!("Error placing order: {:?}", e),
    }
    websocket_task.await.unwrap();
}