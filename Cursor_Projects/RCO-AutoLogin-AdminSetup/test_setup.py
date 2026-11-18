"""
Test script to verify the web server setup
Run this to check if everything is configured correctly
"""
import os
import sys

def test_files():
    """Check if all required files exist"""
    print("="*60)
    print("RCO Auto Login - Setup Verification")
    print("="*60)
    print("\n1. Checking required files...")
    
    required_files = [
        'app.py',
        'templates/index.html',
        'requirements.txt',
        'Ralex Auto Start.py',
        'RCO_Login_Admin_Setup.py'
    ]
    
    missing_files = []
    for file in required_files:
        if os.path.exists(file):
            print(f"   ✓ {file}")
        else:
            print(f"   ✗ {file} - MISSING!")
            missing_files.append(file)
    
    if missing_files:
        print("\n❌ Error: Missing required files!")
        return False
    
    print("\n✓ All required files present")
    return True


def test_imports():
    """Check if required Python packages are installed"""
    print("\n2. Checking Python dependencies...")
    
    packages = {
        'flask': 'Flask',
        'flask_cors': 'Flask-CORS',
        'selenium': 'Selenium',
        'webdriver_manager': 'WebDriver Manager'
    }
    
    missing_packages = []
    for module, name in packages.items():
        try:
            __import__(module)
            print(f"   ✓ {name}")
        except ImportError:
            print(f"   ✗ {name} - NOT INSTALLED!")
            missing_packages.append(name)
    
    if missing_packages:
        print("\n❌ Error: Missing Python packages!")
        print("\nTo install, run:")
        print("   pip install -r requirements.txt")
        return False
    
    print("\n✓ All dependencies installed")
    return True


def test_chrome():
    """Check if Chrome browser is available"""
    print("\n3. Checking Chrome browser...")
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        # Try to create a headless Chrome instance
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        try:
            driver = webdriver.Chrome(options=options)
            driver.quit()
            print("   ✓ Chrome browser is available")
            return True
        except Exception as e:
            print(f"   ⚠ Chrome check failed: {e}")
            print("   Note: Chrome will be needed when running the scripts")
            return True  # Don't fail setup check for this
            
    except Exception as e:
        print(f"   ⚠ Could not verify Chrome: {e}")
        return True


def get_network_info():
    """Display network information"""
    print("\n4. Network Information...")
    
    try:
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        print(f"   Computer Name: {hostname}")
        print(f"   IP Address: {local_ip}")
        print(f"\n   Access URLs:")
        print(f"   - Local:   http://localhost:5000")
        print(f"   - Network: http://{local_ip}:5000")
        
    except Exception as e:
        print(f"   ⚠ Could not get network info: {e}")


def main():
    """Run all tests"""
    all_ok = True
    
    # Run tests
    if not test_files():
        all_ok = False
    
    if not test_imports():
        all_ok = False
    
    test_chrome()
    get_network_info()
    
    # Final result
    print("\n" + "="*60)
    if all_ok:
        print("✅ Setup verification PASSED!")
        print("\nYou're ready to start the server!")
        print("\nTo start:")
        print("   - Double-click: start_server.bat")
        print("   - Or run: python app.py")
    else:
        print("❌ Setup verification FAILED!")
        print("\nPlease fix the issues above before starting the server.")
    print("="*60)
    
    return 0 if all_ok else 1


if __name__ == '__main__':
    sys.exit(main())











