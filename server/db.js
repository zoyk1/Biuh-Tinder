import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'biuh-match.db'));

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== 创建表 =====

db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    age INTEGER DEFAULT 20,
    gender TEXT DEFAULT 'male',
    major TEXT DEFAULT '',
    year TEXT DEFAULT '',
    location TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    prompt_answer TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 用户照片表
  CREATE TABLE IF NOT EXISTS user_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 用户 Prompt 问答表
  CREATE TABLE IF NOT EXISTS user_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 匹配表
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_a_id TEXT NOT NULL,
    user_b_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_a_id, user_b_id)
  );

  -- 消息表
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 校园圈动态表
  CREATE TABLE IF NOT EXISTS moments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id TEXT NOT NULL,
    image TEXT DEFAULT '',
    title TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 动态标签表
  CREATE TABLE IF NOT EXISTS moment_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moment_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE
  );

  -- 动态点赞表
  CREATE TABLE IF NOT EXISTS moment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moment_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(moment_id, user_id)
  );

  -- 动态评论表
  CREATE TABLE IF NOT EXISTS moment_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moment_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 热门话题标签表
  CREATE TABLE IF NOT EXISTS trending_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL UNIQUE
  );

  -- 页面内容表 (用于"关于我们"、"校园安全指南"等)
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 社团活动表
  CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    contact TEXT DEFAULT '',
    image TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 周边商店表
  CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    address TEXT DEFAULT '',
    image TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ===== 种子数据 =====

