import grpc
from proto import service_pb2
from proto import service_pb2_grpc

def run():
    # Connect to the Rust server
    with grpc.insecure_channel('localhost:50052') as channel:
        stub = service_pb2_grpc.MyServiceStub(channel)

        # Call the SendData method
        response = stub.SendData(service_pb2.DataRequest(message="Hello from Python!"))
        print(f"Received: {response.reply}")

if __name__ == '__main__':
    run()
