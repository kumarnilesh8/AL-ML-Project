import os
import requests
import json
import re
import sys
from dotenv import load_dotenv
from pathlib import Path
from langchain_core.tools import tool

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


# Create a regular function first
def get_restaurant_recommendations_func(location: str):
    """Provides a list of top restaurant recommendations for a given location."""
    recommendations = {
        "munich": ["Hofbräuhaus", "Augustiner-Keller", "Tantris"],
        "new york": ["Le Bernardin", "Eleven Madison Park", "Joe's Pizza"],
        "paris": ["Le Meurice", "L'Ambroisie", "Bistrot Paul Bert"],
        "delhi": ["Dilkhush", "Rajdhani", "Paradise"],
    }
    return recommendations.get(location.lower(), ["No recommendations available"])


# Then create the tool wrapper
@tool
def get_restaurant_recommendations(location: str):
    """Provides a list of top restaurant recommendations for a given location."""
    return get_restaurant_recommendations_func(location)


def call_copilot_with_tools(user_message: str, tools: list) -> str:
    """Call Moody's Copilot with tool descriptions"""
    
    url = "https://copilot.moodys.com/api/v2/usecases/defaults/chat"
    
    headers = {
        "Content-Type": "application/json",
        "x-api-client": copilot_client,
        "x-api-key": copilot_key
    }
    
    # Build tool descriptions for the prompt
    tool_descriptions = []
    for tool_func in tools:
        tool_descriptions.append(f"- {tool_func.name}: {tool_func.description}")
    
    tools_text = "\n".join(tool_descriptions)
    
    # Enhanced prompt with tool information
    enhanced_message = f"""You have access to the following tools:
{tools_text}

If you need to use a tool, respond with: USE_TOOL: tool_name(argument)

User question: {user_message}"""
    
    messages = [{"role": "user", "content": enhanced_message}]
    
    payload = {
        "model": "gpt-4o",
        "messages": messages,
        "max_tokens": 4000
    }
    
    print(f"Calling Moody's Copilot...")
    response = requests.post(url, headers=headers, json=payload)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        try:
            result = response.json()
            print(f"JSON parsed successfully")
            
            # Extract content from Moody's Copilot format: data[0].message.content
            content = None
            if "data" in result and len(result["data"]) > 0:
                content = result["data"][0].get("message", {}).get("content", "")
                print(f"✓ Extracted from Moody's format: '{content[:100]}...'")
            # Fallback to OpenAI format
            elif "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0].get("message", {}).get("content", "")
                print(f"✓ Extracted from OpenAI format: '{content[:100]}...'")
            else:
                content = str(result)
                print(f"⚠ Using fallback (full result as string)")
            
            if not content:
                print("WARNING: Extracted content is empty!")
                return "Error: Empty response from API"
            
            # Check if tool should be called
            if "USE_TOOL:" in content and "get_restaurant_recommendations" in content:
                print("Tool call detected!")
                match = re.search(r'get_restaurant_recommendations\(["\']?([^"\')\n]+)["\']?\)', content)
                if match:
                    location = match.group(1).strip()
                    print(f"🔧 Calling tool: get_restaurant_recommendations('{location}')")
                    
                    # Call the regular function, not the StructuredTool
                    tool_result = get_restaurant_recommendations_func(location)
                    print(f"🔧 Tool result: {tool_result}")
                    
                    # Call LLM again with tool result
                    followup_message = f"The tool returned: {tool_result}. Please provide a natural response to the user."
                    messages.append({"role": "assistant", "content": content})
                    messages.append({"role": "user", "content": followup_message})
                    payload["messages"] = messages
                    
                    response2 = requests.post(url, headers=headers, json=payload)
                    if response2.status_code == 200:
                        result2 = response2.json()
                        # Extract from Moody's format
                        if "data" in result2 and len(result2["data"]) > 0:
                            final_content = result2["data"][0].get("message", {}).get("content", "")
                        else:
                            final_content = result2.get("choices", [{}])[0].get("message", {}).get("content", "")
                        return final_content if final_content else str(result2)
            
            return content
            
        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse JSON: {e}")
            print(f"Raw response: {response.text}")
            return f"Error: Invalid JSON response"
    else:
        error_msg = f"API Error {response.status_code}: {response.text}"
        print(error_msg)
        raise Exception(error_msg)


# Use it
if __name__ == "__main__":
    print("\n>>> Starting Demo")
    
    tools = [get_restaurant_recommendations]
    
    try:
        response = call_copilot_with_tools(
            "Recommend some restaurants in Delhi.",
            tools
        )
        
        print(f"\n✓ Final Response:")
        print(response)
    except Exception as e:
        print(f"\n❌ Error occurred: {e}")
        import traceback
        traceback.print_exc()