const seedUsers = [
  { id: 'u1', name: '林依依', age: 20, gender: 'female', major: '视觉传达设计', year: '大二', location: '常出没于：艺术楼 & 图书馆咖啡厅', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { id: 'u2', name: '张子豪', age: 21, gender: 'male', major: '计算机科学与技术', year: '大三', location: '常出没于：机房 & 健身房', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { id: 'u3', name: '陈书婷', age: 22, gender: 'female', major: '新闻与传播', year: '大四', location: '常出没于：学生活动中心', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { id: 'u4', name: '李浩宇', age: 23, gender: 'male', major: '金融工程', year: '研一', location: '常出没于：商学院 & 篮球场', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
  { id: 'u5', name: '赵小雅', age: 20, gender: 'female', major: '汉语言文学', year: '大二', location: '常出没于：樱花大道 & 图书馆五楼', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=150&q=80' },
  { id: 'u6', name: '王宇轩', age: 22, gender: 'male', major: '电子信息工程', year: '大四', location: '常出没于：创新实验室', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'u7', name: '刘凯', age: 21, gender: 'male', major: '市场营销', year: '大三', location: '常出没于：商学院大厅 & 网球场', avatar: 'https://images.unsplash.com/photo-1500649297466-74794c70acfc?auto=format&fit=crop&w=150&q=80' },
  { id: 'u8', name: '孙琪', age: 23, gender: 'female', major: '会计学', year: '研一', location: '常出没于：研究生院自习室', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80' },
];

const seedPhotos = [
  { user_id: 'u1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u1', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
  { user_id: 'u2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
  { user_id: 'u3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
  { user_id: 'u4', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u4', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
  { user_id: 'u5', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u5', url: 'https://images.unsplash.com/photo-1485875437342-9b39470b3d95?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
  { user_id: 'u6', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u6', url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
  { user_id: 'u7', url: 'https://images.unsplash.com/photo-1500649297466-74794c70acfc?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u7', url: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
  { user_id: 'u8', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80', sort_order: 0 },
  { user_id: 'u8', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80', sort_order: 1 },
];

const seedPrompts = [
  { user_id: 'u1', question: '我在 BIUH 最喜欢的角落是...', answer: '傍晚的南区操场，看晚霞发呆。', sort_order: 0 },
  { user_id: 'u1', question: '期末周的续命秘籍...', answer: '买三杯冰美式，以及找一个能在图书馆帮我占座的搭子。', sort_order: 1 },
  { user_id: 'u2', question: '我的一大怪癖是...', answer: '写代码(赶 DDl)的时候必须听白噪音，绝对不能听有人声的歌。', sort_order: 0 },
  { user_id: 'u2', question: '让我心动的瞬间...', answer: '当你能在黑客松(Hackathon)上和我打好配合的时候！', sort_order: 1 },
  { user_id: 'u3', question: '毕业前一定要做的事...', answer: '把 BIUH 周边所有好吃的苍蝇馆子都吃一遍。', sort_order: 0 },
  { user_id: 'u3', question: '我正在寻找...', answer: '一个情绪稳定、愿意周末陪我一起去市区逛展、看话剧的人。', sort_order: 1 },
  { user_id: 'u4', question: '我的一大怪癖是...', answer: '喝美式必须加双份浓缩，不然总觉得不够苦。', sort_order: 0 },
  { user_id: 'u4', question: '周末最爱做的事...', answer: '去市区找个精酿酒吧，或者和朋友组队打篮球。', sort_order: 1 },
  { user_id: 'u5', question: '我最喜欢的解压方式...', answer: '戴上耳机听着播客，在校园里毫无目的地夜跑。', sort_order: 0 },
  { user_id: 'u5', question: '让我心动的瞬间...', answer: '聊到同一本文学作品时，眼睛发亮的样子。', sort_order: 1 },
  { user_id: 'u6', question: '毕业前一定要做的事...', answer: '把这几年做的硬核机器人项目全部开源发布出去。', sort_order: 0 },
  { user_id: 'u6', question: '周末最爱做的事...', answer: '开车去郊外露营烤肉，逃离城市的喧嚣。', sort_order: 1 },
  { user_id: 'u7', question: '我的一大怪癖是...', answer: '每次做 PPT 之前必须把桌面清理得一尘不染。', sort_order: 0 },
  { user_id: 'u7', question: '我正在寻找...', answer: '一个愿意陪我去听各种独立音乐 Livehouse 的灵魂搭子。', sort_order: 1 },
  { user_id: 'u8', question: '我在 BIUH 最喜欢的角落是...', answer: '北区综合楼的天台，晚上在那里看星星喝点小酒一绝。', sort_order: 0 },
  { user_id: 'u8', question: '典型的周日长这样...', answer: '睡到自然醒，然后去探店吃顿好的，下午疯狂赶 DDL。', sort_order: 1 },
];

const seedTags = ['#BIUH期末破防瞬间', '#食堂避雷指南', '#二手闲置交易', '#周末去哪儿', '#寻物启事'];

const seedMoments = [
  { author_id: 'u1', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', title: '周末探店｜学校南门新开的咖啡馆太出片了☕️ 强烈推荐抹茶拿铁！', tags: ['#周末去哪儿'], likes: 128,
    comments: [
      { author_id: 'u3', content: '看着好棒！求个具体定位～' },
      { author_id: 'u2', content: '抹茶拿铁确实绝绝子' }
    ]
  },
  { author_id: 'u2', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80', title: 'Hackathon 熬夜通宵的第 24 小时，兄弟们顶住！💻', tags: ['#BIUH期末破防瞬间'], likes: 45, comments: [] },
  { author_id: 'u2', image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80', title: '求助：图书馆三楼靠窗的位置冷气太足了，有人借件外套吗🥶', tags: ['#寻物启事'], likes: 12,
    comments: [
      { author_id: 'u2', content: '去一楼咖啡厅喝杯热饮暖暖吧' }
    ]
  },
  { author_id: 'u3', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80', title: '今天 BIUH 的晚霞绝了！赶紧放下手中的 DDL 出来看看天吧。', tags: ['#周末去哪儿'], likes: 356, comments: [] },
  { author_id: 'u4', image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=600&q=80', title: '食堂一楼新开的轻食窗口测评🥗 减脂期福音', tags: ['#食堂避雷指南'], likes: 89, comments: [] },
  { author_id: 'u5', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80', title: '期末复习周的正确打开方式📖 图书馆五楼阳光正好', tags: ['#BIUH期末破防瞬间'], likes: 231,
    comments: [
      { author_id: 'u4', content: '五楼这会儿还有位置吗？准备过去！' }
    ]
  },
  { author_id: 'u6', image: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&w=600&q=80', title: '周末逃离校园计划！南山露营地也太舒服了吧🏕️ 远离屏幕呼吸新鲜空气。', tags: ['#周末去哪儿'], likes: 412, comments: [] },
  { author_id: 'u4', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80', title: '毕业清仓！出一波九成新的专业课本和闲置显示器，可南区食堂面交📦', tags: ['#二手闲置交易'], likes: 34,
    comments: [
      { author_id: 'u7', content: '老哥显示器还在吗？什么型号的？' }
    ]
  },
];

const seedPages = [
  {
    id: 'about',
    title: '关于我们',
    content: 'BIUH Match 是一个专属于 BIUH 学生的校园社交平台。我们的使命是为 BIUH 校园内的同学提供一个安全、真实、有趣的交友空间。\n\n在这里，你可以通过滑动匹配找到志同道合的朋友，在校园圈分享日常点滴，发现身边有趣的人和事。\n\n**我们的团队**\n\n我们是一群热爱校园生活的 BIUH 学生，希望通过技术让校园社交变得更简单、更温暖。\n\n**联系方式**\n\n邮箱：hello@biuh-match.cn\n微信：BIUH_Match'
  },
  {
    id: 'safety',
    title: '校园安全指南',
    content: '**在线安全**\n\n- 不要向陌生人透露个人敏感信息（身份证号、银行卡号等）\n- 首次见面选择公共场所，并告知朋友你的行程\n- 如遇到骚扰或不当行为，请立即举报\n\n**线下见面建议**\n\n- 选择校园内或人多的公共场所\n- 白天见面更安全\n- 可以带上朋友一起\n- 保持手机畅通\n\n**举报与反馈**\n\n如发现违规用户，请通过 App 内举报功能或发送邮件至 safety@biuh-match.cn'
  },
  {
    id: 'clubs',
    title: '社团活动',
    content: 'BIUH 拥有丰富多彩的社团活动，以下为部分热门社团：'
  },
  {
    id: 'shops',
    title: '周边商店',
    content: '校园周边精选推荐，让你轻松找到好吃好玩的地方：'
  }
];

const seedClubs = [
  { name: '计算机协会', description: '定期举办编程马拉松、技术分享会，欢迎所有对技术感兴趣的同学加入！', category: '学术科技', contact: '每周五晚 7 点，信息楼 301', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80' },
  { name: '摄影社', description: '用镜头记录校园之美，不定期组织外拍活动和摄影展览。', category: '文化艺术', contact: '每周六下午，艺术楼 205', image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=400&q=80' },
  { name: '篮球社', description: '校内篮球爱好者的聚集地，定期举办 3v3 和 5v5 比赛。', category: '体育运动', contact: '每周三/五下午，北区体育馆', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=400&q=80' },
  { name: '读书会', description: '每月共读一本书，线下讨论交流，遇见有趣的灵魂。', category: '文化艺术', contact: '每两周周日，图书馆咖啡厅', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=80' },
  { name: '志愿者协会', description: '组织社区服务、支教、环保等公益活动，让大学生活更有意义。', category: '公益服务', contact: '每周六上午，学生活动中心', image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=400&q=80' },
  { name: '音乐社', description: '涵盖吉他、乐队、合唱等多种形式，每学期举办校园 Livehouse。', category: '文化艺术', contact: '每周四晚，学生活动中心 B1', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&q=80' },
];

const seedShops = [
  { name: '南门咖啡馆', description: '学校南门新开的网红咖啡馆，抹茶拿铁必点！环境超好适合拍照。', category: '咖啡甜点', address: '南门外 100 米左转', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80', rating: 4.8 },
  { name: '北区食堂', description: '一楼新开轻食窗口，减脂期同学的福音，价格实惠量又足。', category: '校园餐饮', address: '北区综合楼一楼', image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=400&q=80', rating: 4.2 },
  { name: '二手书屋', description: '二手教材、课外书、杂志都有，价格超便宜，期末季必去。', category: '书店文具', address: '东区商业街 3 号', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&q=80', rating: 4.5 },
  { name: '学长奶茶铺', description: '开了三年的老店，波霸奶茶和杨枝甘露是招牌，夏天排队也要喝。', category: '奶茶饮品', address: '西门外美食街 12 号', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=400&q=80', rating: 4.6 },
  { name: '校园打印店', description: '论文打印、海报制作、证件照拍摄，学生优惠价。', category: '生活服务', address: '教学楼 A 座负一楼', image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80', rating: 4.0 },
  { name: '健身工坊', description: '器械齐全的健身房，学生月卡只要 99 元，还有私教课程。', category: '运动健身', address: '北区体育馆旁', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80', rating: 4.3 },
];

// ===== 插入种子数据（如果表为空） =====

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('[DB] Seeding initial data...');

  const insertUser = db.prepare('INSERT INTO users (id, name, age, gender, major, year, location, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertPhoto = db.prepare('INSERT INTO user_photos (user_id, url, sort_order) VALUES (?, ?, ?)');
  const insertPrompt = db.prepare('INSERT INTO user_prompts (user_id, question, answer, sort_order) VALUES (?, ?, ?, ?)');
  const insertTag = db.prepare('INSERT INTO trending_tags (tag) VALUES (?)');
  const insertMoment = db.prepare('INSERT INTO moments (author_id, image, title, likes) VALUES (?, ?, ?, ?)');
  const insertMomentTag = db.prepare('INSERT INTO moment_tags (moment_id, tag) VALUES (?, ?)');
  const insertComment = db.prepare('INSERT INTO moment_comments (moment_id, author_id, content) VALUES (?, ?, ?)');
  const insertPage = db.prepare('INSERT INTO pages (id, title, content) VALUES (?, ?, ?)');
  const insertClub = db.prepare('INSERT INTO clubs (name, description, category, contact, image) VALUES (?, ?, ?, ?, ?)');
  const insertShop = db.prepare('INSERT INTO shops (name, description, category, address, image, rating) VALUES (?, ?, ?, ?, ?, ?)');

  const transaction = db.transaction(() => {
    for (const u of seedUsers) {
      insertUser.run(u.id, u.name, u.age, u.gender, u.major, u.year, u.location, u.avatar);
    }
    for (const p of seedPhotos) {
      insertPhoto.run(p.user_id, p.url, p.sort_order);
    }
    for (const p of seedPrompts) {
      insertPrompt.run(p.user_id, p.question, p.answer, p.sort_order);
    }
    for (const t of seedTags) {
      insertTag.run(t);
    }
    for (const m of seedMoments) {
      const result = insertMoment.run(m.author_id, m.image, m.title, m.likes);
      const momentId = result.lastInsertRowid;
      for (const t of m.tags) {
        insertMomentTag.run(momentId, t);
      }
      for (const c of m.comments) {
        insertComment.run(momentId, c.author_id, c.content);
      }
    }
    for (const p of seedPages) {
      insertPage.run(p.id, p.title, p.content);
    }
    for (const c of seedClubs) {
      insertClub.run(c.name, c.description, c.category, c.contact, c.image);
    }
    for (const s of seedShops) {
      insertShop.run(s.name, s.description, s.category, s.address, s.image, s.rating);
    }
  });

  transaction();
  console.log('[DB] Seed data inserted successfully.');
} else {
  console.log('[DB] Database already has data, skipping seed.');
}

export default db;
