import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp|svg|pdf|doc|docx|txt)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('不支持的文件格式'));
  }
});

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// ============================================================
// 辅助函数
// ============================================================

function getUserProfile(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;
  const photos = db.prepare('SELECT url, sort_order FROM user_photos WHERE user_id = ? ORDER BY sort_order').all(userId);
  const prompts = db.prepare('SELECT question, answer, sort_order FROM user_prompts WHERE user_id = ? ORDER BY sort_order').all(userId);
  return {
    ...user,
    photos: photos.map(p => p.url),
    prompts: prompts.map(p => ({ q: p.question, a: p.answer }))
  };
}

function getMomentDetail(momentId, currentUserId) {
  const moment = db.prepare(`
    SELECT m.*, u.name as author_name, u.avatar as author_avatar
    FROM moments m
    JOIN users u ON m.author_id = u.id
    WHERE m.id = ?
  `).get(momentId);
  if (!moment) return null;
  const tags = db.prepare('SELECT tag FROM moment_tags WHERE moment_id = ?').all(momentId).map(t => t.tag);
  const comments = db.prepare(`
    SELECT mc.id, mc.content, mc.author_id, u.name as author, u.avatar
    FROM moment_comments mc
    JOIN users u ON mc.author_id = u.id
    WHERE mc.moment_id = ?
    ORDER BY mc.created_at ASC
  `).all(momentId);
  const isLiked = currentUserId
    ? !!db.prepare('SELECT 1 FROM moment_likes WHERE moment_id = ? AND user_id = ?').get(momentId, currentUserId)
    : false;
  return {
    id: moment.id,
    author: moment.author_name,
    authorId: moment.author_id,
    avatar: moment.author_avatar,
    image: moment.image,
    title: moment.title,
    tags,
    likes: moment.likes,
    isLiked,
    comments
  };
}

// ============================================================
// 认证 API
// ============================================================

// 注册
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: '该邮箱已被注册' });
  }
  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);
  const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
  db.prepare('INSERT INTO users (id, name, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)').run(id, name, email, password_hash, avatar);
  const user = getUserProfile(id);
  res.status(201).json({ message: '注册成功', user });
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '请填写邮箱和密码' });
  }
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !row.password_hash) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }
  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }
  const user = getUserProfile(row.id);
  res.json({ message: '登录成功', user });
});

// ============================================================
// 用户 API
// ============================================================

