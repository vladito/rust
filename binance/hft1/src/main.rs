use std::time::{SystemTime, UNIX_EPOCH};

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use reqwest::Client;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;
use ta::{indicators::{RelativeStrengthIndex, MovingAverageConvergenceDivergence}, Next};
use serde_json::Value;

// Replace with your Binance API Key and Secret
const API_KEY: &str = "MyR8wbo7ukF01985fI11pa1QHneFZfN8ZPOr28MZHFSGW6qJVPOosBuP8JKqAQMx";
const API_SECRET: &str = "FX8ZJu8D2Z0W6ZgY9fe1vEyeJGp5WcRZlSq1hh7iJOve20oDkcR1QK5yFJBtbjux";
const BINANCE_API_URL: &str = "https://testnet.binance.vision";

// WebSocket base URL
const BINANCE_WS_BASE_URL: &str = "wss://stream.binance.com:9443/ws/";

// Function to trade a specific pair
async fn trade_pair(symbol: String) {
    let websocket_url = format!("{}{}@trade", BINANCE_WS_BASE_URL, symbol);

    // WebSocket connection for price data
    let (mut socket, _) = connect_async(websocket_url)
        .await
        .expect("Failed to connect to Binance WebSocket");

    // Technical indicators: RSI(14) and MACD(12, 26, 9)
    let mut rsi = RelativeStrengthIndex::new(14).unwrap();
    let mut macd = MovingAverageConvergenceDivergence::new(12, 26, 9).unwrap();

    let mut closing_prices: Vec<f64> = Vec::new();
    
    while let Some(msg) = socket.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                //println!("WebSocket Message: {}", &text);
                let parsed: Value = serde_json::from_str(&text).unwrap();
                
                // Extract price from the message
                let price_str = parsed["p"].as_str().unwrap();
                let price: f64 = price_str.parse().unwrap();
                
                // Store closing prices for indicators
                closing_prices.push(price);
                
                // If we have enough data, calculate the indicators
                if closing_prices.len() > 14 {
                    let rsi_value = rsi.next(price);
                    let macd_value = macd.next(price);

                    // Simple trading strategy based on RSI and MACD
                    if rsi_value < 30.0 && macd_value.macd > macd_value.signal {
                        println!("Buy Signal for {}: Price: {}, RSI: {}, MACD: {}", symbol, price, rsi_value, macd_value.macd);
                        let _ = place_order(&symbol.to_uppercase(), "BUY", "0.001", &price.to_string()).await;
                    } else if rsi_value > 70.0 && macd_value.macd < macd_value.signal {
                        println!("Sell Signal for {}: Price: {}, RSI: {}, MACD: {}", symbol, price, rsi_value, macd_value.macd);
                        let _ = place_order(&symbol.to_uppercase(), "SELL", "0.001", &price.to_string()).await;
                    }
                }
            }
            Ok(Message::Ping(ping)) => {
                socket.send(Message::Pong(ping)).await.unwrap();
            }
            Ok(_) => {}
            Err(e) => {
                eprintln!("WebSocket error for {}: {}", symbol, e);
                break;
            }
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
    // List of trading pairs
    let trading_pairs = vec!["btcusdt", "ethusdt", "bnbusdt"];
    
    // Trade each pair concurrently
    let mut tasks = vec![];
    for pair in trading_pairs {
        tasks.push(tokio::spawn(trade_pair(pair.to_string())));
    }

    // Wait for all tasks to complete
    for task in tasks {
        task.await.unwrap();
    }
}