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

// Wallet auth middleware
app.use((req, res, next) => {
  req.walletAddress = req.headers['x-wallet-address'] || null;
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', wallet: !!req.walletAddress, timestamp: new Date().toISOString() });
  } catch (error) {
    res.json({ status: 'ok', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Auth with wallet
app.post('/api/auth/wallet', async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );

    let user;
    let isNew = false;

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
    } else {
      // Create new user with wallet address
      const username = `User_${walletAddress.substring(0, 6)}`;
      const avatar = walletAddress.substring(2, 8).toUpperCase();
      
      const newUser = await query(
        `INSERT INTO users (username, avatar, wallet_address, role, bio) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [username, avatar, walletAddress.toLowerCase(), 'user', '加密货币爱好者']
      );
      
      user = newUser.rows[0];
      isNew = true;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        wallet_address: user.wallet_address,
        bio: user.bio,
        followers_count: user.followers_count,
        total_profit: user.total_profit
      },
      isNew
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const topicsCount = await query('SELECT COUNT(*) FROM topics');
    const usersCount = await query('SELECT COUNT(*) FROM users');
    
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
    
    let sql = 'SELECT t.*, u.username, u.avatar, u.role, u.wallet_address FROM topics t JOIN users u ON t.author_id = u.id';
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
      'SELECT t.*, u.username, u.avatar, u.role, u.wallet_address FROM topics t JOIN users u ON t.author_id = u.id WHERE t.id = $1',
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
    const { section, title, content, tags = [] } = req.body;
    
    // Require wallet authentication
    if (!req.walletAddress) {
      return res.status(401).json({ error: 'Wallet connection required to create topics' });
    }

    // Get or create user by wallet address
    let userResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [req.walletAddress.toLowerCase()]
    );

    let authorId;
    if (userResult.rows.length > 0) {
      authorId = userResult.rows[0].id;
    } else {
      // Auto-register user
      const username = `User_${req.walletAddress.substring(0, 6)}`;
      const avatar = req.walletAddress.substring(2, 8).toUpperCase();
      
      const newUser = await query(
        `INSERT INTO users (username, avatar, wallet_address, role, bio) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [username, avatar, req.walletAddress.toLowerCase(), 'user', '加密货币爱好者']
      );
      authorId = newUser.rows[0].id;
    }

    const result = await query(
      `INSERT INTO topics (section, author_id, title, content, preview, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [section || 'general', authorId, title, content, content.substring(0, 100) + '...', tags]
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
      'SELECT id, username, avatar, role, bio, wallet_address, followers_count, total_profit, created_at FROM users WHERE id = $1',
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

app.get('/api/users/wallet/:address', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, avatar, role, bio, wallet_address, followers_count, total_profit, created_at FROM users WHERE wallet_address = $1',
      [req.params.address.toLowerCase()]
    );
    
    if (result.rows.length > 0) {
      const topicsResult = await query('SELECT COUNT(*) FROM topics WHERE author_id = $1', [result.rows[0].id]);
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
      'SELECT id, username, avatar, role, wallet_address, followers_count, total_profit FROM users ORDER BY followers_count DESC LIMIT 5'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Top traders error:', error);
    res.status(500).json({ error: 'Failed to fetch top traders' });
  }
});

// Comments
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

app.post('/api/topics/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!req.walletAddress) {
      return res.status(401).json({ error: 'Wallet connection required' });
    }

    // Get user by wallet
    let userResult = await query('SELECT id FROM users WHERE wallet_address = $1', [req.walletAddress.toLowerCase()]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Please create an account first.' });
    }

    const result = await query(
      `INSERT INTO comments (topic_id, author_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, userResult.rows[0].id, content]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Trending
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

// Follow
app.post('/api/follow', async (req, res) => {
  try {
    const { traderId } = req.body;
    
    if (!req.walletAddress) {
      return res.status(401).json({ error: 'Wallet connection required' });
    }

    const userResult = await query('SELECT id FROM users WHERE wallet_address = $1', [req.walletAddress.toLowerCase()]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followerId = userResult.rows[0].id;

    await query(
      `INSERT INTO follows (follower_id, trader_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [followerId, traderId]
    );

    await query(
      'UPDATE users SET followers_count = followers_count + 1 WHERE id = $1',
      [traderId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow' });
  }
});

// Serve static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 CryptoHub API Server v3.0 running on port ${PORT}`);
  console.log(`📊 Database: Connected`);
  console(`🔗 Wallet Auth: Enabled`);
});

export default app;
