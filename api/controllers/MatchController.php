<?php
/**
 * 匹配控制器
 * 处理获取匹配列表
 */

require_once __DIR__ . '/../models/MatchModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../utils/Response.php';

class MatchController
{
    private MatchModel $matchModel;
    private AuthMiddleware $auth;

    public function __construct(AuthMiddleware $auth)
    {
        $this->matchModel = new MatchModel();
        $this->auth       = $auth;
    }

    /**
     * 获取当前用户的匹配列表
     * GET /api/matches
     * Header: Authorization: Bearer <token>
     */
    public function getMatches(): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        $matches = $this->matchModel->getUserMatches($userId);

        Response::success('获取匹配列表成功', [
            'matches' => $matches,
            'count'   => count($matches),
        ]);
    }
}
