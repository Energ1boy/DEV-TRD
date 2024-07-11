const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)");
    db.run("CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, date TEXT, author TEXT, upvotes INTEGER DEFAULT 0, downvotes INTEGER DEFAULT 0)");
    db.run("CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, comment TEXT, date TEXT, author TEXT, FOREIGN KEY(post_id) REFERENCES posts(id))");
});

module.exports = db;