//This code implements a gRPC server using the Tonic framework, which allows communication between a client and server.

use tonic::{transport::Server, Request, Response, Status};
use myservice::my_service_server::{MyService, MyServiceServer};
use myservice::{DataRequest, DataResponse};

pub mod myservice {
    tonic::include_proto!("myservice"); // The package name defined in your proto file
}

#[derive(Default)]
pub struct MyServiceImpl;

#[tonic::async_trait]
impl MyService for MyServiceImpl {
    async fn send_data(
        &self,
        request: Request<DataRequest>,
    ) -> Result<Response<DataResponse>, Status> {
        let reply = format!("Received Now: {}", request.into_inner().message);
        Ok(Response::new(DataResponse { reply }))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::1]:50052".parse()?;
    let my_service = MyServiceImpl::default();
    Server::builder()
    .add_service(MyServiceServer::new(my_service))
    .serve(addr)
    .await?;
    Ok(())
}
