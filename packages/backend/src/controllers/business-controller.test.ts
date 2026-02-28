/**
 * Unit tests for BusinessController
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessController } from './business-controller.js';
import { businessService } from '../services/business-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';
import type { Request, Response, NextFunction } from 'express';

// Mock dependencies
vi.mock('../services/business-service.js', () => ({
  businessService: {
    listBusinesses: vi.fn(),
    getBusinessById: vi.fn(),
    getBusinessBySlug: vi.fn(),
    createBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    deleteBusiness: vi.fn(),
  },
}));

vi.mock('../utils/api-response.js', () => ({
  sendSuccess: vi.fn(),
  sendError: vi.fn(),
}));

describe('BusinessController', () => {
  let controller: BusinessController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new BusinessController();
    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: {
        id: 'user-123',
        role: 'ADMIN',
      },
      ip: '192.168.1.1',
      socket: {},
      get: vi.fn(),
    };
    mockResponse = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('listBusinesses', () => {
    it('should list businesses with default pagination', async () => {
      const mockResult = {
        businesses: [{ id: '1', name: 'Business 1' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      vi.mocked(businessService.listBusinesses).mockResolvedValue(mockResult);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.listBusinesses).toHaveBeenCalledWith(
        {
          category: undefined,
          status: undefined,
          openNow: undefined,
          search: undefined,
        },
        {
          page: 1,
          limit: 20,
          sortBy: undefined,
          sortOrder: 'asc',
        }
      );

      expect(sendSuccess).toHaveBeenCalledWith(mockResponse, {
        businesses: mockResult.businesses,
        pagination: mockResult.pagination,
      });
    });

    it('should list businesses with category filter', async () => {
      mockRequest.query = { category: 'cat-123' };

      const mockResult = {
        businesses: [{ id: '1', name: 'Business 1' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      vi.mocked(businessService.listBusinesses).mockResolvedValue(mockResult);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.listBusinesses).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'cat-123',
        }),
        expect.any(Object)
      );
    });

    it('should list businesses with status filter', async () => {
      mockRequest.query = { status: 'ACTIVE' };

      const mockResult = {
        businesses: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      vi.mocked(businessService.listBusinesses).mockResolvedValue(mockResult);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.listBusinesses).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACTIVE',
        }),
        expect.any(Object)
      );
    });

    it('should list businesses with open_now filter', async () => {
      mockRequest.query = { open_now: 'true' };

      const mockResult = {
        businesses: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      vi.mocked(businessService.listBusinesses).mockResolvedValue(mockResult);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.listBusinesses).toHaveBeenCalledWith(
        expect.objectContaining({
          openNow: true,
        }),
        expect.any(Object)
      );
    });

    it('should handle pagination parameters', async () => {
      mockRequest.query = { page: '2', limit: '10' };

      const mockResult = {
        businesses: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      };

      vi.mocked(businessService.listBusinesses).mockResolvedValue(mockResult);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.listBusinesses).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      );
    });

    it('should handle sort parameter with ascending order', async () => {
      mockRequest.query = { sort: 'name' };

      const mockResult = {
        businesses: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      vi.mocked(businessService.listBusinesses).mockResolvedValue(mockResult);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.listBusinesses).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sortBy: 'name',
          sortOrder: 'asc',
        })
      );
    });

    it('should handle sort parameter with descending order', async () => {
      mockRequest.query = { sort: '-createdAt' };

      const mockResult = {
        businesses: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      vi.mocked(businessService.listBusinesses).mockResolvedValue(mockResult);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.listBusinesses).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      );
    });

    it('should call next() on error', async () => {
      const error = new Error('Database error');
      vi.mocked(businessService.listBusinesses).mockRejectedValue(error);

      await controller.listBusinesses(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });

  describe('getBusinessById', () => {
    it('should get business by ID successfully', async () => {
      mockRequest.params = { id: 'business-123' };
      const mockBusiness = { id: 'business-123', name: 'Test Business' };

      vi.mocked(businessService.getBusinessById).mockResolvedValue(mockBusiness);

      await controller.getBusinessById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.getBusinessById).toHaveBeenCalledWith('business-123');
      expect(sendSuccess).toHaveBeenCalledWith(mockResponse, mockBusiness);
    });

    it('should handle array ID parameter', async () => {
      mockRequest.params = { id: ['business-123', 'extra'] };
      const mockBusiness = { id: 'business-123', name: 'Test Business' };

      vi.mocked(businessService.getBusinessById).mockResolvedValue(mockBusiness);

      await controller.getBusinessById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.getBusinessById).toHaveBeenCalledWith('business-123');
    });

    it('should return error if ID is missing', async () => {
      mockRequest.params = {};

      await controller.getBusinessById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendError).toHaveBeenCalledWith(
        mockResponse,
        'INVALID_REQUEST',
        'Business ID is required',
        400
      );
      expect(businessService.getBusinessById).not.toHaveBeenCalled();
    });

    it('should return 404 if business not found', async () => {
      mockRequest.params = { id: 'non-existent' };

      vi.mocked(businessService.getBusinessById).mockResolvedValue(null);

      await controller.getBusinessById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendError).toHaveBeenCalledWith(
        mockResponse,
        'BUSINESS_NOT_FOUND',
        'Business not found',
        404
      );
    });

    it('should call next() on error', async () => {
      mockRequest.params = { id: 'business-123' };
      const error = new Error('Database error');

      vi.mocked(businessService.getBusinessById).mockRejectedValue(error);

      await controller.getBusinessById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBusinessBySlug', () => {
    it('should get business by slug successfully', async () => {
      mockRequest.params = { slug: 'test-business' };
      const mockBusiness = { id: 'business-123', slug: 'test-business', name: 'Test Business' };

      vi.mocked(businessService.getBusinessBySlug).mockResolvedValue(mockBusiness);

      await controller.getBusinessBySlug(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.getBusinessBySlug).toHaveBeenCalledWith('test-business');
      expect(sendSuccess).toHaveBeenCalledWith(mockResponse, mockBusiness);
    });

    it('should handle array slug parameter', async () => {
      mockRequest.params = { slug: ['test-business', 'extra'] };
      const mockBusiness = { id: 'business-123', slug: 'test-business' };

      vi.mocked(businessService.getBusinessBySlug).mockResolvedValue(mockBusiness);

      await controller.getBusinessBySlug(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.getBusinessBySlug).toHaveBeenCalledWith('test-business');
    });

    it('should return error if slug is missing', async () => {
      mockRequest.params = {};

      await controller.getBusinessBySlug(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendError).toHaveBeenCalledWith(
        mockResponse,
        'INVALID_REQUEST',
        'Business slug is required',
        400
      );
      expect(businessService.getBusinessBySlug).not.toHaveBeenCalled();
    });

    it('should return 404 if business not found', async () => {
      mockRequest.params = { slug: 'non-existent' };

      vi.mocked(businessService.getBusinessBySlug).mockResolvedValue(null);

      await controller.getBusinessBySlug(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendError).toHaveBeenCalledWith(
        mockResponse,
        'BUSINESS_NOT_FOUND',
        'Business not found',
        404
      );
    });

    it('should call next() on error', async () => {
      mockRequest.params = { slug: 'test-business' };
      const error = new Error('Database error');

      vi.mocked(businessService.getBusinessBySlug).mockRejectedValue(error);

      await controller.getBusinessBySlug(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createBusiness', () => {
    it('should create business successfully', async () => {
      const businessData = {
        name: 'New Business',
        description: 'Description',
        categoryPrimaryId: 'cat-123',
        address: {
          street: '123 Main St',
          suburb: 'Guildford',
          postcode: '2161',
          country: 'Australia',
        },
        phone: '+61412345678',
      };

      mockRequest.body = businessData;
      const mockCreatedBusiness = { id: 'business-123', ...businessData };

      vi.mocked(businessService.createBusiness).mockResolvedValue(mockCreatedBusiness);

      await controller.createBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.createBusiness).toHaveBeenCalledWith(
        businessData,
        {
          actorId: 'user-123',
          actorRole: 'ADMIN',
          ipAddress: '192.168.1.1',
          userAgent: undefined,
        }
      );

      expect(sendSuccess).toHaveBeenCalledWith(mockResponse, mockCreatedBusiness, 201);
    });

    it('should extract audit context from request', async () => {
      mockRequest.body = { name: 'Test' };
      mockRequest.ip = '10.0.0.1';
      (mockRequest.get as ReturnType<typeof vi.fn>).mockReturnValue('Mozilla/5.0');

      const mockCreatedBusiness = { id: 'business-123' };
      vi.mocked(businessService.createBusiness).mockResolvedValue(mockCreatedBusiness);

      await controller.createBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.createBusiness).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          actorId: 'user-123',
          actorRole: 'ADMIN',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should use system defaults when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { name: 'Test' };

      const mockCreatedBusiness = { id: 'business-123' };
      vi.mocked(businessService.createBusiness).mockResolvedValue(mockCreatedBusiness);

      await controller.createBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.createBusiness).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          actorId: 'system',
          actorRole: 'SYSTEM',
        })
      );
    });

    it('should call next() on error', async () => {
      mockRequest.body = { name: 'Test' };
      const error = new Error('Validation error');

      vi.mocked(businessService.createBusiness).mockRejectedValue(error);

      await controller.createBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });

  describe('updateBusiness', () => {
    it('should update business successfully', async () => {
      mockRequest.params = { id: 'business-123' };
      mockRequest.body = { name: 'Updated Name' };

      const mockUpdatedBusiness = { id: 'business-123', name: 'Updated Name' };
      vi.mocked(businessService.updateBusiness).mockResolvedValue(mockUpdatedBusiness);

      await controller.updateBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.updateBusiness).toHaveBeenCalledWith(
        'business-123',
        { name: 'Updated Name' },
        expect.objectContaining({
          actorId: 'user-123',
          actorRole: 'ADMIN',
        })
      );

      expect(sendSuccess).toHaveBeenCalledWith(mockResponse, mockUpdatedBusiness);
    });

    it('should handle array ID parameter', async () => {
      mockRequest.params = { id: ['business-123', 'extra'] };
      mockRequest.body = { name: 'Updated' };

      const mockUpdatedBusiness = { id: 'business-123' };
      vi.mocked(businessService.updateBusiness).mockResolvedValue(mockUpdatedBusiness);

      await controller.updateBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.updateBusiness).toHaveBeenCalledWith(
        'business-123',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should return error if ID is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { name: 'Updated' };

      await controller.updateBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendError).toHaveBeenCalledWith(
        mockResponse,
        'INVALID_REQUEST',
        'Business ID is required',
        400
      );
      expect(businessService.updateBusiness).not.toHaveBeenCalled();
    });

    it('should extract audit context from request', async () => {
      mockRequest.params = { id: 'business-123' };
      mockRequest.body = { name: 'Updated' };
      mockRequest.ip = '10.0.0.1';
      (mockRequest.get as ReturnType<typeof vi.fn>).mockReturnValue('Mozilla/5.0');

      const mockUpdatedBusiness = { id: 'business-123' };
      vi.mocked(businessService.updateBusiness).mockResolvedValue(mockUpdatedBusiness);

      await controller.updateBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.updateBusiness).toHaveBeenCalledWith(
        'business-123',
        expect.any(Object),
        expect.objectContaining({
          actorId: 'user-123',
          actorRole: 'ADMIN',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should call next() on error', async () => {
      mockRequest.params = { id: 'business-123' };
      mockRequest.body = { name: 'Updated' };
      const error = new Error('Not found');

      vi.mocked(businessService.updateBusiness).mockRejectedValue(error);

      await controller.updateBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteBusiness', () => {
    it('should delete business successfully', async () => {
      mockRequest.params = { id: 'business-123' };

      vi.mocked(businessService.deleteBusiness).mockResolvedValue(undefined);

      await controller.deleteBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.deleteBusiness).toHaveBeenCalledWith(
        'business-123',
        expect.objectContaining({
          actorId: 'user-123',
          actorRole: 'ADMIN',
        })
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { message: 'Business deleted successfully' },
        200
      );
    });

    it('should handle array ID parameter', async () => {
      mockRequest.params = { id: ['business-123', 'extra'] };

      vi.mocked(businessService.deleteBusiness).mockResolvedValue(undefined);

      await controller.deleteBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.deleteBusiness).toHaveBeenCalledWith(
        'business-123',
        expect.any(Object)
      );
    });

    it('should return error if ID is missing', async () => {
      mockRequest.params = {};

      await controller.deleteBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendError).toHaveBeenCalledWith(
        mockResponse,
        'INVALID_REQUEST',
        'Business ID is required',
        400
      );
      expect(businessService.deleteBusiness).not.toHaveBeenCalled();
    });

    it('should extract audit context from request', async () => {
      mockRequest.params = { id: 'business-123' };
      mockRequest.ip = '10.0.0.1';
      (mockRequest.get as ReturnType<typeof vi.fn>).mockReturnValue('Mozilla/5.0');

      vi.mocked(businessService.deleteBusiness).mockResolvedValue(undefined);

      await controller.deleteBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(businessService.deleteBusiness).toHaveBeenCalledWith(
        'business-123',
        expect.objectContaining({
          actorId: 'user-123',
          actorRole: 'ADMIN',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should call next() on error', async () => {
      mockRequest.params = { id: 'business-123' };
      const error = new Error('Not found');

      vi.mocked(businessService.deleteBusiness).mockRejectedValue(error);

      await controller.deleteBusiness(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });
});
