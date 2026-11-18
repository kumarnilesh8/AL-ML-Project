"""
Flask Web Server for RCO Auto Login Scripts
Provides a web interface to launch Python automation scripts
"""
import os
import subprocess
import threading
import time
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Base directory for scripts
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Script definitions
SCRIPTS = {
    'ralex': {
        'name': 'Ralex Auto Start',
        'file': 'Ralex Auto Start.py',
        'description': 'Automated login and instance startup for Ralex Analytics'
    },
    'rco': {
        'name': 'RCO Login Admin Setup',
        'file': 'RCO_Login_Admin_Setup.py',
        'description': 'Automated admin configuration for RCO Web Server Settings'
    }
}

# Store execution status
execution_status = {}


def run_script(script_key, script_path):
    """Run a Python script in a separate process"""
    try:
        execution_status[script_key] = {
            'status': 'running',
            'start_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'output': '',
            'error': ''
        }
        
        # Run the script using Python
        process = subprocess.Popen(
            ['python', script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=BASE_DIR
        )
        
        # Wait for process to complete (with timeout)
        stdout, stderr = process.communicate(timeout=300)  # 5 minute timeout
        
        execution_status[script_key].update({
            'status': 'completed' if process.returncode == 0 else 'failed',
            'end_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'output': stdout,
            'error': stderr,
            'return_code': process.returncode
        })
        
    except subprocess.TimeoutExpired:
        execution_status[script_key].update({
            'status': 'timeout',
            'end_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'error': 'Script execution timed out after 5 minutes'
        })
    except Exception as e:
        execution_status[script_key].update({
            'status': 'error',
            'end_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'error': str(e)
        })


@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')


@app.route('/api/scripts', methods=['GET'])
def get_scripts():
    """Get list of available scripts"""
    return jsonify({
        'success': True,
        'scripts': SCRIPTS
    })


@app.route('/api/run/<script_key>', methods=['POST'])
def run_single_script(script_key):
    """Run a single script"""
    if script_key not in SCRIPTS:
        return jsonify({
            'success': False,
            'error': f'Script "{script_key}" not found'
        }), 404
    
    script_info = SCRIPTS[script_key]
    script_path = os.path.join(BASE_DIR, script_info['file'])
    
    if not os.path.exists(script_path):
        return jsonify({
            'success': False,
            'error': f'Script file not found: {script_info["file"]}'
        }), 404
    
    # Check if script is already running
    if script_key in execution_status and execution_status[script_key].get('status') == 'running':
        return jsonify({
            'success': False,
            'error': 'Script is already running'
        }), 400
    
    # Run script in background thread
    thread = threading.Thread(target=run_script, args=(script_key, script_path))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'success': True,
        'message': f'Started {script_info["name"]}',
        'script_key': script_key
    })


@app.route('/api/run/both', methods=['POST'])
def run_both_scripts():
    """Run both scripts sequentially"""
    results = []
    
    for script_key in ['ralex', 'rco']:
        script_info = SCRIPTS[script_key]
        script_path = os.path.join(BASE_DIR, script_info['file'])
        
        if not os.path.exists(script_path):
            results.append({
                'script': script_key,
                'success': False,
                'error': f'Script file not found: {script_info["file"]}'
            })
            continue
        
        # Check if script is already running
        if script_key in execution_status and execution_status[script_key].get('status') == 'running':
            results.append({
                'script': script_key,
                'success': False,
                'error': 'Script is already running'
            })
            continue
        
        # Run script in background thread
        thread = threading.Thread(target=run_script, args=(script_key, script_path))
        thread.daemon = True
        thread.start()
        
        results.append({
            'script': script_key,
            'success': True,
            'message': f'Started {script_info["name"]}'
        })
        
        # Small delay between scripts
        time.sleep(2)
    
    return jsonify({
        'success': True,
        'message': 'Started both scripts',
        'results': results
    })


@app.route('/api/status/<script_key>', methods=['GET'])
def get_status(script_key):
    """Get execution status of a script"""
    if script_key not in SCRIPTS:
        return jsonify({
            'success': False,
            'error': f'Script "{script_key}" not found'
        }), 404
    
    status = execution_status.get(script_key, {
        'status': 'not_started',
        'message': 'Script has not been executed yet'
    })
    
    return jsonify({
        'success': True,
        'script_key': script_key,
        'status': status
    })


@app.route('/api/status', methods=['GET'])
def get_all_status():
    """Get execution status of all scripts"""
    all_status = {}
    for script_key in SCRIPTS.keys():
        all_status[script_key] = execution_status.get(script_key, {
            'status': 'not_started',
            'message': 'Script has not been executed yet'
        })
    
    return jsonify({
        'success': True,
        'status': all_status
    })


@app.route('/api/clear/<script_key>', methods=['POST'])
def clear_status(script_key):
    """Clear execution status for a script"""
    if script_key in execution_status:
        del execution_status[script_key]
    
    return jsonify({
        'success': True,
        'message': f'Status cleared for {script_key}'
    })


if __name__ == '__main__':
    # Get local IP address
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print("\n" + "="*60)
    print("RCO Auto Login - Web Interface")
    print("="*60)
    print(f"\nServer starting...")
    print(f"\nAccess the web interface at:")
    print(f"  Local:   http://localhost:5000")
    print(f"  Network: http://{local_ip}:5000")
    print(f"\nShare the Network URL with other users on the same network")
    print("="*60 + "\n")
    
    # Run Flask server - accessible from network
    app.run(
        host='0.0.0.0',  # Listen on all network interfaces
        port=5000,
        debug=False,
        threaded=True
    )











