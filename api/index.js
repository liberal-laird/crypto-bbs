const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store (生产环境请使用数据库)
let users = [
  { id: 1, username: 'TraderZhang', avatar: 'T', role: 'vip', followers: 1234 },
  { id: 2, username: 'SolStrategy', avatar: 'S', role: 'expert', followers: 892 },
  { id: 3, username: 'ArbitrageKing', avatar: 'A', role: 'user', followers: 567 },
  { id: 4, username: 'DeFiHunter', avatar: 'D', role: 'user', followers: 432 }
];

let topics = [
  {
    id: 1,
    section: 'follow',
    authorId: 1,
    title: 'BTC 现货分批建仓策略，分享实盘信号',
    preview: '目前行情处于相对低位，建议分批布局现货，支撑位 95k-98k 可以逐步买入...',
    content: '详细策略内容...',
    tags: ['BTC', '现货', '建仓'],
    hot: true,
    views: 5432,
    likes: 1200,
    comments: 328,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
   收益率: '156%'
  },
  {
    id: 2,
    section: 'follow',
    authorId: 2,
    title: 'SOL 链上巨鲸地址异动，多单信号确认',
    preview: '监测到 SOL 链上某巨鲸地址近24小时持续增持，链上数据显示大单持续买入...',
    content: '详细链上分析...',
    tags: ['SOL', '链上数据'],
    views: 3211,
    likes: 567,
    comments: 156,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
   收益率: '89%'
  },
  {
    id: 3,
    section: 'arbitrage',
    authorId: 3,
    title: 'BTC 期现套利机会分析 - CBOE vs Binance 价差',
    preview: '当前 CBOE 期货价格比 Binance 现货高 2.3%，考虑资金成本后年化收益约 15-20%...',
    content: '详细套利分析...',
    tags: ['BTC', '期现套利'],
    hot: true,
    new: true,
    views: 2345,
    likes: 312,
    comments: 89,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
   年化: '24.5%'
  },
  {
    id: 4,
    section: 'arbitrage',
    authorId: 4,
    title: 'Curve / Aave 循环贷套利实盘记录',
    preview: '利用 CRV 质押收益 + 借贷利差进行循环操作，单日收益 0.15%...',
    content: '详细操作记录...',
    tags: ['DeFi', '套利'],
    views: 4567,
    likes: 876,
    comments: 234,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
   年化: '45%'
  }
];

// Stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    todayDiscussions: 12847,
    onlineUsers: 3256,
    totalTopics: 89432,
    followAmount: '2.4B'
  });
});

// Topics endpoints
app.get('/api/topics', (req, res) => {
  const { section, page = 1, limit = 10 } = req.query;
  
  let filtered = topics;
  if (section && section !== 'all') {
    filtered = topics.filter(t => t.section === section);
  }
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    topics: filtered.slice(start, end),
    total: filtered.length,
    page: parseInt(page)
  });
});

app.get('/api/topics/:id', (req, res) => {
  const topic = topics.find(t => t.id === parseInt(req.params.id));
  if (topic) {
    const author = users.find(u => u.id === topic.authorId);
    res.json({ ...topic, author });
  } else {
    res.status(404).json({ error: 'Topic not found' });
  }
});

app.post('/api/topics', (req, res) => {
  const { section, authorId, title, content, tags } = req.body;
  
  const newTopic = {
    id: topics.length + 1,
    section,
    authorId: authorId || 1,
    title,
    preview: content.substring(0, 100) + '...',
    content,
    tags: tags || [],
    views: 0,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString()
  };
  
  topics.unshift(newTopic);
  res.json(newTopic);
});

// Users endpoints
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    const userTopics = topics.filter(t => t.authorId === user.id);
    res.json({ ...user, topicsCount: userTopics.length });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/top-traders', (req, res) => {
  const sorted = [...users].sort((a, b) => b.followers - a.followers).slice(0, 5);
  res.json(sorted);
});

// Trending topics
app.get('/api/trending', (req, res) => {
  const trending = topics
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((t, i) => ({
      rank: i + 1,
      title: t.title,
      views: t.views
    }));
  
  res.json(trending);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
});
