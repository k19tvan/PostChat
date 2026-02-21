import ngrok
import time

# Authenticate (optional if NGROK_AUTHTOKEN environment variable is set)
ngrok.set_auth_token("39nuQHQilkDTq5xuvdlSFTL548a_3M38W9uUHtPeuQk8cbDPf")

# Establish a tunnel to a specified port (e.g., 9000)
listener = ngrok.forward(8000, authtoken_from_env=False)

# Print the public URL
print(f"Ingress established at {listener.url()}")

# Keep the listener alive (for simple scripts)
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Closing listener")
    ngrok.disconnect()
