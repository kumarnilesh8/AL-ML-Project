# IsDB Oracle Database MCP Server

A Model Context Protocol (MCP) server for connecting to IsDB Oracle Database using the `oracledb` Python library. This server provides database operations through MCP tools and includes comprehensive connection management.

## Features

- 🔗 Oracle Database connection using `oracledb` (not cx-Oracle)
- 🏊 Connection pooling for better performance
- 🛠️ MCP server with database tools
- 🧪 Comprehensive testing capabilities
- 🎯 Interactive mode for manual testing
- 📊 Database schema exploration
- ⚡ Async/await support

## Database Configuration

The server connects to IsDB Oracle Database with the following parameters:
- **Username**: IBSM
- **Password**: a
- **Hostname**: ADB-WXISDBIN002
- **Port**: 1521
- **Service Name**: ORCLPDB
- **DSN**: ADB-WXISDBIN002:1521/ORCLPDB

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Ensure Oracle Instant Client is installed on your system for the oracledb library

## Usage

### 1. MCP Server Mode (Default)

Run as an MCP server:
```bash
python main.py --mode server
```

### 2. Test Mode

Run connection tests:
```bash
python main.py --mode test
```

### 3. Interactive Mode

Run in interactive mode for manual testing:
```bash
python main.py --mode interactive
```

### 4. Direct Testing

Run the test script directly:
```bash
python test_connection.py
```

## MCP Tools

The server provides the following MCP tools:

### `test_connection`
- **Description**: Test the database connection and return connection info
- **Parameters**: None
- **Returns**: Connection status and database information

### `execute_query`
- **Description**: Execute a SQL query on the IsDB Oracle database
- **Parameters**:
  - `sql` (required): SQL query to execute
  - `parameters` (optional): Parameters for the SQL query
- **Returns**: Query results or affected row count

### `get_table_info`
- **Description**: Get information about tables in the database
- **Parameters**:
  - `table_name` (optional): Specific table name to get info for
- **Returns**: Table structure or list of all tables

### `get_schema_info`
- **Description**: Get schema information for the current user
- **Parameters**: None
- **Returns**: Count of different database objects (tables, views, etc.)

## File Structure

```
RFO_IsDB/
├── requirements.txt          # Python dependencies
├── config.py                 # Database and MCP configuration
├── database_connection.py    # Database connection management
├── mcp_server.py            # MCP server implementation
├── test_connection.py       # Connection testing script
├── main.py                  # Main entry point
└── README.md                # This documentation
```

## Configuration

Configuration is managed in `config.py`:

```python
# Database Configuration
DB_CONFIG = DatabaseConfig(
    username="IBSM",
    password="a", 
    hostname="ADB-WXISDBIN002",
    port=1521,
    service_name="ORCLPDB"
)

# MCP Server Configuration  
MCP_CONFIG = MCPServerConfig(
    name="isdb-oracle-server",
    description="MCP Server for IsDB Oracle Database Operations",
    version="1.0.0"
)
```

## Connection Management

The `IsDBConnection` class provides:
- Connection pooling with configurable min/max connections
- Context manager for automatic connection cleanup
- Async/await support for non-blocking operations
- Comprehensive error handling
- Support for both SELECT and DML operations

## Testing

The test suite includes:
1. **Basic Connection Test**: Verifies database connectivity
2. **Query Operations Test**: Tests SELECT and DML queries
3. **Connection Pool Test**: Tests concurrent connections
4. **Error Handling Test**: Verifies proper error handling

Run tests with:
```bash
python test_connection.py
```

## Security Considerations

⚠️ **Important Security Notes**:
- The password is currently stored in plain text in the configuration
- For production use, consider using environment variables or secure credential stores
- Implement proper authentication and authorization mechanisms
- Use connection encryption (TLS) when possible

## Troubleshooting

### Common Issues

1. **Oracle Client Not Found**
   - Install Oracle Instant Client
   - Ensure it's in your PATH or use `oracledb.init_oracle_client(lib_dir="path")`

2. **Connection Timeout**
   - Verify network connectivity to ADB-WXISDBIN002:1521
   - Check firewall settings
   - Ensure the Oracle service is running

3. **Authentication Failed**
   - Verify username (IBSM) and password (a) are correct
   - Check if the user account is active and not locked

4. **Service Name Issues**
   - Confirm ORCLPDB is the correct service name
   - Try using SID instead of service name if needed

### Debug Mode

Enable debug logging by modifying the logging level:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Development

To extend functionality:

1. **Add New MCP Tools**: Modify `mcp_server.py` to add new tools
2. **Extend Database Operations**: Add methods to `IsDBConnection` class
3. **Add Configuration Options**: Extend configuration classes in `config.py`

## Dependencies

- `oracledb==2.0.2`: Oracle database connectivity (not cx-Oracle)
- `mcp==1.0.0`: Model Context Protocol server
- `python-dotenv==1.0.0`: Environment variable management
- `asyncio==3.4.3`: Async/await support
- `typing-extensions==4.8.0`: Type hints
- `pydantic==2.5.0`: Data validation

## License

This project is provided as-is for IsDB Oracle Database connectivity purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Test the connection using the interactive mode
4. Verify database connectivity outside of this application
