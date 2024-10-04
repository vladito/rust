use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    commitment_config::CommitmentConfig,
};
use solana_transaction_status::UiTransactionEncoding;
use std::str::FromStr;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use url::Url;

const RAYDIUM_PUBLIC_KEY: &str = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
const WSS_URL: &str = "wss://mainnet.helius-rpc.com/?api-key=dbdba8cb-65a7-424b-82ab-9b1363f251ac";
const HTTP_URL: &str = "https://mainnet.helius-rpc.com/?api-key=dbdba8cb-65a7-424b-82ab-9b1363f251ac";
const INSTRUCTION_NAME: &str = "initialize2";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let raydium_pubkey = Pubkey::from_str(RAYDIUM_PUBLIC_KEY)?;
    let url = Url::parse(WSS_URL)?;
    let (ws_stream, _) = connect_async(url).await?;
    let (mut write, mut read) = ws_stream.split();

    println!("Monitoring logs for program: {}", raydium_pubkey);

    let subscribe_msg = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "logsSubscribe",
        "params": [
            {
                "mentions": [ RAYDIUM_PUBLIC_KEY ]
            },
            {
                "commitment": "finalized"
            }
        ]
    });
    write.send(Message::Text(subscribe_msg.to_string())).await?;

    let http_client = RpcClient::new(HTTP_URL.to_string());

    while let Some(msg) = read.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                let json: Value = serde_json::from_str(&text)?;
                println!("{}", json)
                // if let Some(result) = json.get("params").and_then(|p| p.get("result")) {
                //     if let Some(logs) = result.get("logs").and_then(|l| l.as_array()) {
                //         if logs.iter().any(|log| log.as_str().unwrap_or("").contains(INSTRUCTION_NAME)) {
                //             if let Some(signature) = result.get("signature").and_then(|s| s.as_str()) {
                //                 println!("Signature for 'initialize2': https://explorer.solana.com/tx/{}", signature);
                //                 if let Err(e) = fetch_raydium_mints(signature, &http_client).await {
                //                     eprintln!("Error fetching Raydium mints: {}", e);
                //                 }
                //             }
                //         }
                //     }
                // }
            }
            Ok(Message::Close(_)) => {
                println!("WebSocket connection closed");
                break;
            }
            Err(e) => {
                eprintln!("Error receiving message: {}", e);
            }
            _ => {}
        }
    }

    Ok(())
}

async fn fetch_raydium_mints(tx_id: &str, client: &RpcClient) -> Result<(), Box<dyn std::error::Error>> {
    let tx = client.get_transaction_with_config(
        &tx_id.parse()?,
        solana_client::rpc_config::RpcTransactionConfig {
            encoding: Some(UiTransactionEncoding::JsonParsed),
            commitment: Some(CommitmentConfig::confirmed()),
            max_supported_transaction_version: Some(0),
        },
    )?;

    //if let Some(transaction) = tx.transaction {
    //     if let Some(message) = transaction.message {
    //         if let Some(instructions) = message.instructions {
    //             let raydium_instruction = instructions.iter().find(|ix| {
    //                 ix.program_id == RAYDIUM_PUBLIC_KEY
    //             });

    //             if let Some(instruction) = raydium_instruction {
    //                 if let Some(accounts) = instruction.accounts.as_ref() {
    //                     if accounts.len() > 9 {
    //                         let token_a_account = &accounts[8];
    //                         let token_b_account = &accounts[9];

    //                         println!("New LP Found");
    //                         println!("Token A Account Public Key: {}", token_a_account);
    //                         println!("Token B Account Public Key: {}", token_b_account);
    //                     } else {
    //                         println!("Not enough accounts in the instruction");
    //                     }
    //                 } else {
    //                     println!("No accounts found in the instruction");
    //                 }
    //             } else {
    //                 println!("No Raydium instruction found in the transaction");
    //             }
    //         } else {
    //             println!("No instructions found in the transaction message");
    //         }
    //     } else {
    //         println!("No message found in the transaction");
    //     }
    // } else {
    //     println!("No transaction data found");
    //}

    Ok(())
}