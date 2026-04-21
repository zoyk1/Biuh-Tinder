import React, { useState, useEffect } from 'react';
import { Heart, X, MessageCircle, User, Zap, Star, Send, ChevronLeft, RefreshCw, Flame, Settings, Shield, LogOut, Mail, Lock, ChevronRight, PlusSquare, Trash2, Hash } from 'lucide-react';

// --- BIUH 校园专属模拟数据 (Mock Data) ---
const BIUH_PROFILES = [
  {
    id: 1,
    name: '林依依',
    age: 20,
    gender: 'female',
    major: '视觉传达设计',
    year: '大二',
    location: '常出没于：艺术楼 & 图书馆咖啡厅',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '我在 BIUH 最喜欢的角落是...', a: '傍晚的南区操场，看晚霞发呆。' },
      { q: '期末周的续命秘籍...', a: '买三杯冰美式，以及找一个能在图书馆帮我占座的搭子。' }
    ]
  },
  {
    id: 2,
    name: '张子豪',
    age: 21,
    gender: 'male',
    major: '计算机科学与技术',
    year: '大三',
    location: '常出没于：机房 & 健身房',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '我的一大怪癖是...', a: '写代码(赶 DDl)的时候必须听白噪音，绝对不能听有人声的歌。' },
      { q: '让我心动的瞬间...', a: '当你能在黑客松(Hackathon)上和我打好配合的时候！' }
    ]
  },
  {
    id: 3,
    name: '陈书婷',
    age: 22,
    gender: 'female',
    major: '新闻与传播',
    year: '大四',
    location: '常出没于：学生活动中心',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '毕业前一定要做的事...', a: '把 BIUH 周边所有好吃的苍蝇馆子都吃一遍。' },
      { q: '我正在寻找...', a: '一个情绪稳定、愿意周末陪我一起去市区逛展、看话剧的人。' }
    ]
  },
  {
    id: 4,
    name: '李浩宇',
    age: 23,
    gender: 'male', 
    major: '金融工程',
    year: '研一',
    location: '常出没于：商学院 & 篮球场',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '我的一大怪癖是...', a: '喝美式必须加双份浓缩，不然总觉得不够苦。' },
      { q: '周末最爱做的事...', a: '去市区找个精酿酒吧，或者和朋友组队打篮球。' }
    ]
  },
  {
    id: 5,
    name: '赵小雅',
    age: 20,
    gender: 'female',
    major: '汉语言文学',
    year: '大二',
    location: '常出没于：樱花大道 & 图书馆五楼',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1485875437342-9b39470b3d95?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '我最喜欢的解压方式...', a: '戴上耳机听着播客，在校园里毫无目的地夜跑。' },
      { q: '让我心动的瞬间...', a: '聊到同一本文学作品时，眼睛发亮的样子。' }
    ]
  },
  {
    id: 6,
    name: '王宇轩',
    age: 22,
    gender: 'male',
    major: '电子信息工程',
    year: '大四',
    location: '常出没于：创新实验室',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '毕业前一定要做的事...', a: '把这几年做的硬核机器人项目全部开源发布出去。' },
      { q: '周末最爱做的事...', a: '开车去郊外露营烤肉，逃离城市的喧嚣。' }
    ]
  },
  {
    id: 7,
    name: '刘凯',
    age: 21,
    gender: 'male',
    major: '市场营销',
    year: '大三',
    location: '常出没于：商学院大厅 & 网球场',
    photos: [
      'https://images.unsplash.com/photo-1500649297466-74794c70acfc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '我的一大怪癖是...', a: '每次做 PPT 之前必须把桌面清理得一尘不染。' },
      { q: '我正在寻找...', a: '一个愿意陪我去听各种独立音乐 Livehouse 的灵魂搭子。' }
    ]
  },
  {
    id: 8,
    name: '孙琪',
    age: 23,
    gender: 'female',
    major: '会计学',
    year: '研一',
    location: '常出没于：研究生院自习室',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80'
    ],
    prompts: [
      { q: '我在 BIUH 最喜欢的角落是...', a: '北区综合楼的天台，晚上在那里看星星喝点小酒一绝。' },
      { q: '典型的周日长这样...', a: '睡到自然醒，然后去探店吃顿好的，下午疯狂赶 DDL。' }
    ]
  }
];

const TRENDING_TAGS = ['#BIUH期末破防瞬间', '#食堂避雷指南', '#二手闲置交易', '#周末去哪儿', '#寻物启事'];

