"""
Main entry point for MCP Server
"""

import asyncio
import sys
import argparse
import logging
from mcp_server import main as run_mcp_server

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MCP Server")
    parser.add_argument(
        "--mode", 
        choices=["server"],
        default="server",
        help="Run mode (default: server)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.mode == "server":
            logger.info("Starting MCP Server mode...")
            asyncio.run(run_mcp_server())
            
    except KeyboardInterrupt:
        print("\nShutdown requested by user")
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

