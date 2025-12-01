# 梅花心易 (Mind I-Ching) - 易学启蒙与实践平台

> **"万物皆有数，心动即天机"**

梅花心易是一个致力于易学启蒙与实践的现代化 Web 应用。我们旨在剥离传统易学中复杂的迷信色彩，回归纯粹的易理逻辑，通过现代技术手段帮助用户理解和运用梅花易数。

## ✨ 功能特性

### 1. 📖 心法 (Learn)
- **交互式学习路线图**：清晰展示梅花易数的学习路径，从基础八卦到高阶断卦技巧。
- **易理逻辑解析**：深入浅出地讲解易学核心概念，帮助初学者建立正确的易学世界观。

### 2. 📚 卦典 (Library)
- **64卦完整收录**：提供完整的六十四卦查询功能。
- **详解与白话**：每卦均包含卦辞、大象、爻辞的原典及现代白话注解。
- **搜索功能**：支持快速查找卦象。

### 3. 🔮 演练 (Practice)
- **数字化起卦**：支持数字起卦（先天卦）等多种起卦方式。
- **实时排盘**：自动计算本卦、互卦、变卦，以及体用关系。
- **动爻分析**：精准定位动爻，展示变卦过程。

### 4. 🤖 AI 解卦 (AI Interpretation)
- **智能分析**：集成 Google Gemini / DeepSeek AI 模型，提供现代化的卦象解读。
- **多维度解读**：结合传统易理与现代语境，为用户提供更具参考价值的建议。

## 🛠️ 技术栈

本项目采用现代化的前端技术栈构建，确保高性能与良好的用户体验。

- **前端框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **图标**: [Lucide React](https://lucide.dev/)
- **AI 集成**: [Google GenAI SDK](https://ai.google.dev/)
- **部署**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **数据库**: [Cloudflare D1](https://developers.cloudflare.com/d1/)

## 🚀 快速开始

### 前置要求
- [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)
- npm 或 yarn

### 安装

1. 克隆项目到本地：
   ```bash
   git clone <repository-url>
   cd meihuaxinyi
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

### 开发

启动本地开发服务器：
```bash
npm run dev
```
访问 `http://localhost:5173` 即可预览应用。

### 构建

构建生产环境版本：
```bash
npm run build
```
构建产物将输出到 `dist` 目录。

### 预览

预览构建后的应用：
```bash
npm run preview
```

## 📂 项目结构

```
meihuaxinyi/
├── components/       # UI 组件
│   ├── Roadmap.tsx       # 学习路线图组件
│   ├── DivinationTool.tsx # 起卦演练工具
│   ├── HexagramLib.tsx    # 卦典库组件
│   └── ...
├── utils/            # 核心逻辑与工具函数
│   ├── meiHuaLogic.ts    # 梅花易数排盘逻辑
│   ├── ichingData.ts     # 易经数据（卦辞、爻辞等）
│   └── ...
├── services/         # 外部服务集成
│   └── geminiService.ts  # AI 服务接口
├── types.ts          # TypeScript 类型定义
├── constants.ts      # 常量定义（八卦属性、六十四卦名等）
├── App.tsx           # 应用主入口
└── ...
```

## 🧠 核心概念简述

- **体用 (Ti/Yong)**：梅花易数的核心分析方法。"体"代表自己或主体，"用"代表事物或客体。通过五行生克关系判断吉凶。
- **本互变 (Ben/Hu/Bian)**：
    - **本卦**：事情的开始或现状。
    - **互卦**：事情发展的过程或中间状态。
    - **变卦**：事情的结局或最终走向。

## 📄 许可证

[MIT License](LICENSE)
