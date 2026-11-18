import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Build path to .env file (one level up from basics/)
env_path = Path.cwd().parent / '.env'
print(f"Looking for .env at: {env_path}")
print(f".env exists: {env_path.exists()}")

# Load it
load_dotenv(dotenv_path=env_path)

# These will work because load_dotenv() loaded them
copilot_key = os.getenv("COPILOT_X_API_KEY")
copilot_client = os.getenv("COPILOT_X_API_CLIENT")

if copilot_key and copilot_client:
    os.environ["COPILOT_X_API_KEY"] = copilot_key
    os.environ["COPILOT_X_API_CLIENT"] = copilot_client
    print("✓ Environment variables set successfully")
else:
    print("✗ One or more variables not found in .env")
BASE_URL = "https://copilot.moodys.com/api"

def chat_with_copilot(user_message: str) -> str:
    """
    POST request to Moody's Copilot Chat API
    """
    url = f"{BASE_URL}/v2/usecases/defaults/chat"
    
    print(f"URL: {url}")
    print(f"Headers: x-api-client={copilot_client[:10]}..., x-api-key={copilot_key[:10]}...")
    
    # Headers with custom authentication
    headers = {
        "Content-Type": "application/json",
        "x-api-client": copilot_client,
        "x-api-key": copilot_key
    }
    
    # Build messages array
    messages = [{"role": "user","content": user_message}]
        
    # Request body matching Swagger schema
    payload = {
        "model": "gpt-4.1",
        "messages": messages
    }

    # Make POST request
    response = requests.post(url, headers=headers, json=payload)
    
    print(f"Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")


    if response.status_code == 200:
        result = response.json()
        # Extract the assistant's response (adjust based on actual response structure)
        return result.get("choices", [{}])[0].get("message", {}).get("content", "")
    else:
        raise Exception(f"API Error {response.status_code}: {response.text}")

# Example usage
if __name__ == "__main__":
    response = chat_with_copilot(
        user_message="Whos eon Musk ?",
    )
    print(response)