# RCO Auto Login - Web Control Panel

A web-based control panel for executing Python automation scripts for Ralex and RCO systems.

## 🌟 Features

- **Web Interface**: Beautiful, modern UI accessible from any web browser
- **Individual Script Execution**: Run each script independently
- **Batch Execution**: Run both scripts sequentially with one click
- **Real-time Status Updates**: Live monitoring of script execution
- **Network Shareable**: Accessible from other computers on the same network
- **Detailed Logging**: View script output and errors in real-time

## 📋 Prerequisites

- Python 3.7 or higher
- Chrome browser (for Selenium automation)
- Network connectivity (for sharing with other users)

## 🚀 Installation

### 1. Install Dependencies

Open a terminal/command prompt in the project directory and run:

```bash
pip install -r requirements.txt
```

### 2. Verify Script Files

Ensure the following Python scripts are in the project directory:
- `Ralex Auto Start.py`
- `RCO_Login_Admin_Setup.py`

## 🎯 Usage

### Starting the Web Server

1. Open a terminal/command prompt in the project directory
2. Run the Flask server:

```bash
python app.py
```

3. You'll see output showing the server addresses:
   ```
   ============================================================
   RCO Auto Login - Web Interface
   ============================================================
   
   Access the web interface at:
     Local:   http://localhost:5000
     Network: http://192.168.x.x:5000
   
   Share the Network URL with other users on the same network
   ============================================================
   ```

### Accessing the Web Interface

#### On the Same Computer:
- Open your browser and go to: `http://localhost:5000`

#### From Other Computers on the Network:
1. Note the "Network" URL displayed when you started the server (e.g., `http://192.168.1.100:5000`)
2. Share this URL with other users
3. They can open it in their browser to access the control panel
4. **Important**: Make sure the computer running the server stays on and the script is running

### Using the Web Interface

1. **Run Individual Scripts**:
   - Click the "Run Script" button on the desired script card
   - Watch the status update in real-time

2. **Run Both Scripts**:
   - Click the "Run Both Scripts" button in the Quick Execute section
   - Both scripts will run sequentially

3. **Monitor Status**:
   - The "Execution Status" section shows real-time updates
   - View start/end times, errors, and output logs

## 🔒 Security Notes

- The web server is accessible to anyone on your local network
- Ensure you trust all users who have network access
- The scripts contain hardcoded credentials - keep the system secure
- Consider running on a private/isolated network

## 🛠️ Troubleshooting

### Port Already in Use
If port 5000 is already in use, edit `app.py` and change the port number:
```python
app.run(host='0.0.0.0', port=5001)  # Change to different port
```

### Cannot Access from Other Computers
1. Check your firewall settings - allow incoming connections on port 5000
2. Ensure both computers are on the same network
3. Windows Firewall: Add an inbound rule for port 5000
   ```
   Control Panel → Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port → TCP → 5000
   ```

### Script Execution Fails
- Verify Chrome browser is installed
- Check that ChromeDriver is compatible with your Chrome version
- Review script output in the Status section for specific errors

### Dependencies Not Found
Make sure you've installed all requirements:
```bash
pip install -r requirements.txt
```

## 📁 Project Structure

```
RCO-Auto Login-AdminSetup/
├── app.py                          # Flask web server
├── templates/
│   └── index.html                  # Web interface
├── Ralex Auto Start.py            # Ralex automation script
├── RCO_Login_Admin_Setup.py       # RCO admin automation script
├── requirements.txt                # Python dependencies
├── README.md                       # This file
└── Docker_Ralex/                   # Docker configs (if any)
    Docker_RCO_Login/
```

## 🔄 API Endpoints

The Flask server provides these REST API endpoints:

- `GET /` - Serve the web interface
- `GET /api/scripts` - Get list of available scripts
- `POST /api/run/<script_key>` - Run a single script
- `POST /api/run/both` - Run both scripts
- `GET /api/status` - Get status of all scripts
- `GET /api/status/<script_key>` - Get status of specific script
- `POST /api/clear/<script_key>` - Clear status for a script

## 📝 Script Information

### Ralex Auto Start
- **Purpose**: Automated login to Ralex Analytics and instance startup
- **Target**: `https://ralex.analytics.moodys.net/Ralex/Logon.aspx`
- **Actions**: Login → Navigate to Cloud menu → Start instance by name

### RCO Login Admin Setup
- **Purpose**: Automated admin configuration for RCO Web Server
- **Target**: `http://adb-wxisdbin002.analytics.moodys.net:9780/MAUIWeb/html/login.html`
- **Actions**: Login → Admin Tools → Environment → Web Server Settings → Configure URLs

## ⚠️ Important Notes

1. **Browser Windows**: Scripts open Chrome windows that remain open for verification
2. **Timeouts**: Scripts have a 5-minute execution timeout
3. **Concurrent Execution**: Running scripts prevents starting new instances until completion
4. **Credentials**: Hardcoded in the Python scripts - update as needed

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review script output in the web interface
3. Check browser console for JavaScript errors (F12 → Console)

## 📄 License

Internal use only - Moody's Analytics

---

**Version**: 1.0  
**Last Updated**: December 2025











