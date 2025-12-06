import os
import json
import base64
import pdfplumber
from docx import Document
import tempfile

def handler(request):
    """Main Vercel serverless function handler"""
    try:
        method = request.get('method', 'GET')
        
        # Handle GET request
        if method == 'GET':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'status': 'PTL Tools API is running',
                    'endpoint': 'POST /api/ptl-tools'
                })
            }
        
        # Handle POST request
        elif method == 'POST':
            content_type = request.get('headers', {}).get('content-type', '')
            
            # Handle multipart/form-data (File upload)
            if 'multipart/form-data' in content_type:
                return handle_multipart_form_data(request)
            
            # Handle JSON with base64
            elif 'application/json' in content_type:
                return handle_json_request(request)
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Unsupported content type'})
                }
        
        # Handle OPTIONS for CORS
        elif method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def handle_multipart_form_data(request):
    """Handle FormData uploads from frontend"""
    try:
        # Get the raw body
        body = request.get('body', b'')
        is_base64 = request.get('isBase64Encoded', False)
        
        if is_base64:
            body = base64.b64decode(body)
        
        # Extract boundary from content-type
        content_type = request.get('headers', {}).get('content-type', '')
        boundary = None
        
        if 'boundary=' in content_type:
            boundary = '--' + content_type.split('boundary=')[1].strip()
        
        if not boundary or not body:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid form data'})
            }
        
        # Simple parsing for form data
        parts = body.split(boundary.encode())
        
        file_content = None
        filename = None
        
        for part in parts:
            if b'filename=' in part:
                # Extract filename
                lines = part.split(b'\r\n')
                for line in lines:
                    if b'filename=' in line:
                        filename = line.split(b'filename="')[1].split(b'"')[0].decode('utf-8')
                        break
                
                # Extract file content
                header_end = part.find(b'\r\n\r\n')
                if header_end != -1:
                    file_content = part[header_end + 4:]
                    # Remove trailing --\r\n
                    file_content = file_content.rstrip(b'\r\n--')
                    break
        
        if file_content and filename:
            result = process_file(file_content, filename)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result)
            }
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No file found in request'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def handle_json_request(request):
    """Handle JSON request with base64 file"""
    try:
        body = request.get('body', '{}')
        is_base64 = request.get('isBase64Encoded', False)
        
        if is_base64:
            body = base64.b64decode(body).decode('utf-8')
        
        body_data = json.loads(body)
        
        if 'file' in body_data and 'filename' in body_data:
            file_content = base64.b64decode(body_data['file'])
            filename = body_data['filename']
            
            result = process_file(file_content, filename)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(result)
            }
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing file data in JSON'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def process_file(file_content, filename):
    """Process uploaded file and extract text"""
    try:
        ext = os.path.splitext(filename.lower())[1]
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name
        
        try:
            # PDF Extraction
            if ext == '.pdf':
                text = ""
                try:
                    with pdfplumber.open(tmp_path) as pdf:
                        for page in pdf.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                except Exception as e:
                    return {
                        'text': '',
                        'ocr_required': True,
                        'message': f'PDF processing error: {str(e)}'
                    }
                
                if not text.strip():
                    return {
                        'text': '',
                        'ocr_required': True,
                        'message': 'PDF has no extractable text. OCR required.'
                    }
                
                return {
                    'text': text.strip(),
                    'ocr_required': False,
                    'filename': filename
                }
            
            # DOCX Extraction
            elif ext == '.docx':
                try:
                    doc = Document(tmp_path)
                    paragraphs = []
                    for para in doc.paragraphs:
                        if para.text.strip():
                            paragraphs.append(para.text)
                    
                    text = "\n".join(paragraphs)
                    
                    if not text.strip():
                        return {
                            'text': '',
                            'ocr_required': False,
                            'message': 'Document appears to be empty'
                        }
                    
                    return {
                        'text': text.strip(),
                        'ocr_required': False,
                        'filename': filename
                    }
                except Exception as e:
                    return {
                        'text': '',
                        'ocr_required': False,
                        'message': f'DOCX processing error: {str(e)}'
                    }
            
            # TXT Extraction
            elif ext == '.txt':
                try:
                    text = file_content.decode('utf-8', errors='ignore')
                    return {
                        'text': text.strip(),
                        'ocr_required': False,
                        'filename': filename
                    }
                except Exception as e:
                    return {
                        'text': '',
                        'ocr_required': False,
                        'message': f'TXT processing error: {str(e)}'
                    }
            
            else:
                return {
                    'text': '',
                    'ocr_required': False,
                    'message': f'Unsupported file type: {ext}'
                }
        
        finally:
            # Clean up
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    except Exception as e:
        return {
            'text': '',
            'ocr_required': False,
            'message': f'File processing failed: {str(e)}'
        }