import grpc
from grpc_health.v1 import health, health_pb2, health_pb2_grpc
from concurrent import futures
import transliteration_pb2_grpc
from transliteration_service import TransliterationService

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    transliteration_pb2_grpc.add_TransliterationServiceServicer_to_server(
        TransliterationService(), server
    )

    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

    health_servicer.set(
        "",
        health_pb2.HealthCheckResponse.SERVING
    )

    server.add_insecure_port("[::]:50051")
    server.start()
    print("gRPC server started on port 50051")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()