// 获取当前用户信息
app.get('/api/users/:id', (req, res) => {
  const user = getUserProfile(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

// 更新用户信息
app.put('/api/users/:id', (req, res) => {
  const { name, age, gender, major, year, location, avatar, prompt_answer,
    bio, favorite_food, hobbies, interests, mbti, music_genre, movie_genre,
    pet, relationship_goal, zodiac, smoking, drinking, exercise, social_media } = req.body;
  db.prepare(`
    UPDATE users SET name=COALESCE(?,name), age=COALESCE(?,age), gender=COALESCE(?,gender),
    major=COALESCE(?,major), year=COALESCE(?,year), location=COALESCE(?,location),
    avatar=COALESCE(?,avatar), prompt_answer=COALESCE(?,prompt_answer),
    bio=COALESCE(?,bio), favorite_food=COALESCE(?,favorite_food),
    hobbies=COALESCE(?,hobbies), interests=COALESCE(?,interests),
    mbti=COALESCE(?,mbti), music_genre=COALESCE(?,music_genre),
    movie_genre=COALESCE(?,movie_genre),
    pet=COALESCE(?,pet), relationship_goal=COALESCE(?,relationship_goal),
    zodiac=COALESCE(?,zodiac), smoking=COALESCE(?,smoking),
    drinking=COALESCE(?,drinking), exercise=COALESCE(?,exercise),
    social_media=COALESCE(?,social_media)
    WHERE id=?
  `).run(name, age !== undefined ? age : null, gender, major, year, location, avatar, prompt_answer,
    bio, favorite_food, hobbies, interests, mbti, music_genre, movie_genre,
    pet, relationship_goal, zodiac, smoking, drinking, exercise, social_media, req.params.id);
  const user = getUserProfile(req.params.id);
  res.json({ message: '更新成功', user });
});

// 获取推荐队列（按性别过滤）
app.get('/api/users/:id/discover', (req, res) => {
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!currentUser) return res.status(404).json({ error: '用户不存在' });
  
  const matchedIds = db.prepare('SELECT user_b_id FROM matches WHERE user_a_id = ?').all(req.params.id).map(m => m.user_b_id);
  const matchedIds2 = db.prepare('SELECT user_a_id FROM matches WHERE user_b_id = ?').all(req.params.id).map(m => m.user_a_id);
  const excludeIds = [req.params.id, ...matchedIds, ...matchedIds2];
  
  const placeholders = excludeIds.map(() => '?').join(',');
  const users = db.prepare(`
    SELECT * FROM users WHERE gender != ? AND id NOT IN (${placeholders})
  `).all(currentUser.gender, ...excludeIds);
  
  const profiles = users.map(u => getUserProfile(u.id));
  res.json(profiles);
});

// ============================================================
// 匹配 API
// ============================================================

// 创建匹配
app.post('/api/matches', (req, res) => {
  const { userAId, userBId } = req.body;
  if (!userAId || !userBId) return res.status(400).json({ error: '缺少用户 ID' });
  
  const existing = db.prepare('SELECT id FROM matches WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)').get(userAId, userBId, userBId, userAId);
  if (existing) return res.json({ message: '已经匹配过了', matchId: existing.id });

  const result = db.prepare('INSERT INTO matches (user_a_id, user_b_id) VALUES (?, ?)').run(userAId, userBId);
  const matchUser = getUserProfile(userBId);
  res.status(201).json({ message: '匹配成功', matchId: result.lastInsertRowid, matchUser });
});

// 获取匹配列表
app.get('/api/matches/:userId', (req, res) => {
  const userId = req.params.userId;
  const matchesA = db.prepare('SELECT user_b_id as user_id FROM matches WHERE user_a_id = ?').all(userId);
  const matchesB = db.prepare('SELECT user_a_id as user_id FROM matches WHERE user_b_id = ?').all(userId);
  const allMatchIds = [...matchesA, ...matchesB].map(m => m.user_id);
  const profiles = allMatchIds.map(id => getUserProfile(id)).filter(Boolean);
  res.json(profiles);
});

// ============================================================
// 消息 API
// ============================================================

// 获取对话消息
app.get('/api/messages/:matchId', (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.match_id = ?
    ORDER BY m.created_at ASC
  `).all(req.params.matchId);
  res.json(messages);
});

// 发送消息
app.post('/api/messages', (req, res) => {
  const { matchId, senderId, content } = req.body;
  if (!matchId || !senderId || !content) return res.status(400).json({ error: '缺少必填字段' });
  const result = db.prepare('INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)').run(matchId, senderId, content);
  res.status(201).json({ id: result.lastInsertRowid, matchId, senderId, content });
});

// 获取两个用户之间的 matchId
app.get('/api/messages/match-id/:userA/:userB', (req, res) => {
  const match = db.prepare('SELECT id FROM matches WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)').get(req.params.userA, req.params.userB, req.params.userB, req.params.userA);
  if (!match) return res.json({ matchId: null });
  res.json({ matchId: match.id });
});

// ============================================================
// 校园圈 API
// ============================================================

// 获取热门标签
app.get('/api/trending-tags', (req, res) => {
  const tags = db.prepare('SELECT tag FROM trending_tags').all().map(t => t.tag);
  res.json(tags);
});

// 获取动态列表（可按标签筛选）
app.get('/api/moments', (req, res) => {
  const { tag, userId } = req.query;
  let moments;
  if (tag) {
    moments = db.prepare(`
      SELECT m.id FROM moments m
      JOIN moment_tags mt ON m.id = mt.moment_id
      WHERE mt.tag = ?
      ORDER BY m.created_at DESC
    `).all(tag);
  } else {
    moments = db.prepare('SELECT id FROM moments ORDER BY created_at DESC').all();
  }
  const result = moments.map(m => getMomentDetail(m.id, userId || null));
  res.json(result);
});

// 获取单条动态
app.get('/api/moments/:id', (req, res) => {
  const { userId } = req.query;
  const moment = getMomentDetail(req.params.id, userId || null);
  if (!moment) return res.status(404).json({ error: '动态不存在' });
  res.json(moment);
});

// 发布动态
app.post('/api/moments', (req, res) => {
  const { authorId, title, image, tags } = req.body;
  if (!authorId || !title) return res.status(400).json({ error: '缺少必填字段' });
  const result = db.prepare('INSERT INTO moments (author_id, title, image) VALUES (?, ?, ?)').run(authorId, title, image || '');
  const momentId = result.lastInsertRowid;
  if (tags && tags.length > 0) {
    const insertTag = db.prepare('INSERT INTO moment_tags (moment_id, tag) VALUES (?, ?)');
    for (const tag of tags) {
      insertTag.run(momentId, tag);
    }
  }
  const moment = getMomentDetail(momentId, authorId);
  res.status(201).json(moment);
});

// 删除动态
app.delete('/api/moments/:id', (req, res) => {
  const { userId } = req.body;
  const moment = db.prepare('SELECT author_id FROM moments WHERE id = ?').get(req.params.id);
  if (!moment) return res.status(404).json({ error: '动态不存在' });
  if (moment.author_id !== userId) return res.status(403).json({ error: '只能删除自己的动态' });
  db.prepare('DELETE FROM moments WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

// 点赞 / 取消点赞
app.post('/api/moments/:id/like', (req, res) => {
  const { userId } = req.body;
  const moment = db.prepare('SELECT * FROM moments WHERE id = ?').get(req.params.id);
  if (!moment) return res.status(404).json({ error: '动态不存在' });
  const existing = db.prepare('SELECT 1 FROM moment_likes WHERE moment_id = ? AND user_id = ?').get(req.params.id, userId);
  if (existing) {
    db.prepare('DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?').run(req.params.id, userId);
    db.prepare('UPDATE moments SET likes = likes - 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)').run(req.params.id, userId);
    db.prepare('UPDATE moments SET likes = likes + 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: true });
  }
});

// 添加评论
app.post('/api/moments/:id/comments', (req, res) => {
  const { authorId, content } = req.body;
  if (!authorId || !content) return res.status(400).json({ error: '缺少必填字段' });
  const result = db.prepare('INSERT INTO moment_comments (moment_id, author_id, content) VALUES (?, ?, ?)').run(req.params.id, authorId, content);
  const comment = db.prepare(`
    SELECT mc.id, mc.content, u.name as author, u.avatar
    FROM moment_comments mc
    JOIN users u ON mc.author_id = u.id
    WHERE mc.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(comment);
});

// 删除评论
app.delete('/api/moments/:momentId/comments/:commentId', (req, res) => {
  const { userId } = req.body;
  const comment = db.prepare('SELECT author_id FROM moment_comments WHERE id = ?').get(req.params.commentId);
  if (!comment) return res.status(404).json({ error: '评论不存在' });
  if (comment.author_id !== userId) return res.status(403).json({ error: '只能删除自己的评论' });
  db.prepare('DELETE FROM moment_comments WHERE id = ?').run(req.params.commentId);
  res.json({ message: '删除成功' });
});

// ============================================================
// 页面内容 API（关于我们、安全指南等）
// ============================================================

app.get('/api/pages/:id', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).json({ error: '页面不存在' });
  res.json(page);
});

