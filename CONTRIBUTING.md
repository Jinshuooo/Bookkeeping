# 贡献指南 Contributing Guide

感谢您考虑为本项目做出贡献！🎉

[中文](#中文) | [English](#english)

---

## 中文

### 如何贡献

1. **Fork 本仓库**
   - 点击页面右上角的 Fork 按钮

2. **克隆到本地**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bookkeeping.git
   cd Bookkeeping
   ```

3. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或修复bug
   git checkout -b fix/bug-description
   ```

4. **安装依赖并开发**
   ```bash
   npm install
   cp .env.example .env
   # 编辑 .env 添加您的 Supabase 凭据
   npm run dev
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   # 或
   git commit -m "fix: 修复xxx问题"
   ```

6. **推送到您的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 访问您的 Fork 页面
   - 点击 "Compare & pull request"
   - 填写 PR 描述并提交

### 提交信息规范

请使用以下格式：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 重构代码
- `test:` 添加测试
- `chore:` 构建工具或依赖更新

示例：
```
feat: 添加账单分类筛选功能
fix: 修复日期选择器在移动端的显示问题
docs: 更新部署文档
```

### 代码规范

- 使用 ESLint 检查代码
- 保持代码简洁易读
- 添加必要的注释
- 确保所有功能在本地测试通过

### 报告问题

如果发现 bug 或有功能建议：

1. 检查是否已有相关 Issue
2. 创建新 Issue，描述清楚：
   - 问题现象或功能需求
   - 复现步骤（如果是 bug）
   - 您的环境信息（浏览器、操作系统等）

---

## English

### How to Contribute

1. **Fork the repository**
   - Click the Fork button at the top right

2. **Clone to local**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bookkeeping.git
   cd Bookkeeping
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes
   git checkout -b fix/bug-description
   ```

4. **Install dependencies and develop**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env to add your Supabase credentials
   npm run dev
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve xxx issue"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**
   - Visit your fork on GitHub
   - Click "Compare & pull request"
   - Fill in the PR description and submit

### Commit Message Convention

Use the following format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation update
- `style:` Code formatting (no functional changes)
- `refactor:` Code refactoring
- `test:` Add tests
- `chore:` Build tools or dependency updates

Examples:
```
feat: add bill category filter
fix: resolve date picker display issue on mobile
docs: update deployment documentation
```

### Code Standards

- Use ESLint for code checking
- Keep code clean and readable
- Add necessary comments
- Ensure all features are tested locally

### Reporting Issues

If you find a bug or have a feature suggestion:

1. Check if there's already a related Issue
2. Create a new Issue with clear description:
   - Problem description or feature request
   - Steps to reproduce (if it's a bug)
   - Your environment (browser, OS, etc.)

---

**感谢您的贡献！Thank you for contributing!** 🙏
