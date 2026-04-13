<?php
/**
 * 用户模型
 * 负责 users 表和 profiles 表的数据操作
 */

require_once __DIR__ . '/../config/database.php';

class UserModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = getDB();
    }

    /**
     * 创建新用户
     * @param string $username
     * @param string $passwordHash
     * @return int|false  新用户 ID 或 false
     */
    public function createUser(string $username, string $passwordHash): int|false
    {
        $stmt = $this->db->prepare(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, NOW())"
        );
        $stmt->execute([$username, $passwordHash]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * 根据用户名查找用户
     * @param string $username
     * @return array|null
     */
    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, username, password_hash, created_at FROM users WHERE username = ?"
        );
        $stmt->execute([$username]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * 根据 ID 查找用户
     * @param int $id
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, username, created_at FROM users WHERE id = ?"
        );
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * 获取用户个人资料
     * @param int $userId
     * @return array|null
     */
    public function getProfile(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT p.user_id, p.avatar_url, p.bio, p.gender, p.age, u.username, u.created_at
             FROM profiles p
             INNER JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ?"
        );
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * 创建或更新用户个人资料
     * @param int $userId
     * @param array $data  包含 avatar_url, bio, gender, age
     * @return bool
     */
    public function upsertProfile(int $userId, array $data): bool
    {
        // 先检查是否已存在
        $stmt = $this->db->prepare("SELECT user_id FROM profiles WHERE user_id = ?");
        $stmt->execute([$userId]);
        $exists = $stmt->fetch();

        if ($exists) {
            // 更新
            $fields = [];
            $values = [];
            $allowedFields = ['avatar_url', 'bio', 'gender', 'age'];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "{$field} = ?";
                    $values[] = $data[$field];
                }
            }

            if (empty($fields)) {
                return false;
            }

            $values[] = $userId;
            $sql = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE user_id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($values);
        } else {
            // 插入
            $stmt = $this->db->prepare(
                "INSERT INTO profiles (user_id, avatar_url, bio, gender, age) VALUES (?, ?, ?, ?, ?)"
            );
            return $stmt->execute([
                $userId,
                $data['avatar_url'] ?? null,
                $data['bio'] ?? null,
                $data['gender'] ?? null,
                $data['age'] ?? null,
            ]);
        }
    }

    /**
     * 更新用户头像 URL
     * @param int $userId
     * @param string $avatarUrl
     * @return bool
     */
    public function updateAvatar(int $userId, string $avatarUrl): bool
    {
        return $this->upsertProfile($userId, ['avatar_url' => $avatarUrl]);
    }

    /**
     * 获取待发现的用户列表（排除已操作过的和自己）
     * @param int $currentUserId
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getDiscoverUsers(int $currentUserId, int $limit = 10, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT u.id, u.username, p.avatar_url, p.bio, p.gender, p.age
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.id != ?
               AND u.id NOT IN (
                   SELECT swiped_id FROM swipes WHERE swiper_id = ?
               )
             ORDER BY RAND()
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$currentUserId, $currentUserId, $limit, $offset]);
        return $stmt->fetchAll();
    }
}