// ============================================================
// 社团活动 API
// ============================================================

app.get('/api/clubs', (req, res) => {
  const clubs = db.prepare('SELECT * FROM clubs ORDER BY created_at DESC').all();
  res.json(clubs);
});

app.get('/api/clubs/:id', (req, res) => {
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.params.id);
  if (!club) return res.status(404).json({ error: '社团不存在' });
  res.json(club);
});

// ============================================================
// 周边商店 API
// ============================================================

app.get('/api/shops', (req, res) => {
  const shops = db.prepare('SELECT * FROM shops ORDER BY rating DESC').all();
  res.json(shops);
});

app.get('/api/shops/:id', (req, res) => {
  const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(req.params.id);
  if (!shop) return res.status(404).json({ error: '商店不存在' });
  res.json(shop);
});

// ============================================================
// 文件上传 API
// ============================================================

// 通用文件上传
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, size: req.file.size });
});

// 添加用户照片
app.post('/api/users/:id/photos', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择图片' });
  const url = `/uploads/${req.file.filename}`;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM user_photos WHERE user_id = ?').get(req.params.id);
  const sortOrder = (maxOrder?.max || 0) + 1;
  db.prepare('INSERT INTO user_photos (user_id, url, sort_order) VALUES (?, ?, ?)').run(req.params.id, url, sortOrder);
  const user = getUserProfile(req.params.id);
  res.json({ message: '照片上传成功', photos: user.photos });
});

// 删除用户照片
app.delete('/api/users/:id/photos', (req, res) => {
  const { photoIndex } = req.body;
  const photos = db.prepare('SELECT url, sort_order FROM user_photos WHERE user_id = ? ORDER BY sort_order').all(req.params.id);
  if (photoIndex < 0 || photoIndex >= photos.length) return res.status(400).json({ error: '索引无效' });
  db.prepare('DELETE FROM user_photos WHERE user_id = ? AND sort_order = ?').run(req.params.id, photos[photoIndex].sort_order);
  res.json({ message: '照片已删除' });
});

