import webview
import sys
import os

if __name__ == '__main__':
    # URL to load
    url = 'http://localhost:3000'
    
    # Create the window
    window = webview.create_window(
        'SassyGurlStore Desktop', 
        url,
        width=1280,
        height=800,
        confirm_close=True
    )
    
    try:
        webview.start()
    except Exception as e:
        print("Error starting webview:", e)
