<?php
/**
 * BIUH-Tinder API 单一入口文件
 * 负责全局 CORS 处理、路由分发、鉴权拦截
 */

// ============================================================
// 全局配置
// ============================================================

// JWT 密钥（生产环境请更换为复杂的随机字符串）
define('JWT_SECRET', 'biuh_tinder_secret_key_change_in_production_2024');

// 上传目录（相对于 API 根目录）
define('UPLOAD_DIR', __DIR__ . '/public/uploads');

// 开发环境错误显示（生产环境请设为 0）
error_reporting(E_ALL);
ini_set('display_errors', '1');

// ============================================================
// 全局 CORS 跨域处理
// ============================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400'); // 预检请求缓存 24 小时

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================
// 自动加载
// ============================================================

require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/JWT.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/models/UserModel.php';
require_once __DIR__ . '/models/SwipeModel.php';
require_once __DIR__ . '/models/MatchModel.php';
require_once __DIR__ . '/models/MessageModel.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ProfileController.php';
require_once __DIR__ . '/controllers/SwipeController.php';
require_once __DIR__ . '/controllers/MatchController.php';
require_once __DIR__ . '/controllers/MessageController.php';

// ============================================================
// 路由解析
// ============================================================

// 获取请求 URI 和方法
$requestUri  = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// 解析路径：去掉 query string 和前缀
$path = parse_url($requestUri, PHP_URL_PATH);

// 去掉可能的 /api 前缀和 index.php
$path = preg_replace('#^/?(api/)?(index\.php/?)?#', '', $path);
$path = '/' . trim($path, '/');

// 如果路径只有 "/"，设为空
if ($path === '/') {
    $path = '';
}

// 初始化中间件和控制器
$authMiddleware    = new AuthMiddleware(JWT_SECRET);
$authController    = new AuthController(JWT_SECRET);
$profileController = new ProfileController($authMiddleware, UPLOAD_DIR);
$swipeController   = new SwipeController($authMiddleware);
$matchController   = new MatchController($authMiddleware);
$messageController = new MessageController($authMiddleware);

// ============================================================
// 不需要鉴权的路由（白名单）
// ============================================================
$publicRoutes = [
    'POST /register',
    'POST /login',
];

// 当前路由标识
$currentRoute = $requestMethod . ' ' . $path;

// 检查是否为公开路由
$isPublic = false;
foreach ($publicRoutes as $route) {
    if ($currentRoute === $route) {
        $isPublic = true;
        break;
    }
}

// 如果不是公开路由，进行鉴权拦截
if (!$isPublic) {
    $userId = $authMiddleware->getUserId();
    if (!$userId) {
        Response::unauthorized();
    }
}

// ============================================================
// 路由分发
// ============================================================

try {
    switch ($currentRoute) {
        // ---------- 认证模块 ----------
        case 'POST /register':
            $authController->register();
            break;

        case 'POST /login':
            $authController->login();
            break;

        // ---------- 个人资料模块 ----------
        case 'GET /profile':
            $profileController->getProfile();
            break;

        case 'PUT /update-profile':
            $profileController->updateProfile();
            break;

        case 'POST /upload-avatar':
            $profileController->uploadAvatar();
            break;

        // ---------- 探索与匹配模块 ----------
        case 'GET /discover':
            $swipeController->discover();
            break;

        case 'POST /swipe':
            $swipeController->swipe();
            break;

        case 'GET /matches':
            $matchController->getMatches();
            break;

        // ---------- 聊天模块 ----------
        case 'GET /messages':
            $messageController->getMessages();
            break;

        case 'POST /send-message':
            $messageController->sendMessage();
            break;

        case 'GET /conversations':
            $messageController->getConversations();
            break;

        // ---------- 带参数的路由（需要额外匹配） ----------
        default:
            // 匹配 GET /profile/{userId}
            if (preg_match('#^GET /profile/(\d+)$#', $currentRoute, $matches)) {
                $profileController->getUserProfile((int) $matches[1]);
                break;
            }

            // 未匹配到任何路由
            Response::notFound('接口不存在: ' . $path);
            break;
    }
} catch (PDOException $e) {
    // 数据库异常
    error_log('Database Error: ' . $e->getMessage());
    Response::serverError('数据库操作失败');
} catch (Exception $e) {
    // 通用异常
    error_log('Server Error: ' . $e->getMessage());
    Response::serverError('服务器内部错误');
}
