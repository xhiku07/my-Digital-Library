from database import init_db, get_db
from dotenv import load_dotenv
load_dotenv()
import os
import anthropic
from flask import Flask, render_template, request, jsonify
from database import init_db

app = Flask(__name__)

init_db()

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def generate_summary(title, author):
    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=75,
        messages=[
            {"role": "user", "content": f"Summarize the academic work titled '{title}' by {author} in exactly 2 crisp sentences. If you are not familiar with this work or cannot summarize it accurately, respond with exactly: 'Summary unavailable — please add manually.'"}
        ]
    )
    return message.content[0].text


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/add', methods=['POST'])
def add_item():
    data = request.json
    
    conn = get_db()
    existing = conn.execute('SELECT summary FROM items WHERE title = ?', (data['title'],)).fetchone()
    if existing:
        conn.close()
        return jsonify({'success': False, 'error': 'Item already exists in your library'})
    
    summary = generate_summary(data['title'], data['author'])
    

    conn.execute('''
        INSERT INTO items (title, author, type, category, summary, link, doi, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data['title'], data['author'], data['type'], data['category'], summary, data['link'], data.get('doi', ''), data['tags']))
    conn.commit()             
    conn.close()
    
    return jsonify({'success': True, 'summary': summary})

@app.route('/items')
def get_items():
    conn = get_db()
    items = conn.execute('SELECT * FROM items ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(item) for item in items])

if __name__ == '__main__':
    app.run(debug =True)
