const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, 'Case reference is required']
  },
  sender: {
    userType: {
      type: String,
      enum: ['admin', 'panelist', 'client'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    panelistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Panelist',
      default: null,
      comment: 'Populated if sender is a panelist'
    },
    name: {
      type: String,
      required: true
    }
  },
  recipients: [
    {
      recipientType: {
        type: String,
        enum: ['party', 'panelist', 'admin', 'all_parties'],
        required: true
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      panelistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panelist',
        default: null
      },
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        trim: true
      },
      isRead: {
        type: Boolean,
        default: false
      },
      readAt: {
        type: Date,
        default: null
      }
    }
  ],
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  messageType: {
    type: String,
    enum: ['general', 'meeting_notification', 'case_update', 'resolution_request'],
    default: 'general'
  },
  attachments: [
    {
      name: String,
      url: String, // S3 URL
      key: String, // S3 key
      size: Number,
      mimetype: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * P1 Performance Fix: Optimized indexes for hot query paths
 * These indexes support message retrieval, unread counts, and filtering
 */
MessageSchema.index({ case: 1, createdAt: -1 }); // Messages for a case sorted by date
MessageSchema.index({ 'sender.userId': 1 }); // Messages by sender
MessageSchema.index({ 'recipients.userId': 1, 'recipients.isRead': 1, createdAt: -1 }); // P1: Compound index for unread messages
MessageSchema.index({ isDeleted: 1 }); // Filter deleted messages

// Update the updatedAt field before saving
MessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to mark message as read by a specific recipient
MessageSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(
    r => r.userId && r.userId.toString() === userId.toString()
  );

  if (recipient && !recipient.isRead) {
    recipient.isRead = true;
    recipient.readAt = Date.now();
  }

  return this.save();
};

// Method to get unread message count for a user
MessageSchema.statics.getUnreadCount = async function(userId) {
  const messages = await this.find({
    'recipients.userId': userId,
    'recipients.isRead': false,
    isDeleted: false
  });

  return messages.length;
};

module.exports = mongoose.model('Message', MessageSchema);
