const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");

    stmt.run(username, password, function (err) {
        if (err) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        res.json({ success: true });
    });
    stmt.finalize();
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err || !row) {
            return res.status(400).json({ success: false });
        }
        res.json({ success: true, username: row.username });
    });
});

app.post('/api/posts', (req, res) => {
    const { title, content, author } = req.body;
    const stmt = db.prepare("INSERT INTO posts (title, content, date, author) VALUES (?, ?, ?, ?)");

    stmt.run(title, content, new Date().toISOString(), author, function (err) {
        if (err) {
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, post: { id: this.lastID, title, content, date: new Date().toISOString(), author, upvotes: 0, downvotes: 0 } });
    });
    stmt.finalize();
});

app.get('/api/posts', (req, res) => {
    db.all("SELECT * FROM posts", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, posts: rows });
    });
});

app.get('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.json({ success: true, post: row });
    });
});

app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, author } = req.body;

    db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (row.author !== author) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
        }
        const stmt = db.prepare("UPDATE posts SET title = ?, content = ? WHERE id = ?");
        stmt.run(title, content, id, function (err) {
            if (err) {
                return res.status(500).json({ success: false });
            }
            res.json({ success: true });
        });
        stmt.finalize();
    });
});

app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const { author } = req.body;

    db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (row.author !== author) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }
        const stmt = db.prepare("DELETE FROM posts WHERE id = ?");
        stmt.run(id, function (err) {
            if (err) {
                return res.status(500).json({ success: false });
            }
            res.json({ success: true });
        });
        stmt.finalize();
    });
});

app.post('/api/comments', (req, res) => {
    const { postId, comment, author } = req.body;
    const stmt = db.prepare("INSERT INTO comments (post_id, comment, date, author) VALUES (?, ?, ?, ?)");

    stmt.run(postId, comment, new Date().toISOString(), author, function (err) {
        if (err) {
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, comment: { id: this.lastID, postId, comment, date: new Date().toISOString(), author } });
    });
    stmt.finalize();
});

app.get('/api/comments/:postId', (req, res) => {
    const { postId } = req.params;
    db.all("SELECT * FROM comments WHERE post_id = ?", [postId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, comments: rows });
    });
});

app.post('/api/posts/:id/upvote', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?", [id], function (err) {
        if (err) {
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

app.post('/api/posts/:id/downvote', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?", [id], function (err) {
        if (err) {
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
