/**
 * Unit tests for BusinessService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BusinessService } from './business-service.js';
import { prisma } from '../db/index.js';
import { geocodeAddress } from './maps/geocoding-service.js';
import { getEsClient } from '../search/index.js';
import { seoService } from './seo-service.js';

// Mock dependencies
vi.mock('../db/index.js', () => ({
  prisma: {
    business: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('./maps/geocoding-service.js', () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock('../search/index.js', () => ({
  getEsClient: vi.fn(() => ({
    index: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('./seo-service.js', () => ({
  seoService: {
    generateBusinessSlug: vi.fn(),
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('BusinessService', () => {
  let businessService: BusinessService;
  const mockAuditContext = {
    actorId: 'user-123',
    actorRole: 'ADMIN',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  };

  beforeEach(() => {
    businessService = new BusinessService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBusiness', () => {
    const mockBusinessData = {
      name: 'Test Business',
      description: 'A test business',
      categoryPrimaryId: 'cat-123',
      address: {
        street: '123 Main St',
        suburb: 'Guildford',
        postcode: '2161',
        country: 'Australia',
      },
      phone: '+61412345678',
      email: 'test@example.com',
      website: 'https://example.com',
    };

    const mockCreatedBusiness = {
      id: 'business-123',
      name: 'Test Business',
      slug: 'test-business',
      description: 'A test business',
      categoryPrimaryId: 'cat-123',
      address: {
        street: '123 Main St',
        suburb: 'Guildford',
        postcode: '2161',
        country: 'Australia',
        latitude: -33.8688,
        longitude: 151.2093,
      },
      phone: '+61412345678',
      email: 'test@example.com',
      website: 'https://example.com',
      status: 'PENDING',
      claimed: false,
      createdAt: new Date(),
      categoryPrimary: {
        id: 'cat-123',
        name: 'Restaurants',
        slug: 'restaurants',
      },
      claimedByUser: null,
    };

    it('should create a business with geocoding', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-123' } as never);
      vi.mocked(seoService.generateBusinessSlug).mockResolvedValue('test-business');
      vi.mocked(geocodeAddress).mockResolvedValue({
        latitude: -33.8688,
        longitude: 151.2093,
        formattedAddress: '123 Main St, Guildford NSW 2161, Australia',
        confidence: 'high',
      });
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const result = await businessService.createBusiness(mockBusinessData, mockAuditContext);

      expect(result).toEqual(mockCreatedBusiness);
      expect(seoService.generateBusinessSlug).toHaveBeenCalledWith('Test Business');
      expect(geocodeAddress).toHaveBeenCalledWith({
        street: '123 Main St',
        suburb: 'Guildford',
        postcode: '2161',
        country: 'Australia',
      });
      expect(prisma.business.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Business',
            slug: 'test-business',
            status: 'PENDING',
            claimed: false,
            address: expect.objectContaining({
              latitude: -33.8688,
              longitude: 151.2093,
            }),
          }),
        })
      );
    });

    it('should create business without coordinates if geocoding fails', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-123' } as never);
      vi.mocked(seoService.generateBusinessSlug).mockResolvedValue('test-business');
      vi.mocked(geocodeAddress).mockRejectedValue(new Error('Geocoding failed'));
      vi.mocked(prisma.business.create).mockResolvedValue({
        ...mockCreatedBusiness,
        address: {
          ...mockCreatedBusiness.address,
          latitude: 0,
          longitude: 0,
        },
      } as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const result = await businessService.createBusiness(mockBusinessData, mockAuditContext);

      expect(result.address).toMatchObject({
        latitude: 0,
        longitude: 0,
      });
      expect(prisma.business.create).toHaveBeenCalled();
    });

    it('should log audit trail for business creation', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-123' } as never);
      vi.mocked(seoService.generateBusinessSlug).mockResolvedValue('test-business');
      vi.mocked(geocodeAddress).mockResolvedValue({
        latitude: -33.8688,
        longitude: 151.2093,
        formattedAddress: '123 Main St, Guildford NSW 2161, Australia',
        confidence: 'high',
      });
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      await businessService.createBusiness(mockBusinessData, mockAuditContext);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user-123',
          actorRole: 'ADMIN',
          action: 'business.create',
          targetType: 'Business',
          targetId: 'business-123',
          previousValue: undefined,
          newValue: mockCreatedBusiness,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should handle audit log failures gracefully', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-123' } as never);
      vi.mocked(seoService.generateBusinessSlug).mockResolvedValue('test-business');
      vi.mocked(geocodeAddress).mockResolvedValue({
        latitude: -33.8688,
        longitude: 151.2093,
        formattedAddress: '123 Main St, Guildford NSW 2161, Australia',
        confidence: 'high',
      });
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('Audit log failed'));

      // Should not throw even if audit log fails
      const result = await businessService.createBusiness(mockBusinessData, mockAuditContext);

      expect(result).toEqual(mockCreatedBusiness);
    });

    it('should set default status to PENDING', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-123' } as never);
      vi.mocked(seoService.generateBusinessSlug).mockResolvedValue('test-business');
      vi.mocked(geocodeAddress).mockResolvedValue({
        latitude: -33.8688,
        longitude: 151.2093,
        formattedAddress: '123 Main St, Guildford NSW 2161, Australia',
        confidence: 'high',
      });
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      await businessService.createBusiness(mockBusinessData, mockAuditContext);

      expect(prisma.business.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            claimed: false,
          }),
        })
      );
    });

    it('should handle optional fields', async () => {
      const minimalData = {
        name: 'Minimal Business',
        description: 'Minimal description',
        categoryPrimaryId: 'cat-123',
        address: {
          street: '123 Main St',
          suburb: 'Guildford',
          postcode: '2161',
          country: 'Australia',
        },
        phone: '+61412345678',
      };

      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-123' } as never);
      vi.mocked(seoService.generateBusinessSlug).mockResolvedValue('minimal-business');
      vi.mocked(geocodeAddress).mockResolvedValue({
        latitude: -33.8688,
        longitude: 151.2093,
        formattedAddress: '123 Main St, Guildford NSW 2161, Australia',
        confidence: 'high',
      });
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const result = await businessService.createBusiness(minimalData, mockAuditContext);

      expect(result).toBeDefined();
      expect(prisma.business.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoriesSecondary: [],
            languagesSpoken: [],
            certifications: [],
            paymentMethods: [],
            accessibilityFeatures: [],
          }),
        })
      );
    });
  });

  describe('getBusinessById', () => {
    const mockBusiness = {
      id: 'business-123',
      name: 'Test Business',
      slug: 'test-business',
      categoryPrimary: { id: 'cat-123', name: 'Restaurants' },
      claimedByUser: null,
    };

    it('should get business by ID with relations', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(mockBusiness as never);

      const result = await businessService.getBusinessById('business-123', true);

      expect(result).toEqual(mockBusiness);
      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'business-123' },
        include: {
          categoryPrimary: true,
          claimedByUser: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      });
    });

    it('should get business by ID without relations', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(mockBusiness as never);

      const result = await businessService.getBusinessById('business-123', false);

      expect(result).toEqual(mockBusiness);
      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'business-123' },
        include: undefined,
      });
    });

    it('should return null for non-existent business', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      const result = await businessService.getBusinessById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getBusinessBySlug', () => {
    const mockBusiness = {
      id: 'business-123',
      name: 'Test Business',
      slug: 'test-business',
      categoryPrimary: { id: 'cat-123', name: 'Restaurants' },
      claimedByUser: null,
    };

    it('should get business by slug', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(mockBusiness as never);

      const result = await businessService.getBusinessBySlug('test-business');

      expect(result).toEqual(mockBusiness);
      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-business' },
        include: expect.any(Object),
      });
    });

    it('should return null for non-existent slug', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      const result = await businessService.getBusinessBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listBusinesses', () => {
    const mockBusinesses = [
      { id: 'business-1', name: 'Business 1', status: 'ACTIVE' },
      { id: 'business-2', name: 'Business 2', status: 'ACTIVE' },
    ];

    it('should list businesses with default pagination', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(2);

      const result = await businessService.listBusinesses({}, {});

      expect(result.businesses).toEqual(mockBusinesses);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter by category', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(2);

      await businessService.listBusinesses({ category: 'cat-123' }, {});

      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryPrimaryId: 'cat-123',
          }),
        })
      );
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(2);

      await businessService.listBusinesses({ status: 'PENDING' }, {});

      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should default to ACTIVE status when no status filter provided', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(2);

      await businessService.listBusinesses({}, {});

      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(50);

      const result = await businessService.listBusinesses({}, { page: 2, limit: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
    });

    it('should enforce maximum limit of 100', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(200);

      await businessService.listBusinesses({}, { limit: 500 });

      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Max enforced
        })
      );
    });

    it('should sort by name ascending', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(2);

      await businessService.listBusinesses({}, { sortBy: 'name', sortOrder: 'asc' });

      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: 'asc' }],
        })
      );
    });

    it('should sort by createdAt descending by default', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(2);

      await businessService.listBusinesses({}, {});

      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }],
        })
      );
    });
  });

  describe('updateBusiness', () => {
    const existingBusiness = {
      id: 'business-123',
      name: 'Old Name',
      address: {
        street: '123 Old St',
        suburb: 'Guildford',
        postcode: '2161',
        latitude: -33.8688,
        longitude: 151.2093,
      },
    };

    const updateData = {
      name: 'New Name',
      description: 'Updated description',
    };

    const updatedBusiness = {
      ...existingBusiness,
      ...updateData,
    };

    it('should update business and log audit trail', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(prisma.business.update).mockResolvedValue(updatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const result = await businessService.updateBusiness('business-123', updateData, mockAuditContext);

      expect(result).toEqual(updatedBusiness);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'business.update',
          targetId: 'business-123',
          previousValue: existingBusiness,
          newValue: updatedBusiness,
        }),
      });
    });

    it('should throw error if business not found', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      await expect(
        businessService.updateBusiness('non-existent', updateData, mockAuditContext)
      ).rejects.toThrow();
    });

    it('should re-geocode if address changed', async () => {
      const updateWithAddress = {
        ...updateData,
        address: {
          street: '456 New St',
          suburb: 'Parramatta',
          postcode: '2150',
          country: 'Australia',
        },
      };

      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(geocodeAddress).mockResolvedValue({
        latitude: -33.8150,
        longitude: 151.0000,
        formattedAddress: '456 New St, Parramatta NSW 2150, Australia',
        confidence: 'high',
      });
      vi.mocked(prisma.business.update).mockResolvedValue({
        ...updatedBusiness,
        address: {
          street: '456 New St',
          suburb: 'Parramatta',
          postcode: '2150',
          country: 'Australia',
          latitude: -33.8150,
          longitude: 151.0000,
        },
      } as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      await businessService.updateBusiness('business-123', updateWithAddress, mockAuditContext);

      expect(geocodeAddress).toHaveBeenCalledWith({
        street: '456 New St',
        suburb: 'Parramatta',
        postcode: '2150',
        country: 'Australia',
      });
    });

    it('should keep old coordinates if geocoding fails', async () => {
      const updateWithAddress = {
        ...updateData,
        address: {
          street: '456 New St',
          suburb: 'Parramatta',
          postcode: '2150',
          country: 'Australia',
        },
      };

      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(geocodeAddress).mockRejectedValue(new Error('Geocoding failed'));
      vi.mocked(prisma.business.update).mockResolvedValue(updatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      await businessService.updateBusiness('business-123', updateWithAddress, mockAuditContext);

      expect(prisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            address: expect.objectContaining({
              latitude: -33.8688, // Old coordinates preserved
              longitude: 151.2093,
            }),
          }),
        })
      );
    });
  });

  describe('deleteBusiness', () => {
    const existingBusiness = {
      id: 'business-123',
      name: 'Test Business',
      status: 'ACTIVE',
    };

    it('should soft delete business (set status to DELETED)', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(prisma.business.update).mockResolvedValue({
        ...existingBusiness,
        status: 'DELETED',
      } as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      await businessService.deleteBusiness('business-123', mockAuditContext);

      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: 'business-123' },
        data: { status: 'DELETED' },
      });
    });

    it('should log audit trail for deletion', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(prisma.business.update).mockResolvedValue({
        ...existingBusiness,
        status: 'DELETED',
      } as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      await businessService.deleteBusiness('business-123', mockAuditContext);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'business.delete',
          targetId: 'business-123',
          previousValue: existingBusiness,
          newValue: undefined,
        }),
      });
    });

    it('should throw error if business not found', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      await expect(
        businessService.deleteBusiness('non-existent', mockAuditContext)
      ).rejects.toThrow();
    });
  });
});
