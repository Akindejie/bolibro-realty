import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// @ts-ignore
const { wktToGeoJSON } = require('@terraformer/wkt');
import { AuthenticatedRequest } from '../types/authenticatedRequest';

/**
 * This application now uses Supabase for authentication.
 * The database schema has been updated to use supabaseId column names
 * for consistency with the authentication system.
 */

const prisma = new PrismaClient();

export const getTenant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Allow tenant to get their own data, or manager to view any tenant
    const { userId } = req.params;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    console.log(
      `Request to get tenant ${userId} by user ${authUserId} with role ${userRole}`
    );

    // Security check: Tenants can only access their own data
    if (userRole === 'tenant' && authUserId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    // Using supabaseId to identify the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId: userId },
      include: {
        leases: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
        },
        favorites: true,
      },
    });

    if (tenant) {
      res.json(tenant);
    } else {
      res.status(404).json({ message: 'Tenant not found' });
    }
  } catch (error: any) {
    console.error('Error retrieving tenant:', error);
    res
      .status(500)
      .json({ message: `Error retrieving tenant: ${error.message}` });
  }
};

export const createTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // authId is the Supabase user ID that will be stored in the supabaseId column
    const { supabaseId: authId, name, email, phoneNumber } = req.body;

    // Validation
    if (!authId || !email) {
      res.status(400).json({
        message: 'Missing required fields',
        required: ['supabaseId', 'email'],
      });
      return;
    }

    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { supabaseId: authId },
    });

    if (existingTenant) {
      res.status(409).json({ message: 'Tenant already exists with this ID' });
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        supabaseId: authId, // Store Supabase user ID in supabaseId column
        name: name || '',
        email,
        phoneNumber: phoneNumber || '',
      },
    });

    res.status(201).json(tenant);
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    res
      .status(500)
      .json({ message: `Error creating tenant: ${error.message}` });
  }
};

export const updateTenant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name, email, phoneNumber } = req.body;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    // Security check: Tenants can only update their own data
    if (userRole !== 'tenant' || authUserId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    // Validation
    if (!name && !email && !phoneNumber) {
      res.status(400).json({ message: 'No fields to update provided' });
      return;
    }

    try {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;

      // Using supabaseId to identify the tenant
      const updateTenant = await prisma.tenant.update({
        where: { supabaseId: userId },
        data: updateData,
      });

      res.json(updateTenant);
    } catch (dbError: any) {
      if (dbError.code === 'P2025') {
        res.status(404).json({ message: 'Tenant not found' });
        return;
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    res
      .status(500)
      .json({ message: `Error updating tenant: ${error.message}` });
  }
};

export const getCurrentResidences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    // Security check: Tenants can only view their own residences
    if (userRole !== 'tenant' || authUserId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    // Using supabaseId to identify tenant properties
    const properties = await prisma.property.findMany({
      where: { tenants: { some: { supabaseId: userId } } },
      include: {
        location: true,
      },
    });

    const residencesWithFormattedLocation = await Promise.all(
      properties.map(async (property) => {
        const coordinates: { coordinates: string }[] =
          await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

        const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || '');
        const longitude = geoJSON.coordinates[0];
        const latitude = geoJSON.coordinates[1];

        return {
          ...property,
          location: {
            ...property.location,
            coordinates: {
              longitude,
              latitude,
            },
          },
        };
      })
    );

    res.json(residencesWithFormattedLocation);
  } catch (err: any) {
    console.error('Error retrieving tenant properties:', err);
    res
      .status(500)
      .json({ message: `Error retrieving tenant properties: ${err.message}` });
  }
};

export const addFavoriteProperty = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, propertyId } = req.params;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    // Security check: Tenants can only manage their own favorites
    if (userRole !== 'tenant' || authUserId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    // Using supabaseId to identify the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId: userId },
      include: { favorites: true },
    });

    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    const propertyIdNumber = Number(propertyId);
    const existingFavorites = tenant.favorites || [];

    if (!existingFavorites.some((fav) => fav.id === propertyIdNumber)) {
      // Using supabaseId to update the tenant
      const updatedTenant = await prisma.tenant.update({
        where: { supabaseId: userId },
        data: {
          favorites: {
            connect: { id: propertyIdNumber },
          },
        },
        include: { favorites: true },
      });
      res.json(updatedTenant);
    } else {
      res.status(409).json({ message: 'Property already added as favorite' });
    }
  } catch (error: any) {
    console.error('Error adding favorite property:', error);
    res
      .status(500)
      .json({ message: `Error adding favorite property: ${error.message}` });
  }
};

export const removeFavoriteProperty = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, propertyId } = req.params;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    // Security check: Tenants can only manage their own favorites
    if (userRole !== 'tenant' || authUserId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    const propertyIdNumber = Number(propertyId);

    // Using supabaseId to update the tenant
    const updatedTenant = await prisma.tenant.update({
      where: { supabaseId: userId },
      data: {
        favorites: {
          disconnect: { id: propertyIdNumber },
        },
      },
      include: { favorites: true },
    });

    res.json(updatedTenant);
  } catch (err: any) {
    console.error('Error removing favorite property:', err);
    res
      .status(500)
      .json({ message: `Error removing favorite property: ${err.message}` });
  }
};

/**
 * Special endpoint to handle the /me request
 * This is used by the client when the user's ID is in the token
 * but we need to reference it as 'me' in the URL
 */
export const getTenantProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    console.log(
      `Request to fetch tenant profile for authenticated user: ${authUserId} with role ${userRole}`
    );

    // Security check: Only tenants can access this endpoint
    if (userRole !== 'tenant') {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    // Using supabaseId to identify the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId: authUserId },
      include: {
        leases: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
        },
        favorites: true,
      },
    });

    if (tenant) {
      res.json(tenant);
    } else {
      res.status(404).json({ message: 'Tenant not found' });
    }
  } catch (error: any) {
    console.error('Error retrieving tenant profile:', error);
    res
      .status(500)
      .json({ message: `Error retrieving tenant profile: ${error.message}` });
  }
};
