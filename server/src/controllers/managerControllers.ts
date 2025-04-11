import { Request, Response } from 'express';
import prisma, { withRetry } from '../utils/database';
// @ts-ignore
const { wktToGeoJSON } = require('@terraformer/wkt');

export const getManager = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    console.log(`Fetching manager with ID: ${cognitoId}`);

    try {
      // Use the withRetry utility for database operations
      const manager = await withRetry(
        () =>
          prisma.manager.findUnique({
            where: { cognitoId },
          }),
        `Fetch manager ${cognitoId}`
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
    const { cognitoId, name, email, phoneNumber } = req.body;

    const manager = await prisma.manager.create({
      data: {
        cognitoId,
        name,
        email,
        phoneNumber,
      },
    });

    res.status(201).json(manager);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating manager: ${error.message}` });
  }
};

export const updateManager = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { name, email, phoneNumber } = req.body;

    const updateManager = await prisma.manager.update({
      where: { cognitoId },
      data: {
        name,
        email,
        phoneNumber,
      },
    });

    res.json(updateManager);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating manager: ${error.message}` });
  }
};

export const getManagerProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    console.log(`Getting properties for manager: ${cognitoId}`);

    let properties;
    try {
      // Use the withRetry utility for database operations
      properties = await withRetry(
        () =>
          prisma.property.findMany({
            where: { managerCognitoId: cognitoId },
            include: {
              location: true,
            },
          }),
        `Fetch properties for manager ${cognitoId}`
      );

      console.log(
        `Found ${properties.length} properties for manager ${cognitoId}`
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

    try {
      const propertiesWithFormattedLocation = await Promise.all(
        properties.map(async (property) => {
          try {
            // Ensure images and photoUrls are always arrays
            const photoUrls = Array.isArray(property.photoUrls)
              ? property.photoUrls
              : [];
            const images = Array.isArray(property.images)
              ? property.images
              : [];

            // Get coordinates safely
            let longitude = 0;
            let latitude = 0;

            try {
              // Use the withRetry utility for the raw query
              const coordinates: { coordinates: string }[] = await withRetry(
                () =>
                  prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`,
                `Fetch coordinates for location ${property.location.id}`
              );

              if (coordinates && coordinates[0] && coordinates[0].coordinates) {
                const geoJSON = wktToGeoJSON(coordinates[0].coordinates);
                if (geoJSON && geoJSON.coordinates) {
                  longitude = geoJSON.coordinates[0] || 0;
                  latitude = geoJSON.coordinates[1] || 0;
                }
              }
            } catch (coordError) {
              console.error(
                `Error converting coordinates for property ${property.id}:`,
                coordError
              );
              // Use default coordinates (0,0) if conversion fails
            }

            return {
              ...property,
              photoUrls,
              images,
              location: {
                ...property.location,
                coordinates: {
                  longitude,
                  latitude,
                },
              },
            };
          } catch (propertyError) {
            console.error(
              `Error processing property ${property.id}:`,
              propertyError
            );
            // Return property with minimal location data to prevent entire query failure
            return {
              ...property,
              photoUrls: Array.isArray(property.photoUrls)
                ? property.photoUrls
                : [],
              images: Array.isArray(property.images) ? property.images : [],
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

      res.json(propertiesWithFormattedLocation);
    } catch (processingError) {
      console.error('Error processing property data:', processingError);
      // Return raw properties as fallback with minimal formatting
      const safeProperties = properties.map((p) => ({
        ...p,
        photoUrls: Array.isArray(p.photoUrls) ? p.photoUrls : [],
        images: Array.isArray(p.images) ? p.images : [],
        location: p.location || { coordinates: { longitude: 0, latitude: 0 } },
      }));
      res.json(safeProperties);
    }
  } catch (err: any) {
    console.error('Error retrieving manager properties:', err);
    res.status(500).json({
      message: `Error retrieving manager properties: ${err.message}`,
      error: err.code || 'unknown_error',
    });
  }
};