const BIUH_MOMENTS = [
  {
    id: 1,
    author: '林依依',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    title: '周末探店｜学校南门新开的咖啡馆太出片了☕️ 强烈推荐抹茶拿铁！',
    tags: ['#周末去哪儿'],
    likes: 128,
    isLiked: false,
    comments: [
      { id: 101, author: '陈书婷', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', text: '看着好棒！求个具体定位～' },
      { id: 102, author: 'Alex', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', text: '抹茶拿铁确实绝绝子' }
    ]
  },
  {
    id: 2,
    author: '张子豪',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    title: 'Hackathon 熬夜通宵的第 24 小时，兄弟们顶住！💻',
    tags: ['#BIUH期末破防瞬间'],
    likes: 45,
    isLiked: false,
    comments: []
  },
  {
    id: 3,
    author: '匿名同学',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80',
    title: '求助：图书馆三楼靠窗的位置冷气太足了，有人借件外套吗🥶',
    tags: ['#寻物启事'],
    likes: 12,
    isLiked: true,
    comments: [
      { id: 103, author: '热心肠', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80', text: '去一楼咖啡厅喝杯热饮暖暖吧' }
    ]
  },
  {
    id: 4,
    author: '陈书婷',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    title: '今天 BIUH 的晚霞绝了！赶紧放下手中的 DDL 出来看看天吧。',
    tags: ['#周末去哪儿'],
    likes: 356,
    isLiked: false,
    comments: []
  },
  {
    id: 5,
    author: '美食雷达',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=600&q=80',
    title: '食堂一楼新开的轻食窗口测评🥗 减脂期福音',
    tags: ['#食堂避雷指南'],
    likes: 89,
    isLiked: false,
    comments: []
  },
  {
    id: 6,
    author: '赵小雅',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    title: '期末复习周的正确打开方式📖 图书馆五楼阳光正好',
    tags: ['#BIUH期末破防瞬间'],
    likes: 231,
    isLiked: false,
    comments: [
      { id: 104, author: '李浩宇', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80', text: '五楼这会儿还有位置吗？准备过去！' }
    ]
  },
  {
    id: 7,
    author: '王宇轩',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&w=600&q=80',
    title: '周末逃离校园计划！南山露营地也太舒服了吧🏕️ 远离屏幕呼吸新鲜空气。',
    tags: ['#周末去哪儿'],
    likes: 412,
    isLiked: true,
    comments: []
  },
  {
    id: 8,
    author: '毕业闲置小铺',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80',
    title: '毕业清仓！出一波九成新的专业课本和闲置显示器，可南区食堂面交📦',
    tags: ['#二手闲置交易'],
    likes: 34,
    isLiked: false,
    comments: [
      { id: 105, author: '刘凯', avatar: 'https://images.unsplash.com/photo-1500649297466-74794c70acfc?auto=format&fit=crop&w=100&q=80', text: '老哥显示器还在吗？什么型号的？' }
    ]
  }
];

const INITIAL_USER = {
  name: 'Alex',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  age: 20,
  gender: 'male', 
  major: '未设置专业',
  year: '大一',
  location: '未设置常出没地',
  promptAnswer: '还未填写...'
};

const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
];

export default function App() {
  const [appView, setAppView] = useState('landing');
  const [authView, setAuthView] = useState('login'); 
  
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);
  const [regName, setRegName] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);

  const [moments, setMoments] = useState(BIUH_MOMENTS); 
  const [activeMoment, setActiveMoment] = useState(null); 
  const [isPublishing, setIsPublishing] = useState(false); 
  const [newMomentText, setNewMomentText] = useState(''); 
  const [newMomentTag, setNewMomentTag] = useState(''); 
  const [activeTagFilter, setActiveTagFilter] = useState(null); 
  const [newComment, setNewComment] = useState(''); 
  const [profileSubView, setProfileSubView] = useState(null); 

  const [viewingProfile, setViewingProfile] = useState(null); 

  const [queue, setQueue] = useState(() => BIUH_PROFILES.filter(p => p.gender !== INITIAL_USER.gender));
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeTab, setActiveTab] = useState('matches'); 
  const [activeChat, setActiveChat] = useState(null); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(null);
  const [inputText, setInputText] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // 当性别改变时，重新拉取异性数据，并过滤掉已经匹配过的用户
    setQueue(BIUH_PROFILES.filter(p => p.gender !== currentUser.gender && !matches.some(m => m.id === p.id)));
  }, [currentUser.gender]);

  const handlePass = () => {
    if (queue.length === 0 || leaving) return;
    setLeaving(true);
    
    setTimeout(() => {
      const newQueue = [...queue];
      newQueue.shift();
      setQueue(newQueue);
      setLeaving(false);
      const container = document.getElementById('discover-scroll-container');
      if (container) container.scrollTop = 0;
    }, 400); 
  };

  const handleLike = (profile) => {
    if (queue.length === 0 || leaving) return;
    setLeaving(true);

    setTimeout(() => {
      const newQueue = [...queue];
      newQueue.shift();
      setQueue(newQueue);
      setLeaving(false);
      
      const container = document.getElementById('discover-scroll-container');
      if (container) container.scrollTop = 0;

      if (Math.random() > 0.3) {
        handleMatch(profile);
      }
    }, 400);
  };

  const handleMatch = (profile) => {
    setShowMatchAnimation(profile);
    setMatches(prev => {
      // 修复重复 Key 问题：检查是否已经存在于 matches 中，防止重复匹配同一个人
      if (prev.some(m => m.id === profile.id)) {
        return prev;
      }
      return [...prev, profile];
    });
  };

  const handleSendMessage = (userId, text) => {
    if (!text.trim()) return;
    setMessages(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), { id: Date.now() + Math.random(), sender: 'me', text }]
    }));
  };

  const handleReset = () => {
    // 刷新队列：仅获取异性数据，并且过滤掉已经存在于 matches 列表中的用户
    setQueue(BIUH_PROFILES.filter(p => p.gender !== currentUser.gender && !matches.some(m => m.id === p.id)));
    // 如果当前在其他无关页面(如校园圈)，才切回匹配列表；如果在匹配/对话列表，则保持侧边栏状态不变
    if (activeTab !== 'matches' && activeTab !== 'messages') {
      setActiveTab('matches');
    }
    setActiveChat(null);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (authView === 'register') {
      if (regName.trim() !== '') {
        setCurrentUser(prev => ({ ...prev, name: regName.trim() }));
      }
      setAppView('onboarding');
    } else {
      setAppView('app');
    }
  };

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    setAppView('app');
  };

  const handleLogout = () => {
    setAppView('landing');
    setActiveTab('matches');
    setActiveChat(null);
  };

  const handleToggleLikeMoment = (momentId) => {
    setMoments(prev => prev.map(m => {
      if (m.id === momentId) {
        const updated = { ...m, isLiked: !m.isLiked, likes: m.isLiked ? m.likes - 1 : m.likes + 1 };
        if (activeMoment && activeMoment.id === momentId) {
          setActiveMoment(updated);
        }
        return updated;
      }
      return m;
    }));
  };

  const handleAddComment = (momentId) => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now() + Math.random(),
      author: currentUser.name,
      avatar: currentUser.avatar,
      text: newComment
    };
    
    setMoments(prev => prev.map(m => {
      if (m.id === momentId) {
        const updated = { ...m, comments: [...m.comments, comment] };
        if (activeMoment && activeMoment.id === momentId) {
          setActiveMoment(updated);
        }
        return updated;
      }
      return m;
    }));
    setNewComment(''); 
  };

  const handleDeleteComment = (momentId, commentId) => {
    setMoments(prev => prev.map(m => {
      if (m.id === momentId) {
        const updated = { ...m, comments: m.comments.filter(c => c.id !== commentId) };
        if (activeMoment && activeMoment.id === momentId) {
          setActiveMoment(updated);
        }
        return updated;
      }
      return m;
    }));
  };

  const handleDeleteMoment = (momentId) => {
    setMoments(prev => prev.filter(m => m.id !== momentId));
    if (activeMoment && activeMoment.id === momentId) {
      setActiveMoment(null);
    }
  };

  const handleViewProfile = (authorName, authorAvatar) => {
    if (authorName === currentUser.name) {
      setActiveTab('profile');
      if (activeMoment) setActiveMoment(null);
      return;
    }

    const foundProfile = BIUH_PROFILES.find(p => p.name === authorName);
    
    if (foundProfile) {
      setViewingProfile(foundProfile);
    } else {
      setViewingProfile({
        name: authorName,
        photos: [authorAvatar],
        age: '保密',
        gender: '保密',
        major: '未知专业',
        year: '神秘年级',
        location: 'BIUH 校园某处',
        prompts: [{ q: '关于我...', a: '这是一位很低调的同学，还没有完善详细资料。' }]
      });
    }
  };

  const handlePublishMoment = (e) => {
    e.preventDefault();
    if (!newMomentText.trim()) return;
    
    let formattedTag = newMomentTag.trim();
    if (formattedTag && !formattedTag.startsWith('#')) {
      formattedTag = '#' + formattedTag;
    }

    const newPost = {
      id: Date.now() + Math.random(),
      author: currentUser.name,
      avatar: currentUser.avatar,
      image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80', 
      title: newMomentText,
      tags: formattedTag ? [formattedTag] : [], 
      likes: 0,
      isLiked: false,
      comments: []
    };
    
    setMoments([newPost, ...moments]);
    setIsPublishing(false); 
    setNewMomentText(''); 
    setNewMomentTag(''); 
  };


  const renderSidebar = () => (
    <div className={`
      w-full md:w-[350px] bg-white border-r border-gray-200 flex flex-col h-full
      ${activeChat && 'hidden md:flex'} 
    `}>
      <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('profile')}>
          <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover" />
          <span className="text-black font-serif font-bold text-lg">{currentUser.name}</span>
        </div>
        <button onClick={handleReset} title="重置数据" className="text-gray-400 hover:text-black transition">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        <button 
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'matches' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-800'}`}
          onClick={() => { setActiveTab('matches'); setActiveChat(null); }}
        >
          匹配
        </button>
        <button 
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'messages' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-800'}`}
          onClick={() => { setActiveTab('messages'); setActiveChat(null); }}
        >
          对话
        </button>
        <button 
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'moments' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-800'}`}
          onClick={() => { setActiveTab('moments'); setActiveChat(null); }}
        >
          校园圈
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#fcfcfc]">
        {activeTab === 'moments' && (
          <div className="space-y-8 mt-2">
            <button 
              onClick={() => setIsPublishing(true)}
              className="w-full bg-black text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg hover:bg-gray-800 hover:scale-[1.02] transition-all"
            >
              <PlusSquare size={20} />
              <span className="font-bold">发布新日常</span>
            </button>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">热门校园话题</h3>
                {activeTagFilter && (
                   <button onClick={() => setActiveTagFilter(null)} className="text-xs text-rose-500 font-bold hover:underline">清除筛选</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map(tag => (
                  <span 
                    key={tag} 
                    onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${activeTagFilter === tag ? 'bg-black text-white shadow-md' : 'bg-[#f4f4f0] text-gray-700 hover:bg-gray-200'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-sm font-serif font-bold text-rose-800 mb-1">💡 脱单小贴士</p>
              <p className="text-xs text-rose-600">多发带图的校园圈动态，被 Like 匹配的概率会提升 30% 喔！</p>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            {matches.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Heart size={24} className="text-gray-300" />
                </div>
                <p className="font-serif">去点赞发现你的共鸣</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {matches.map(match => (
                  <div key={match.id} className="cursor-pointer group relative overflow-hidden rounded-xl aspect-[3/4]" onClick={() => setActiveChat(match)}>
                    <img src={match.photos[0]} alt={match.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    <span className="absolute bottom-3 left-3 text-white font-serif font-bold text-lg">{match.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="flex flex-col gap-1">
             {matches.length === 0 && <p className="text-center text-gray-400 mt-10 font-serif">暂无对话</p>}
             {matches.map(match => {
                const lastMsg = messages[match.id] ? messages[match.id][messages[match.id].length - 1].text : '开始了对话';
                return (
                  <div 
                    key={match.id} 
                    className="flex items-center gap-4 p-3 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                    onClick={() => setActiveChat(match)}
                  >
                    <img src={match.photos[0]} alt={match.name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-gray-900 text-lg">{match.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{lastMsg}</p>
                    </div>
                  </div>
                )
             })}
          </div>
        )}
      </div>
    </div>
  );

  const renderDiscover = () => {
    const profile = queue[0];

    return (
      <div className="flex-1 relative flex flex-col bg-[#f4f4f0] h-full">
        {/* 移动端顶部栏 */}
        <div className="md:hidden absolute top-0 w-full h-16 bg-[#f4f4f0]/90 backdrop-blur flex items-center justify-between px-6 z-20">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black">
             <MessageCircle size={24} />
             {matches.length > 0 && <span className="absolute top-4 left-9 w-2 h-2 bg-rose-500 rounded-full"></span>}
          </button>
          <span className="font-serif font-black text-2xl tracking-tighter text-black">BIUH Match</span>
          <button onClick={() => { setActiveTab('profile'); setActiveChat(null); }} className="text-black">
            <User size={24} />
          </button>
        </div>

        {/* 滚动资料区 */}
        <div id="discover-scroll-container" className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 pb-32 smooth-scroll">
          {queue.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 min-h-[600px]">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-6 overflow-hidden border-4 border-white shadow-md">
                <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover opacity-50 grayscale" />
              </div>
              <h2 className="text-2xl font-serif text-black mb-2">当前校区没有更多同学了</h2>
              <p className="mb-6">扩大搜索范围或稍后再试</p>
              <button 
                onClick={handleReset}
                className="px-8 py-3 bg-black text-white rounded-full font-bold shadow-lg hover:bg-gray-800 transition"
              >
                重新搜索
              </button>
            </div>
          ) : (
            <div className={`max-w-md mx-auto p-4 space-y-6 transition-all duration-400 ease-in-out ${leaving ? 'opacity-0 translate-y-10 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
              
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm group">
                 <img src={profile.photos[0]} className="w-full aspect-[4/5] object-cover" alt="Profile 1" />
                 <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-20 p-6 text-white">
                    <div className="flex items-baseline gap-2">
                      <h1 className="text-3xl font-serif font-bold">{profile.name}</h1>
                    </div>
                    <p className="text-lg opacity-90 mt-1">{profile.age}岁 · {profile.gender === 'male' ? '男生' : '女生'} · {profile.major} · {profile.year}</p>
                    <div className="flex items-center gap-2 text-sm mt-2 opacity-80">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      <span>{profile.location}</span>
                    </div>
                 </div>
                 <button onClick={() => handleLike(profile)} className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 md:opacity-100 md:translate-y-0">
                    <Heart size={22} className="fill-black" />
                 </button>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm relative group">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{profile.prompts[0].q}</p>
                 <h2 className="text-2xl font-serif text-black leading-snug">{profile.prompts[0].a}</h2>
                 <button onClick={() => handleLike(profile)} className="absolute -bottom-5 right-6 w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition">
                    <Heart size={22} className="fill-black" />
                 </button>
              </div>

              <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm group mt-10">
                 <img src={profile.photos[1]} className="w-full aspect-square object-cover" alt="Profile 2" />
                 <button onClick={() => handleLike(profile)} className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 md:opacity-100 md:translate-y-0">
                    <Heart size={22} className="fill-black" />
                 </button>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm relative group mb-8">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{profile.prompts[1].q}</p>
                 <h2 className="text-2xl font-serif text-black leading-snug">{profile.prompts[1].a}</h2>
                 <button onClick={() => handleLike(profile)} className="absolute -bottom-5 right-6 w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition">
                    <Heart size={22} className="fill-black" />
                 </button>
              </div>
            </div>
          )}
        </div>

        {queue.length > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-4">
            <button 
              onClick={handlePass}
              className="w-16 h-16 bg-white border border-gray-200 rounded-full shadow-xl flex items-center justify-center text-gray-800 hover:scale-105 hover:bg-gray-50 transition"
              disabled={leaving}
            >
              <X size={32} strokeWidth={2} />
            </button>
          </div>
        )}

        {showMatchAnimation && (
          <div className="absolute inset-0 bg-[#f4f4f0]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-black mb-12 text-center tracking-tight">
              You and {showMatchAnimation.name} invited each other to chat.
            </h1>
            
            <div className="flex items-center gap-6 mb-16 relative">
              <img src={currentUser.avatar} className="w-32 h-32 rounded-full border-[6px] border-white object-cover shadow-xl z-10 translate-x-4" alt="Me" />
              <img 
                src={showMatchAnimation.photos[0]} 
                className="w-32 h-32 rounded-full border-[6px] border-white object-cover shadow-xl z-0 -translate-x-4 cursor-pointer hover:scale-105 hover:z-20 transition-all" 
                alt="Match" 
                title="查看TA的主页"
                onClick={() => handleViewProfile(showMatchAnimation.name, showMatchAnimation.photos[0])}
              />
            </div>

            <div className="w-full max-w-sm space-y-4">
              <button 
                onClick={() => { setActiveChat(showMatchAnimation); setShowMatchAnimation(null); }}
                className="w-full py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition shadow-lg"
              >
                打个招呼
              </button>
              <button 
                onClick={() => setShowMatchAnimation(null)}
                className="w-full py-4 bg-transparent border-2 border-black text-black rounded-full font-bold text-lg hover:bg-black/5 transition"
              >
                继续探索
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMoments = () => {
    const displayedMoments = activeTagFilter 
      ? moments.filter(m => m.tags && m.tags.includes(activeTagFilter))
      : moments;

    if (activeMoment) {
      return (
        <div className="flex-1 flex flex-col h-full bg-white z-40 absolute md:static inset-0 animate-in slide-in-from-right-8 duration-300">
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white/90 backdrop-blur-md z-10">
            <button onClick={() => setActiveMoment(null)} className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition">
              <ChevronLeft size={28} />
            </button>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => handleViewProfile(activeMoment.author, activeMoment.avatar)}
            >
              <img src={activeMoment.avatar} className="w-8 h-8 rounded-full object-cover" alt="author" />
              <span className="font-bold font-serif text-sm">{activeMoment.author}</span>
            </div>
            {activeMoment.author === currentUser.name ? (
              <button 
                onClick={() => handleDeleteMoment(activeMoment.id)}
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
                title="删除动态"
              >
                <Trash2 size={20} />
              </button>
            ) : (
              <div className="w-8"></div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <img src={activeMoment.image} className="w-full max-h-[60vh] object-cover bg-gray-100" alt="moment" />
            <div className="p-6">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-3">{activeMoment.title}</h2>
              {activeMoment.tags && activeMoment.tags.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {activeMoment.tags.map(tag => (
                    <span key={tag} className="text-rose-500 text-sm font-medium cursor-pointer hover:underline" onClick={() => { setActiveTagFilter(tag); setActiveMoment(null); }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-gray-500 text-sm leading-relaxed mb-6">这是 {activeMoment.author} 分享在 BIUH 校园圈的日常。如果你觉得有趣，快来点赞互动吧！</p>
              
              <div className="flex items-center gap-8 border-y border-gray-100 py-4 my-6">
                <button 
                  onClick={() => handleToggleLikeMoment(activeMoment.id)} 
                  className={`flex items-center gap-2 transition ${activeMoment.isLiked ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}
                >
                  <Heart size={26} fill={activeMoment.isLiked ? 'currentColor' : 'none'} className={activeMoment.isLiked ? 'scale-110 transition-transform' : ''} /> 
                  <span className="font-bold text-lg">{activeMoment.likes}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle size={24} /> <span className="font-bold text-lg">{activeMoment.comments.length}</span>
                </div>
              </div>

              <div className="space-y-6 pb-4">
                <h3 className="font-bold text-gray-800 text-sm mb-4">全部评论</h3>
                {activeMoment.comments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">还没有人评论，快来抢沙发！</p>
                ) : (
                  activeMoment.comments.map(c => (
                    <div key={c.id} className="flex gap-3 group/comment">
                      <img 
                        src={c.avatar} 
                        className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition" 
                        alt={c.author} 
                        onClick={() => handleViewProfile(c.author, c.avatar)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span 
                            className="font-bold text-gray-900 text-xs cursor-pointer hover:underline"
                            onClick={() => handleViewProfile(c.author, c.avatar)}
                          >
                            {c.author}
                          </span>
                          {c.author === currentUser.name && (
                            <button 
                              onClick={() => handleDeleteComment(activeMoment.id, c.id)}
                              className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition px-2 py-1 bg-gray-50 hover:bg-rose-50 rounded-md"
                            >
                              删除
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment(activeMoment.id);
              }}
              placeholder="说点什么..." 
              className="flex-1 bg-[#f4f4f0] border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 rounded-full px-5 py-2.5 outline-none transition-all text-sm"
            />
            <button 
              onClick={() => handleAddComment(activeMoment.id)}
              disabled={!newComment.trim()}
              className="px-5 py-2.5 bg-black text-white rounded-full font-bold text-sm disabled:opacity-50 transition"
            >
              发送
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 relative flex flex-col bg-[#f4f4f0] h-full overflow-hidden">
        <div className="md:hidden absolute top-0 w-full h-16 bg-[#f4f4f0]/90 backdrop-blur flex items-center justify-between px-6 z-20 border-b border-gray-100">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black">
             <MessageCircle size={24} />
          </button>
          <span className="font-serif font-black text-2xl tracking-tighter text-black">BIUH 动态</span>
          <button onClick={() => { setActiveTab('profile'); setActiveChat(null); }} className="text-black">
            <User size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full pt-20 md:pt-6 pb-20 px-4 md:px-6 smooth-scroll">
           
           <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
             {activeTagFilter && (
               <span onClick={() => setActiveTagFilter(null)} className="shrink-0 px-4 py-2 bg-rose-50 text-rose-500 rounded-full text-sm font-bold shadow-sm whitespace-nowrap">
                 ✕ 清除筛选
               </span>
             )}
             {TRENDING_TAGS.map(tag => (
               <span 
                 key={tag} 
                 onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                 className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${activeTagFilter === tag ? 'bg-black text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}
               >
                 {tag}
               </span>
             ))}
           </div>

           {displayedMoments.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-400">
               <Hash size={32} className="mb-2 opacity-50" />
               <p>该话题下还没有动态，来抢首发吧！</p>
             </div>
           ) : (
             <div className="columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
               {displayedMoments.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => setActiveMoment(post)}
                    className="break-inside-avoid bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group"
                  >
                     <div className="relative overflow-hidden">
                       <img src={post.image} className="w-full object-cover bg-gray-100 group-hover:scale-105 transition-transform duration-500" alt={post.title} />
                     </div>
                     <div className="p-3 md:p-4">
                        <h3 className="font-bold text-sm md:text-base text-gray-900 leading-snug mb-2 line-clamp-2 font-serif">{post.title}</h3>
                        
                        {post.tags && post.tags.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-0.5 rounded-md">{post.tags[0]}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                           <div 
                             className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                             onClick={(e) => { e.stopPropagation(); handleViewProfile(post.author, post.avatar); }}
                           >
                              <img src={post.avatar} className="w-5 h-5 rounded-full object-cover" />
                              <span className="truncate max-w-[80px] font-medium">{post.author}</span>
                           </div>
                           <div className="flex items-center gap-3">
                             {post.author === currentUser.name && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteMoment(post.id); }}
                                 className="text-gray-400 hover:text-rose-500 transition"
                                 title="删除动态"
                               >
                                 <Trash2 size={14} />
                               </button>
                             )}
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleLikeMoment(post.id); }}
                                className={`flex items-center gap-1 transition-colors ${post.isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                             >
                                <Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} />
                                <span>{post.likes}</span>
                             </button>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
             </div>
           )}
        </div>
        
        <button 
          onClick={() => setIsPublishing(true)}
          className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform z-10"
        >
           <PlusSquare size={24} />
        </button>

        {isPublishing && (
          <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end md:justify-center md:items-center animate-in fade-in duration-200">
            <div className="bg-white w-full md:w-[500px] rounded-t-3xl md:rounded-3xl p-6 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setIsPublishing(false)} className="text-gray-400 hover:text-black transition">
                  <X size={24} />
                </button>
                <span className="font-bold text-lg font-serif">发布新日常</span>
                <button 
                  onClick={handlePublishMoment}
                  disabled={!newMomentText.trim()}
                  className="px-5 py-2 bg-black text-white rounded-full font-bold text-sm disabled:opacity-30 hover:bg-gray-800 transition"
                >
                  发布
                </button>
              </div>
              
              <div className="flex gap-4 mb-4">
                <img src={currentUser.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="avatar" />
                <textarea 
                  autoFocus
                  rows="4"
                  value={newMomentText}
                  onChange={(e) => setNewMomentText(e.target.value)}
                  placeholder="分享你的 BIUH 校园生活..."
                  className="flex-1 resize-none outline-none text-lg placeholder:text-gray-300"
                />
              </div>

              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Hash size={16} className="text-gray-400" />
                  <input 
                    type="text" 
                    value={newMomentTag}
                    onChange={(e) => setNewMomentTag(e.target.value)}
                    placeholder="输入自定义话题 (例如：#自习室推荐)"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 font-medium"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.slice(0, 4).map(tag => (
                    <span 
                      key={tag} 
                      onClick={() => setNewMomentTag(tag)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 cursor-pointer hover:border-black transition"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition">
                <PlusSquare size={28} className="mb-1 opacity-50" />
                <span className="text-xs font-medium">点击上传照片</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChat = () => {
    const chatMsgs = messages[activeChat.id] || [];

    return (
      <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] z-30 absolute md:static inset-0">
        <div className="h-20 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-black">
              <ChevronLeft size={28} />
            </button>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleViewProfile(activeChat.name, activeChat.photos[0])}
            >
              <img src={activeChat.photos[0]} alt={activeChat.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                 <span className="font-serif font-bold text-lg block">{activeChat.name}</span>
                 <span className="text-xs text-gray-400">刚刚匹配成功</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="text-center my-8">
            <div 
              className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-4 border border-gray-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleViewProfile(activeChat.name, activeChat.photos[0])}
              title="查看TA的主页"
            >
               <img src={activeChat.photos[0]} className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-serif font-bold text-gray-800">你和 {activeChat.name} 互换了心意</p>
            <p className="text-xs text-gray-400 mt-1">别让缘分溜走，发个消息吧</p>
          </div>
          {chatMsgs.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-base ${
                msg.sender === 'me' 
                  ? 'bg-black text-white rounded-br-sm shadow-sm' 
                  : 'bg-[#f4f4f0] text-black rounded-bl-sm border border-gray-100'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage(activeChat.id, inputText);
                setInputText('');
              }
            }}
            placeholder="写点什么..." 
            className="flex-1 bg-[#f4f4f0] border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 rounded-full px-6 py-3 outline-none transition-all"
          />
          <button 
            onClick={() => {
              handleSendMessage(activeChat.id, inputText);
              setInputText('');
            }}
            disabled={!inputText.trim()}
            className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors"
          >
            <Send size={18} className="ml-1" />
          </button>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="flex-1 flex flex-col h-full bg-[#f4f4f0] z-30 absolute md:static inset-0 overflow-y-auto">
      <div className="h-20 flex items-center justify-between px-6 bg-[#f4f4f0] shrink-0 md:hidden">
        <button onClick={() => setActiveTab('matches')} className="p-2 -ml-2 text-black">
          <ChevronLeft size={28} />
        </button>
        <span className="font-serif font-bold text-xl">Account</span>
        <div className="w-8"></div> 
      </div>
      
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full pt-8 md:pt-16">
        <div className="flex flex-col items-center mb-12">
          <div className="w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg relative group cursor-pointer">
            <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <span className="text-white font-bold text-sm">更换头像</span>
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-black">{currentUser.name}</h2>
          <p className="text-gray-500 mt-2 tracking-widest text-sm uppercase">Member since 2024</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div 
            onClick={() => setProfileSubView('edit')}
            className="p-5 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <User size={22} className="text-gray-400" />
              <span className="font-bold text-gray-800">编辑个人资料</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
          <div 
            onClick={() => setProfileSubView('settings')}
            className="p-5 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <Settings size={22} className="text-gray-400" />
              <span className="font-bold text-gray-800">偏好设置</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
          <div 
            onClick={() => setProfileSubView('security')}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <Shield size={22} className="text-gray-400" />
              <span className="font-bold text-gray-800">隐私与安全</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-white rounded-2xl shadow-sm border border-gray-200 text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition"
        >
          <LogOut size={20} />
          退出登录
        </button>

        {profileSubView && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-right-8 duration-300">
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 shrink-0 bg-white">
              <button onClick={() => setProfileSubView(null)} className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition">
                <ChevronLeft size={28} />
              </button>
              <span className="font-serif font-bold text-lg">
                {profileSubView === 'edit' && '编辑个人资料'}
                {profileSubView === 'settings' && '偏好设置'}
                {profileSubView === 'security' && '隐私与安全'}
              </span>
              <button onClick={() => setProfileSubView(null)} className="font-bold text-sm text-black">完成</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#f4f4f0]">
              
              {profileSubView === 'edit' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">姓名 / 昵称</label>
                    <input type="text" defaultValue={currentUser.name} onChange={(e) => setCurrentUser(prev => ({...prev, name: e.target.value}))} className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">性别</label>
                      <select defaultValue={currentUser.gender} onChange={(e) => setCurrentUser(prev => ({...prev, gender: e.target.value}))} className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium bg-white appearance-none cursor-pointer">
                        <option value="male">男生</option>
                        <option value="female">女生</option>
                      </select>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">专业</label>
                      <input type="text" defaultValue={currentUser.major} onChange={(e) => setCurrentUser(prev => ({...prev, major: e.target.value}))} className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">年级</label>
                      <select defaultValue={currentUser.year} onChange={(e) => setCurrentUser(prev => ({...prev, year: e.target.value}))} className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium bg-white appearance-none cursor-pointer">
                        <option value="大一">大一</option>
                        <option value="大二">大二</option>
                        <option value="大三">大三</option>
                        <option value="大四">大四</option>
                        <option value="研究生">研究生</option>
                        <option value="博士生">博士生</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">常出没地点</label>
                    <input type="text" defaultValue={currentUser.location} onChange={(e) => setCurrentUser(prev => ({...prev, location: e.target.value}))} className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                  </div>
                </div>
              )}

              {profileSubView === 'settings' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-800">新消息推送通知</span>
                    <div className="w-12 h-6 bg-black rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer">
                    <span className="font-bold text-gray-800">深色模式</span>
                    <span className="text-gray-400 text-sm">跟随系统配置</span>
                  </div>
                </div>
              )}

              {profileSubView === 'security' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-black font-bold cursor-pointer hover:bg-gray-50 transition">
                    修改登录密码
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-rose-500 font-bold cursor-pointer hover:bg-rose-50 transition">
                    注销我的账号
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="min-h-screen w-full bg-[#f4f4f0] font-sans flex flex-col items-center py-12 px-6 overflow-y-auto selection:bg-rose-200">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 md:p-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-black tracking-tight text-black mb-3">欢迎来到 BIUH, {currentUser.name}</h1>
          <p className="text-gray-500 font-serif text-lg">让我们来完善你的专属校园档案。</p>
        </div>
        
        <form onSubmit={handleCompleteOnboarding} className="space-y-8">
          <div className="flex flex-col items-center">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">你的校园形象</label>
            <div className="relative group cursor-pointer" onClick={() => {
              const nextIdx = (avatarIndex + 1) % MOCK_AVATARS.length;
              setAvatarIndex(nextIdx);
              setCurrentUser(prev => ({ ...prev, avatar: MOCK_AVATARS[nextIdx] }));
            }}>
              <img src={currentUser.avatar} className="w-32 h-32 rounded-full object-cover border-4 border-[#f4f4f0] shadow-md group-hover:opacity-80 transition" alt="Avatar" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full">点击切换</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">年龄</label>
              <input 
                type="number" 
                required 
                min="16" max="30"
                value={currentUser.age}
                onChange={(e) => setCurrentUser(prev => ({...prev, age: e.target.value}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">性别</label>
              <select 
                required 
                value={currentUser.gender}
                onChange={(e) => setCurrentUser(prev => ({...prev, gender: e.target.value}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition appearance-none cursor-pointer" 
              >
                <option value="male">男生</option>
                <option value="female">女生</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">专业</label>
              <input 
                type="text" 
                required 
                placeholder="例如：计算机" 
                value={currentUser.major === '未设置专业' ? '' : currentUser.major}
                onChange={(e) => setCurrentUser(prev => ({...prev, major: e.target.value}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">年级</label>
              <select 
                required 
                value={currentUser.year}
                onChange={(e) => setCurrentUser(prev => ({...prev, year: e.target.value}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition appearance-none cursor-pointer" 
              >
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="研究生">研究生</option>
                <option value="博士生">博士生</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">校园里常出没的地点是？</label>
            <input 
              type="text" 
              required 
              placeholder="例如：图书馆三楼靠窗、南区操场..." 
              value={currentUser.location === '未设置常出没地' ? '' : currentUser.location}
              onChange={(e) => setCurrentUser(prev => ({...prev, location: e.target.value}))}
              className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
            />
          </div>

          <div className="bg-[#f4f4f0] p-6 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">回答一个问题，让大家更了解你</label>
            <p className="text-lg font-serif font-bold text-black mb-3">“期末周我的终极解压方式是...”</p>
            <textarea 
              required
              rows="3"
              placeholder="写下你的答案..."
              value={currentUser.promptAnswer === '还未填写...' ? '' : currentUser.promptAnswer}
              onChange={(e) => setCurrentUser(prev => ({...prev, promptAnswer: e.target.value}))}
              className="w-full px-4 py-3 bg-white border-transparent rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none transition resize-none" 
            />
          </div>

          <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg shadow-xl hover:bg-gray-800 hover:scale-[1.02] transition-all mt-4 flex items-center justify-center gap-2">
            进入 BIUH Match <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );

  const renderAuth = () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#f4f4f0] font-sans p-4 relative">
      <button 
        onClick={() => setAppView('landing')} 
        className="absolute top-8 left-8 text-black hover:scale-110 transition flex items-center gap-2"
      >
        <ChevronLeft size={24} />
        <span className="font-bold hidden md:inline">返回官网</span>
      </button>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-10 text-center">
          <h1 className="text-4xl font-serif font-black tracking-tighter text-black mb-2">BIUH Match</h1>
          <p className="text-gray-500 text-sm mb-10 font-serif italic">专属于 BIUH 的真实社交。</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5 text-left">
            {authView === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">你的名字</label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    required 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="输入真实姓名或昵称" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">校园认证</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" required placeholder="BIUH 校园邮箱 / 学号" className="w-full pl-12 pr-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">密码</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" required placeholder="输入密码" className="w-full pl-12 pr-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors mt-4">
              {authView === 'login' ? '登 录' : '创建账号'}
            </button>
          </form>

          <div className="mt-8 text-sm text-gray-500">
            {authView === 'login' ? (
              <p>刚来到这里？ <button onClick={() => setAuthView('register')} type="button" className="text-black font-bold underline hover:text-gray-700">注册加入</button></p>
            ) : (
              <p>已经是会员？ <button onClick={() => setAuthView('login')} type="button" className="text-black font-bold underline hover:text-gray-700">登录账号</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLanding = () => (
    <div className="min-h-screen w-full bg-[#f4f4f0] font-sans flex flex-col overflow-y-auto overflow-x-hidden selection:bg-rose-200">
      
      <nav className="w-full max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-12 py-8 z-20">
        <div className="flex items-center gap-12">
          <div className="font-serif font-black text-3xl md:text-4xl tracking-tighter text-black cursor-pointer">BIUH Match</div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold tracking-wide text-gray-900">
            <a href="#" className="hover:text-gray-500 transition-colors">关于我们</a>
            <a href="#" className="hover:text-gray-500 transition-colors">校园安全指南</a>
            <a href="#" className="hover:text-gray-500 transition-colors">社团活动</a>
            <a href="#" className="hover:text-gray-500 transition-colors">周边商店</a>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="hidden md:block text-sm font-bold tracking-wide text-gray-900 hover:text-gray-500 transition-colors">加入团队</a>
          <a href="#" className="hidden md:block text-sm font-bold tracking-wide text-gray-900 hover:text-gray-500 transition-colors">联系客服</a>
          <button 
            onClick={() => { setAuthView('login'); setAppView('auth'); }}
            className="text-black font-bold text-sm md:text-base border-2 border-black rounded-full px-6 py-2.5 hover:bg-black hover:text-[#f4f4f0] transition-all duration-300"
          >
            登录认证
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-10 md:pt-20 pb-20 flex flex-col xl:flex-row items-center justify-between gap-16 z-10">
        
        <div className="flex-1 w-full xl:max-w-2xl flex flex-col items-center xl:items-start text-center xl:text-left">
          <h1 className="text-[4rem] md:text-[6rem] lg:text-[7.5rem] font-serif font-bold text-black tracking-tighter leading-[0.85] mb-8">
            Designed for <br/>BIUHers.<span className="text-3xl md:text-5xl align-top ml-1 relative -top-4 md:-top-8">™</span>
          </h1>
          <p className="text-xl md:text-[1.35rem] text-gray-800 font-serif leading-relaxed max-w-xl mb-12">
            在这个快节奏的校园里，大家都在为了 GPA 和实习奔波。我们希望为你提供一个纯粹的内部交友空间。
            <br/><br/>
            在 BIUH，遇见那个能陪你一起在南区操场散步的人。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => { setAuthView('register'); setAppView('auth'); }}
              className="w-full sm:w-auto bg-black text-white px-10 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:scale-105 hover:bg-gray-900 transition-all shadow-xl"
            >
              开启校园寻缘
            </button>
            
            <div className="hidden xl:flex items-center gap-3 ml-6 opacity-70">
              <div className="w-12 h-12 bg-white border border-gray-300 p-1 flex items-center justify-center">
                 <div className="w-full h-full border-2 border-dashed border-gray-400"></div>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-600">限校园<br/>内网访问</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full relative h-[500px] md:h-[700px] flex items-center justify-center">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-[#EAE8E3] rounded-full -z-10 blur-2xl opacity-60"></div>
           
           <div className="relative w-[90%] md:w-[80%] h-full rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700 ease-out border-[8px] border-white">
             <img 
               src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80" 
               alt="Happy Couple Laughing" 
               className="w-full h-full object-cover"
             />
             
             <div className="absolute bottom-10 -left-6 md:-left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 transform -rotate-6 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                  <Heart fill="currentColor" size={24} />
                </div>
                <div className="hidden sm:block">
                  <p className="font-serif font-bold text-black text-sm">Ta 赞了你的社团照片</p>
                </div>
             </div>
           </div>
        </div>
        
      </main>

      <footer className="w-full bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-serif font-black text-2xl text-gray-300">BIUH Match</div>
          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">© 2026 BIUH Student Union. Demo Project</p>
        </div>
      </footer>
    </div>
  );

  const renderViewingProfile = () => (
    <div className="absolute inset-0 bg-[#f4f4f0] z-[60] flex flex-col animate-in slide-in-from-bottom-8 duration-300 overflow-y-auto">
      <div className="h-16 flex items-center px-4 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => setViewingProfile(null)} className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition">
          <ChevronLeft size={28} />
        </button>
        <span className="font-bold font-serif ml-2 text-lg">{viewingProfile.name} 的校园档案</span>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-md mx-auto w-full space-y-6 pb-20 mt-4">
         <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm">
           <img src={viewingProfile.photos?.[0] || viewingProfile.avatar} className="w-full aspect-[4/5] object-cover" alt="Profile" />
           <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-20 p-6 text-white">
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl font-serif font-bold">{viewingProfile.name}</h1>
              </div>
              <p className="text-lg opacity-90 mt-1">{viewingProfile.age}岁 · {viewingProfile.gender === 'male' ? '男生' : (viewingProfile.gender === 'female' ? '女生' : '保密')} · {viewingProfile.major} · {viewingProfile.year}</p>
              <div className="flex items-center gap-2 text-sm mt-2 opacity-80">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                <span>{viewingProfile.location}</span>
              </div>
           </div>
         </div>

         {viewingProfile.prompts && viewingProfile.prompts.length > 0 && (
           <div className="bg-white p-8 rounded-2xl shadow-sm">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{viewingProfile.prompts[0].q}</p>
             <h2 className="text-2xl font-serif text-black leading-snug">{viewingProfile.prompts[0].a}</h2>
           </div>
         )}
      </div>
    </div>
  );

  if (appView === 'landing') {
    return renderLanding();
  }

  if (appView === 'auth') {
    return renderAuth();
  }

  if (appView === 'onboarding') {
    return renderOnboarding();
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f4f0] overflow-hidden font-sans">
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        fixed md:static inset-y-0 left-0 z-50 h-full shadow-2xl md:shadow-none
      `}>
        {renderSidebar()}
      </div>

      <div className="flex-1 flex flex-col relative h-full">
        {activeTab === 'profile' 
          ? renderProfile() 
          : (activeChat 
              ? renderChat() 
              : (activeTab === 'moments' 
                  ? renderMoments() 
                  : renderDiscover()
                )
            )
        }
      </div>

      {viewingProfile && renderViewingProfile()}
    </div>
  );
}