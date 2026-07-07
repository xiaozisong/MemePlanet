# Drizzle 迁移目录占位
此目录存放 `drizzle-kit generate` 生成的 SQL 迁移文件。

实际生产建议直接用 `docs/db/schema.sql` + `docs/db/seed.sql` 由 docker-entrypoint 自动建表，
drizzle 迁移作为增量变更工具（如新增字段、索引）。

```bash
pnpm --filter @memestar/backend db:generate
pnpm --filter @memestar/backend db:migrate
```
