const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  sessionId: {
    type: String,
    default: null,
    comment: 'Party A session ID for case submission tracking'
  },
  linkedSessionId: {
    type: String,
    default: null,
    comment: 'Party B session ID if Party B has joined'
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['marriage', 'land', 'property', 'family'],
    required: [true, 'Case type is required']
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'panel_assigned', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  assignedPanelists: [
    {
      panelist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panelist',
        required: true
      },
      assignedAt: {
        type: Date,
        default: Date.now
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['active', 'removed', 'completed'],
        default: 'active'
      }
    }
  ],
  panelAssignedAt: {
    type: Date,
    default: null
  },
  parties: [
    {
      name: {
        type: String,
        required: true
      },
      contact: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      }
    }
  ],
  documents: [
    {
      name: String,
      url: String, // S3 URL instead of local path
      key: String, // S3 object key for deletion/management
      size: Number,
      mimetype: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  notes: [
    {
      content: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdByType: {
        type: String,
        enum: ['admin', 'panelist', 'client'],
        default: 'admin'
      },
      panelistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panelist',
        default: null
      },
      noteType: {
        type: String,
        enum: ['general', 'progress', 'internal'],
        default: 'general'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  resolutionStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'partial', 'complete'],
    default: 'not_started',
    comment: 'Tracks progress of panelist resolution submissions'
  },
  resolutionProgress: {
    total: {
      type: Number,
      default: 0,
      comment: 'Total number of panelists assigned'
    },
    submitted: {
      type: Number,
      default: 0,
      comment: 'Number of panelists who have submitted resolutions'
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },
  finalizedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Panelist',
      comment: 'List of panelists who have finalized their resolution'
    }
  ],
  finalizedAt: {
    type: Date,
    default: null,
    comment: 'When all panelists completed their resolutions'
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

// Update the updatedAt field before saving
CaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * P1 Performance Fix: Add compound indexes for hot query paths
 * These indexes optimize common dashboard and filter queries
 */
CaseSchema.index({ createdBy: 1, createdAt: -1 }); // User's cases sorted by date
CaseSchema.index({ status: 1, createdAt: -1 }); // Cases by status sorted by date
CaseSchema.index({ type: 1, createdAt: -1 }); // Cases by type sorted by date
CaseSchema.index({ assignedTo: 1, status: 1 }); // Assigned cases by status
CaseSchema.index({ 'assignedPanelists.panelist': 1, 'assignedPanelists.status': 1 }); // Panelist assignments

module.exports = mongoose.model('Case', CaseSchema);