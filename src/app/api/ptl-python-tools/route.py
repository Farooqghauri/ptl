import json

# This file defines the Python Serverless Function for Vercel's App Router.
# The URL endpoint is automatically mapped to: /api/ptl-python-tools

# --- 1. GET Handler (Health Check / Connectivity Test) ---
def GET(request):
    """
    Handles GET requests for a health check.
    """
    try:
        # Use the simpler, cleaner response from your latest version.
        return json.dumps({"status": "healthy", "service": "PTL Python Tools Serverless"}), 200
    except Exception as e:
        # Keep the logging from the previous version for better debugging visibility in the terminal.
        print(f"PTL Python Tools GET Error: {e}")
        return json.dumps({
            "error": "Failed to run GET handler."
        }), 500


# --- 2. POST Handler (Core Logic: Document Processing) ---
def POST(request):
    """
    Handles POST requests for document processing, using your logic to confirm data receipt.
    """
    try:
        # Use the robust data parsing from your latest version.
        # Vercel's runtime injects a Request object with a .json() method.
        data = request.json()
        input_text = data.get('text', 'No input text found.')

        # Create a detailed response confirming the data received
        response_data = {
            "status": "success",
            # Show a snippet of the received data for confirmation
            "text": f"Vercel function received your data: '{input_text[:50]}...' and is ALIVE!",
            "message": "Routing confirmed. Next step: Integrate full file processing/AI logic here."
        }

        # Return the response as a JSON string and status code.
        return json.dumps(response_data), 200

    except Exception as e:
        # Log the detailed error in your development terminal
        print(f"PTL Python Tools POST Error: {e}")
        
        # Return a server error response to the frontend
        return json.dumps({
            "error": f"Failed to process request. Vercel Python Error: {str(e)}"
        }), 500