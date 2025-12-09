# 梅花心易 (Meihuaxinyi)

> **易学启蒙与实践**  
> 探索东方智慧，结合现代 AI 技术，为易学爱好者打造的智能起卦与解卦平台。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)

## 📖 项目简介

**梅花心易** 是一款基于梅花易数（Meihua Yishu）逻辑的现代化易学应用。它不仅提供了传统的起卦工具，还创新性地融合了 Google Gemini 和 DeepSeek 等先进的大语言模型，为用户提供深度的卦象解读和生活指引。

本项目旨在帮助用户：
- **轻松起卦**：通过数字化手段快速获取卦象。
- **深度理解**：利用 AI 辅助解读卦辞、爻辞及五行生克关系。
- **系统学习**：通过循序渐进的学习路径掌握易学核心概念。
- **每日指引**：获取每日运势分析，指导生活决策。

## ✨ 核心功能

### 1. 智能起卦 (Divination Tool)
- **多种起卦方式**：支持时间起卦、数字起卦等多种传统梅花易数起卦法。
- **直观展示**：清晰展示本卦、互卦、变卦及其卦画。
- **五行分析**：自动计算体用关系、五行生克，辅助判断吉凶。

### 2. AI 智能解卦 (AI Interpretation)
- **多模型支持**：集成 Google Gemini 和 DeepSeek 模型。
- **深度推理**：AI 模拟国学大师思维，结合“取象比类”与具体问题场景进行发散性推理。
- **结构化输出**：提供核心直断、象意推演、局势演变及大师忠告等结构化解读。

### 3. 每日一卦 (Daily Guidance)
- **每日运势**：每天抽取一卦，获取今日运势评分、关键词及行动指南。
- **生活化建议**：将深奥的易理转化为通俗易懂的生活建议（宜/忌）。

### 4. 易学心法 (Learning Roadmap)
- **循序渐进**：提供从基础八卦到高阶断卦的学习路线图。
- **知识库**：内置丰富的易学知识点，帮助新手快速入门。

### 5. 卦典查询 (Hexagram Library)
- **完整收录**：收录六十四卦完整卦辞、爻辞及大象传。
- **便捷检索**：支持快速查找和浏览特定卦象信息。

## 🛠️ 技术栈

### 前端 (Frontend)
- **框架**: React 19
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **动画**: Tailwind CSS Animate

### 后端 (Backend / Serverless)
- **平台**: Cloudflare Pages Functions
- **数据库**: Cloudflare D1 (SQLite)
- **AI 服务**: Google Gemini API, DeepSeek API

## 🚀 快速开始

### 前置要求
- Node.js (v18+)
- pnpm 或 npm
- Cloudflare Wrangler CLI (用于本地开发后端函数)

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/meihuaxinyi.git
cd meihuaxinyi

# 安装依赖
npm install
```

### 配置环境变量

在项目根目录创建 `.dev.vars` 文件（用于本地 Wrangler 开发），配置以下变量：

```env
# JWT 密钥 (用于用户认证)
JWT_SECRET=your_jwt_secret_here

# 数据加密密钥 (用于加密存储的 API Key)
DATA_SECRET=your_data_encryption_secret_here

# 系统默认 AI Key (可选，作为后备 Key)
DEFAULT_GEMINI_KEY=your_gemini_api_key
DEFAULT_DEEPSEEK_KEY=your_deepseek_api_key
```

### 本地开发

```bash
# 启动前端 + 后端函数 (推荐)
npx wrangler pages dev . -- pnpm run dev

# 仅启动前端 (无后端功能)
npm run dev
```

### 数据库初始化

本项目使用 Cloudflare D1。首次运行时，后端会自动尝试创建必要的表结构（如 `users`, `credit_logs`）。

## 📂 目录结构

```
meihuaxinyi/
├── components/       # React 组件
│   ├── DivinationTool.tsx  # 起卦核心组件
│   ├── Roadmap.tsx         # 学习路径组件
│   ├── HexagramLib.tsx     # 卦典组件
│   └── ...
├── functions/        # Cloudflare Pages Functions (后端 API)
│   ├── api/
│   │   ├── ai-proxy.js     # AI 代理接口
│   │   └── ...
│   └── ...
├── services/         # 前端服务层
│   └── geminiService.ts    # AI 服务调用逻辑
├── utils/            # 工具函数
├── App.tsx           # 主应用入口
└── ...
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进本项目！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。
