<?php
/**
 * 滑动记录模型
 * 负责 swipes 表的数据操作
 */

require_once __DIR__ . '/../config/database.php';

class SwipeModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = getDB();
    }

    /**
     * 记录一次滑动操作
     * @param int $swiperId  操作者 ID
     * @param int $swipedId  被操作者 ID
     * @param string $action  操作类型 (like/ignore)
     * @return bool
     */
    public function createSwipe(int $swiperId, int $swipedId, string $action): bool
    {
        $stmt = $this->db->prepare(
            "INSERT INTO swipes (swiper_id, swiped_id, action, created_at) VALUES (?, ?, ?, NOW())"
        );
        return $stmt->execute([$swiperId, $swipedId, $action]);
    }

    /**
     * 检查是否已对某用户操作过
     * @param int $swiperId
     * @param int $swipedId
     * @return bool
     */
    public function hasSwiped(int $swiperId, int $swipedId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT id FROM swipes WHERE swiper_id = ? AND swiped_id = ?"
        );
        $stmt->execute([$swiperId, $swipedId]);
        return (bool) $stmt->fetch();
    }

    /**
     * 检查对方是否喜欢了自己
     * @param int $swiperId  当前用户（喜欢者）
     * @param int $swipedId  被喜欢的用户
     * @return bool
     */
    public function hasLikedMe(int $swiperId, int $swipedId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND action = 'like'"
        );
        $stmt->execute([$swipedId, $swiperId]);
        return (bool) $stmt->fetch();
    }
}
