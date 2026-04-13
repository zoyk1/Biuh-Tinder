<?php
/**
 * 匹配记录模型
 * 负责 matches 表的数据操作
 */

require_once __DIR__ . '/../config/database.php';

class MatchModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = getDB();
    }

    /**
     * 创建匹配记录（使用事务确保原子性）
     * 使用唯一索引防止重复匹配
     * @param int $userId1
     * @param int $userId2
     * @return int|false  匹配记录 ID 或 false
     */
    public function createMatch(int $userId1, int $userId2): int|false
    {
        try {
            $this->db->beginTransaction();

            // 确保较小的 ID 在前，防止 A-B 和 B-A 重复
            $smallerId = min($userId1, $userId2);
            $largerId  = max($userId1, $userId2);

            // 先检查是否已经匹配过（tinder.sql 的 matches 表无唯一索引，需手动检查）
            $checkStmt = $this->db->prepare(
                "SELECT id FROM matches WHERE user1_id = ? AND user2_id = ?"
            );
            $checkStmt->execute([$smallerId, $largerId]);
            if ($checkStmt->fetch()) {
                $this->db->commit();
                return -1; // 表示已存在匹配
            }

            $stmt = $this->db->prepare(
                "INSERT INTO matches (user1_id, user2_id, created_at) VALUES (?, ?, NOW())"
            );
            $stmt->execute([$smallerId, $largerId]);

            $matchId = (int) $this->db->lastInsertId();

            $this->db->commit();
            return $matchId;
        } catch (PDOException $e) {
            $this->db->rollBack();
            return false;
        }
    }

    /**
     * 检查两个用户是否已匹配
     * @param int $userId1
     * @param int $userId2
     * @return bool
     */
    public function isMatched(int $userId1, int $userId2): bool
    {
        $smallerId = min($userId1, $userId2);
        $largerId  = max($userId1, $userId2);

        $stmt = $this->db->prepare(
            "SELECT id FROM matches WHERE user1_id = ? AND user2_id = ?"
        );
        $stmt->execute([$smallerId, $largerId]);
        return (bool) $stmt->fetch();
    }

    /**
     * 获取用户的所有匹配列表
     * @param int $userId
     * @return array
     */
    public function getUserMatches(int $userId): array
    {
        $stmt = $this->db->prepare(
            "SELECT m.id AS match_id, m.created_at AS matched_at,
                    u.id AS user_id, u.username,
                    p.avatar_url, p.bio, p.gender, p.age
             FROM matches m
             INNER JOIN users u ON (
                 CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END = u.id
             )
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE m.user1_id = ? OR m.user2_id = ?
             ORDER BY m.created_at DESC"
        );
        $stmt->execute([$userId, $userId, $userId]);
        return $stmt->fetchAll();
    }

    /**
     * 获取匹配记录详情
     * @param int $matchId
     * @return array|null
     */
    public function findById(int $matchId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, user1_id, user2_id, created_at FROM matches WHERE id = ?"
        );
        $stmt->execute([$matchId]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
}
