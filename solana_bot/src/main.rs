use teloxide::{prelude::*, utils::command::BotCommands};
use reqwest::Client;
use std::env;
use anyhow::{Result, Context};
use dotenv::dotenv;
use pretty_env_logger;
use serde_json::{json, Value}; 

#[derive(BotCommands, Clone)]
#[command(rename_rule = "lowercase", description = "Available commands")]
enum Command {
    #[command(description = "Get token information")]
    Info,
    #[command(description = "Display help message")]
    Help,
}

#[derive(Clone)]
struct AppState {
    client: Client,
    helius_api_key: String,
}

async fn handle_message(
    bot: Bot,
    msg: Message,
    cmd: Command,
    state: AppState,
) -> Result<()> {
    match cmd {
        Command::Info => {
            let request_body = json!({
                "jsonrpc": "2.0",          // JSON-RPC version
                "method": "getBalance",      // Method name
                "params": [
                    "2k5AXX4guW9XwRQ1AKCpAuUqgWDpQpwFfpVFh3hnm2Ha" // Replace with actual token address
                ],              // Parameters required by the method (update as necessary)
                "id": 1                    // Unique ID for the request
            });

            let response = state.client
                .get("https://mainnet.helius-rpc.com/")
                .header("Authorization", format!("Bearer {}", state.helius_api_key))
                .json(&request_body)
                .send()
                .await?
                .json::<Value>()
                .await?;
            
            // Display the response or handle it as needed
            println!("Response: {:?}", response);
            
            bot.send_message(msg.chat.id, format!("Token info: {}", response))
                .await
                .context("Failed to send message")?;
        }

        Command::Help => {
            let descriptions = Command::descriptions().to_string();
            bot.send_message(msg.chat.id, descriptions)
                .await
                .context("Failed to send help message")?;
        }
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    pretty_env_logger::init();
    log::info!("Starting bot...");

    let bot = Bot::from_env();
    let helius_api_key = env::var("HELIUS_API_KEY")
        .context("HELIUS_API_KEY must be set")?;

    let state = AppState{
        client:Client::new(),
        helius_api_key
    };
    
    log::info!("HELIUS_API_KEY: {}", state.helius_api_key); // Use log for better practice

    Command::repl(bot, move |bot, msg, cmd| {
        let state = state.clone();
        async move {
            if let Err(e) = handle_message(bot, msg, cmd, state).await {
                log::error!("Error: {:?}", e);
            }
            Ok(())
        }
    })
    .await;

    Ok(())
}
