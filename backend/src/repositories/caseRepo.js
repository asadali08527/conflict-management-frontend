const Case = require('../models/Case');

/**
 * P2: Repository Layer for Case Model
 * Encapsulates all database operations for Cases
 * Provides optimized queries with lean() and projections
 */

class CaseRepository {
  /**
   * Find cases with pagination and filters
   * P2 Performance: Uses lean() for better performance
   */
  async findCases({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 }, projection = null }) {
    const skip = (page - 1) * limit;

    const query = Case.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // P2: Optimization - returns plain JS objects

    return query;
  }

  /**
   * Find cases with population (for detailed views)
   */
  async findCasesWithPopulation({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } }) {
    const skip = (page - 1) * limit;

    return Case.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('assignedPanelists.panelist', 'name email specialization')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Count cases matching filter
   */
  async countCases(filter = {}) {
    return Case.countDocuments(filter);
  }

  /**
   * Find case by ID
   */
  async findById(id, lean = false) {
    const query = Case.findById(id);
    if (lean) {
      return query.lean();
    }
    return query;
  }

  /**
   * Find case by ID with population
   */
  async findByIdWithDetails(id) {
    return Case.findById(id)
      .populate('createdBy', 'name email role phone')
      .populate('assignedTo', 'name email role')
      .populate('assignedPanelists.panelist', 'name email specialization')
      .populate('assignedPanelists.assignedBy', 'name email')
      .lean();
  }

  /**
   * Find one case by filter
   */
  async findOne(filter, lean = false) {
    const query = Case.findOne(filter);
    if (lean) {
      return query.lean();
    }
    return query;
  }

  /**
   * Create new case
   */
  async create(caseData) {
    return Case.create(caseData);
  }

  /**
   * Update case by ID
   */
  async updateById(id, updateData) {
    return Case.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Update one case by filter
   */
  async updateOne(filter, updateData) {
    return Case.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete case by ID (soft delete by setting status to closed)
   */
  async deleteById(id) {
    return Case.findByIdAndUpdate(id, { status: 'closed' }, { new: true });
  }

  /**
   * Hard delete case (use with caution)
   */
  async hardDeleteById(id) {
    return Case.findByIdAndDelete(id);
  }

  /**
   * Get cases by user (client view)
   * P2: Optimized with projection
   */
  async findByUser(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return Case.find(
      { createdBy: userId },
      'caseId title type status priority createdAt updatedAt' // P2: Projection
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Get cases by status
   * P2: Optimized query with compound index
   */
  async findByStatus(status, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return Case.find({ status }, 'caseId title type status priority createdAt assignedTo')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Get cases assigned to admin
   */
  async findAssignedToAdmin(adminId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return Case.find({ assignedTo: adminId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Get cases assigned to panelist
   */
  async findByPanelist(panelistId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return Case.find({
      'assignedPanelists.panelist': panelistId,
      'assignedPanelists.status': 'active',
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Aggregate statistics by status
   */
  async getStatsByStatus() {
    return Case.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }

  /**
   * Aggregate statistics by type
   */
  async getStatsByType() {
    return Case.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }
}

module.exports = new CaseRepository();
