use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // Connect to the market data WebSocket endpoint
    let url = "wss://stream.binance.com:9443/ws/bnbbtc@depth";
    let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");

    // Split the stream into a sender and receiver
    let (mut write, mut read) = ws_stream.split();

    // Subscribe to the market data stream
    let subscribe_msg = r#"{"method": "SUBSCRIBE", "params": ["aapl@ticker"], "id": 1}"#; // Adjust message according to Binance API
    write.send(Message::Text(subscribe_msg.into())).await.expect("Failed to send subscription");

    // Listen for incoming messages
    while let Some(message) = read.next().await {
        match message {
            Ok(msg) => match msg {
                Message::Text(data) => {
                    // Handle incoming market data
                    let data: serde_json::Value = serde_json::from_str(&data).expect("Invalid JSON");
                    if let Some(raw_data) = data.get("data") {
                        println!("Received market data: {}", raw_data);
                    } else {
                        println!("Received message: {}", data);
                    }
                }
                Message::Ping(ping_data) => {
                    // Respond to PING with PONG
                    let pong_msg = Message::Pong(ping_data);
                    write.send(pong_msg).await.expect("Failed to send PONG");
                }
                _ => {}
            },
            Err(e) => {
                eprintln!("Error receiving message: {}", e);
                break;
            }
        }

        // Sleep for a bit to avoid hitting the message rate limit
        sleep(Duration::from_millis(200)).await;
    }
}
