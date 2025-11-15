import os
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
import requests

base_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv()

app = Flask(__name__, static_folder=base_dir, static_url_path='')

@app.route('/')
def index():
    return send_from_directory(base_dir, 'main.html')

@app.post('/jarvis-gemini')
def jarvis_gemini():
    data = request.get_json(silent=True) or {}
    transcript = str(data.get('transcript', '')).strip()
    lang = (data.get('language') or 'en').lower().strip()

    api_key = os.getenv('GEMINI_API_KEY')
    use_bn = (lang == 'bn')
    default_text = 'কোন ইনভয়েস ক্যাশ নাকি ই এম আই' if use_bn else 'Which invoice cash or emi'

    if not api_key:
        return jsonify({'speech': default_text}), 200

    language_name = 'Bengali (bn-IN)' if use_bn else 'English (en-US)'
    instruction = (
        'You are Jarvis, a concise voice assistant.\n'
        'Return only one short sentence for text-to-speech without quotes.\n'
        'Keep under 12 words.\n'
        f'Language: {language_name}.\n'
        f'Context: The user opened the dashboard and said: {transcript}.\n'
        'Goal: Politely ask which invoice type they want: Cash or EMI.'
    )

    payload = {
        'contents': [
            {
                'parts': [ {'text': instruction} ]
            }
        ],
        'generationConfig': {
            'temperature': 0.5,
            'maxOutputTokens': 50
        }
    }

    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + api_key

    try:
        resp = requests.post(url, json=payload, timeout=8)
        if not resp.ok:
            return jsonify({'speech': default_text}), 200
        data = resp.json()
        text = ''
        try:
            text = data['candidates'][0]['content']['parts'][0]['text']
        except Exception:
            try:
                for p in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
                    if 'text' in p:
                        text += p['text']
            except Exception:
                text = ''
        text = (text or '').strip().strip('"')
        if not text:
            text = default_text
        return jsonify({'speech': text}), 200
    except Exception:
        return jsonify({'speech': default_text}), 200

@app.get('/<path:path>')
def static_proxy(path):
    return send_from_directory(base_dir, path)

if __name__ == '__main__':
    port = int(os.getenv('PORT', '8000'))
    app.run(host='0.0.0.0', port=port)
