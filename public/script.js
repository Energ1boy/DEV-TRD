document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const postForm = document.getElementById('postForm');
    const editPostForm = document.getElementById('editPostForm');
    const commentForm = document.getElementById('commentForm');
    const postList = document.getElementById('posts'); // Corrected selection
    const authDiv = document.getElementById('auth');
    const newPostDiv = document.getElementById('newPost');
    const editPostDiv = document.getElementById('editPost');
    const postDetailDiv = document.getElementById('postDetail');
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');
    const postAuthor = document.getElementById('postAuthor');
    const commentList = document.getElementById('commentList');
    const editPostId = document.getElementById('editPostId');
    const editTitle = document.getElementById('editTitle');
    const editContent = document.getElementById('editContent');
    const commentContent = document.getElementById('commentContent');

    let currentUser = localStorage.getItem('currentUser');

    if (currentUser) {
        authDiv.style.display = 'none';
        newPostDiv.style.display = 'block';
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;

        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            alert('Registration successful! Please log in.');
        } else {
            alert('Registration failed: ' + data.message);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.username;
            localStorage.setItem('currentUser', currentUser);
            authDiv.style.display = 'none';
            newPostDiv.style.display = 'block';
        } else {
            alert('Login failed');
        }
    });

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;

        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, author: currentUser })
        });
        const post = await res.json();
        displayPost(post.post);
    });

    editPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editPostId.value;
        const title = editTitle.value;
        const content = editContent.value;

        const res = await fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, author: currentUser })
        });
        const data = await res.json();
        if (data.success) {
            location.reload();
        } else {
            alert('Failed to update post: ' + data.message);
        }
    });

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postId = postDetailDiv.dataset.postId;
        const comment = commentContent.value;

        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, comment, author: currentUser })
        });
        const data = await res.json();
        if (data.success) {
            displayComment(data.comment);
        }
    });

    async function fetchPosts() {
        const res = await fetch('/api/posts');
        const data = await res.json();
        if (data.success) {
            data.posts.forEach(displayPost);
        }
    }

    async function fetchPost(id) {
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();
        if (data.success) {
            postTitle.innerText = data.post.title;
            postContent.innerText = data.post.content;
            postAuthor.innerText = `by ${data.post.author}`;
            postDetailDiv.dataset.postId = id;
            await fetchComments(id);
            postList.style.display = 'none';
            postDetailDiv.style.display = 'block';
        }
    }

    async function fetchComments(postId) {
        const res = await fetch(`/api/comments/${postId}`);
        const data = await res.json();
        if (data.success) {
            commentList.innerHTML = '';
            data.comments.forEach(displayComment);
        }
    }

    function displayPost(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
            <h3><a href="#" onclick="viewPost(${post.id})">${post.title}</a></h3>
            <p>${post.content}</p>
            <small>${new Date(post.date).toLocaleString()} by ${post.author}</small>
            <p>Upvotes: ${post.upvotes} | Downvotes: ${post.downvotes}</p>
            <button onclick="upvote(${post.id})">Upvote</button>
            <button onclick="downvote(${post.id})">Downvote</button>
            ${post.author === currentUser ? `
                <button onclick="editPost(${post.id}, '${post.title}', '${post.content}')">Edit</button>
                <button onclick="deletePost(${post.id})">Delete</button>
            ` : ''}
        `;
        postList.appendChild(postDiv);
    }

    function displayComment(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.innerHTML = `
            <p>${comment.comment}</p>
            <small>${new Date(comment.date).toLocaleString()} by ${comment.author}</small>
        `;
        commentList.appendChild(commentDiv);
    }

    window.editPost = (id, title, content) => {
        editPostId.value = id;
        editTitle.value = title;
        editContent.value = content;
        newPostDiv.style.display = 'none';
        editPostDiv.style.display = 'block';
    };

    window.deletePost = async (id) => {
        const res = await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author: currentUser })
        });
        const data = await res.json();
        if (data.success) {
            location.reload();
        } else {
            alert('Failed to delete post: ' + data.message);
        }
    };

    window.viewPost = (id) => {
        fetchPost(id);
    };

    window.upvote = async (id) => {
        const res = await fetch(`/api/posts/${id}/upvote`, {
            method: 'POST',
        });
        const data = await res.json();
        if (data.success) {
            location.reload();
        }
    };

    window.downvote = async (id) => {
        const res = await fetch(`/api/posts/${id}/downvote`, {
            method: 'POST',
        });
        const data = await res.json();
        if (data.success) {
            location.reload();
        }
    };

    fetchPosts();
});
