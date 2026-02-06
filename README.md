# CryptoHub - 币圈讨论社区

Web3 风格的加密货币论坛社区

## 功能特性

- 💬 **跟单讨论** - 分享交易信号、跟单策略
- ⚡ **套利讨论** - 期现套利、DeFi 套利机会
- 📊 **实盘记录** - 交易员实盘业绩展示
- 👥 **跟随系统** - 跟随顶级交易员
- 🔥 **热门话题** - 社区热点讨论
- 💰 **收益率排行** - 交易员排行榜

## 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JS
- **后端**: Node.js + Express (Vercel Serverless)
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **部署**: Vercel

## 项目结构

```
crypto-bbs/
├── index.html          # 主页面
├── public/
│   └── api.js          # API 客户端
├── api/
│   └── index.js        # 后端 API
├── package.json
├── vercel.json         # Vercel 配置
└── README.md
```

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动后端
npm run dev

# 前端直接在浏览器打开 index.html
```

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

## API 接口

- `GET /api/stats` - 社区统计数据
- `GET /api/topics` - 获取主题列表
- `POST /api/topics` - 发布新主题
- `GET /api/topics/:id` - 获取主题详情
- `GET /api/trending` - 热门话题
- `GET /api/top-traders` - 顶级交易员

## Web3 特性

- 暗色主题设计
- 渐变霓虹效果
- 玻璃态 UI
- 钱包连接预留
- 链上数据集成

## 许可证

MIT License
