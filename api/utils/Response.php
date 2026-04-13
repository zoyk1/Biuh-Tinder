<?php
/**
 * 统一响应格式工具类
 * 所有接口必须返回结构一致的 JSON
 */

class Response
{
    /**
     * 成功响应
     * @param string $message
     * @param mixed $data
     * @return void
     */
    public static function success(string $message = '操作成功', mixed $data = null): void
    {
        self::send(200, $message, $data);
    }

    /**
     * 参数错误响应
     * @param string $message
     * @param mixed $data
     * @return void
     */
    public static function error(string $message = '参数错误', mixed $data = null): void
    {
        self::send(400, $message, $data);
    }

    /**
     * 未授权响应
     * @param string $message
     * @param mixed $data
     * @return void
     */
    public static function unauthorized(string $message = '未登录或登录已过期', mixed $data = null): void
    {
        http_response_code(401);
        self::send(401, $message, $data);
    }

    /**
     * 禁止访问响应
     * @param string $message
     * @param mixed $data
     * @return void
     */
    public static function forbidden(string $message = '无权访问', mixed $data = null): void
    {
        http_response_code(403);
        self::send(403, $message, $data);
    }

    /**
     * 未找到响应
     * @param string $message
     * @param mixed $data
     * @return void
     */
    public static function notFound(string $message = '资源不存在', mixed $data = null): void
    {
        http_response_code(404);
        self::send(404, $message, $data);
    }

    /**
     * 服务器错误响应
     * @param string $message
     * @param mixed $data
     * @return void
     */
    public static function serverError(string $message = '服务器内部错误', mixed $data = null): void
    {
        http_response_code(500);
        self::send(500, $message, $data);
    }

    /**
     * 发送 JSON 响应
     * @param int $code      业务状态码
     * @param string $message 提示信息
     * @param mixed $data     具体数据
     * @return void
     */
    public static function send(int $code, string $message, mixed $data = null): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'code'    => $code,
            'message' => $message,
            'data'    => $data,
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }
}
