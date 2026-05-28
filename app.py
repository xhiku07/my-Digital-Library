from database import init_db, get_db
from dotenv import load_dotenv
load_dotenv()
import os
import anthropic
from flask import Flask, render_template, request, jsonify, session
from functools import wraps
from database import init_db

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key')
PASSWORD = os.getenv('LIBRARY_PASSWORD', 'yourpassword')

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('auth'):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/login', methods=['POST'])
def login():
    if request.json.get('password') == PASSWORD:
        session['auth'] = True
        return jsonify({'success': True})
    return jsonify({'success': False})

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({'success': True})

init_db()

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def generate_summary(title, author):
    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=75,
        messages=[
            {"role": "user", "content": f"Summarize the academic work titled '{title}' by {author} in exactly 2 crisp sentences. No markdown, no hashtags, no headers, plain text only. If unfamiliar, respond: 'Summary unavailable — please add manually.'"}
        ]
    )
    return message.content[0].text


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/add', methods=['POST'])
@auth_required
def add_item():
    data = request.json
    
    conn = get_db()
    existing = conn.execute('SELECT summary FROM items WHERE title = ?', (data['title'],)).fetchone()
    if existing:
        conn.close()
        return jsonify({'success': False, 'error': 'Item already exists in your library'})
    
    if data.get('summary'):
        summary = data['summary']
    else:
        summary = generate_summary(data['title'], data['author'])
    

    conn.execute('''
        INSERT INTO items (title, author, type, category, summary, link, doi, tags, year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data['title'], data['author'], data['type'], data['category'], summary, data['link'], data.get('doi', ''), data['tags'], data.get('year', '')))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'summary': summary})

@app.route('/update/<int:item_id>', methods=['POST'])
@auth_required  
def update_item(item_id):
    data = request.json
    conn = get_db()
    conn.execute('''
        UPDATE items SET title=?, author=?, type=?, category=?, summary=?, link=?, doi=?, tags=?, year=?
        WHERE id=?
    ''', (data['title'], data['author'], data['type'], data['category'], data.get('summary', ''), data['link'], data.get('doi', ''), data['tags'], data.get('year', ''), item_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/delete/<int:item_id>', methods=['DELETE'])
@auth_required
def delete_item(item_id):
    conn = get_db()
    conn.execute('DELETE FROM items WHERE id=?', (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/items')
def get_items():
    conn = get_db()
    items = conn.execute('SELECT * FROM items ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(item) for item in items])


if __name__ == '__main__':
    app.run(debug =True)
