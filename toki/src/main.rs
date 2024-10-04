use tokio::io::AsyncReadExt;
use tokio::time;
use log::Level;

async fn sleeper() {
    log::info!("Sleeping");
    time::sleep(time::Duration::from_secs(1)).await;
    log::info!("Awake");
}

async fn reader() {
    log::info!("reading some beeg data");
    let mut f = tokio::fs::File::open("beeg.csv").await.unwrap();
    let mut contents = vec![];
    f.read_to_end(&mut contents).await.unwrap();
    log::info!("Read beeg {} bytes", contents.len());
}

async fn run() {
    // sleeper().await;
    // reader().await;
    tokio::join!(sleeper(), reader(), reader(), reader(), reader(), reader(), reader(), reader(), reader(), reader(), reader());
}

fn main() {
    simple_logger::init_with_level(Level::Info).unwrap();
    let start = std::time::Instant::now();

    let rt = tokio::runtime::Runtime::new().unwrap();
    let future = run();

    rt.block_on(future);

    let end = std::time::Instant::now();
    log::info!("Took {:?} seconds", end - start)
}
