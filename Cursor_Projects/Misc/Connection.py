import oracledb

connection = oracledb.connect(
    user="IBSM",
    password="a",
    host="ADB-WXISDBIN002",
    port=1521,  # Usually 1521; confirm with your MCP server config
    service_name="ORCLPDB"
)

# Example usage
cursor = connection.cursor()
cursor.execute("SELECT 1 FROM DUAL")
print(cursor.fetchone())
connection.close()