<?php
/**
 * 探索与匹配控制器
 * 处理用户发现和滑动操作
 */

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/SwipeModel.php';
require_once __DIR__ . '/../models/MatchModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../utils/Response.php';

class SwipeController
{
    private UserModel $userModel;
    private SwipeModel $swipeModel;
    private MatchModel $matchModel;
    private AuthMiddleware $auth;

    public function __construct(AuthMiddleware $auth)
    {
        $this->userModel  = new UserModel();
        $this->swipeModel = new SwipeModel();
        $this->matchModel = new MatchModel();
        $this->auth       = $auth;
    }

    /**
     * 发现用户（获取推荐列表）
     * GET /api/discover?limit=10&offset=0
     * Header: Authorization: Bearer <token>
     */
    public function discover(): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        $limit  = (int) ($_GET['limit'] ?? 10);
        $offset = (int) ($_GET['offset'] ?? 0);

        // 限制单次查询数量
        if ($limit < 1 || $limit > 50) {
            $limit = 10;
        }

        $users = $this->userModel->getDiscoverUsers($userId, $limit, $offset);

        Response::success('获取推荐用户成功', [
            'users' => $users,
            'count' => count($users),
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    /**
     * 滑动操作（喜欢/忽略）
     * POST /api/swipe
     * Header: Authorization: Bearer <token>
     * Body: { "target_user_id": 123, "action": "like" }
     */
    public function swipe(): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) {
            Response::error('请求格式错误');
        }

        $targetUserId = (int) ($input['target_user_id'] ?? 0);
        $action       = $input['action'] ?? '';

        // 参数校验
        if ($targetUserId <= 0) {
            Response::error('目标用户 ID 无效');
        }

        $allowedActions = ['like', 'ignore'];
        if (!in_array($action, $allowedActions)) {
            Response::error('操作类型无效，允许值：like, ignore');
        }

        // 不能对自己操作
        if ($userId === $targetUserId) {
            Response::error('不能对自己进行操作');
        }

        // 检查目标用户是否存在
        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            Response::notFound('目标用户不存在');
        }

        // 检查是否已操作过
        if ($this->swipeModel->hasSwiped($userId, $targetUserId)) {
            Response::error('已经对该用户操作过了');
        }

        // 记录滑动操作
        $swipeResult = $this->swipeModel->createSwipe($userId, $targetUserId, $action);
        if (!$swipeResult) {
            Response::serverError('操作失败');
        }

        $responseData = [
            'swiped'       => true,
            'action'       => $action,
            'target_user'  => $targetUser['username'],
        ];

        // 核心逻辑：如果是喜欢，检查是否双向匹配
        if ($action === 'like') {
            $isMatch = false;
            $hasLikedMe = $this->swipeModel->hasLikedMe($userId, $targetUserId);

            if ($hasLikedMe) {
                $matchId = $this->matchModel->createMatch($userId, $targetUserId);

                if ($matchId > 0) {
                    $isMatch = true;
                    $responseData['is_match']    = true;
                    $responseData['match_id']    = $matchId;
                    $responseData['message']     = '恭喜！你们互相喜欢，已成功匹配！';
                } elseif ($matchId === -1) {
                    // 已经匹配过了（唯一索引冲突）
                    $responseData['is_match'] = true;
                    $responseData['message']  = '你们已经匹配过了';
                }
            }

            if (!$isMatch) {
                $responseData['is_match'] = false;
                $responseData['message']  = '已标记喜欢，等待对方回应';
            }
        }

        Response::success('操作成功', $responseData);
    }
}
