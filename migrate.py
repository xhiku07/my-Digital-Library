import sqlite3, json

conn = sqlite3.connect('library.db')
conn.row_factory = sqlite3.Row
items = [dict(row) for row in conn.execute('SELECT * FROM items').fetchall()]
conn.close()

with open('backup.json', 'w') as f:
    json.dump(items, f)