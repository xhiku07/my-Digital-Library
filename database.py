import sqlite3
import os

DB_PATH = '/data/library.db' if os.path.exists('/data') else 'library.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT,
            type TEXT,
            category TEXT,
            summary TEXT,
            link TEXT,
            doi TEXT,
            isbn TEXT,
            journal TEXT,
            year TEXT,
            tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()