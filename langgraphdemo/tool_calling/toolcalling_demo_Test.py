from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from dotenv import load_dotenv
import os
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

@tool
def get_restaurant_recommendations(location: str):
    """Provides a list of top restaurant recommendations for a given location."""
    recommendations = {
        "munich": ["Hofbräuhaus", "Augustiner-Keller", "Tantris"],
        "new york": ["Le Bernardin", "Eleven Madison Park", "Joe's Pizza"],
        "paris": ["Le Meurice", "L'Ambroisie", "Bistrot Paul Bert"],
        "delhi": ["Dilkhush", "Rajdhani", "Paradise"],
    }
    return recommendations.get(location.lower(), ["No recommendations available for this location."])


# TODO: Bind the tool to the model

 # set this in your terminal first

llm = ChatOpenAI(
    model="gpt-4.1-mini",          # e.g. "gpt-4o-mini" or the name your service uses
    api_key=copilot_key,
    base_url="https://copilot.moodys.com/api/v2/usecases/chat",   # adjust to match your service, e.g. /api or /api/v1
)
tools=[get_restaurant_recommendations]
llm_with_tools=llm.bind_tools(tools)


messages = [
    HumanMessage("Recommend some restaurants in Delhi.")
]
print(">>> starting toolcalling_demo.py")
#TODO: Invoke the llm
llm_output=llm_with_tools.invoke(messages)
print(llm_output)