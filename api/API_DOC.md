# BIUH-Tinder API 接口文档

> 基础 URL：`http://localhost:8000`
>
> 统一响应格式：
> ```json
> {
>   "code": 200,
>   "message": "操作成功",
>   "data": {}
> }
> ```

---

## 🔐 关于 JWT Token 与密码的关系（重要说明）

**JWT Token 和用户密码是完全不同的东西，互不冲突：**

| | 密码 (password) | Token (JWT) |
|---|---|---|
| **用途** | 用户登录时验证身份 | 登录成功后，后续请求的身份凭证 |
| **输入方** | 用户自己输入 | 后端自动生成，前端自动携带 |
| **传输方式** | 仅在注册/登录时发送一次 | 每次请求在 Header 中携带 |
| **存储位置** | 数据库 `password_hash` 字段 | 前端 `localStorage` |

**完整流程：**
```
1. 注册：用户输入用户名 + 密码 → 后端用 password_hash() 加密密码后存入数据库
2. 登录：用户输入用户名 + 密码 → 后端用 password_verify() 验证密码 → 验证通过后生成 JWT Token 返回给前端
3. 后续请求：前端在 Header 中携带 Token → 后端验证 Token 确认用户身份
```

用户**始终使用密码**来登录/注册，Token 只是登录成功后的"通行证"，避免每次请求都传密码。

---

## 📋 接口总览

| 模块 | 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|------|
| 认证 | POST | `/register` | ❌ | 用户注册 |
| 认证 | POST | `/login` | ❌ | 用户登录 |
| 资料 | GET | `/profile` | ✅ | 获取自己的资料 |
| 资料 | GET | `/profile/{userId}` | ✅ | 获取指定用户资料 |
| 资料 | PUT | `/update-profile` | ✅ | 更新个人资料 |
| 资料 | POST | `/upload-avatar` | ✅ | 上传头像 |
| 探索 | GET | `/discover` | ✅ | 获取推荐用户列表 |
| 匹配 | POST | `/swipe` | ✅ | 滑动操作（喜欢/忽略） |
| 匹配 | GET | `/matches` | ✅ | 获取匹配列表 |
| 聊天 | GET | `/conversations` | ✅ | 获取会话列表 |
| 聊天 | GET | `/messages` | ✅ | 获取聊天记录 |
| 聊天 | POST | `/send-message` | ✅ | 发送消息 |

> 需要鉴权的接口，请在请求头添加：`Authorization: Bearer <token>`

---

## 📝 接口详情

### 1. 用户注册

**POST** `/register`

