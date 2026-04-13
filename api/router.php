<?php
/**
 * PHP 内置开发服务器路由文件
 * 用于：php -S localhost:8000 router.php
 * 
 * PHP 内置服务器不会读取 .htaccess 文件，
 * 所以需要此文件来处理 URL 重写。
 */

// 如果请求的是真实存在的文件（图片、CSS等），直接返回
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$publicPath = __DIR__ . '/public';

// 处理 uploads 目录下的静态文件
if (preg_match('#^/uploads/#', $uri)) {
    $file = $publicPath . $uri;
    if (is_file($file)) {
        return false; // 让 PHP 内置服务器直接提供文件
    }
}

// 所有其他请求转发到 index.php
require __DIR__ . '/index.php';
