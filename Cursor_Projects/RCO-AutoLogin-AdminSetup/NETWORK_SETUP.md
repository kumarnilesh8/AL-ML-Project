# Network Sharing Setup Guide

This guide helps you configure Windows to allow other users on your network to access the web interface.

## 🌐 Sharing the Web Interface

### Step 1: Get Your Network IP Address

When you start the server (`python app.py`), you'll see:
```
Network: http://192.168.x.x:5000
```

This is the URL you share with others. Example: `http://192.168.1.100:5000`

### Step 2: Configure Windows Firewall

#### Option A: Quick Method (Windows Defender Firewall)

1. Press `Windows + R` and type: `wf.msc` → Press Enter
2. Click **Inbound Rules** in the left panel
3. Click **New Rule** in the right panel
4. Select **Port** → Click Next
5. Select **TCP** → Enter port number: `5000` → Click Next
6. Select **Allow the connection** → Click Next
7. Check all: Domain, Private, Public → Click Next
8. Name: `RCO Web Interface` → Click Finish

#### Option B: Command Line Method (Run as Administrator)

Open Command Prompt as Administrator and run:

```cmd
netsh advfirewall firewall add rule name="RCO Web Interface" dir=in action=allow protocol=TCP localport=5000
```

To remove the rule later:
```cmd
netsh advfirewall firewall delete rule name="RCO Web Interface"
```

### Step 3: Verify Network Access

1. On another computer on the same network
2. Open a web browser
3. Enter the Network URL: `http://192.168.x.x:5000`
4. You should see the RCO Control Panel

## 🔍 Troubleshooting Network Access

### Problem: "This site can't be reached"

**Solution 1: Check if server is running**
- Make sure `python app.py` is running
- Don't close the Command Prompt window

**Solution 2: Check firewall**
- Follow the firewall configuration steps above
- Temporarily disable firewall to test (not recommended for production)

**Solution 3: Verify same network**
- Both computers must be on the same network
- Check Wi-Fi connection or network settings

**Solution 4: Try different port**
If port 5000 is blocked or used:
1. Edit `app.py`
2. Change `port=5000` to `port=8080` (or any available port)
3. Update firewall rule for new port
4. Restart the server

### Problem: Connection refused or timeout

**Check 1: Network configuration**
```cmd
ipconfig
```
Look for "IPv4 Address" - should be 192.168.x.x or 10.x.x.x

**Check 2: Test server locally first**
- On the server computer, try `http://localhost:5000`
- If this doesn't work, there's a server issue

**Check 3: Ping test**
From the client computer:
```cmd
ping 192.168.x.x
```
Replace with your server's IP. If this fails, there's a network connectivity issue.

### Problem: Firewall blocks connection

**Windows Defender Firewall:**
1. Control Panel → Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings"
4. Find Python or add it
5. Check Private and Public networks

**Third-party Firewall:**
- If using Norton, McAfee, etc., consult their documentation
- Add an exception for port 5000 or Python

## 🔒 Security Best Practices

### 1. Use Private Networks Only
- Don't expose to public/guest Wi-Fi
- Use company/home private networks

### 2. Know Your Users
- Only share URL with trusted team members
- Scripts contain sensitive credentials

### 3. Monitor Access
- Watch the server terminal for connection attempts
- Look for unexpected IP addresses

### 4. Use VPN for Remote Access
- If users are not on same physical network
- Connect via company VPN first
- Then access the web interface

### 5. Stop Server When Not in Use
- Close the Command Prompt to stop the server
- Don't leave running overnight unnecessarily

## 📱 Accessing from Mobile Devices

Yes! You can access from phones/tablets on the same network:

1. Connect mobile device to same Wi-Fi
2. Open mobile browser (Chrome, Safari, etc.)
3. Enter the Network URL: `http://192.168.x.x:5000`
4. Bookmark for easy access

## 🖥️ Multiple Users Simultaneously

- Multiple users can access the interface at the same time
- However, only one script execution at a time
- If someone is running a script, others must wait
- Status updates are visible to all users in real-time

## 🔄 Keeping the Server Running

### Option 1: Keep Command Prompt Open
- Simple but requires keeping window open
- Computer must stay on

### Option 2: Run as Background Service (Advanced)
Use `pythonw` instead of `python`:
```cmd
start pythonw app.py
```
This runs without a visible window.

To stop:
```cmd
taskkill /F /IM pythonw.exe
```

### Option 3: Task Scheduler (Advanced)
Set up Windows Task Scheduler to auto-start on system boot.

## 📊 Finding Your IP Address

**Method 1: From Server Output**
Just read it when starting: `python app.py`

**Method 2: Command Prompt**
```cmd
ipconfig | findstr IPv4
```

**Method 3: Settings**
1. Windows Settings → Network & Internet
2. Click your connection (Wi-Fi or Ethernet)
3. Find "IPv4 address"

## ❓ Common Questions

**Q: Can people outside my building access it?**
A: No, only devices on your local network (same Wi-Fi/LAN)

**Q: Do I need a static IP?**
A: Not required, but helpful. Your IP might change after router restart.

**Q: Can I use a domain name instead of IP?**
A: Yes, with local DNS setup, but that's advanced. IP address works fine.

**Q: How many users can connect?**
A: Practically unlimited viewers, but one script executor at a time.

**Q: Will this work with corporate networks?**
A: Usually yes, but some corporate networks block internal servers. Check with IT.

## 🆘 Still Having Issues?

1. **Check server logs** - Look at the Command Prompt where server is running
2. **Test locally** - Always verify `http://localhost:5000` works first
3. **Network basics** - Ping test, same subnet verification
4. **Firewall logs** - Check Windows Firewall logs for blocks
5. **Try different port** - Some networks block certain ports

---

**Need more help?** Check the main README.md or QUICK_START.txt files.