请求体：
```json
{
  "username": "testuser",
  "password": "123456"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. 用户登录

**POST** `/login`

请求体：
```json
{
  "username": "testuser",
  "password": "123456"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. 获取自己的资料

**GET** `/profile`

请求头：`Authorization: Bearer <token>`

成功响应：
```json
{
  "code": 200,
  "message": "获取资料成功",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "avatar_url": "/uploads/avatar_abc123.jpg",
    "bio": "Hello World!",
    "gender": "male",
    "age": 25,
    "created_at": "2024-01-01 12:00:00"
  }
}
```

---

### 4. 获取指定用户资料

**GET** `/profile/{userId}`

请求头：`Authorization: Bearer <token>`

成功响应：同上

---

### 5. 更新个人资料

**PUT** `/update-profile`

请求头：`Authorization: Bearer <token>`

请求体（所有字段均为可选，只传需要更新的字段）：
```json
{
  "bio": "这是我的个人简介",
  "gender": "male",
  "age": 25
}
```

> `gender` 允许值：`male`, `female`, `other`

成功响应：返回更新后的完整资料

---

### 6. 上传头像

**POST** `/upload-avatar`

请求头：`Authorization: Bearer <token>`

请求体：`multipart/form-data`，字段名为 `avatar`

限制：
- 仅支持 JPG、PNG、GIF、WebP 格式
- 文件大小不超过 2MB

成功响应：
```json
{
  "code": 200,
  "message": "头像上传成功",
  "data": {
    "avatar_url": "/uploads/avatar_abc123_1700000000.jpg"
  }
}
```

**前端示例（axios）**：
```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

axios.post('/api/upload-avatar', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

---

### 7. 发现用户（获取推荐列表）

**GET** `/discover?limit=10&offset=0`

请求头：`Authorization: Bearer <token>`

查询参数：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | int | 10 | 每页数量（1-50） |
| offset | int | 0 | 偏移量 |

成功响应：
```json
{
  "code": 200,
  "message": "获取推荐用户成功",
  "data": {
    "users": [
      {
        "id": 2,
        "username": "user2",
        "avatar_url": "/uploads/avatar_xxx.jpg",
        "bio": "Hi!",
        "gender": "female",
        "age": 22
      }
    ],
    "count": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 8. 滑动操作（喜欢/忽略）

**POST** `/swipe`

请求头：`Authorization: Bearer <token>`

请求体：
```json
{
  "target_user_id": 2,
  "action": "like"
}
```

> `action` 允许值：`like`（喜欢）, `ignore`（忽略）

互相喜欢（匹配成功）时响应：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "swiped": true,
    "action": "like",
    "target_user": "user2",
    "is_match": true,
    "match_id": 1,
    "message": "恭喜！你们互相喜欢，已成功匹配！"
  }
}
```

> ⚠️ 前端应检查 `data.is_match` 字段来决定是否弹出匹配成功提示。

---

### 9. 获取匹配列表

**GET** `/matches`

请求头：`Authorization: Bearer <token>`

成功响应：
```json
{
  "code": 200,
  "message": "获取匹配列表成功",
  "data": {
    "matches": [
      {
        "match_id": 1,
        "matched_at": "2024-01-01 12:00:00",
        "user_id": 2,
        "username": "user2",
        "avatar_url": "/uploads/avatar_xxx.jpg",
        "bio": "Hi!",
        "gender": "female",
        "age": 22
      }
    ],
    "count": 1
  }
}
```

---

### 10. 获取会话列表

**GET** `/conversations`

请求头：`Authorization: Bearer <token>`

成功响应：
```json
{
  "code": 200,
  "message": "获取会话列表成功",
  "data": {
    "conversations": [
      {
        "user_id": 2,
        "username": "user2",
        "avatar_url": "/uploads/avatar_xxx.jpg",
        "last_message": "你好！",
        "last_message_time": "2024-01-01 12:30:00",
        "last_sender_id": 2
      }
    ],
    "count": 1
  }
}
```

---

### 11. 获取聊天记录

**GET** `/messages?user_id=2&limit=50&offset=0`

请求头：`Authorization: Bearer <token>`

查询参数：
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| user_id | int | ✅ | - | 对方用户 ID |
| limit | int | ❌ | 50 | 每页数量（1-100） |
| offset | int | ❌ | 0 | 偏移量 |

成功响应：
```json
{
  "code": 200,
  "message": "获取聊天记录成功",
  "data": {
    "messages": [
      {
        "id": 1,
        "sender_id": 1,
        "receiver_id": 2,
        "content": "你好！",
        "created_at": "2024-01-01 12:00:00",
        "sender_name": "testuser"
      }
    ],
    "count": 1,
    "with_user": 2,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 12. 发送消息

**POST** `/send-message`

请求头：`Authorization: Bearer <token>`

请求体：
```json
{
  "receiver_id": 2,
  "content": "你好！很高兴认识你～"
}
```

> 🔒 只有互相匹配的用户之间才能发送消息，否则返回 403。

---

## ⚠️ 错误码说明

| code | HTTP 状态码 | 说明 |
|------|-------------|------|
| 200 | 200 | 成功 |
| 400 | 400 | 参数错误 |
| 401 | 401 | 未登录或 Token 过期 |
| 403 | 403 | 无权操作 |
| 404 | 404 | 资源不存在 |
| 500 | 500 | 服务器内部错误 |

---

## 🚀 快速开始

### 1. 初始化数据库

在 MySQL 中执行项目根目录的 `tinder.sql`：

```bash
mysql -u root -p < tinder.sql
```

### 2. 修改数据库配置

编辑 `api/config/database.php`，确保数据库连接信息正确：

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'dating_app_db');
define('DB_USER', 'root');
define('DB_PASS', '你的MySQL密码');
```

### 3. 启动开发服务器

**重要：必须使用 `router.php` 启动，不能用 `index.php`！**

```bash
cd api
php -S localhost:8000 router.php
```

> ⚠️ PHP 内置开发服务器不会读取 `.htaccess` 文件，所以必须通过 `router.php` 来做 URL 重写。
> 如果直接用 `php -S localhost:8000`，POST 请求可能无法正常工作。
> 生产环境使用 Apache 时，`.htaccess` 会自动生效，不需要 `router.php`。

### 4. 测试接口

```bash
# 注册
curl -X POST http://localhost:8000/register -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"123456\"}"

# 登录
curl -X POST http://localhost:8000/login -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"123456\"}"
```

### 5. 前端 axios 配置示例

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：自动添加 Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401 过期
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
