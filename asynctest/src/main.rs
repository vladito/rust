// src/main.rs

use tokio;

async fn fetch_data(id: u32) -> String {
    // Simulate a delay
    tokio::time::sleep(std::time::Duration::from_secs(id)).await;
    format!("Data from task {}", id)
}

#[tokio::main]
async fn main() {
    let task1 = fetch_data(1);
    let task2 = fetch_data(2);
    let task3 = fetch_data(3);

    // Await all tasks concurrently
    let result1 = task1.await;
    let result2 = task2.await;
    let result3 = task3.await;

    println!("{}", result1); // Should print after 1 second
    println!("{}", result2); // Should print after 2 seconds
    println!("{}", result3); // Should print after 3 seconds
}
