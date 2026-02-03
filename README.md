# 📊 记账本 Bookkeeping

> 一个现代化的个人财务管理系统，支持多账本管理和团队协作

[English](#english) | [中文](#chinese)

---

## 🌟 特性

- 💰 **收支管理** - 轻松记录和分类您的收入与支出
- 📊 **数据可视化** - 直观的图表展示财务状况
- 📚 **多账本支持** - 为不同用途创建独立账本（工作、家庭、旅行等）
- 👥 **协作记账** - 邀请家人或朋友共同管理账本
- 📤 **数据导出** - 导出 Excel 进行深度分析
- 🔐 **安全可靠** - Supabase 提供企业级数据安全
- ☁️ **实时同步** - 跨设备无缝同步数据
- 🚀 **一键部署** - 免费部署到 Cloudflare Pages

## 🎯 快速开始

只需三步，即可拥有自己的记账系统！

### 1️⃣ Fork 本仓库

点击 GitHub 页面右上角的 **Fork** 按钮，将项目复制到您的账号下。

### 2️⃣ 配置 Supabase

1. 访问 [supabase.com](https://supabase.com/) 并创建免费账号
2. 创建新项目（选择离您最近的区域）
3. 等待项目初始化完成（约2分钟）
4. 在项目中运行数据库脚本：
   - 进入 **SQL Editor**（左侧菜单）
   - 点击 **New query**
   - 复制本仓库中的 `supabase_schema.sql` 全部内容
   - 粘贴并点击 **Run** 执行
5. 获取 API 凭据：
   - 进入 **Settings** > **API**
   - 复制 `Project URL`（形如：`https://xxxxx.supabase.co`）
   - 复制 `anon public` key（以 `eyJ` 开头的长字符串）

### 3️⃣ 部署到 Cloudflare Pages

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)（需要注册，完全免费）
2. 选择 **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
3. 连接您的 GitHub 账号并选择刚才 Fork 的仓库
4. 配置构建设置：
   ```
   构建命令：npm run build
   构建输出目录：dist
   ```
5. 添加环境变量（点击 **Add variable**）：
   ```
   VITE_SUPABASE_URL = 您的 Supabase Project URL
   VITE_SUPABASE_ANON_KEY = 您的 Supabase Anon Key
   ```
6. 点击 **Save and Deploy**

等待 1-2 分钟，您的记账系统就部署完成了！🎉

## 💻 本地开发（可选）

如果您想在本地进行开发或自定义：

```bash
# 克隆您 Fork 的仓库
git clone https://github.com/YOUR_USERNAME/Bookkeeping.git
cd Bookkeeping

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入您的 Supabase 凭据

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 即可查看效果。

## 📖 使用说明

1. **注册账号** - 使用邮箱注册并验证
2. **创建交易** - 点击 "+" 添加收入或支出
3. **查看统计** - 在仪表盘查看图表和分析
4. **管理账本** - 创建多个账本，如"日常开销"、"投资理财"等
5. **邀请协作** - 在设置中通过邮箱邀请成员

## 🛠️ 技术栈

- **前端框架**: React 18 + Vite
- **UI 样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **部署**: Cloudflare Pages
- **图表**: Recharts
- **图标**: Lucide React

## ❓ 常见问题

**Q: Supabase 免费额度够用吗？**  
A: 对于个人使用完全够用。免费版提供 500MB 数据库、5GB 文件存储和 50,000 月活跃用户。

**Q: Cloudflare Pages 是免费的吗？**  
A: 是的，Cloudflare Pages 提供无限带宽和请求数，完全免费。

**Q: 如何备份我的数据？**  
A: 在设置页面点击"导出数据"即可下载 Excel 格式的备份。

**Q: 可以修改代码吗？**  
A: 当然可以！这是开源项目，您可以自由修改和定制。

**Q: 如何更新到最新版本？**  
A: 在您 Fork 的仓库页面，点击 **Sync fork** 即可同步上游更新。

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

## 👨‍💻 作者

**Jinshuooo**
- GitHub: [@Jinshuooo](https://github.com/Jinshuooo)

## 🐛 问题反馈

遇到问题？请[提交 Issue](https://github.com/Jinshuooo/Bookkeeping/issues)

---

<a name="english"></a>
# 📊 Bookkeeping

> A modern personal finance management system with multi-ledger support and team collaboration

## 🌟 Features

- 💰 **Transaction Management** - Easy tracking of income and expenses
- 📊 **Data Visualization** - Intuitive charts for financial insights
- 📚 **Multi-Ledger Support** - Create separate ledgers for different purposes
- 👥 **Collaboration** - Invite family or friends to manage shared ledgers
- 📤 **Data Export** - Export to Excel for deeper analysis
- 🔐 **Secure** - Enterprise-grade security powered by Supabase
- ☁️ **Real-time Sync** - Seamless data synchronization across devices
- 🚀 **One-Click Deploy** - Free deployment to Cloudflare Pages

## 🎯 Quick Start

Get your own bookkeeping system in just 3 steps!

### 1️⃣ Fork This Repository

Click the **Fork** button at the top right of this page.

### 2️⃣ Set Up Supabase

1. Visit [supabase.com](https://supabase.com/) and create a free account
2. Create a new project (choose the region closest to you)
3. Wait for initialization (~2 minutes)
4. Run the database schema:
   - Go to **SQL Editor** (left menu)
   - Click **New query**
   - Copy the entire content of `supabase_schema.sql` from this repo
   - Paste and click **Run**
5. Get your API credentials:
   - Go to **Settings** > **API**
   - Copy the `Project URL` (like: `https://xxxxx.supabase.co`)
   - Copy the `anon public` key (long string starting with `eyJ`)

### 3️⃣ Deploy to Cloudflare Pages

1. Visit [Cloudflare Dashboard](https://dash.cloudflare.com/) (sign up for free)
2. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
3. Connect your GitHub account and select your forked repository
4. Configure build settings:
   ```
   Build command: npm run build
   Build output directory: dist
   ```
5. Add environment variables (click **Add variable**):
   ```
   VITE_SUPABASE_URL = Your Supabase Project URL
   VITE_SUPABASE_ANON_KEY = Your Supabase Anon Key
   ```
6. Click **Save and Deploy**

Wait 1-2 minutes, and your bookkeeping system is live! 🎉

## 💻 Local Development (Optional)

If you want to develop locally or customize:

```bash
# Clone your forked repository
git clone https://github.com/YOUR_USERNAME/Bookkeeping.git
cd Bookkeeping

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

# Start development server
npm run dev
```

Visit http://localhost:5173 to see your app.

## 📖 Usage

1. **Sign Up** - Register with your email
2. **Add Transactions** - Click "+" to add income or expenses
3. **View Analytics** - Check charts and insights in the dashboard
4. **Manage Ledgers** - Create multiple ledgers like "Daily", "Investment", etc.
5. **Invite Members** - Share ledgers via email in settings

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Cloudflare Pages
- **Charts**: Recharts
- **Icons**: Lucide React

## ❓ FAQ

**Q: Is Supabase free tier enough?**  
A: Yes, perfect for personal use. Free tier includes 500MB database, 5GB storage, and 50,000 MAU.

**Q: Is Cloudflare Pages free?**  
A: Yes, completely free with unlimited bandwidth and requests.

**Q: How to backup my data?**  
A: Click "Export Data" in settings to download an Excel backup.

**Q: Can I modify the code?**  
A: Absolutely! This is open source - customize it as you like.

**Q: How to update to the latest version?**  
A: Click **Sync fork** on your forked repository page.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👨‍💻 Author

**Jinshuooo**
- GitHub: [@Jinshuooo](https://github.com/Jinshuooo)

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/Jinshuooo/Bookkeeping/issues)

---

**⭐ If you find this project helpful, please give it a star!**
