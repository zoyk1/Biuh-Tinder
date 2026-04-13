<?php
/**
 * JWT 鉴权中间件
 * 从 HTTP Header 提取 Bearer Token 并验证
 */

require_once __DIR__ . '/../utils/JWT.php';

class AuthMiddleware
{
    /**
     * JWT 密钥（应与签发时一致）
     */
    private string $secret;

    public function __construct(string $secret)
    {
        $this->secret = $secret;
    }

    /**
     * 验证请求中的 Token，返回解码后的用户信息
     * @return array|null  成功返回用户载荷，失败返回 null
     */
    public function authenticate(): ?array
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        // 支持 Apache 和 Nginx 不同的 Header 传递方式
        if (empty($authHeader)) {
            // 尝试从 apache_request_headers 获取
            if (function_exists('apache_request_headers')) {
                $headers = apache_request_headers();
                $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            }
        }

        // 检查 Bearer Token 格式
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7); // 去掉 "Bearer " 前缀

        if (empty($token)) {
            return null;
        }

        // 解码验证
        return JWT::decode($token, $this->secret);
    }

    /**
     * 获取当前已认证的用户 ID
     * @return int|null
     */
    public function getUserId(): ?int
    {
        $payload = $this->authenticate();
        return $payload['user_id'] ?? null;
    }
}
