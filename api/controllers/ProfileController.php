<?php
/**
 * 个人资料控制器
 * 处理资料获取、更新和头像上传
 */

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../utils/Response.php';

class ProfileController
{
    private UserModel $userModel;
    private AuthMiddleware $auth;
    private string $uploadDir;

    public function __construct(AuthMiddleware $auth, string $uploadDir)
    {
        $this->userModel = new UserModel();
        $this->auth      = $auth;
        $this->uploadDir = $uploadDir;
    }

    /**
     * 获取当前用户资料
     * GET /api/profile
     * Header: Authorization: Bearer <token>
     */
    public function getProfile(): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        $profile = $this->userModel->getProfile($userId);

        if (!$profile) {
            // 用户存在但没有资料，返回基础信息
            $user = $this->userModel->findById($userId);
            if (!$user) {
                Response::notFound('用户不存在');
            }
            Response::success('获取资料成功', [
                'user_id'    => $user['id'],
                'username'   => $user['username'],
                'avatar_url' => null,
                'bio'        => null,
                'gender'     => null,
                'age'        => null,
                'created_at' => $user['created_at'],
            ]);
        }

        Response::success('获取资料成功', $profile);
    }

    /**
     * 获取指定用户资料
     * GET /api/profile/{userId}
     * Header: Authorization: Bearer <token>
     */
    public function getUserProfile(int $targetUserId): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        $profile = $this->userModel->getProfile($targetUserId);

        if (!$profile) {
            $user = $this->userModel->findById($targetUserId);
            if (!$user) {
                Response::notFound('用户不存在');
            }
            Response::success('获取资料成功', [
                'user_id'    => $user['id'],
                'username'   => $user['username'],
                'avatar_url' => null,
                'bio'        => null,
                'gender'     => null,
                'age'        => null,
                'created_at' => $user['created_at'],
            ]);
        }

        Response::success('获取资料成功', $profile);
    }

    /**
     * 更新个人资料
     * PUT /api/update-profile
     * Header: Authorization: Bearer <token>
     * Body: { "bio": "xxx", "gender": "male/female/other", "age": 25 }
     */
    public function updateProfile(): void
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

        // 构建更新数据（只允许更新特定字段）
        $data = [];

        if (isset($input['bio'])) {
            if (mb_strlen($input['bio']) > 500) {
                Response::error('个人简介不能超过 500 个字符');
            }
            $data['bio'] = trim($input['bio']);
        }

        if (isset($input['gender'])) {
            $allowedGenders = ['male', 'female', 'other'];
            if (!in_array($input['gender'], $allowedGenders)) {
                Response::error('性别参数无效，允许值：male, female, other');
            }
            $data['gender'] = $input['gender'];
        }

        if (isset($input['age'])) {
            $age = (int) $input['age'];
            if ($age < 1 || $age > 150) {
                Response::error('年龄参数无效');
            }
            $data['age'] = $age;
        }

        if (empty($data)) {
            Response::error('没有需要更新的数据');
        }

        $success = $this->userModel->upsertProfile($userId, $data);

        if (!$success) {
            Response::serverError('更新资料失败');
        }

        // 返回更新后的资料
        $profile = $this->userModel->getProfile($userId);
        Response::success('更新资料成功', $profile);
    }

    /**
     * 上传头像
     * POST /api/upload-avatar
     * Header: Authorization: Bearer <token>
     * Body: FormData with file field "avatar"
     */
    public function uploadAvatar(): void
    {
        $userId = $this->auth->getUserId();
        if (!$userId) {
            Response::unauthorized();
        }

        // 检查是否有文件上传
        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            $errorMsg = match ($_FILES['avatar']['error'] ?? UPLOAD_ERR_NO_FILE) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => '文件大小超出限制',
                UPLOAD_ERR_NO_FILE => '请选择要上传的图片',
                default => '文件上传失败',
            };
            Response::error($errorMsg);
        }

        $file = $_FILES['avatar'];

        // 限制文件大小（2MB）
        $maxSize = 2 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            Response::error('图片大小不能超过 2MB');
        }

        // 验证 MIME 类型
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedMimes)) {
            Response::error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
        }

        // 生成安全的文件名
        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/gif'  => 'gif',
            'image/webp' => 'webp',
            default      => 'jpg',
        };
        $fileName = uniqid('avatar_', true) . '_' . time() . '.' . $extension;

        // 确保上传目录存在
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }

        $filePath = $this->uploadDir . '/' . $fileName;

        // 移动文件
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            Response::serverError('文件保存失败');
        }

        // 生成访问 URL
        $avatarUrl = '/uploads/' . $fileName;

        // 更新数据库
        $this->userModel->updateAvatar($userId, $avatarUrl);

        Response::success('头像上传成功', [
            'avatar_url' => $avatarUrl,
        ]);
    }
}
