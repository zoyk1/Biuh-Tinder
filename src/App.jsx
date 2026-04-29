import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, X, MessageCircle, User, Zap, Star, Send, ChevronLeft, RefreshCw, Flame, Settings, Shield, LogOut, Mail, Lock, ChevronRight, PlusSquare, Trash2, Hash, Camera } from 'lucide-react';
// --- Token 管理 ---
const TOKEN_KEY = 'biuh_token';
const USER_KEY = 'biuh_user';

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const removeToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };
const saveUserToStorage = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
const getStoredUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };

// --- API 辅助函数 ---
const API = {
  get: (url) => fetch(url, {
    headers: { ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}) }
  }).then(r => r.json()),
  post: (url, body) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}) },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  put: (url, body) => fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}) },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  del: (url, body) => fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}) },
    body: JSON.stringify(body)
  }).then(r => r.json()),
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

  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
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

  // 星图 Canvas 相关 refs
  const canvasRef = useRef(null);
  const nodePositionsRef = useRef([]);
  const hoveredNodeRef = useRef(null);
  const selectedNodeRef = useRef(null);
  hoveredNodeRef.current = hoveredNode;
  selectedNodeRef.current = selectedNode;

  // ====== 自动恢复登录会话 ======
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      // 有缓存的 token 和用户信息，先直接恢复界面
      setCurrentUser(storedUser);
      // 然后用 token 验证并获取最新用户数据
      API.get('/api/auth/me').then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          saveUserToStorage(data.user);
          loadAppData(data.user);
          setAppView('app');
        } else {
          // token 无效，清除缓存
          removeToken();
          setCurrentUser(null);
          setAppView('landing');
        }
      }).catch(() => {
        // 网络错误时仍然使用缓存数据
        loadAppData(storedUser);
        setAppView('app');
      });
    }
  }, []);

  // ====== Canvas 星图渲染 ======
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData?.profiles?.length) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    if (!container) return;
    const dpr = window.devicePixelRatio || 1;
    let W = container.clientWidth;
    let H = container.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = W / 2, cy = H / 2;
    const profiles = graphData.profiles;
    const centerUser = graphData.centerUser || displayUser;
    let animId, time = 0;
    const nodeSizeMin = 22, nodeSizeMax = 38;

    // --- Seeded random for stable layout ---
    const seedRand = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };

    // --- Pre-load avatar images ---
    const imageCache = {};
    const loadImage = (url) => new Promise((resolve) => {
      if (!url) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imageCache[url] = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
    });

    // Load all avatars
    const allUrls = [
      centerUser.avatar,
      ...profiles.map(p => p.photos?.[0] || p.avatar)
    ].filter(Boolean);
    const uniqueUrls = [...new Set(allUrls)];
    Promise.all(uniqueUrls.map(loadImage)).then(() => {
      // Images loaded, start render
      startRender();
    });
    // Also start immediately for non-image rendering
    startRender();

    function startRender() {

    // --- Organic layout: Poisson-like scatter ---
    // Use golden angle + jitter for organic but stable placement
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
    const maxR = Math.min(W, H) * 0.44;
    const minR = 55;
    const padding = 20;

    const positions = profiles.map((p, i) => {
      const score = p.matchScore || 0.1;
      const rand = seedRand(i * 7919 + 31);
      // Golden angle spacing + jitter for organic feel
      const baseAngle = i * goldenAngle;
      const angleJitter = (rand() - 0.5) * 0.6; // ±0.3 radians jitter
      const angle = baseAngle + angleJitter - Math.PI / 2;
      // Radius: high score = closer, but with organic scatter
      const baseR = maxR - (maxR - minR) * Math.pow(score, 0.7);
      const rJitter = (rand() - 0.5) * 40; // ±20px jitter
      const r = Math.max(minR, Math.min(maxR, baseR + rJitter));
      const size = nodeSizeMin + (nodeSizeMax - nodeSizeMin) * Math.pow(score, 0.5);
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      // Clamp to canvas
      const cpx = Math.max(padding + size, Math.min(W - padding - size, px));
      const cpy = Math.max(padding + size, Math.min(H - padding - size, py));
      return { ...p, px: cpx, py: cpy, size, r, angle, score };
    });
    nodePositionsRef.current = positions;

    // --- Simple collision resolution ---
    for (let iter = 0; iter < 5; iter++) {
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i], b = positions[j];
          const dx = b.px - a.px, dy = b.py - a.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = a.size + b.size + 12;
          if (dist < minDist && dist > 0) {
            const push = (minDist - dist) / 2;
            const nx = dx / dist, ny = dy / dist;
            a.px -= nx * push * 0.5; a.py -= ny * push * 0.5;
            b.px += nx * push * 0.5; b.py += ny * push * 0.5;
            // Re-clamp
            a.px = Math.max(padding + a.size, Math.min(W - padding - a.size, a.px));
            a.py = Math.max(padding + a.size, Math.min(H - padding - a.size, a.py));
            b.px = Math.max(padding + b.size, Math.min(W - padding - b.size, b.px));
            b.py = Math.max(padding + b.size, Math.min(H - padding - b.size, b.py));
          }
        }
        // Push away from center if too close
        const n = positions[i];
        const dcx = n.px - cx, dcy = n.py - cy;
        const dCenter = Math.sqrt(dcx * dcx + dcy * dcy);
        if (dCenter < minR * 0.8) {
          const push = (minR * 0.8 - dCenter);
          if (dCenter > 0) {
            n.px += (dcx / dCenter) * push;
            n.py += (dcy / dCenter) * push;
          }
        }
      }
    }

    const wobblyCircle = (x, y, r, w) => {
      ctx.beginPath();
      const n = 48;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const noise = Math.sin(a * 5 + x * 0.02) * Math.cos(a * 3.5 + y * 0.02) * w;
        const rr = Math.max(2, r + noise);
        const px = x + rr * Math.cos(a), py = y + rr * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const wobblyLine = (x1, y1, x2, y2, w) => {
      const segs = 24, dx = x2 - x1, dy = y2 - y1;
      const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const nx = -dy / len, ny = dx / len;
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const off = Math.sin(t * Math.PI * 3.7 + x1 * 0.01 + y1 * 0.01) * w;
        const px = x1 + dx * t + nx * off, py = y1 + dy * t + ny * off;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    const drawAvatar = (img, x, y, r) => {
      if (!img) return false;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x - r + 1, y - r + 1, (r - 1) * 2, (r - 1) * 2);
      ctx.restore();
      return true;
    };

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const g = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, W * 0.7);
      g.addColorStop(0, '#faf8f5'); g.addColorStop(1, '#f0ece4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // Grid dots
      ctx.fillStyle = 'rgba(0,0,0,0.035)';
      for (let x = 0; x < W; x += 28) for (let y = 0; y < H; y += 28) ctx.fillRect(x, y, 1, 1);

      // Soft organic background rings (hand-drawn style)
      [0.3, 0.55, 0.8].forEach((f, i) => {
        const ringR = minR + (maxR - minR) * f;
        ctx.beginPath();
        const n = 60;
        for (let j = 0; j <= n; j++) {
          const a = (j / n) * Math.PI * 2;
          const noise = Math.sin(a * 3 + i * 2.1) * Math.cos(a * 2.3 + i) * (8 + i * 3);
          const rr = Math.max(10, ringR + noise);
          const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a);
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(0,0,0,${0.05 - i * 0.01})`; ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([]);
      });

      const hov = hoveredNodeRef.current;
      const sel = selectedNodeRef.current;

      // Edges from center to nodes
      positions.forEach(n => {
        const isH = hov?.id === n.id || sel?.id === n.id;
        const alpha = isH ? 0.45 : 0.06 + n.score * 0.12;
        ctx.strokeStyle = `rgba(0,0,0,${alpha.toFixed(3)})`;
        ctx.lineWidth = isH ? 2 : 0.8 + n.score * 1.5;
        wobblyLine(cx, cy, n.px, n.py, isH ? 3 : 1.5);
        if (isH) {
          const mx = (cx + n.px) / 2, my = (cy + n.py) / 2;
          // Match score bubble on edge
          wobblyCircle(mx, my - 4, 16, 2);
          ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = '#e11d48'; ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(n.score * 100) + '%', mx, my - 4);
        }
      });

      // Draw inter-node connections (between similar profiles)
      positions.forEach((a, i) => {
        positions.forEach((b, j) => {
          if (j <= i) return;
          const scoreSum = a.score + b.score;
          if (scoreSum > 1.2) {
            const dx = a.px - b.px, dy = a.py - b.py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxR * 0.7) {
              ctx.strokeStyle = `rgba(0,0,0,${0.03 + scoreSum * 0.02})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(a.px, a.py);
              ctx.lineTo(b.px, b.py);
              ctx.stroke();
            }
          }
        });
      });

      // --- Center node with avatar ---
      const centerSize = 32;
      // Outer glow ring
      wobblyCircle(cx, cy, centerSize + 6, 5);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.stroke();
      // White background
      wobblyCircle(cx, cy, centerSize, 3);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();
      // Draw center avatar
      const centerImg = imageCache[centerUser.avatar];
      if (centerImg) {
        drawAvatar(centerImg, cx, cy, centerSize);
        // Re-draw border on top of image
        wobblyCircle(cx, cy, centerSize, 3);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();
      } else {
        ctx.fillStyle = '#000'; ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const cName = centerUser.name || 'Me';
        ctx.fillText(cName.length > 3 ? cName.slice(0, 2) : cName, cx, cy);
      }
      // Center name
      ctx.fillStyle = '#000'; ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(centerUser.name || 'Me', cx, cy + centerSize + 6);

      // --- Outer nodes with avatars ---
      positions.forEach(n => {
        const isH = hov?.id === n.id;
        const isS = sel?.id === n.id;
        const s = isH || isS ? n.size * 1.2 : n.size;
        const floatY = Math.sin(time * 1.2 + n.angle * 3) * 2.5;
        const floatX = Math.cos(time * 0.8 + n.angle * 2) * 1.5;
        const px = n.px + floatX, py = n.py + floatY;

        // Hover / select ring
        if (isH || isS) {
          ctx.beginPath();
          ctx.arc(px, py, s + 7, 0, Math.PI * 2);
          ctx.strokeStyle = isS ? 'rgba(225,29,72,0.3)' : 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        }

        // White background circle
        ctx.beginPath();
        ctx.arc(px, py, s, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = isS ? '#e11d48' : (isH ? '#000' : 'rgba(0,0,0,0.15)');
        ctx.lineWidth = isS ? 2.5 : (isH ? 2 : 1.5); ctx.stroke();

        // Draw avatar image
        const imgUrl = n.photos?.[0] || n.avatar;
        const img = imageCache[imgUrl];
        if (img) {
          drawAvatar(img, px, py, s);
          // Re-draw border on top
          ctx.beginPath();
          ctx.arc(px, py, s, 0, Math.PI * 2);
          ctx.strokeStyle = isS ? '#e11d48' : (isH ? '#000' : 'rgba(0,0,0,0.15)');
          ctx.lineWidth = isS ? 2.5 : (isH ? 2 : 1.5); ctx.stroke();
        } else {
          // Fallback: initial letter
          ctx.fillStyle = isS ? '#e11d48' : '#000';
          ctx.font = `bold ${Math.round(s * 0.65)}px serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(n.name?.charAt(0) || '?', px, py);
        }

        // Name below node
        ctx.fillStyle = isH ? '#000' : 'rgba(0,0,0,0.5)';
        ctx.font = `${isH ? 'bold' : 'normal'} ${isH ? 12 : 10}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(n.name, px, py + s + 5);

        // Hover tooltip (name + age)
        if (isH && !isS) {
          const text = `${n.name} · ${n.age}岁`;
          ctx.font = 'bold 11px sans-serif';
          const tw = ctx.measureText(text).width + 16;
          ctx.fillStyle = 'rgba(0,0,0,0.82)';
          ctx.beginPath();
          const bx = px - tw / 2, by = py - s - 28, bh = 22;
          ctx.roundRect(bx, by, tw, bh, 6); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, px, by + bh / 2);
        }
      });

      animId = requestAnimationFrame(render);
    };
    render();
    } // end startRender

    return () => cancelAnimationFrame(animId);
  }, [graphData, hoveredNode, selectedNode]);

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
        setToken(result.token);
        setCurrentUser(result.user);
        saveUserToStorage(result.user);
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
        setToken(result.token);
        setCurrentUser(result.user);
        saveUserToStorage(result.user);
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
    removeToken();
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
            <div className="w-full max-w-[950px] relative" style={{ height: '72vh', minHeight: 400 }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-pointer"
                onMouseMove={(e) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / (window.devicePixelRatio || 1) / rect.width;
                  const scaleY = canvas.height / (window.devicePixelRatio || 1) / rect.height;
                  const mx = (e.clientX - rect.left) * scaleX;
                  const my = (e.clientY - rect.top) * scaleY;
                  const positions = nodePositionsRef.current;
                  let found = null;
                  for (let i = positions.length - 1; i >= 0; i--) {
                    const n = positions[i];
                    const dist = Math.sqrt((mx - n.px) ** 2 + (my - n.py) ** 2);
                    if (dist <= n.size + 10) { found = n; break; }
                  }
                  setHoveredNode(found);
                  canvas.style.cursor = found ? 'pointer' : 'default';
                }}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / (window.devicePixelRatio || 1) / rect.width;
                  const scaleY = canvas.height / (window.devicePixelRatio || 1) / rect.height;
                  const mx = (e.clientX - rect.left) * scaleX;
                  const my = (e.clientY - rect.top) * scaleY;
                  const positions = nodePositionsRef.current;
                  let found = null;
                  for (let i = positions.length - 1; i >= 0; i--) {
                    const n = positions[i];
                    const dist = Math.sqrt((mx - n.px) ** 2 + (my - n.py) ** 2);
                    if (dist <= n.size + 10) { found = n; break; }
                  }
                  if (found) setSelectedNode(found);
                  else setSelectedNode(null);
                }}
              />
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
  // Markdown 渲染辅助
  // ============================================================
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 空行跳过
      if (!line.trim()) { i++; continue; }

      // **标题**（加粗行单独成段）
      const boldMatch = line.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        elements.push(<h3 key={key++} className="text-xl font-serif font-bold text-black mt-8 mb-3">{boldMatch[1]}</h3>);
        i++; continue;
      }

      // 列表项（连续的 - 开头行合并为 ul）
      if (line.trim().startsWith('- ')) {
        const items = [];
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          const itemText = lines[i].trim().slice(2);
          // 处理列表项内的加粗
          const parts = itemText.split(/\*\*(.+?)\*\*/);
          items.push(
            <li key={items.length} className="flex items-start gap-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-black mt-2.5 shrink-0"></span>
              <span>{parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className="font-bold text-black">{p}</strong> : p)}</span>
            </li>
          );
          i++;
        }
        elements.push(<ul key={key++} className="space-y-1 mb-4">{items}</ul>);
        continue;
      }

      // 普通段落（连续非空行合并）
      const paraLines = [];
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('- ') && !lines[i].match(/^\*\*.+\*\*$/)) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        const paraText = paraLines.join('\n');
        // 处理行内加粗
        const parts = paraText.split(/\*\*(.+?)\*\*/);
        elements.push(
          <p key={key++} className="text-gray-700 leading-relaxed text-base mb-4">
            {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className="font-bold text-black">{p}</strong> : p)}
          </p>
        );
      }
    }

    return <>{elements}</>;
  };

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
            <div>
              {/* Hero Banner */}
              <div className="bg-black rounded-2xl p-8 md:p-12 mb-8 text-white">
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{landingData.about.title}</h2>
                <p className="text-gray-300 text-lg font-serif">专属于 BIUH 学生的校园社交平台</p>
              </div>
              {/* Content */}
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
                {renderMarkdown(landingData.about.content)}
              </div>
            </div>
          )}
          {landingSubView === 'safety' && landingData.safety && (
            <div>
              {/* Hero Banner */}
              <div className="bg-black rounded-2xl p-8 md:p-12 mb-8 text-white">
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{landingData.safety.title}</h2>
                <p className="text-gray-300 text-lg font-serif">保护每一位同学的交友安全</p>
              </div>
              {/* Content */}
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
                {renderMarkdown(landingData.safety.content)}
              </div>
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
