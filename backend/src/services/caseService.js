const caseRepo = require('../repositories/caseRepo');
const { logger } = require('../config/logger');

/**
 * P2: Service Layer for Case Business Logic
 * Orchestrates repository calls, validation, and side effects
 * Controllers should call service methods instead of directly accessing repositories
 */

class CaseService {
  /**
   * List cases with pagination and filters
   * Handles role-based filtering (clients see only their cases)
   */
  async listCases({ user, page = 1, limit = 10, status, type, sortBy = 'createdAt', sortOrder = 'desc' }) {
    try {
      const filter = {};

      // Role-based filtering
      if (user.role === 'client') {
        filter.createdBy = user.id;
      } else if (user.role === 'panelist') {
        filter['assignedPanelists.panelist'] = user.panelistId;
        filter['assignedPanelists.status'] = 'active';
      }

      // Additional filters
      if (status) filter.status = status;
      if (type) filter.type = type;

      // Sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Fetch data
      const [cases, total] = await Promise.all([
        caseRepo.findCasesWithPopulation({ filter, page, limit, sort }),
        caseRepo.countCases(filter),
      ]);

      return {
        cases,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, user: user.id }, 'Error listing cases');
      throw error;
    }
  }

  /**
   * Get case by ID with authorization check
   */
  async getCaseById(caseId, user) {
    try {
      const caseData = await caseRepo.findByIdWithDetails(caseId);

      if (!caseData) {
        const error = new Error('Case not found');
        error.statusCode = 404;
        throw error;
      }

      // Authorization check
      this._checkCaseAccess(caseData, user);

      return caseData;
    } catch (error) {
      logger.error({ error, caseId, user: user.id }, 'Error fetching case');
      throw error;
    }
  }

  /**
   * Create new case
   */
  async createCase(caseData, userId) {
    try {
      const newCase = await caseRepo.create({
        ...caseData,
        createdBy: userId,
        status: 'open',
      });

      logger.info({ caseId: newCase._id, userId }, 'Case created successfully');

      // TODO: Send notifications (add to queue)
      // TODO: Create case activity log

      return newCase;
    } catch (error) {
      logger.error({ error, userId }, 'Error creating case');
      throw error;
    }
  }

  /**
   * Update case
   */
  async updateCase(caseId, updateData, user) {
    try {
      // Fetch existing case
      const existingCase = await caseRepo.findById(caseId);

      if (!existingCase) {
        const error = new Error('Case not found');
        error.statusCode = 404;
        throw error;
      }

      // Authorization check
      this._checkCaseAccess(existingCase, user);

      // Only admins can update certain fields
      if (user.role !== 'admin') {
        const restrictedFields = ['status', 'assignedTo', 'assignedPanelists', 'priority'];
        restrictedFields.forEach((field) => {
          if (updateData[field]) {
            delete updateData[field];
          }
        });
      }

      // Update case
      const updatedCase = await caseRepo.updateById(caseId, updateData);

      logger.info({ caseId, user: user.id }, 'Case updated successfully');

      // TODO: Create case activity log
      // TODO: Send notifications if status changed

      return updatedCase;
    } catch (error) {
      logger.error({ error, caseId, user: user.id }, 'Error updating case');
      throw error;
    }
  }

  /**
   * Assign case to admin
   */
  async assignCase(caseId, adminId, assignedBy) {
    try {
      const updatedCase = await caseRepo.updateById(caseId, {
        assignedTo: adminId,
        assignedAt: new Date(),
        status: 'assigned',
      });

      if (!updatedCase) {
        const error = new Error('Case not found');
        error.statusCode = 404;
        throw error;
      }

      logger.info({ caseId, adminId, assignedBy }, 'Case assigned to admin');

      // TODO: Send notification to assigned admin
      // TODO: Create case activity log

      return updatedCase;
    } catch (error) {
      logger.error({ error, caseId, adminId }, 'Error assigning case');
      throw error;
    }
  }

  /**
   * Assign panelists to case
   */
  async assignPanelists(caseId, panelistIds, assignedBy) {
    try {
      const caseData = await caseRepo.findById(caseId);

      if (!caseData) {
        const error = new Error('Case not found');
        error.statusCode = 404;
        throw error;
      }

      // Add panelists
      const newPanelists = panelistIds.map((panelistId) => ({
        panelist: panelistId,
        assignedBy,
        assignedAt: new Date(),
        status: 'active',
      }));

      caseData.assignedPanelists.push(...newPanelists);
      caseData.status = 'panel_assigned';
      caseData.panelAssignedAt = new Date();

      await caseData.save();

      logger.info({ caseId, panelistIds, assignedBy }, 'Panelists assigned to case');

      // TODO: Send notifications to panelists
      // TODO: Create case activity log

      return caseData;
    } catch (error) {
      logger.error({ error, caseId, panelistIds }, 'Error assigning panelists');
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(user) {
    try {
      const [statusStats, typeStats] = await Promise.all([
        caseRepo.getStatsByStatus(),
        caseRepo.getStatsByType(),
      ]);

      return {
        byStatus: statusStats,
        byType: typeStats,
      };
    } catch (error) {
      logger.error({ error, user: user.id }, 'Error fetching dashboard stats');
      throw error;
    }
  }

  /**
   * Private method: Check if user has access to case
   */
  _checkCaseAccess(caseData, user) {
    if (user.role === 'admin') {
      return true; // Admins can access all cases
    }

    if (user.role === 'client') {
      if (caseData.createdBy.toString() !== user.id.toString()) {
        const error = new Error('Unauthorized access to case');
        error.statusCode = 403;
        throw error;
      }
    }

    if (user.role === 'panelist') {
      const isPanelist = caseData.assignedPanelists.some(
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

module.exports = new CaseService();
