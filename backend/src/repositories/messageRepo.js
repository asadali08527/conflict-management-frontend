const Message = require('../models/Message');

/**
 * P2: Repository Layer for Message Model
 * Encapsulates all database operations for Messages
 * Provides optimized queries with lean() and projections
 */

class MessageRepository {
  /**
   * Find messages with pagination and filters
   * P2 Performance: Uses lean() for better performance
   */
  async findMessages({ filter = {}, page = 1, limit = 20, sort = { createdAt: -1 }, projection = null }) {
    const skip = (page - 1) * limit;

    return Message.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Find messages by case
   * P2: Optimized with compound index { case: 1, createdAt: -1 }
   */
  async findByCase(caseId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return Message.find(
      { case: caseId, isDeleted: false },
      'sender recipients subject content messageType priority createdAt updatedAt'
    )
      .sort({ createdAt: 1 }) // Chronological order for chat
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Count messages by case
   */
  async countByCase(caseId) {
    return Message.countDocuments({ case: caseId, isDeleted: false });
  }

  /**
   * Find message by ID
   */
  async findById(id, lean = false) {
    const query = Message.findById(id);
    if (lean) {
      return query.lean();
    }
    return query;
  }

  /**
   * Find one message by filter
   */
  async findOne(filter, lean = false) {
    const query = Message.findOne(filter);
    if (lean) {
      return query.lean();
    }
    return query;
  }

  /**
   * Create new message
   */
  async create(messageData) {
    return Message.create(messageData);
  }

  /**
   * Update message by ID
   */
  async updateById(id, updateData) {
    return Message.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Soft delete message (set isDeleted flag)
   */
  async deleteById(id) {
    return Message.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }

  /**
   * Hard delete message (use with caution)
   */
  async hardDeleteById(id) {
    return Message.findByIdAndDelete(id);
  }

  /**
   * Mark message as read for specific user
   * P2: Uses message instance method
   */
  async markAsRead(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) {
      return null;
    }
    return message.markAsRead(userId);
  }

  /**
   * Get unread messages for user
   * P2: Optimized with compound index { recipients.userId: 1, recipients.isRead: 1, createdAt: -1 }
   */
  async findUnreadByUser(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return Message.find({
      'recipients.userId': userId,
      'recipients.isRead': false,
      isDeleted: false,
    })
      .populate('case', 'caseId title status')
      .populate('sender.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Count unread messages for user
   * P2: Uses model static method
   */
  async countUnreadByUser(userId) {
    return Message.getUnreadCount(userId);
  }

  /**
   * Get messages sent by user
   */
  async findBySender(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return Message.find({
      'sender.userId': userId,
      isDeleted: false,
    })
      .populate('case', 'caseId title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Get messages for specific recipient
   */
  async findByRecipient(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return Message.find({
      'recipients.userId': userId,
      isDeleted: false,
    })
      .populate('case', 'caseId title status')
      .populate('sender.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Bulk mark as read for multiple messages
   */
  async bulkMarkAsRead(messageIds, userId) {
    return Message.updateMany(
      {
        _id: { $in: messageIds },
        'recipients.userId': userId,
      },
      {
        $set: {
          'recipients.$[elem].isRead': true,
          'recipients.$[elem].readAt': new Date(),
        },
      },
      {
        arrayFilters: [{ 'elem.userId': userId }],
      }
    );
  }

  /**
   * Get message statistics for a case
   */
  async getCaseMessageStats(caseId) {
    return Message.aggregate([
      {
        $match: {
          case: caseId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          messageTypes: {
            $push: '$messageType',
          },
        },
      },
    ]);
  }

  /**
   * Get recent messages across all cases (admin dashboard)
   */
  async getRecentMessages(limit = 10) {
    return Message.find({ isDeleted: false })
      .populate('case', 'caseId title')
      .populate('sender.userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = new MessageRepository();
