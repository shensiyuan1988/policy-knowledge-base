# 政策知识库管理系统

残联政务政策知识库管理系统，提供法规管理、数据看板等功能，助力政务事项智能查询。

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS
- **数据库**: Supabase
- **图表**: Recharts
- **图标**: Lucide React

## 在线访问

https://shensiyuan1988.github.io/policy-knowledge-base/

## 本地开发

```bash
pnpm install
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写 Supabase 配置。

## GitHub Pages 部署

通过 GitHub Actions 自动部署。需在 Settings > Secrets > Actions 中配置：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
