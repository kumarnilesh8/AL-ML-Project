from mcp.server.fastmcp import FastMCP
mcp=FastMCP("TestWeather")

@mcp.tool()
def get_weather(city: str) -> str:
    return "The Weather is Nice and Rainy"

if __name__ == "__main__":
    mcp.run()