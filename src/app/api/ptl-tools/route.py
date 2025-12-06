import os
import json
import base64
import pdfplumber
from docx import Document
import tempfile

# Handler for Vercel Serverless Functions
def handler(request):
    try:
        # Handle GET request
        if request['method'] == 'GET':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'status': 'PTL Tools API is running',
                    'endpoints': {
                        'POST /api/ptl-tools': 'Extract text from files (PDF/DOCX/TXT)'
                    }
                })
            }
        
        # Handle POST request for file processing
        elif request['method'] == 'POST':
            # Parse the request body
            body = request.get('body', '{}')
            
            # Check if body is base64 encoded (Vercel sometimes encodes binary)
            is_base64 = request.get('isBase64Encoded', False)
            
            if is_base64:
                body = base64.b64decode(body).decode('utf-8')
            
            try:
                body_data = json.loads(body)
            except:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Invalid JSON in request body'})
                }
            
            # Check for file data
            if 'file' not in body_data or 'filename' not in body_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Missing file or filename in request'})
                }
            
            # Decode base64 file content
            try:
                file_content = base64.b64decode(body_data['file'])
                filename = body_data['filename']
                
                # Get file extension
                _, ext = os.path.splitext(filename.lower())
                
                # Process file based on extension
                result = process_file(file_content, ext, filename)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps(result)
                }
                
            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'File processing error: {str(e)}'})
                }
        
        # Handle OPTIONS for CORS
        elif request['method'] == 'OPTIONS':
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
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }

def process_file(file_content, ext, filename):
    """Process uploaded file and extract text"""
    try:
        # Create a temporary file
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
                        'error': f'PDF processing error: {str(e)}',
                        'ocr_required': True
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
                    'filename': filename,
                    'file_type': 'pdf'
                }
            
            # DOCX Extraction
            elif ext == '.docx':
                try:
                    doc = Document(tmp_path)
                    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
                    return {
                        'text': text,
                        'ocr_required': False,
                        'filename': filename,
                        'file_type': 'docx'
                    }
                except Exception as e:
                    return {
                        'error': f'DOCX processing error: {str(e)}',
                        'ocr_required': False
                    }
            
            # TXT Extraction
            elif ext == '.txt':
                try:
                    text = file_content.decode('utf-8', errors='ignore')
                    return {
                        'text': text,
                        'ocr_required': False,
                        'filename': filename,
                        'file_type': 'txt'
                    }
                except Exception as e:
                    return {
                        'error': f'TXT processing error: {str(e)}',
                        'ocr_required': False
                    }
            
            else:
                return {
                    'error': f'Unsupported file type: {ext}',
                    'supported_types': ['.pdf', '.docx', '.txt']
                }
        
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    except Exception as e:
        return {'error': f'File processing failed: {str(e)}'}