"""
Basic MCP Server
"""

import asyncio
import json
import logging
from typing import Dict, Any, List
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
from mcp import types
from config import MCP_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BasicMCPServer:
    """Basic MCP Server"""
    
    def __init__(self):
        self.server = Server("mcp-server")
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup MCP server handlers"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[types.Tool]:
            """List available tools"""
            return [
                types.Tool(
                    name="hello",
                    description="Simple hello tool",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Name to greet"
                            }
                        },
                        "required": []
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
            """Handle tool calls"""
            try:
                if name == "hello":
                    user_name = arguments.get("name", "World")
                    result = {"message": f"Hello, {user_name}!"}
                    return [types.TextContent(
                        type="text",
                        text=json.dumps(result, indent=2)
                    )]
                
                else:
                    return [types.TextContent(
                        type="text",
                        text=json.dumps({"status": "error", "error": f"Unknown tool: {name}"})
                    )]
            
            except Exception as e:
                logger.error(f"Error in tool call {name}: {e}")
                return [types.TextContent(
                    type="text",
                    text=json.dumps({"status": "error", "error": str(e)})
                )]
    
    async def run(self, transport):
        """Run the MCP server"""
        logger.info(f"Starting MCP Server: {MCP_CONFIG.name}")
        
        try:
            await self.server.run(
                transport,
                InitializationOptions(
                    server_name=MCP_CONFIG.name,
                    server_version=MCP_CONFIG.version,
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )
        except Exception as e:
            logger.error(f"Server error: {e}")
        finally:
            logger.info("MCP Server shutdown")

async def main():
    """Main entry point for the MCP server"""
    import sys
    from mcp.server.stdio import stdio_server
    
    server = BasicMCPServer()
    
    # Run with stdio transport
    async with stdio_server() as (read_stream, write_stream):
        await server.run(transport=(read_stream, write_stream))

if __name__ == "__main__":
    asyncio.run(main())
