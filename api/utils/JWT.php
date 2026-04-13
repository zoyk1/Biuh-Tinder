<?php
/**
 * 轻量级 JWT 实现
 * 使用 HMAC-SHA256 算法签发和验证 Token
 */

class JWT
{
    /**
     * 签发 Token
     * @param array $payload  载荷数据（如 ['user_id' => 123]）
     * @param string $secret  密钥
     * @param int $expireSec  有效期（秒），默认 7 天
     * @return string
     */
    public static function encode(array $payload, string $secret, int $expireSec = 604800): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        // 添加签发时间和过期时间
        $payload['iat'] = time();
        $payload['exp'] = time() + $expireSec;

        $headerEncoded  = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = self::generateSignature($headerEncoded, $payloadEncoded, $secret);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signature;
    }

    /**
     * 验证并解码 Token
     * @param string $token   JWT 字符串
     * @param string $secret  密钥
     * @return array|null     成功返回载荷数组，失败返回 null
     */
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signatureProvided] = $parts;

        // 验证签名
        $signatureExpected = self::generateSignature($headerEncoded, $payloadEncoded, $secret);
        if (!hash_equals($signatureExpected, $signatureProvided)) {
            return null;
        }

        // 解码载荷
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!$payload) {
            return null;
        }

        // 检查是否过期
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * 生成 HMAC-SHA256 签名
     */
    private static function generateSignature(string $headerEncoded, string $payloadEncoded, string $secret): string
    {
        return self::base64UrlEncode(
            hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $secret, true)
        );
    }

    /**
     * Base64 URL 安全编码
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL 安全解码
     */
    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
