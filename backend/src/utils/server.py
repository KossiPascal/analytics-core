import signal
from flask import Flask
from werkzeug.serving import run_simple

def start_server(
    app: Flask,
    port: int,
    host="0.0.0.0",
    use_https=False,
    ssl_context=None,
):
    def shutdown(sig, frame):
        print("🛑 Server stopped")
        exit(0)

    signal.signal(signal.SIGINT, shutdown)

    run_simple(
        hostname=host,
        port=port,
        application=app,
        ssl_context=ssl_context if use_https else None,
        use_reloader=False,
    )
