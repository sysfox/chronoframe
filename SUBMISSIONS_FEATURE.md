# Guest Photo Submission Feature

## 概述 (Overview)

本功能允许游客用户在 `/submit` 路径下提交图片，管理员可以在后台审核并决定是否公开或删除。

This feature allows guest users to submit photos at the `/submit` path, and administrators can review submissions in the dashboard and decide whether to approve or delete them.

## 功能特性 (Features)

### 游客提交 (Guest Submission)
- ✅ 无需登录即可提交照片
- ✅ 支持图片格式：JPEG, PNG, HEIC/HEIF, WebP, GIF, BMP, TIFF, AVIF
- ✅ 文件大小限制：50MB
- ✅ 可选填写提交者姓名、邮箱和留言
- ✅ 实时上传进度显示
- ✅ 自动生成缩略图和 ThumbHash

### 管理员审核 (Admin Review)
- ✅ 后台管理页面查看所有提交
- ✅ 按状态筛选：待审核、已批准、已拒绝
- ✅ 批准提交自动转为正式照片
- ✅ 拒绝/删除提交并清理存储
- ✅ 查看提交者信息和留言
- ✅ 显示照片预览和元数据

## 使用方法 (Usage)

### 游客提交照片 (Guest Photo Submission)

1. 访问 `/submit` 页面
2. 点击选择文件或拖放图片文件
3. （可选）填写以下信息：
   - 您的姓名 (Your Name)
   - 邮箱地址 (Email)
   - 留言说明 (Message)
4. 点击 "Submit Photo" 提交
5. 等待上传完成，系统将显示成功消息

### 管理员审核提交 (Admin Review Process)

1. 以管理员身份登录
2. 在侧边栏点击 "Submissions" 进入审核页面
3. 查看待审核的提交列表
4. 对于每个提交，可以：
   - **批准 (Approve)**：将提交转为正式照片，添加到相册
   - **拒绝 (Reject)**：删除提交及其文件
5. 使用状态筛选器查看不同状态的提交

## 技术实现 (Technical Implementation)

### 数据库架构 (Database Schema)

新增 `submissions` 表：

```sql
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_key TEXT NOT NULL,           -- 存储路径
  original_url TEXT,                   -- 原图URL
  thumbnail_url TEXT,                  -- 缩略图URL
  thumbnail_hash TEXT,                 -- ThumbHash
  submitter_name TEXT,                 -- 提交者姓名
  submitter_email TEXT,                -- 提交者邮箱
  submitter_message TEXT,              -- 留言
  file_name TEXT NOT NULL,             -- 文件名
  file_size INTEGER,                   -- 文件大小
  width INTEGER,                       -- 宽度
  height INTEGER,                      -- 高度
  status TEXT DEFAULT 'pending',       -- 状态：pending/approved/rejected
  reviewed_by INTEGER,                 -- 审核人ID
  reviewed_at INTEGER,                 -- 审核时间
  photo_id TEXT,                       -- 批准后的照片ID
  created_at INTEGER DEFAULT (unixepoch())
);
```

### API 端点 (API Endpoints)

#### 游客端点 (Guest Endpoints - No Auth Required)

- **POST /api/submissions**
  - 获取上传签名URL
  - 参数：`fileName`, `contentType`, `submitterName`, `submitterEmail`, `submitterMessage`
  - 返回：`signedUrl`, `fileKey`, `expiresIn`

- **PUT /api/submissions/upload**
  - 内部上传端点
  - 用于不支持预签名URL的存储提供商

- **POST /api/submissions/process**
  - 处理已上传的文件
  - 生成缩略图和ThumbHash
  - 保存到数据库

#### 管理员端点 (Admin Endpoints - Auth Required)

- **GET /api/submissions**
  - 列出所有提交
  - 查询参数：`status` (pending/approved/rejected)
  - 返回：提交列表

- **POST /api/submissions/[id]/approve**
  - 批准提交
  - 创建照片记录
  - 更新提交状态

- **DELETE /api/submissions/[id]**
  - 删除提交
  - 清理存储中的文件

### 前端页面 (Frontend Pages)

- **app/pages/submit.vue**
  - 游客提交页面
  - 文件选择和上传
  - 进度显示

- **app/pages/dashboard/submissions.vue**
  - 管理员审核页面
  - 提交列表和筛选
  - 批准/拒绝操作

## 配置说明 (Configuration)

无需额外配置，功能开箱即用。提交的照片存储在 `submissions/` 前缀下。

No additional configuration needed. Submitted photos are stored with the `submissions/` prefix.

## 安全考虑 (Security Considerations)

- ✅ 文件类型验证（仅允许图片）
- ✅ 文件大小限制（游客50MB，管理员上传128MB）
- ✅ 存储路径限制（submissions/ 前缀）
- ✅ 管理员权限验证
- ✅ SQL注入防护（使用ORM）

## 未来改进 (Future Enhancements)

- [ ] 添加验证码防止滥用
- [ ] 邮件通知管理员新提交
- [ ] 批量审核功能
- [ ] 提交统计和分析
- [ ] 自定义提交表单字段
- [ ] 提交者查看自己的提交状态

## 故障排查 (Troubleshooting)

### 上传失败
- 检查文件大小是否超过限制
- 确认文件格式为支持的图片格式
- 检查存储提供商配置

### 无法审核
- 确认已以管理员身份登录
- 检查数据库连接
- 查看服务器日志错误信息

## 贡献 (Contributing)

欢迎提交问题和改进建议！

Welcome to submit issues and improvement suggestions!
