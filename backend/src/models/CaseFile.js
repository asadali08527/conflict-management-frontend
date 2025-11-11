const mongoose = require('mongoose');

const CaseFileSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  storagePath: {
    type: String,
    required: true
  },
  storageKey: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  uploadUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * P1 Performance Fix: Optimized indexes for file retrieval
 * These indexes support efficient file lookups by session and date
 */
CaseFileSchema.index({ sessionId: 1, createdAt: -1 }); // Files by session sorted by date
CaseFileSchema.index({ storageKey: 1 }); // Lookup by S3 key for deletions/updates

module.exports = mongoose.model('CaseFile', CaseFileSchema);