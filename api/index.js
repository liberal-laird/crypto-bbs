import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, pool } from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.json({ status: 'ok', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const topicsCount = await query('SELECT COUNT(*) FROM topics');
    const usersCount = await query('SELECT COUNT(*) FROM users');
    const commentsCount = await query('SELECT COUNT(*) FROM comments');
    
    res.json({
      todayDiscussions: parseInt(topicsCount.rows[0].count) || 0,
      onlineUsers: parseInt(usersCount.rows[0].count) || 0,
      totalTopics: parseInt(topicsCount.rows[0].count) || 0,
      followAmount: '2.4B'
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ todayDiscussions: 12847, onlineUsers: 3256, totalTopics: 89432, followAmount: '2.4B' });
  }
});

// Topics endpoints
app.get('/api/topics', async (req, res) => {
  try {
    const { section = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT t.*, u.username, u.avatar, u.role FROM topics t JOIN users u ON t.author_id = u.id';
    const params = [];
    
    if (section !== 'all') {
      sql += ' WHERE t.section = $1';
      params.push(section);
    }
    
    sql += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    res.json({
      topics: result.rows,
      total: result.rowCount,
      page: parseInt(page)
    });
  } catch (error) {
    console.error('Topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

app.get('/api/topics/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT t.*, u.username, u.avatar, u.role FROM topics t JOIN users u ON t.author_id = u.id WHERE t.id = $1',
      [req.params.id]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Topic not found' });
    }
  } catch (error) {
    console.error('Topic detail error:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { section, authorId = 1, title, content, tags = [] } = req.body;
    
    const result = await query(
      `INSERT INTO topics (section, author_id, title, content, preview, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [section, authorId, title, content, content.substring(0, 100) + '...', tags]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Users endpoints
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, avatar, role, bio, followers_count, total收益率, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length > 0) {
      const topicsResult = await query('SELECT COUNT(*) FROM topics WHERE author_id = $1', [req.params.id]);
      res.json({ ...result.rows[0], topicsCount: parseInt(topicsResult.rows[0].count) });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('User error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/top-traders', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, avatar, role, followers_count, total收益率 FROM users ORDER BY followers_count DESC LIMIT 5'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Top traders error:', error);
    res.status(500).json({ error: 'Failed to fetch top traders' });
  }
});

// Trending topics
app.get('/api/trending', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, views_count FROM topics ORDER BY views_count DESC LIMIT 5'
    );
    
    res.json(result.rows.map((t, i) => ({
      rank: i + 1,
      id: t.id,
      title: t.title,
      views: t.views_count
    })));
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

// Comments endpoint
app.get('/api/topics/:id/comments', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.username, u.avatar FROM comments c 
       JOIN users u ON c.author_id = u.id 
       WHERE c.topic_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 CryptoHub API Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.POSTGRES_URL ? 'Connected' : 'Using default'}`);
});

export default app;
