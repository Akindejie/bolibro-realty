import { Request, Response } from 'express';
import prisma, { withRetry } from '../utils/database';
// @ts-ignore
const { wktToGeoJSON } = require('@terraformer/wkt');
import { AuthenticatedRequest } from '../types/authenticatedRequest';

/**
 * This application now uses Supabase for authentication.
 * The database schema has been updated to use supabaseId column names
 * for consistency with the authentication system.
 */

export const getManager = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    console.log(
      `Request to fetch manager with ID: ${userId} by user ${authUserId} with role ${userRole}`
    );

    // Security check: Managers can only access their own data
    if (userRole !== 'manager' || authUserId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    try {
      // Using supabaseId to identify the manager
      const manager = await withRetry(
        () =>
          prisma.manager.findUnique({
            where: { supabaseId: userId },
          }),
        `Fetch manager ${userId}`
      );

      if (manager) {
        res.json(manager);
      } else {
        res.status(404).json({ message: 'Manager not found' });
      }
    } catch (dbError: any) {
      console.error(`Database error when fetching manager: ${dbError.message}`);

      if (dbError.message?.includes("Can't reach database server")) {
        res.status(503).json({
          message: 'Database connection error. Please try again later.',
          details: 'Unable to connect to the database server',
        });
        return;
      }

      throw dbError; // Re-throw for the outer catch block
    }
  } catch (error: any) {
    console.error(`Error in getManager:`, error);
    res
      .status(500)
      .json({ message: `Error retrieving manager: ${error.message}` });
  }
};

export const createManager = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // authId is the Supabase user ID that will be stored in the supabaseId column
    const { supabaseId: authId, name, email, phoneNumber } = req.body;

    // Validation
    if (!authId || !name || !email) {
      res.status(400).json({
        message: 'Missing required fields',
        required: ['supabaseId', 'name', 'email'],
      });
      return;
    }

    // Check if manager already exists
    const existingManager = await prisma.manager.findUnique({
      where: { supabaseId: authId },
    });

    if (existingManager) {
      res.status(409).json({ message: 'Manager already exists with this ID' });
      return;
    }

    const manager = await prisma.manager.create({
      data: {
        supabaseId: authId, // Store Supabase user ID in supabaseId column
        name,
        email,
        phoneNumber,
      },
    });

    res.status(201).json(manager);
  } catch (error: any) {
    console.error('Error creating manager:', error);
    res
      .status(500)
      .json({ message: `Error creating manager: ${error.message}` });
  }
};

export const updateManager = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name, email, phoneNumber } = req.body;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    // Security check: Managers can only update their own data
    if (userRole !== 'manager' || authUserId !== userId) {
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

      // Using supabaseId to identify the manager
      const updateManager = await prisma.manager.update({
        where: { supabaseId: userId },
        data: updateData,
      });

      res.json(updateManager);
    } catch (dbError: any) {
      if (dbError.code === 'P2025') {
        res.status(404).json({ message: 'Manager not found' });
        return;
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error updating manager:', error);
    res
      .status(500)
      .json({ message: `Error updating manager: ${error.message}` });
  }
};

export const getManagerProperties = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    // Security check: Managers can only access their own properties
    if (userRole !== 'manager' || authUserId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    console.log(`Getting properties for manager: ${userId}`);

    let properties;
    try {
      // Using managerId to find properties
      properties = await withRetry(
        () =>
          prisma.property.findMany({
            where: { managerId: userId },
            include: {
              location: true,
            },
          }),
        `Fetch properties for manager ${userId}`
      );

      console.log(
        `Found ${properties.length} properties for manager ${userId}`
      );
    } catch (dbError: any) {
      console.error(
        `Database error when fetching properties: ${dbError.message}`
      );

      if (dbError.message?.includes("Can't reach database server")) {
        res.status(503).json({
          message: 'Database connection error. Please try again later.',
          details: 'Unable to connect to the database server',
        });
        return;
      }

      throw dbError; // Re-throw for the outer catch block
    }

    // Convert location coordinates to correct format
    const formattedProperties = await Promise.all(
      properties.map(async (property) => {
        try {
          const coordinates: { coordinates: string }[] =
            await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

          if (!coordinates[0]?.coordinates) {
            return {
              ...property,
              location: {
                ...property.location,
                coordinates: {
                  longitude: 0,
                  latitude: 0,
                },
              },
            };
          }

          const geoJSON: any = wktToGeoJSON(coordinates[0].coordinates);
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
        } catch (err) {
          console.error(
            `Error converting coordinates for property ${property.id}:`,
            err
          );
          return {
            ...property,
            location: {
              ...property.location,
              coordinates: {
                longitude: 0,
                latitude: 0,
              },
            },
          };
        }
      })
    );

    res.status(200).json(formattedProperties);
  } catch (error: any) {
    console.error('Error retrieving properties:', error);
    res
      .status(500)
      .json({ message: `Error retrieving properties: ${error.message}` });
  }
};

/**
 * Special endpoint to handle the /me request
 * This is used by the client when the user's ID is in the token
 * but we need to reference it as 'me' in the URL
 */
export const getManagerProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    const userRole = req.user?.role;

    console.log(
      `Request to fetch manager profile for authenticated user: ${authUserId} with role ${userRole}`
    );

    // Security check: Only managers can access this endpoint
    if (userRole !== 'manager') {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    try {
      // Using supabaseId to identify the manager
      const manager = await withRetry(
        () =>
          prisma.manager.findUnique({
            where: { supabaseId: authUserId },
          }),
        `Fetch manager profile for ${authUserId}`
      );

      if (manager) {
        res.json(manager);
      } else {
        res.status(404).json({ message: 'Manager not found' });
      }
    } catch (dbError: any) {
      console.error(`Database error when fetching manager: ${dbError.message}`);

      if (dbError.message?.includes("Can't reach database server")) {
        res.status(503).json({
          message: 'Database connection error. Please try again later.',
          details: 'Unable to connect to the database server',
        });
        return;
      }

      throw dbError; // Re-throw for the outer catch block
    }
  } catch (error: any) {
    console.error(`Error in getManagerProfile:`, error);
    res
      .status(500)
      .json({ message: `Error retrieving manager profile: ${error.message}` });
  }
};