// ============================================================
// 星型图匹配 API
// ============================================================

function calcMatchScore(me, other) {
  let score = 0;

  // 专业匹配 (0.30)
  const myMajor = (me.major || '').toLowerCase();
  const otherMajor = (other.major || '').toLowerCase();
  if (myMajor && otherMajor) {
    if (myMajor === otherMajor) score += 0.30;
    else if (myMajor.includes(otherMajor) || otherMajor.includes(myMajor)) score += 0.18;
    else score += 0.03;
  }

  // 年级匹配 (0.25)
  const yearOrder = { '大一': 1, '大二': 2, '大三': 3, '大四': 4, '研究生': 5, '博士生': 6 };
  const myYear = yearOrder[me.year] || 0;
  const otherYear = yearOrder[other.year] || 0;
  if (myYear && otherYear) {
    const diff = Math.abs(myYear - otherYear);
    if (diff === 0) score += 0.25;
    else if (diff === 1) score += 0.175;
    else if (diff === 2) score += 0.075;
    else score += 0.025;
  }

  // 地点匹配 (0.20) - Jaccard
  const myLocs = new Set((me.location || '').split(/[,，、\s]+/).filter(Boolean));
  const otherLocs = new Set((other.location || '').split(/[,，、\s]+/).filter(Boolean));
  if (myLocs.size > 0 && otherLocs.size > 0) {
    const intersection = [...myLocs].filter(x => otherLocs.has(x)).length;
    const union = new Set([...myLocs, ...otherLocs]).size;
    score += 0.20 * (intersection / union);
  }

  // 兴趣匹配 (0.15) - 关键词交集
  const myWords = new Set((me.prompt_answer || '').toLowerCase().split(/\s+/).filter(w => w.length > 1));
  const otherWords = new Set((other.prompt_answer || '').toLowerCase().split(/\s+/).filter(w => w.length > 1));
  if (myWords.size > 0 && otherWords.size > 0) {
    const overlap = [...myWords].filter(w => otherWords.has(w)).length;
    score += 0.15 * Math.min(overlap / Math.min(myWords.size, otherWords.size), 1);
  }

  // 基础分 (0.10)
  score += 0.10;

  return Math.round(Math.min(score, 1) * 100) / 100;
}

// 获取星型图数据
app.get('/api/users/:id/discover-graph', (req, res) => {
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!currentUser) return res.status(404).json({ error: '用户不存在' });

  const matchedIds = db.prepare('SELECT user_b_id FROM matches WHERE user_a_id = ?').all(req.params.id).map(m => m.user_b_id);
  const matchedIds2 = db.prepare('SELECT user_a_id FROM matches WHERE user_b_id = ?').all(req.params.id).map(m => m.user_a_id);
  const excludeIds = [req.params.id, ...matchedIds, ...matchedIds2];

  const placeholders = excludeIds.map(() => '?').join(',');
  const users = db.prepare(`SELECT * FROM users WHERE id NOT IN (${placeholders})`).all(...excludeIds);

  const profiles = users.map(u => {
    const profile = getUserProfile(u.id);
    const matchScore = calcMatchScore(currentUser, u);
    return { ...profile, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    centerUser: getUserProfile(req.params.id),
    profiles
  });
});

// ============================================================
// 启动服务器
// ============================================================

app.listen(PORT, () => {
  console.log(`[Server] BIUH Match API running at http://localhost:${PORT}`);
  console.log(`[Server] API endpoints:`);
  console.log(`  POST   /api/auth/register`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  GET    /api/users/:id`);
  console.log(`  PUT    /api/users/:id`);
  console.log(`  GET    /api/users/:id/discover`);
  console.log(`  POST   /api/matches`);
  console.log(`  GET    /api/matches/:userId`);
  console.log(`  GET    /api/messages/:matchId`);
  console.log(`  POST   /api/messages`);
  console.log(`  GET    /api/trending-tags`);
  console.log(`  GET    /api/moments`);
  console.log(`  POST   /api/moments`);
  console.log(`  POST   /api/moments/:id/like`);
  console.log(`  POST   /api/moments/:id/comments`);
  console.log(`  GET    /api/pages/:id`);
  console.log(`  GET    /api/clubs`);
  console.log(`  GET    /api/shops`);
});
