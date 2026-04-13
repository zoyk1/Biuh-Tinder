<?php
/**
 * 认证控制器
 * 处理用户注册和登录
 */

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthController
{
    private UserModel $userModel;
    private string $jwtSecret;

    public function __construct(string $jwtSecret)
    {
        $this->userModel = new UserModel();
        $this->jwtSecret = $jwtSecret;
    }

    /**
     * 用户注册
     * POST /api/register
     * Body: { "username": "xxx", "password": "xxx" }
     */
    public function register(): void
    {
        $input = $this->getJsonInput();

        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        // 参数校验
        if (empty($username) || empty($password)) {
            Response::error('用户名和密码不能为空');
        }

        if (mb_strlen($username) < 2 || mb_strlen($username) > 50) {
            Response::error('用户名长度应在 2-50 个字符之间');
        }

        if (strlen($password) < 6) {
            Response::error('密码长度不能少于 6 个字符');
        }

        // 检查用户名是否已存在
        $existingUser = $this->userModel->findByUsername($username);
        if ($existingUser) {
            Response::error('该用户名已被注册');
        }

        // 密码加密
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // 创建用户
        $userId = $this->userModel->createUser($username, $passwordHash);

        if (!$userId) {
            Response::serverError('注册失败，请稍后重试');
        }

        // 签发 Token
        $token = JWT::encode(['user_id' => $userId], $this->jwtSecret);

        Response::success('注册成功', [
            'user_id'  => $userId,
            'username' => $username,
            'token'    => $token,
        ]);
    }

    /**
     * 用户登录
     * POST /api/login
     * Body: { "username": "xxx", "password": "xxx" }
     */
    public function login(): void
    {
        $input = $this->getJsonInput();

        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        // 参数校验
        if (empty($username) || empty($password)) {
            Response::error('用户名和密码不能为空');
        }

        // 查找用户
        $user = $this->userModel->findByUsername($username);
        if (!$user) {
            Response::error('用户名或密码错误');
        }

        // 验证密码
        if (!password_verify($password, $user['password_hash'])) {
            Response::error('用户名或密码错误');
        }

        // 签发 Token
        $token = JWT::encode(['user_id' => $user['id']], $this->jwtSecret);

        Response::success('登录成功', [
            'user_id'  => $user['id'],
            'username' => $user['username'],
            'token'    => $token,
        ]);
    }

    /**
     * 获取 JSON 请求体
     * @return array
     */
    private function getJsonInput(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
}
