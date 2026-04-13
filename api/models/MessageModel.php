<?php
/**
 * 消息模型
 * 负责 messages 表的数据操作
 */

require_once __DIR__ . '/../config/database.php';

class MessageModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = getDB();
    }

    /**
     * 发送消息
     * @param int $senderId
     * @param int $receiverId
     * @param string $content
     * @return int|false  消息 ID 或 false
     */
    public function createMessage(int $senderId, int $receiverId, string $content): int|false
    {
        $stmt = $this->db->prepare(
            "INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, NOW())"
        );
        $stmt->execute([$senderId, $receiverId, $content]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * 获取两个用户之间的聊天记录
     * @param int $userId1
     * @param int $userId2
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getConversation(int $userId1, int $userId2, int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at,
                    u.username AS sender_name
             FROM messages m
             INNER JOIN users u ON m.sender_id = u.id
             WHERE (m.sender_id = ? AND m.receiver_id = ?)
                OR (m.sender_id = ? AND m.receiver_id = ?)
             ORDER BY m.created_at ASC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$userId1, $userId2, $userId2, $userId1, $limit, $offset]);
        return $stmt->fetchAll();
    }

    /**
     * 获取用户最近的会话列表（最后一条消息）
     * @param int $userId
     * @return array
     */
    public function getRecentConversations(int $userId): array
    {
        $stmt = $this->db->prepare(
            "SELECT 
                other.id AS user_id, 
                other.username, 
                p.avatar_url,
                latest_msg.content AS last_message, 
                latest_msg.created_at AS last_message_time,
                latest_msg.sender_id AS last_sender_id
             FROM (
                 SELECT 
                     CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id,
                     MAX(id) AS max_id
                 FROM messages
                 WHERE sender_id = ? OR receiver_id = ?
                 GROUP BY other_user_id
             ) AS conv
             INNER JOIN messages latest_msg ON conv.max_id = latest_msg.id
             INNER JOIN users other ON conv.other_user_id = other.id
             LEFT JOIN profiles p ON other.id = p.user_id
             ORDER BY latest_msg.created_at DESC"
        );
        $stmt->execute([$userId, $userId, $userId]);
        return $stmt->fetchAll();
    }

    /**
     * 根据消息 ID 查找消息
     * @param int $messageId
     * @return array|null
     */
    public function findById(int $messageId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, sender_id, receiver_id, content, created_at FROM messages WHERE id = ?"
        );
        $stmt->execute([$messageId]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
}
