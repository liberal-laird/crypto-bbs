import { pool } from './index.js';

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar VARCHAR(10) DEFAULT '',
  role VARCHAR(20) DEFAULT 'user',
  wallet_address VARCHAR(100),
  bio TEXT,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  total收益率 DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  author_id INT REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  preview TEXT,
  tags TEXT[] DEFAULT '{}',
  is_hot BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  topic_id INT REFERENCES topics(id) ON DELETE CASCADE,
  author_id INT REFERENCES users(id),
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follows table (user follows trader)
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INT REFERENCES users(id),
  trader_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, trader_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_section ON topics(section);
CREATE INDEX IF NOT EXISTS idx_topics_author ON topics(author_id);
CREATE INDEX IF NOT EXISTS idx_topics_created ON topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_topic ON comments(topic_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
`;

async function migrate() {
  console.log('🚀 Running database migrations...');
  
  try {
    await pool.query(schema);
    console.log('✅ Migrations completed successfully!');
    
    // Insert sample data if tables are empty
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('📝 Inserting sample data...');
      await seedData();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function seedData() {
  // Sample users
  await pool.query(`
    INSERT INTO users (username, avatar, role, bio, followers_count, total收益率) VALUES
    ('TraderZhang', 'T', 'vip', 'BTC 现货交易专家，专注趋势跟踪', 1234, 156.5),
    ('SolStrategy', 'S', 'expert', 'SOL 生态布道者，链上数据分析', 892, 89.2),
    ('ArbitrageKing', 'A', 'user', '套利策略研究者', 567, 24.5),
    ('DeFiHunter', 'D', 'user', 'DeFi 套利猎人', 432, 45.8)
  `);
  
  // Sample topics
  await pool.query(`
    INSERT INTO topics (section, author_id, title, content, preview, tags, is_hot, views_count, likes_count, comments_count, created_at, 收益率) VALUES
    ('follow', 1, 'BTC 现货分批建仓策略，分享实盘信号', '目前行情处于相对低位，建议分批布局现货...', '目前行情处于相对低位，建议分批布局现货，支撑位 95k-98k 可以逐步买入...', ARRAY['BTC', '现货', '建仓'], TRUE, 5432, 1200, 328, NOW() - INTERVAL '2 hours', '156%'),
    ('follow', 2, 'SOL 链上巨鲸地址异动，多单信号确认', '监测到 SOL 链上某巨鲸地址近24小时持续增持...', '监测到 SOL 链上某巨鲸地址近24小时持续增持，链上数据显示大单持续买入...', ARRAY['SOL', '链上数据'], FALSE, 3211, 567, 156, NOW() - INTERVAL '4 hours', '89%'),
    ('arbitrage', 3, 'BTC 期现套利机会分析 - CBOE vs Binance 价差', '当前 CBOE 期货价格比 Binance 现货高 2.3%...', '当前 CBOE 期货价格比 Binance 现货高 2.3%，考虑资金成本后年化收益约 15-20%...', ARRAY['BTC', '期现套利'], TRUE, 2345, 312, 89, NOW() - INTERVAL '1 hour', '24.5%'),
    ('arbitrage', 4, 'Curve / Aave 循环贷套利实盘记录', '利用 CRV 质押收益 + 借贷利差进行循环操作...', '利用 CRV 质押收益 + 借贷利差进行循环操作，单日收益 0.15%...', ARRAY['DeFi', '套利'], FALSE, 4567, 876, 234, NOW() - INTERVAL '6 hours', '45%')
  `);
  
  console.log('✅ Sample data inserted!');
}

migrate();
