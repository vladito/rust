use reqwest;
use tokio;

#[tokio::main]
async fn main() {
    let url = "https://api-v3.raydium.io/main/version";
    
    match fetch_data(url).await {
        Ok(response) => println!("Response: {}", response),
        Err(e) => eprintln!("Error: {}", e),
    }
}

async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?.text().await?;
    Ok(response)
}
