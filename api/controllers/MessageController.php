<?php
/**
 * 消息控制器
 * 处理消息发送和聊天记录获取
 * 隐私保护：发送消息前强制验证双向匹配关系
 */

require_once __DIR__ . '/../models/MessageModel.php';
require_once __DIR__ . '/../models/MatchModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../utils/Response.php';

class MessageController
{
    private MessageModel $messageModel;
    private MatchModel $matchModel;
    private AuthMiddleware $auth;

    public function __construct(AuthMiddleware $auth)
    {
        $this->messageModel = new MessageModel();
        $this->matchModel   = new MatchModel();
        $this->auth         = $auth;
    }

    /**
     * 发送消息
     * POST /api/send-message
     * Header: Authorization: Bearer <token>
     * Body: { "receiver_id": 123, "content": "你好" }
     */
    public function sendMessage(): void
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

        $receiverId = (int) ($input['receiver_id'] ?? 0);
        $content    = trim($input['content'] ?? '');

        // 参数校验
        if ($receiverId <= 0) {
            Response::error('接收者 ID 无效');
        }

        if (empty($content)) {
            Response::error('消息内容不能为空');
        }

        if (mb_strlen($content) > 1000) {
            Response::error('消息内容不能超过 1000 个字符');
        }

        // 不能给自己发消息
        if ($userId === $receiverId) {
            Response::error('不能给自己发送消息');
        }

        // 🔒 隐私与防骚扰机制：强制检查双向匹配关系
        $isMatched = $this->matchModel->isMatched($userId, $receiverId);
        if (!$isMatched) {
            Response::forbidden('你们尚未匹配，无法发送消息');
        }

        // 保存消息
        $messageId = $this->messageModel->createMessage($userId, $receiverId, $content);

        if (!$messageId) {
            Response::serverError('消息发送失败');
        }

        // 获取完整的消息记录返回
        $message = $this->messageModel->findById($messageId);

        Response::success('消息发送成功', $message);
    }

    /**
     * 获取两人之间的聊天记录
     * GET /api/messages?user_id=123&limit=50&offset=0
     * Header: Authorization: Bearer <token>
     */
    public function getMessages(): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        $targetUserId = (int) ($_GET['user_id'] ?? 0);
        $limit  = (int) ($_GET['limit'] ?? 50);
        $offset = (int) ($_GET['offset'] ?? 0);

        if ($targetUserId <= 0) {
            Response::error('请提供对方的用户 ID（user_id 参数）');
        }

        // 限制查询数量
        if ($limit < 1 || $limit > 100) {
            $limit = 50;
        }

        // 检查是否有匹配关系（隐私保护）
        $isMatched = $this->matchModel->isMatched($userId, $targetUserId);
        if (!$isMatched) {
            Response::forbidden('你们尚未匹配，无法查看聊天记录');
        }

        $messages = $this->messageModel->getConversation($userId, $targetUserId, $limit, $offset);

        Response::success('获取聊天记录成功', [
            'messages' => $messages,
            'count'    => count($messages),
            'with_user' => $targetUserId,
            'limit'    => $limit,
            'offset'   => $offset,
        ]);
    }

    /**
     * 获取最近的会话列表
     * GET /api/conversations
     * Header: Authorization: Bearer <token>
     */
    public function getConversations(): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        $conversations = $this->messageModel->getRecentConversations($userId);

        Response::success('获取会话列表成功', [
            'conversations' => $conversations,
            'count'         => count($conversations),
        ]);
    }
}
