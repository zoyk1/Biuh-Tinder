import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, X, MessageCircle, User, Zap, Star, Send, ChevronLeft, RefreshCw, Flame, Settings, Shield, LogOut, Mail, Lock, ChevronRight, PlusSquare, Trash2, Hash, Camera } from 'lucide-react';
// --- API 辅助函数 ---
const API = {
  get: (url) => fetch(url).then(r => r.json()),
  post: (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  put: (url, body) => fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  del: (url, body) => fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
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
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [currentUser, setCurrentUser] = useState(null);
  const [regName, setRegName] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);

  const [trendingTags, setTrendingTags] = useState([]);
  const [moments, setMoments] = useState([]); 
  const [activeMoment, setActiveMoment] = useState(null); 
  const [isPublishing, setIsPublishing] = useState(false); 
  const [newMomentText, setNewMomentText] = useState(''); 
  const [newMomentTag, setNewMomentTag] = useState(''); 
  const [newMomentImage, setNewMomentImage] = useState(null);
  const [activeTagFilter, setActiveTagFilter] = useState(null); 
  const [newComment, setNewComment] = useState(''); 
  const [profileSubView, setProfileSubView] = useState(null); 

  const [viewingProfile, setViewingProfile] = useState(null); 

  const [queue, setQueue] = useState([]);
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeTab, setActiveTab] = useState('matches'); 
  const [activeChat, setActiveChat] = useState(null); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(null);
  const [inputText, setInputText] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 上传文件状态
  const [uploadingFile, setUploadingFile] = useState(false);

  // Landing page sub-views
  const [landingSubView, setLandingSubView] = useState(null);
  const [landingData, setLandingData] = useState({ clubs: [], shops: [], about: null, safety: null });

  // 登录后加载数据
  const loadAppData = useCallback(async (user) => {
    try {
      const [profiles, matchList, tags, momentsData] = await Promise.all([
        API.get(`/api/users/${user.id}/discover`),
        API.get(`/api/matches/${user.id}`),
        API.get('/api/trending-tags'),
        API.get(`/api/moments?userId=${user.id}`),
      ]);
      setQueue(profiles || []);
      setMatches(matchList || []);
      setTrendingTags(tags || []);
      setMoments(momentsData || []);
    } catch (err) {
      console.error('Failed to load app data:', err);
    }
  }, []);

  const loadMoments = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await API.get(`/api/moments?userId=${currentUser.id}${activeTagFilter ? `&tag=${encodeURIComponent(activeTagFilter)}` : ''}`);
      setMoments(data || []);
    } catch (err) {
      console.error('Failed to load moments:', err);
    }
  }, [currentUser, activeTagFilter]);

  useEffect(() => {
    if (currentUser && activeTab === 'moments') {
      loadMoments();
    }
  }, [currentUser, activeTab, activeTagFilter, loadMoments]);

  // 文件上传辅助
  const uploadFile = async (file) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setUploadingFile(false);
      return data.url;
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadingFile(false);
      return null;
    }
  };

  const loadLandingData = useCallback(async () => {
    try {
      const [about, safety, clubs, shops] = await Promise.all([
        API.get('/api/pages/about').catch(() => null),
        API.get('/api/pages/safety').catch(() => null),
        API.get('/api/clubs').catch(() => []),
        API.get('/api/shops').catch(() => []),
      ]);
      setLandingData({ about, safety, clubs: clubs || [], shops: shops || [] });
    } catch (err) {
      console.error('Failed to load landing data:', err);
    }
  }, []);

  useEffect(() => {
    if (appView === 'landing') {
      loadLandingData();
    }
  }, [appView, loadLandingData]);

  const loadDiscoverGraph = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await API.get(`/api/users/${currentUser.id}/discover-graph`);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load discover graph:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && appView === 'app' && activeTab === 'matches' && !activeChat) {
      loadDiscoverGraph();
    }
  }, [currentUser, appView, activeTab, activeChat, loadDiscoverGraph]);

  const handleGraphLike = async (profile) => {
    if (!currentUser) return;
    try {
      await API.post('/api/matches', { userAId: currentUser.id, userBId: profile.id });
      if (Math.random() > 0.3) handleMatch(profile);
      setGraphData(prev => prev ? { ...prev, profiles: prev.profiles.filter(p => p.id !== profile.id) } : null);
      setSelectedNode(null);
    } catch (err) { console.error('Graph like failed:', err); }
  };

  const handleGraphPass = () => {
    setGraphData(prev => {
      if (!prev || !selectedNode) return prev;
      return { ...prev, profiles: prev.profiles.filter(p => p.id !== selectedNode.id) };
    });
    setSelectedNode(null);
  };

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

  const handleLike = async (profile) => {
    if (queue.length === 0 || leaving || !currentUser) return;
    setLeaving(true);

    try {
      const result = await API.post('/api/matches', { userAId: currentUser.id, userBId: profile.id });
      setTimeout(() => {
        const newQueue = [...queue];
        newQueue.shift();
        setQueue(newQueue);
        setLeaving(false);
        const container = document.getElementById('discover-scroll-container');
        if (container) container.scrollTop = 0;

        // 随机触发匹配动画（30%概率）
        if (Math.random() > 0.3) {
          handleMatch(profile);
        }
      }, 400);
    } catch (err) {
      console.error('Match failed:', err);
      setLeaving(false);
    }
  };

  const handleMatch = (profile) => {
    setShowMatchAnimation(profile);
    setMatches(prev => {
      if (prev.some(m => m.id === profile.id)) return prev;
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

  const handleReset = async () => {
    if (!currentUser) return;
    try {
      const profiles = await API.get(`/api/users/${currentUser.id}/discover`);
      setQueue(profiles || []);
    } catch (err) {
      console.error('Reset failed:', err);
    }
    if (activeTab !== 'matches' && activeTab !== 'messages') {
      setActiveTab('matches');
    }
    setActiveChat(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (authView === 'register') {
      try {
        const result = await API.post('/api/auth/register', {
          name: regName.trim() || '新同学',
          email: authEmail,
          password: authPassword || '123456',
        });
        if (result.error) {
          alert(result.error);
          return;
        }
        setCurrentUser(result.user);
        await loadAppData(result.user);
        setAppView('onboarding');
      } catch (err) {
        console.error('Register failed:', err);
      }
    } else {
      try {
        const result = await API.post('/api/auth/login', {
          email: authEmail || 'demo@biuh.edu',
          password: authPassword || '123456',
        });
        if (result.error) {
          alert(result.error);
          return;
        }
        setCurrentUser(result.user);
        await loadAppData(result.user);
        setAppView('app');
      } catch (err) {
        console.error('Login failed:', err);
      }
    }
  };

  const handleCompleteOnboarding = async (e) => {
    e.preventDefault();
    if (currentUser && currentUser.id) {
      try {
        await API.put(`/api/users/${currentUser.id}`, {
          name: currentUser.name,
          age: currentUser.age,
          gender: currentUser.gender,
          major: currentUser.major,
          year: currentUser.year,
          location: currentUser.location,
          avatar: currentUser.avatar,
          prompt_answer: currentUser.promptAnswer,
        });
      } catch (err) {
        console.error('Profile update failed:', err);
      }
    }
    setAppView('app');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppView('landing');
    setActiveTab('matches');
    setActiveChat(null);
    setQueue([]);
    setMatches([]);
    setMoments([]);
  };

  const handleToggleLikeMoment = async (momentId) => {
    if (!currentUser) return;
    try {
      const result = await API.post(`/api/moments/${momentId}/like`, { userId: currentUser.id });
      setMoments(prev => prev.map(m => {
        if (m.id === momentId) {
          const updated = { ...m, isLiked: result.liked, likes: result.liked ? m.likes + 1 : m.likes - 1 };
          if (activeMoment && activeMoment.id === momentId) {
            setActiveMoment(updated);
          }
          return updated;
        }
        return m;
      }));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleAddComment = async (momentId) => {
    if (!newComment.trim() || !currentUser) return;
    try {
      const comment = await API.post(`/api/moments/${momentId}/comments`, {
        authorId: currentUser.id,
        content: newComment,
      });
      setMoments(prev => prev.map(m => {
        if (m.id === momentId) {
          const updated = { ...m, comments: [...m.comments, { id: comment.id, author: comment.author, avatar: comment.avatar, text: comment.content }] };
          if (activeMoment && activeMoment.id === momentId) {
            setActiveMoment(updated);
          }
          return updated;
        }
        return m;
      }));
      setNewComment('');
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleDeleteComment = async (momentId, commentId) => {
    if (!currentUser) return;
    try {
      await API.del(`/api/moments/${momentId}/comments/${commentId}`, { userId: currentUser.id });
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
    } catch (err) {
      console.error('Delete comment failed:', err);
    }
  };

  const handleDeleteMoment = async (momentId) => {
    if (!currentUser) return;
    try {
      await API.del(`/api/moments/${momentId}`, { userId: currentUser.id });
      setMoments(prev => prev.filter(m => m.id !== momentId));
      if (activeMoment && activeMoment.id === momentId) {
        setActiveMoment(null);
      }
    } catch (err) {
      console.error('Delete moment failed:', err);
    }
  };

  const handleViewProfile = async (authorName, authorAvatar, authorId) => {
    if (authorName === currentUser?.name) {
      setActiveTab('profile');
      if (activeMoment) setActiveMoment(null);
      return;
    }
    // Try to fetch by ID if available
    if (authorId) {
      try {
        const profile = await API.get(`/api/users/${authorId}`);
        if (profile) {
          setViewingProfile(profile);
          return;
        }
      } catch (err) { /* fallthrough */ }
    }
    // Fallback
    const foundProfile = queue.find(p => p.name === authorName) || matches.find(p => p.name === authorName);
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

  const handlePublishMoment = async (e) => {
    e.preventDefault();
    if (!newMomentText.trim() || !currentUser) return;
    
    let formattedTag = newMomentTag.trim();
    if (formattedTag && !formattedTag.startsWith('#')) {
      formattedTag = '#' + formattedTag;
    }

    try {
      const moment = await API.post('/api/moments', {
        authorId: currentUser.id,
        title: newMomentText,
        image: newMomentImage || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80',
        tags: formattedTag ? [formattedTag] : [],
      });
      setMoments([moment, ...moments]);
      setIsPublishing(false); 
      setNewMomentText(''); 
      setNewMomentTag('');
      setNewMomentImage(null);
    } catch (err) {
      console.error('Publish failed:', err);
    }
  };

  // ============================================================
  // 登录前的默认用户（用于 onboarding）
  // ============================================================
  const getDisplayUser = () => currentUser || {
    name: '新同学', avatar: MOCK_AVATARS[0], age: 20, gender: 'male',
    major: '', year: '大一', location: '', promptAnswer: ''
  };
  const displayUser = getDisplayUser();

  const renderSidebar = () => (
    <div className={`w-full md:w-[350px] bg-white border-r border-gray-200 flex flex-col h-full ${activeChat && 'hidden md:flex'}`}>
      <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('profile')}>
          <img src={displayUser.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover" />
          <span className="text-black font-serif font-bold text-lg">{displayUser.name}</span>
        </div>
        <button onClick={handleReset} title="刷新推荐" className="text-gray-400 hover:text-black transition">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        <button className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'matches' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-800'}`}
          onClick={() => { setActiveTab('matches'); setActiveChat(null); }}>匹配</button>
        <button className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'messages' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-800'}`}
          onClick={() => { setActiveTab('messages'); setActiveChat(null); }}>对话</button>
        <button className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'moments' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-800'}`}
          onClick={() => { setActiveTab('moments'); setActiveChat(null); }}>校园圈</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#fcfcfc]">
        {activeTab === 'moments' && (
          <div className="space-y-8 mt-2">
            <button onClick={() => setIsPublishing(true)}
              className="w-full bg-black text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg hover:bg-gray-800 hover:scale-[1.02] transition-all">
              <PlusSquare size={20} /><span className="font-bold">发布新日常</span>
            </button>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">热门校园话题</h3>
                {activeTagFilter && <button onClick={() => setActiveTagFilter(null)} className="text-xs text-rose-500 font-bold hover:underline">清除筛选</button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(tag => (
                  <span key={tag} onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${activeTagFilter === tag ? 'bg-black text-white shadow-md' : 'bg-[#f4f4f0] text-gray-700 hover:bg-gray-200'}`}>
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
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3"><Heart size={24} className="text-gray-300" /></div>
                <p className="font-serif">去点赞发现你的共鸣</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {matches.map(match => (
                  <div key={match.id} className="cursor-pointer group relative overflow-hidden rounded-xl aspect-[3/4]" onClick={() => setActiveChat(match)}>
                    <img src={match.photos?.[0] || match.avatar} alt={match.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                <div key={match.id} className="flex items-center gap-4 p-3 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                  onClick={() => setActiveChat(match)}>
                  <img src={match.photos?.[0] || match.avatar} alt={match.name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-gray-900 text-lg">{match.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{lastMsg}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderDiscover = () => {
    const profiles = graphData?.profiles || [];
    const centerUser = graphData?.centerUser || displayUser;

    // SVG 星型图布局参数
    const W = 700, H = 500;
    const cx = W / 2, cy = H / 2;
    const minR = 80, maxR = 210;
    const nodeSizeMin = 18, nodeSizeMax = 36;

    // 计算节点位置
    const nodes = profiles.map((p, i) => {
      const score = p.matchScore || 0.1;
      const r = maxR - (maxR - minR) * score;
      const angle = (2 * Math.PI * i) / profiles.length - Math.PI / 2;
      const size = nodeSizeMin + (nodeSizeMax - nodeSizeMin) * score;
      return { ...p, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), size, r, angle };
    });

    // 连线粗细：1~6px，颜色从灰到黑
    const lineProps = (score) => ({
      strokeWidth: 1 + 5 * score,
      stroke: `rgba(0,0,0,${0.15 + 0.6 * score})`,
    });

    return (
      <div className="flex-1 relative flex flex-col bg-[#f4f4f0] h-full overflow-hidden">
        {/* 移动端顶栏 */}
        <div className="md:hidden h-14 bg-[#f4f4f0]/90 backdrop-blur flex items-center justify-between px-6 z-20 border-b border-gray-100 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black"><MessageCircle size={24} /></button>
          <span className="font-serif font-black text-xl tracking-tighter text-black">星型匹配</span>
          <button onClick={() => { setActiveTab('profile'); setActiveChat(null); }} className="text-black"><User size={24} /></button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
          {/* 标题 */}
          <div className="text-center mb-3 shrink-0">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">发现你的校园匹配</h2>
            <p className="text-gray-500 text-sm mt-1">距离中心越近，匹配度越高 · 点击头像互动</p>
          </div>

          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 py-20">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <User size={32} className="text-gray-400" />
              </div>
              <p className="text-lg font-serif text-black mb-2">暂无推荐用户</p>
              <p className="mb-4 text-sm">完善你的资料以获得更精准的推荐</p>
              <button onClick={loadDiscoverGraph} className="px-6 py-2.5 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition">重新搜索</button>
            </div>
          ) : (
            <div className="w-full max-w-[750px] relative">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: '55vh' }}>
                {/* 背景同心圆 */}
                {[0.3, 0.6, 0.9].map((frac, i) => (
                  <circle key={i} cx={cx} cy={cy} r={minR + (maxR - minR) * frac} fill="none" stroke="#e5e5e5" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                {/* 连线 */}
                {nodes.map((n, i) => (
                  <line key={`line-${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} {...lineProps(n.matchScore || 0.1)} style={{ transition: 'all 0.3s' }} />
                ))}

                {/* 中心节点 (当前用户) */}
                <g>
                  <circle cx={cx} cy={cy} r={30} fill="white" stroke="black" strokeWidth="3" />
                  <image href={centerUser.avatar} x={cx - 24} y={cy - 24} width={48} height={48} clipPath="circle(24px at 24px 24px)" preserveAspectRatio="xMidYMid slice" />
                  <text x={cx} y={cy + 44} textAnchor="middle" className="text-[11px] font-bold fill-black">{centerUser.name}</text>
                </g>

                {/* 外围节点 */}
                {nodes.map((n, i) => {
                  const isHovered = hoveredNode?.id === n.id;
                  const isSelected = selectedNode?.id === n.id;
                  const s = isHovered || isSelected ? n.size * 1.2 : n.size;
                  return (
                    <g key={n.id}
                      style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
                      onMouseEnter={(e) => { setHoveredNode(n); setTooltipPos({ x: n.x, y: n.y }); }}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => setSelectedNode(n)}>
                      {/* 光晕效果 */}
                      {(isHovered || isSelected) && <circle cx={n.x} cy={n.y} r={s + 6} fill="rgba(0,0,0,0.06)" />}
                      {/* 节点圆 */}
                      <circle cx={n.x} cy={n.y} r={s} fill="white" stroke={isSelected ? '#e11d48' : '#ddd'} strokeWidth={isSelected ? 3 : 1.5} />
                      <image href={n.photos?.[0] || n.avatar} x={n.x - s + 3} y={n.y - s + 3} width={(s - 3) * 2} height={(s - 3) * 2}
                        clipPath={`circle(${s - 3}px at ${s - 3}px ${s - 3}px)`} preserveAspectRatio="xMidYMid slice" />
                      {/* 匹配分数 */}
                      <text x={n.x} y={n.y + s + 14} textAnchor="middle" className="text-[10px] font-bold" fill={isHovered ? '#e11d48' : '#666'}>
                        {Math.round((n.matchScore || 0) * 100)}%
                      </text>
                      {/* 悬停提示 */}
                      {isHovered && !isSelected && (
                        <g>
                          <rect x={n.x - 50} y={n.y - s - 34} width={100} height={24} rx={6} fill="black" fillOpacity={0.85} />
                          <text x={n.x} y={n.y - s - 18} textAnchor="middle" className="text-[11px] font-bold" fill="white">
                            {n.name} · {n.age}岁
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* 刷新按钮 */}
          <button onClick={loadDiscoverGraph} className="mt-2 flex items-center gap-2 text-gray-500 hover:text-black text-sm font-bold transition shrink-0">
            <RefreshCw size={16} />刷新推荐
          </button>
        </div>

        {/* 选中用户的 Profile 浮层 */}
        {selectedNode && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedNode(null); }}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
              <div className="relative">
                <img src={selectedNode.photos?.[0] || selectedNode.avatar} className="w-full aspect-[4/3] object-cover" alt={selectedNode.name} />
                <button onClick={() => setSelectedNode(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition"><X size={18} /></button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-16 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-serif font-bold">{selectedNode.name}</h3>
                      <p className="text-sm opacity-90 mt-0.5">{selectedNode.age}岁 · {selectedNode.gender === 'male' ? '男生' : '女生'} · {selectedNode.major}</p>
                      <p className="text-xs opacity-70 mt-1">{selectedNode.year} · {selectedNode.location}</p>
                    </div>
                    <div className="bg-white text-black rounded-xl px-3 py-2 text-center shadow-lg">
                      <div className="text-2xl font-black leading-none">{Math.round((selectedNode.matchScore || 0) * 100)}</div>
                      <div className="text-[10px] font-bold text-gray-500">匹配</div>
                    </div>
                  </div>
                </div>
              </div>
              {selectedNode.bio && (
                <div className="px-5 pt-4 pb-2"><p className="text-sm text-gray-600 leading-relaxed">{selectedNode.bio}</p></div>
              )}
              {selectedNode.mbti && (
                <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-bold text-gray-700">{selectedNode.mbti}</span>
                  {selectedNode.hobbies && selectedNode.hobbies.split(/[,，、]/).filter(Boolean).map((h, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-medium">{h.trim()}</span>
                  ))}
                </div>
              )}
              {selectedNode.prompts?.[0] && (
                <div className="p-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{selectedNode.prompts[0].q}</p>
                  <p className="text-gray-700 font-serif">{selectedNode.prompts[0].a}</p>
                </div>
              )}
              <div className="flex gap-3 p-4">
                <button onClick={handleGraphPass}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition flex items-center justify-center gap-2">
                  <X size={20} />跳过
                </button>
                <button onClick={() => handleGraphLike(selectedNode)}
                  className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2">
                  <Heart size={20} className="fill-white" />Like
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 匹配动画 */}
        {showMatchAnimation && (
          <div className="absolute inset-0 bg-[#f4f4f0]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-black mb-10 text-center tracking-tight">
              You and {showMatchAnimation.name} invited each other to chat.
            </h1>
            <div className="flex items-center gap-6 mb-12 relative">
              <img src={displayUser.avatar} className="w-28 h-28 rounded-full border-[6px] border-white object-cover shadow-xl z-10 translate-x-4" alt="Me" />
              <img src={showMatchAnimation.photos?.[0] || showMatchAnimation.avatar}
                className="w-28 h-28 rounded-full border-[6px] border-white object-cover shadow-xl z-0 -translate-x-4 cursor-pointer hover:scale-105 hover:z-20 transition-all"
                alt="Match"
                onClick={() => { handleViewProfile(showMatchAnimation.name, showMatchAnimation.photos?.[0] || showMatchAnimation.avatar, showMatchAnimation.id); setShowMatchAnimation(null); }}
              />
            </div>
            <div className="w-full max-w-sm space-y-3">
              <button onClick={() => { setActiveChat(showMatchAnimation); setShowMatchAnimation(null); }}
                className="w-full py-3.5 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition shadow-lg">打个招呼</button>
              <button onClick={() => setShowMatchAnimation(null)}
                className="w-full py-3.5 bg-transparent border-2 border-black text-black rounded-full font-bold text-lg hover:bg-black/5 transition">继续探索</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMoments = () => {
    if (activeMoment) {
      return (
        <div className="flex-1 flex flex-col h-full bg-white z-40 absolute md:static inset-0 animate-in slide-in-from-right-8 duration-300">
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white/90 backdrop-blur-md z-10">
            <button onClick={() => setActiveMoment(null)} className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition"><ChevronLeft size={28} /></button>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => handleViewProfile(activeMoment.author, activeMoment.avatar, activeMoment.authorId)}>
              <img src={activeMoment.avatar} className="w-8 h-8 rounded-full object-cover" alt="author" />
              <span className="font-bold font-serif text-sm">{activeMoment.author}</span>
            </div>
            {activeMoment.author === displayUser.name ? (
              <button onClick={() => handleDeleteMoment(activeMoment.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition" title="删除动态"><Trash2 size={20} /></button>
            ) : <div className="w-8"></div>}
          </div>
          <div className="flex-1 overflow-y-auto">
            <img src={activeMoment.image} className="w-full max-h-[60vh] object-cover bg-gray-100" alt="moment" />
            <div className="p-6">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-3">{activeMoment.title}</h2>
              {activeMoment.tags?.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {activeMoment.tags.map(tag => (
                    <span key={tag} className="text-rose-500 text-sm font-medium cursor-pointer hover:underline"
                      onClick={() => { setActiveTagFilter(tag); setActiveMoment(null); }}>{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-8 border-y border-gray-100 py-4 my-6">
                <button onClick={() => handleToggleLikeMoment(activeMoment.id)}
                  className={`flex items-center gap-2 transition ${activeMoment.isLiked ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>
                  <Heart size={26} fill={activeMoment.isLiked ? 'currentColor' : 'none'} />
                  <span className="font-bold text-lg">{activeMoment.likes}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-600"><MessageCircle size={24} /><span className="font-bold text-lg">{activeMoment.comments.length}</span></div>
              </div>
              <div className="space-y-6 pb-4">
                <h3 className="font-bold text-gray-800 text-sm mb-4">全部评论</h3>
                {activeMoment.comments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">还没有人评论，快来抢沙发！</p>
                ) : activeMoment.comments.map(c => (
                  <div key={c.id} className="flex gap-3 group/comment">
                    <img src={c.avatar} className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition" alt={c.author}
                      onClick={() => handleViewProfile(c.author, c.avatar)} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900 text-xs cursor-pointer hover:underline"
                          onClick={() => handleViewProfile(c.author, c.avatar)}>{c.author}</span>
                        {c.author === displayUser.name && (
                          <button onClick={() => handleDeleteComment(activeMoment.id, c.id)}
                            className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition px-2 py-1 bg-gray-50 hover:bg-rose-50 rounded-md">删除</button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(activeMoment.id); }}
              placeholder="说点什么..." className="flex-1 bg-[#f4f4f0] border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 rounded-full px-5 py-2.5 outline-none transition-all text-sm" />
            <button onClick={() => handleAddComment(activeMoment.id)} disabled={!newComment.trim()}
              className="px-5 py-2.5 bg-black text-white rounded-full font-bold text-sm disabled:opacity-50 transition">发送</button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 relative flex flex-col bg-[#f4f4f0] h-full overflow-hidden">
        <div className="md:hidden absolute top-0 w-full h-16 bg-[#f4f4f0]/90 backdrop-blur flex items-center justify-between px-6 z-20 border-b border-gray-100">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black"><MessageCircle size={24} /></button>
          <span className="font-serif font-black text-2xl tracking-tighter text-black">BIUH 动态</span>
          <button onClick={() => { setActiveTab('profile'); setActiveChat(null); }} className="text-black"><User size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto w-full pt-20 md:pt-6 pb-20 px-4 md:px-6 smooth-scroll">
          <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
            {activeTagFilter && (
              <span onClick={() => setActiveTagFilter(null)} className="shrink-0 px-4 py-2 bg-rose-50 text-rose-500 rounded-full text-sm font-bold shadow-sm whitespace-nowrap">✕ 清除筛选</span>
            )}
            {trendingTags.map(tag => (
              <span key={tag} onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${activeTagFilter === tag ? 'bg-black text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}>
                {tag}
              </span>
            ))}
          </div>
          {moments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Hash size={32} className="mb-2 opacity-50" /><p>该话题下还没有动态，来抢首发吧！</p>
            </div>
          ) : (
            <div className="columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {moments.map(post => (
                <div key={post.id} onClick={() => setActiveMoment(post)}
                  className="break-inside-avoid bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group">
                  <div className="relative overflow-hidden">
                    <img src={post.image} className="w-full object-cover bg-gray-100 group-hover:scale-105 transition-transform duration-500" alt={post.title} />
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-bold text-sm md:text-base text-gray-900 leading-snug mb-2 line-clamp-2 font-serif">{post.title}</h3>
                    {post.tags?.length > 0 && (
                      <div className="mb-3"><span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-0.5 rounded-md">{post.tags[0]}</span></div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                        onClick={(e) => { e.stopPropagation(); handleViewProfile(post.author, post.avatar, post.authorId); }}>
                        <img src={post.avatar} className="w-5 h-5 rounded-full object-cover" />
                        <span className="truncate max-w-[80px] font-medium">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {post.author === displayUser.name && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteMoment(post.id); }} className="text-gray-400 hover:text-rose-500 transition" title="删除动态"><Trash2 size={14} /></button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleToggleLikeMoment(post.id); }}
                          className={`flex items-center gap-1 transition-colors ${post.isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}>
                          <Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} /><span>{post.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setIsPublishing(true)}
          className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform z-10">
          <PlusSquare size={24} />
        </button>
        {isPublishing && (
          <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end md:justify-center md:items-center animate-in fade-in duration-200">
            <div className="bg-white w-full md:w-[500px] rounded-t-3xl md:rounded-3xl p-6 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setIsPublishing(false)} className="text-gray-400 hover:text-black transition"><X size={24} /></button>
                <span className="font-bold text-lg font-serif">发布新日常</span>
                <button onClick={handlePublishMoment} disabled={!newMomentText.trim()}
                  className="px-5 py-2 bg-black text-white rounded-full font-bold text-sm disabled:opacity-30 hover:bg-gray-800 transition">发布</button>
              </div>
              <div className="flex gap-4 mb-4">
                <img src={displayUser.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="avatar" />
                <textarea autoFocus rows="4" value={newMomentText} onChange={(e) => setNewMomentText(e.target.value)}
                  placeholder="分享你的 BIUH 校园生活..." className="flex-1 resize-none outline-none text-lg placeholder:text-gray-300" />
              </div>
              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Hash size={16} className="text-gray-400" />
                  <input type="text" value={newMomentTag} onChange={(e) => setNewMomentTag(e.target.value)}
                    placeholder="输入自定义话题 (例如：#自习室推荐)"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 font-medium" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.slice(0, 4).map(tag => (
                    <span key={tag} onClick={() => setNewMomentTag(tag)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 cursor-pointer hover:border-black transition">{tag}</span>
                  ))}
                </div>
              </div>
              <input type="file" id="moment-img-up" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) { const u = await uploadFile(f); if (u) setNewMomentImage(u); }
              }} />
              <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition overflow-hidden relative"
                onClick={() => document.getElementById('moment-img-up').click()}>
                {newMomentImage ? (
                  <><img src={newMomentImage} className="absolute inset-0 w-full h-full object-cover" alt="preview" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition"><span className="text-white text-xs font-bold">更换图片</span></div></>
                ) : (
                  <><PlusSquare size={28} className="mb-1 opacity-50" /><span className="text-xs font-medium">{uploadingFile ? '上传中...' : '点击上传照片'}</span></>
                )}
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
            <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-black"><ChevronLeft size={28} /></button>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleViewProfile(activeChat.name, activeChat.photos?.[0] || activeChat.avatar, activeChat.id)}>
              <img src={activeChat.photos?.[0] || activeChat.avatar} alt={activeChat.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <span className="font-serif font-bold text-lg block">{activeChat.name}</span>
                <span className="text-xs text-gray-400">刚刚匹配成功</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="text-center my-8">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-4 border border-gray-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleViewProfile(activeChat.name, activeChat.photos?.[0] || activeChat.avatar, activeChat.id)}>
              <img src={activeChat.photos?.[0] || activeChat.avatar} className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-serif font-bold text-gray-800">你和 {activeChat.name} 互换了心意</p>
            <p className="text-xs text-gray-400 mt-1">别让缘分溜走，发个消息吧</p>
          </div>
          {chatMsgs.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-base ${
                msg.sender === 'me' ? 'bg-black text-white rounded-br-sm shadow-sm' : 'bg-[#f4f4f0] text-black rounded-bl-sm border border-gray-100'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { handleSendMessage(activeChat.id, inputText); setInputText(''); } }}
            placeholder="写点什么..." className="flex-1 bg-[#f4f4f0] border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 rounded-full px-6 py-3 outline-none transition-all" />
          <button onClick={() => { handleSendMessage(activeChat.id, inputText); setInputText(''); }}
            disabled={!inputText.trim()} className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors">
            <Send size={18} className="ml-1" />
          </button>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="flex-1 flex flex-col h-full bg-[#f4f4f0] z-30 absolute md:static inset-0 overflow-y-auto">
      <div className="h-20 flex items-center justify-between px-6 bg-[#f4f4f0] shrink-0 md:hidden">
        <button onClick={() => setActiveTab('matches')} className="p-2 -ml-2 text-black"><ChevronLeft size={28} /></button>
        <span className="font-serif font-bold text-xl">Account</span>
        <div className="w-8"></div>
      </div>
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full pt-8 md:pt-16">
        <div className="flex flex-col items-center mb-12">
          <input type="file" id="profile-avatar-upload" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file && currentUser) {
              const url = await uploadFile(file);
              if (url) {
                const updated = { ...currentUser, avatar: url };
                setCurrentUser(updated);
                await API.put(`/api/users/${currentUser.id}`, { avatar: url });
              }
            }
          }} />
          <div className="w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg relative group cursor-pointer"
            onClick={() => document.getElementById('profile-avatar-upload').click()}>
            <img src={displayUser.avatar} alt="Me" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera size={28} className="text-white" />
            </div>
          </div>
          {uploadingFile && <p className="text-xs text-gray-400 mt-1">上传中...</p>}
          <h2 className="text-3xl font-serif font-bold text-black">{displayUser.name}</h2>
          <p className="text-gray-500 mt-2 tracking-widest text-sm uppercase">Member since 2024</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div onClick={() => setProfileSubView('edit')} className="p-5 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
            <div className="flex items-center gap-4"><User size={22} className="text-gray-400" /><span className="font-bold text-gray-800">编辑个人资料</span></div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
          <div onClick={() => setProfileSubView('settings')} className="p-5 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
            <div className="flex items-center gap-4"><Settings size={22} className="text-gray-400" /><span className="font-bold text-gray-800">偏好设置</span></div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
          <div onClick={() => setProfileSubView('security')} className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
            <div className="flex items-center gap-4"><Shield size={22} className="text-gray-400" /><span className="font-bold text-gray-800">隐私与安全</span></div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full py-4 bg-white rounded-2xl shadow-sm border border-gray-200 text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <LogOut size={20} />退出登录
        </button>
        {profileSubView && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-right-8 duration-300">
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 shrink-0 bg-white">
              <button onClick={() => setProfileSubView(null)} className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition"><ChevronLeft size={28} /></button>
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
                    <input type="text" defaultValue={displayUser.name} onChange={(e) => setCurrentUser(prev => ({...prev, name: e.target.value}))}
                      className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">性别</label>
                      <select defaultValue={displayUser.gender} onChange={(e) => setCurrentUser(prev => ({...prev, gender: e.target.value}))}
                        className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium bg-white appearance-none cursor-pointer">
                        <option value="male">男生</option><option value="female">女生</option>
                      </select>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">专业</label>
                      <input type="text" defaultValue={displayUser.major} onChange={(e) => setCurrentUser(prev => ({...prev, major: e.target.value}))}
                        className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">年级</label>
                      <select defaultValue={displayUser.year} onChange={(e) => setCurrentUser(prev => ({...prev, year: e.target.value}))}
                        className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium bg-white appearance-none cursor-pointer">
                        <option value="大一">大一</option><option value="大二">大二</option><option value="大三">大三</option>
                        <option value="大四">大四</option><option value="研究生">研究生</option><option value="博士生">博士生</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">常出没地点</label>
                    <input type="text" defaultValue={displayUser.location} onChange={(e) => setCurrentUser(prev => ({...prev, location: e.target.value}))}
                      className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">自我介绍</label>
                    <textarea rows="3" defaultValue={displayUser.bio} placeholder="写几句话介绍自己吧..."
                      onChange={(e) => setCurrentUser(prev => ({...prev, bio: e.target.value}))}
                      className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">MBTI 人格</label>
                      <select defaultValue={displayUser.mbti || ''} onChange={(e) => setCurrentUser(prev => ({...prev, mbti: e.target.value}))}
                        className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium bg-white appearance-none cursor-pointer">
                        <option value="">未选择</option>
                        <option value="INTJ">INTJ</option><option value="INTP">INTP</option>
                        <option value="ENTJ">ENTJ</option><option value="ENTP">ENTP</option>
                        <option value="INFJ">INFJ</option><option value="INFP">INFP</option>
                        <option value="ENFJ">ENFJ</option><option value="ENFP">ENFP</option>
                        <option value="ISTJ">ISTJ</option><option value="ISTP">ISTP</option>
                        <option value="ESTJ">ESTJ</option><option value="ESTP">ESTP</option>
                        <option value="ISFJ">ISFJ</option><option value="ISFP">ISFP</option>
                        <option value="ESFJ">ESFJ</option><option value="ESFP">ESFP</option>
                      </select>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">最爱食物</label>
                      <input type="text" defaultValue={displayUser.favorite_food} placeholder="火锅、奶茶..."
                        onChange={(e) => setCurrentUser(prev => ({...prev, favorite_food: e.target.value}))}
                        className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">兴趣爱好</label>
                    <input type="text" defaultValue={displayUser.hobbies} placeholder="摄影、篮球、阅读..."
                      onChange={(e) => setCurrentUser(prev => ({...prev, hobbies: e.target.value}))}
                      className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">感兴趣的内容</label>
                    <input type="text" defaultValue={displayUser.interests} placeholder="科技、艺术、旅行..."
                      onChange={(e) => setCurrentUser(prev => ({...prev, interests: e.target.value}))}
                      className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">喜欢的音乐</label>
                      <input type="text" defaultValue={displayUser.music_genre} placeholder="流行、摇滚..."
                        onChange={(e) => setCurrentUser(prev => ({...prev, music_genre: e.target.value}))}
                        className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">喜欢的电影</label>
                      <input type="text" defaultValue={displayUser.movie_genre} placeholder="科幻、喜剧..."
                        onChange={(e) => setCurrentUser(prev => ({...prev, movie_genre: e.target.value}))}
                        className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition font-medium" />
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (currentUser) {
                      try {
                        const result = await API.put(`/api/users/${currentUser.id}`, {
                          name: currentUser.name, age: currentUser.age, gender: currentUser.gender,
                          major: currentUser.major, year: currentUser.year, location: currentUser.location,
                          bio: currentUser.bio, favorite_food: currentUser.favorite_food,
                          hobbies: currentUser.hobbies, interests: currentUser.interests,
                          mbti: currentUser.mbti, music_genre: currentUser.music_genre,
                          movie_genre: currentUser.movie_genre,
                        });
                        if (result.user) setCurrentUser(result.user);
                        setProfileSubView(null);
                      } catch (err) { console.error('Save failed:', err); }
                    }
                  }} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg shadow-xl hover:bg-gray-800 transition-all">
                    保存资料
                  </button>
                </div>
              )}
              {profileSubView === 'settings' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-800">新消息推送通知</span>
                    <div className="w-12 h-6 bg-black rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer">
                    <span className="font-bold text-gray-800">深色模式</span><span className="text-gray-400 text-sm">跟随系统配置</span>
                  </div>
                </div>
              )}
              {profileSubView === 'security' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-black font-bold cursor-pointer hover:bg-gray-50 transition">修改登录密码</div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-rose-500 font-bold cursor-pointer hover:bg-rose-50 transition">注销我的账号</div>
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
          <h1 className="text-4xl font-serif font-black tracking-tight text-black mb-3">欢迎来到 BIUH, {displayUser.name}</h1>
          <p className="text-gray-500 font-serif text-lg">让我们来完善你的专属校园档案。</p>
        </div>
        <form onSubmit={handleCompleteOnboarding} className="space-y-8">
          <div className="flex flex-col items-center">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">你的校园形象</label>
            <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await uploadFile(file);
                if (url) setCurrentUser(prev => ({ ...prev, avatar: url }));
              }
            }} />
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
              <img src={displayUser.avatar} className="w-32 h-32 rounded-full object-cover border-4 border-[#f4f4f0] shadow-md group-hover:opacity-80 transition" alt="Avatar" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full">{uploadingFile ? '上传中...' : '点击上传头像'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">点击从本地选择图片，或使用默认头像</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">年龄</label>
              <input type="number" required min="16" max="30" value={displayUser.age}
                onChange={(e) => setCurrentUser(prev => ({...prev, age: parseInt(e.target.value)}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">性别</label>
              <select required value={displayUser.gender}
                onChange={(e) => setCurrentUser(prev => ({...prev, gender: e.target.value}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition appearance-none cursor-pointer">
                <option value="male">男生</option><option value="female">女生</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">专业</label>
              <input type="text" required placeholder="例如：计算机" value={displayUser.major}
                onChange={(e) => setCurrentUser(prev => ({...prev, major: e.target.value}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">年级</label>
              <select required value={displayUser.year}
                onChange={(e) => setCurrentUser(prev => ({...prev, year: e.target.value}))}
                className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition appearance-none cursor-pointer">
                <option value="大一">大一</option><option value="大二">大二</option><option value="大三">大三</option>
                <option value="大四">大四</option><option value="研究生">研究生</option><option value="博士生">博士生</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">校园里常出没的地点是？</label>
            <input type="text" required placeholder="例如：图书馆三楼靠窗、南区操场..." value={displayUser.location}
              onChange={(e) => setCurrentUser(prev => ({...prev, location: e.target.value}))}
              className="w-full px-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
          </div>
          <div className="bg-[#f4f4f0] p-6 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">回答一个问题，让大家更了解你</label>
            <p className="text-lg font-serif font-bold text-black mb-3">"期末周我的终极解压方式是..."</p>
            <textarea required rows="3" placeholder="写下你的答案..."
              value={displayUser.promptAnswer || ''}
              onChange={(e) => setCurrentUser(prev => ({...prev, promptAnswer: e.target.value}))}
              className="w-full px-4 py-3 bg-white border-transparent rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none transition resize-none" />
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
      <button onClick={() => setAppView('landing')}
        className="absolute top-8 left-8 text-black hover:scale-110 transition flex items-center gap-2">
        <ChevronLeft size={24} /><span className="font-bold hidden md:inline">返回官网</span>
      </button>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-10 text-center">
          <h1 className="text-4xl font-serif font-black tracking-tighter text-black mb-2">BIUH Match</h1>
          <p className="text-gray-500 text-sm mb-6 font-serif italic">专属于 BIUH 的真实社交。</p>
          <p className="text-xs text-gray-400 mb-10 bg-gray-50 p-3 rounded-lg">Demo 提示：可输入任意邮箱和密码注册新账号，或使用已有账号登录</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-5 text-left">
            {authView === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">你的名字</label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
                    placeholder="输入真实姓名或昵称" className="w-full pl-12 pr-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">校园认证</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="BIUH 校园邮箱 / 学号" className="w-full pl-12 pr-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">密码</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="输入密码" className="w-full pl-12 pr-4 py-4 bg-[#f4f4f0] border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
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

  // ============================================================
  // Landing 子页面：关于我们 / 安全指南 / 社团活动 / 周边商店
  // ============================================================
  const renderLandingSubView = () => {
    if (!landingSubView) return null;
    return (
      <div className="absolute inset-0 bg-[#f4f4f0] z-50 flex flex-col animate-in slide-in-from-bottom-8 duration-300 overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <button onClick={() => setLandingSubView(null)} className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition"><ChevronLeft size={28} /></button>
          <span className="font-bold font-serif ml-2 text-lg">
            {landingSubView === 'about' && '关于我们'}
            {landingSubView === 'safety' && '校园安全指南'}
            {landingSubView === 'clubs' && '社团活动'}
            {landingSubView === 'shops' && '周边商店'}
          </span>
        </div>
        <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
          {landingSubView === 'about' && landingData.about && (
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-serif font-bold text-black mb-6">{landingData.about.title}</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{landingData.about.content}</div>
            </div>
          )}
          {landingSubView === 'safety' && landingData.safety && (
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-serif font-bold text-black mb-6">{landingData.safety.title}</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{landingData.safety.content}</div>
            </div>
          )}
          {landingSubView === 'clubs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landingData.clubs.map(club => (
                <div key={club.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <img src={club.image} className="w-full h-48 object-cover" alt={club.name} />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-black text-white text-xs font-bold rounded-md">{club.category}</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">{club.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">{club.description}</p>
                    <p className="text-xs text-gray-400">📍 {club.contact}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {landingSubView === 'shops' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landingData.shops.map(shop => (
                <div key={shop.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <img src={shop.image} className="w-full h-48 object-cover" alt={shop.name} />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-md">{shop.category}</span>
                      <div className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /><span className="text-sm font-bold text-gray-700">{shop.rating}</span></div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">{shop.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">{shop.description}</p>
                    <p className="text-xs text-gray-400">📍 {shop.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLanding = () => (
    <div className="min-h-screen w-full bg-[#f4f4f0] font-sans flex flex-col overflow-y-auto overflow-x-hidden selection:bg-rose-200 relative">
      <nav className="w-full max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-12 py-8 z-20">
        <div className="flex items-center gap-12">
          <div className="font-serif font-black text-3xl md:text-4xl tracking-tighter text-black cursor-pointer">BIUH Match</div>
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold tracking-wide text-gray-900">
            <button onClick={() => setLandingSubView('about')} className="hover:text-gray-500 transition-colors">关于我们</button>
            <button onClick={() => setLandingSubView('safety')} className="hover:text-gray-500 transition-colors">校园安全指南</button>
            <button onClick={() => setLandingSubView('clubs')} className="hover:text-gray-500 transition-colors">社团活动</button>
            <button onClick={() => setLandingSubView('shops')} className="hover:text-gray-500 transition-colors">周边商店</button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => { setAuthView('login'); setAppView('auth'); }}
            className="text-black font-bold text-sm md:text-base border-2 border-black rounded-full px-6 py-2.5 hover:bg-black hover:text-[#f4f4f0] transition-all duration-300">
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
            <button onClick={() => { setAuthView('register'); setAppView('auth'); }}
              className="w-full sm:w-auto bg-black text-white px-10 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:scale-105 hover:bg-gray-900 transition-all shadow-xl">
              开启校园寻缘
            </button>
          </div>
        </div>
        <div className="flex-1 w-full relative h-[500px] md:h-[700px] flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-[#EAE8E3] rounded-full -z-10 blur-2xl opacity-60"></div>
          <div className="relative w-[90%] md:w-[80%] h-full rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700 ease-out border-[8px] border-white">
            <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80"
              alt="Happy Couple Laughing" className="w-full h-full object-cover" />
            <div className="absolute bottom-10 -left-6 md:-left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 transform -rotate-6 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-500"><Heart fill="currentColor" size={24} /></div>
              <div className="hidden sm:block"><p className="font-serif font-bold text-black text-sm">Ta 赞了你的社团照片</p></div>
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
      {renderLandingSubView()}
    </div>
  );

  const renderViewingProfile = () => (
    <div className="absolute inset-0 bg-[#f4f4f0] z-[60] flex flex-col animate-in slide-in-from-bottom-8 duration-300 overflow-y-auto">
      <div className="h-16 flex items-center px-4 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => setViewingProfile(null)} className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition"><ChevronLeft size={28} /></button>
        <span className="font-bold font-serif ml-2 text-lg">{viewingProfile.name} 的校园档案</span>
      </div>
      <div className="flex-1 p-4 md:p-8 max-w-md mx-auto w-full space-y-6 pb-20 mt-4">
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm">
          <img src={viewingProfile.photos?.[0] || viewingProfile.avatar} className="w-full aspect-[4/5] object-cover" alt="Profile" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-20 p-6 text-white">
            <div className="flex items-baseline gap-2"><h1 className="text-3xl font-serif font-bold">{viewingProfile.name}</h1></div>
            <p className="text-lg opacity-90 mt-1">{viewingProfile.age}岁 · {viewingProfile.gender === 'male' ? '男生' : (viewingProfile.gender === 'female' ? '女生' : '保密')} · {viewingProfile.major} · {viewingProfile.year}</p>
            <div className="flex items-center gap-2 text-sm mt-2 opacity-80"><div className="w-1.5 h-1.5 rounded-full bg-white"></div><span>{viewingProfile.location}</span></div>
          </div>
        </div>
        {viewingProfile.prompts?.length > 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{viewingProfile.prompts[0].q}</p>
            <h2 className="text-2xl font-serif text-black leading-snug">{viewingProfile.prompts[0].a}</h2>
          </div>
        )}
      </div>
    </div>
  );

  if (appView === 'landing') return renderLanding();
  if (appView === 'auth') return renderAuth();
  if (appView === 'onboarding') return renderOnboarding();

  return (
    <div className="flex h-screen w-full bg-[#f4f4f0] overflow-hidden font-sans">
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-50 h-full shadow-2xl md:shadow-none`}>
        {renderSidebar()}
      </div>
      <div className="flex-1 flex flex-col relative h-full">
        {activeTab === 'profile' 
          ? renderProfile() 
          : (activeChat 
              ? renderChat() 
              : (activeTab === 'moments' ? renderMoments() : renderDiscover())
            )
        }
      </div>
      {viewingProfile && renderViewingProfile()}
    </div>
  );
}
