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
llm = ChatOpenAI(api_key=os.environ["OPENAI_API_KEY"])


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


tools=[get_restaurant_recommendations]
llm = ChatOpenAI()
llm_with_tools=llm.bind_tools(tools)


messages = [
    HumanMessage("Recommend some restaurants in Delhi.")
]
print(">>> starting toolcalling_demo.py")
#TODO: Invoke the llm
llm_output=llm_with_tools.invoke(messages)
print(llm_output)