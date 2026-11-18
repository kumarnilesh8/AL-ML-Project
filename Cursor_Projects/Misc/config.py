"""
Configuration for MCP Server
"""

from dataclasses import dataclass

@dataclass
class MCPServerConfig:
    """Configuration for MCP Server"""
    name: str = "mcp-server"
    description: str = "MCP Server"
    version: str = "1.0.0"
    host: str = "localhost"
    port: int = 8000

# Create default configuration
MCP_CONFIG = MCPServerConfig()

