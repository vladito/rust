use tonic::{transport::Server, Request, Response, Status};
use trading::trading_service_server::{TradingService, TradingServiceServer};
use trading::{OrderRequest, OrderResponse};

pub mod trading {
    tonic::include_proto!("trading");
}

#[derive(Debug, Default)]
pub struct MyTradingService {}

#[tonic::async_trait]
impl TradingService for MyTradingService {
    async fn place_order(
        &self,
        request: Request<OrderRequest>,
    ) -> Result<Response<OrderResponse>, Status> {
        let order = request.into_inner();

        println!(
            "Placing order: {} {} @ ${}, {}",
            order.quantity, order.symbol, order.price, order.order_type
        );

        let response = OrderResponse {
            status: "SUCCESS".to_string(),
            message: "Order placed successfully".to_string(),
        };

        Ok(Response::new(response))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::1]:50051".parse().unwrap();
    let trading_service = MyTradingService::default();

    println!("TradingService listening on {}", addr);

    Server::builder()
        .add_service(TradingServiceServer::new(trading_service))
        .serve(addr)
        .await?;

    Ok(())
}
