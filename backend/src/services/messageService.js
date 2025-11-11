const messageRepo = require('../repositories/messageRepo');
const caseRepo = require('../repositories/caseRepo');
const { logger } = require('../config/logger');

/**
 * P2: Service Layer for Message Business Logic
 * Orchestrates repository calls, validation, and side effects
 * Controllers should call service methods instead of directly accessing repositories
 */

class MessageService {
  /**
   * Get messages for a case
   */
  async getMessagesByCase(caseId, user, page = 1, limit = 20) {
    try {
      // Verify case exists and user has access
      const caseData = await caseRepo.findById(caseId, true);

      if (!caseData) {
        const error = new Error('Case not found');
        error.statusCode = 404;
        throw error;
      }

      // Authorization check
      this._checkCaseAccess(caseData, user);

      // Fetch messages
      const [messages, total] = await Promise.all([
        messageRepo.findByCase(caseId, page, limit),
        messageRepo.countByCase(caseId),
      ]);

      return {
        messages,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, caseId, user: user.id }, 'Error fetching messages');
      throw error;
    }
  }

  /**
   * Create new message
   */
  async createMessage(messageData, sender) {
    try {
      // Verify case exists
      const caseData = await caseRepo.findById(messageData.case);

      if (!caseData) {
        const error = new Error('Case not found');
        error.statusCode = 404;
        throw error;
      }

      // Prepare message with sender info
      const newMessage = await messageRepo.create({
        ...messageData,
        sender: {
          userType: sender.role,
          userId: sender.id,
          panelistId: sender.panelistId || null,
          name: sender.name,
        },
      });

      logger.info({ messageId: newMessage._id, caseId: messageData.case }, 'Message created successfully');

      // TODO: Send real-time notification via WebSocket
      // TODO: Send email notification to recipients
      // TODO: Add to notification queue

      return newMessage;
    } catch (error) {
      logger.error({ error, caseId: messageData.case }, 'Error creating message');
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId, userId) {
    try {
      const message = await messageRepo.markAsRead(messageId, userId);

      if (!message) {
        const error = new Error('Message not found');
        error.statusCode = 404;
        throw error;
      }

      logger.debug({ messageId, userId }, 'Message marked as read');

      return message;
    } catch (error) {
      logger.error({ error, messageId, userId }, 'Error marking message as read');
      throw error;
    }
  }

  /**
   * Get unread messages for user
   */
  async getUnreadMessages(userId, page = 1, limit = 20) {
    try {
      const [messages, total] = await Promise.all([
        messageRepo.findUnreadByUser(userId, page, limit),
        messageRepo.countUnreadByUser(userId),
      ]);

      return {
        messages,
        unreadCount: total,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching unread messages');
      throw error;
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    try {
      return await messageRepo.countUnreadByUser(userId);
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching unread count');
      throw error;
    }
  }

  /**
   * Bulk mark messages as read
   */
  async bulkMarkAsRead(messageIds, userId) {
    try {
      const result = await messageRepo.bulkMarkAsRead(messageIds, userId);

      logger.info({ userId, count: messageIds.length }, 'Bulk marked messages as read');

      return result;
    } catch (error) {
      logger.error({ error, userId, messageIds }, 'Error bulk marking messages as read');
      throw error;
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId, user) {
    try {
      const message = await messageRepo.findById(messageId);

      if (!message) {
        const error = new Error('Message not found');
        error.statusCode = 404;
        throw error;
      }

      // Only sender or admin can delete
      if (user.role !== 'admin' && message.sender.userId.toString() !== user.id.toString()) {
        const error = new Error('Unauthorized to delete this message');
        error.statusCode = 403;
        throw error;
      }

      const deletedMessage = await messageRepo.deleteById(messageId);

      logger.info({ messageId, user: user.id }, 'Message deleted');

      return deletedMessage;
    } catch (error) {
      logger.error({ error, messageId, user: user.id }, 'Error deleting message');
      throw error;
    }
  }

  /**
   * Get recent messages (admin dashboard)
   */
  async getRecentMessages(limit = 10) {
    try {
      return await messageRepo.getRecentMessages(limit);
    } catch (error) {
      logger.error({ error }, 'Error fetching recent messages');
      throw error;
    }
  }

  /**
   * Private method: Check if user has access to case
   */
  _checkCaseAccess(caseData, user) {
    if (user.role === 'admin') {
      return true;
    }

    if (user.role === 'client') {
      if (caseData.createdBy.toString() !== user.id.toString()) {
        const error = new Error('Unauthorized access to case');
        error.statusCode = 403;
        throw error;
      }
    }

    if (user.role === 'panelist') {
      const isPanelist = caseData.assignedPanelists?.some(
        (ap) => ap.panelist.toString() === user.panelistId.toString() && ap.status === 'active'
      );

      if (!isPanelist) {
        const error = new Error('Unauthorized access to case');
        error.statusCode = 403;
        throw error;
      }
    }

    return true;
  }
}

module.exports = new MessageService();
