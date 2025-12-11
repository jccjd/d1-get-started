DROP TABLE IF EXISTS todos;
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
INSERT INTO todos (title) VALUES ('学习 Cloudflare Workers');
