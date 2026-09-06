// packages/backend/src/modules/problems/problem.routes.ts

import express from 'express';
import { ProblemController } from './problem.controller.js';
import { ProblemImportController } from './problem.import.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// ---------- Search Routes ----------
// Search problems (admin only)
router.get('/search', authenticate, isAdmin, ProblemController.searchProblems);

// ---------- Public Routes ----------
// ✅ NEW: Get problem by ID (Public - for students)
router.get('/public/:problemId', ProblemController.getProblemByIdPublic);

// ---------- Import Routes (Admin Only) ----------
router.get('/import/template', authenticate, isAdmin, ProblemImportController.getTemplate);
router.post('/import/validate', authenticate, isAdmin, ProblemImportController.validateJSON);
router.post('/import/bulk', authenticate, isAdmin, ProblemImportController.importProblems);
router.post('/export', authenticate, isAdmin, ProblemImportController.exportProblems);

// ---------- Student Routes ----------
// Get all problems (published only)
router.get('/', ProblemController.getProblems);

// Get user's submissions
router.get('/submissions', authenticate, ProblemController.getSubmissions);

// Get problem by slug
router.get('/:slug', authenticate, ProblemController.getProblem);

// Submit solution
router.post('/:slug/submit', authenticate, ProblemController.submitSolution);

// ---------- Admin Routes ----------
// Get next problem number (admin only)
router.get('/next-number', authenticate, isAdmin, ProblemController.getNextProblemNumber);

// Get all problems for admin (including unpublished)
router.get('/admin/all', authenticate, isAdmin, ProblemController.getAdminProblems);

// Create problem
router.post('/', authenticate, isAdmin, ProblemController.create);

// Get problem by ID (admin)
router.get('/admin/:problemId', authenticate, isAdmin, ProblemController.getProblemById);

// Update problem
router.put('/:problemId', authenticate, isAdmin, ProblemController.updateProblem);

// Delete problem
router.delete('/:problemId', authenticate, isAdmin, ProblemController.deleteProblem);

// Toggle publish
router.patch('/:problemId/publish', authenticate, isAdmin, ProblemController.togglePublish);

export default router;