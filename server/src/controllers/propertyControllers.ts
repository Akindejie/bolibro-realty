import { Request, Response } from 'express';
import { PrismaClient, Prisma, Location } from '@prisma/client';
// @ts-ignore
const { wktToGeoJSON } = require('@terraformer/wkt');
import axios from 'axios';
import asyncHandler from 'express-async-handler';
import { supabase, SUPABASE_BUCKETS } from '../config/supabase';
import { uploadPropertyImageToFolder } from '../utils/fileUpload';

// Define AuthenticatedRequest interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const prisma = new PrismaClient();

export const createProperty = async (req: Request, res: Response) => {
  try {
    const files = req.files;
    let allFilesToProcess: Express.Multer.File[] = [];

    if (files) {
      if (Array.isArray(files)) {
        allFilesToProcess = files;
      } else if (typeof files === 'object') {
        // Handle fields structure ({ photos: [...], images: [...] })
        if (files.photos && Array.isArray(files.photos)) {
          allFilesToProcess = [...allFilesToProcess, ...files.photos];
        }
        if (files.images && Array.isArray(files.images)) {
          allFilesToProcess = [...allFilesToProcess, ...files.images];
        }
      }
    }

    // Ensure we always have a name value (required by Prisma)
    const propertyName =
      req.body.name || `Property ${new Date().toLocaleString()}`;

    // Extract data from the request
    const {
      description,
      type,
      beds,
      baths,
      area,
      price,
      address,
      city,
      state,
      postalCode,
      country,
      amenities,
      highlights,
      managerId,
      images,
      // Get the fields with their alternative names as well
      pricePerMonth,
      squareFeet,
      securityDeposit,
      applicationFee,
      cleaningFee,
      isPetsAllowed,
      isParkingIncluded,
    } = req.body;

    // Make sure managerId is set - use either from body or from auth
    const effectiveManagerId = managerId || req.user?.id;

    if (!effectiveManagerId) {
      res.status(400).json({ message: 'Manager ID is required' });
      return;
    }

    const managerSupabaseId = req.body.supabaseId || effectiveManagerId;

    // Parse amenities - improved to handle both arrays, JSON strings, and single values
    let parsedAmenities = [];
    try {
      if (typeof amenities === 'string') {
        // Try JSON parsing first
        try {
          const jsonParsed = JSON.parse(amenities);
          parsedAmenities = Array.isArray(jsonParsed)
            ? jsonParsed
            : [jsonParsed];
        } catch (jsonError) {
          // If JSON parsing fails, it might be a comma-separated string or a single value
          if (amenities.includes(',')) {
            parsedAmenities = amenities
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);
          } else if (amenities.trim()) {
            parsedAmenities = [amenities.trim()];
          }
        }
      } else if (Array.isArray(amenities)) {
        parsedAmenities = amenities;
      }
    } catch (error) {
      console.error('Failed to parse amenities:', error);
      parsedAmenities = [];
    }

    // Parse highlights - improved to handle both arrays, JSON strings, and single values
    let parsedHighlights = [];
    try {
      if (typeof highlights === 'string') {
        // Try JSON parsing first
        try {
          const jsonParsed = JSON.parse(highlights);
          parsedHighlights = Array.isArray(jsonParsed)
            ? jsonParsed
            : [jsonParsed];
        } catch (jsonError) {
          // If JSON parsing fails, it might be a comma-separated string or a single value
          if (highlights.includes(',')) {
            parsedHighlights = highlights
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);
          } else if (highlights.trim()) {
            parsedHighlights = [highlights.trim()];
          }
        }
      } else if (Array.isArray(highlights)) {
        parsedHighlights = highlights;
      }
    } catch (error) {
      console.error('Failed to parse highlights:', error);
      parsedHighlights = [];
    }

    // First, process location
    const locationResult = await prisma.$queryRaw`
      INSERT INTO "Location" (address, city, state, "postalCode", country, coordinates)
      VALUES (
        ${address || ''},
        ${city || ''},
        ${state || ''},
        ${postalCode || ''},
        ${country || ''},
        ST_SetSRID(ST_MakePoint(0, 0), 4326)
      )
      RETURNING id;
    `;

    // Get the inserted location ID with type assertion
    const locationId = (locationResult as Array<{ id: number }>)[0].id;

    // Normalize property type (convert to title case for enum compatibility)
    let propertyTypeNormalized = 'Apartment'; // Default value
    if (type) {
      // First lowercase everything, then uppercase first letter
      propertyTypeNormalized = type.toLowerCase();
      propertyTypeNormalized =
        propertyTypeNormalized.charAt(0).toUpperCase() +
        propertyTypeNormalized.slice(1);
    }

    // Initialize arrays for image URLs
    let photoUrls: string[] = [];
    let uploadedImages: string[] = [];

    // Now create the property with the locationId
    const newProperty = await prisma.property.create({
      data: {
        name: propertyName,
        description: description || '',
        propertyType: propertyTypeNormalized as any,
        beds: parseInt(beds) || 1,
        baths: parseFloat(baths) || 1,
        squareFeet: parseFloat(squareFeet || area) || 0,
        pricePerMonth: parseFloat(pricePerMonth || price) || 0,
        securityDeposit: parseFloat(securityDeposit) || 500,
        applicationFee: parseFloat(applicationFee) || 100,
        cleaningFee: parseFloat(cleaningFee) || 0,
        isPetsAllowed:
          isPetsAllowed === 'true' || isPetsAllowed === true ? true : false,
        isParkingIncluded:
          isParkingIncluded === 'true' || isParkingIncluded === true
            ? true
            : false,
        photoUrls: [],
        images: [],
        amenities: parsedAmenities || [],
        highlights: parsedHighlights.map((h: string) => h as any) || [],
        location: {
          connect: {
            id: locationId,
          },
        },
        manager: {
          connect: {
            supabaseId: managerSupabaseId,
          },
        },
      },
      include: {
        location: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Now process files uploaded through FormData
    if (allFilesToProcess.length > 0) {
      // Now upload the images using the property ID for folder organization
      const uploadPromises = allFilesToProcess.map((file) =>
        uploadPropertyImageToFolder(file, newProperty.id)
      );

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((url) => url !== null);

      // Update the property with the image URLs
      if (successfulUploads.length > 0) {
        await prisma.property.update({
          where: { id: newProperty.id },
          data: {
            photoUrls: successfulUploads,
            images: successfulUploads,
          },
        });

        // Update our local variables to return in the response
        photoUrls = successfulUploads;
        uploadedImages = successfulUploads;
      }
    }

    // Handle additional images from JSON
    if (images) {
      try {
        const parsedImages =
          typeof images === 'string' ? JSON.parse(images) : images;
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          // Update the images in the database
          const allImages = [...uploadedImages, ...parsedImages];

          await prisma.property.update({
            where: { id: newProperty.id },
            data: {
              images: allImages,
              photoUrls: allImages,
            },
          });

          photoUrls = allImages;
          uploadedImages = allImages;
        }
      } catch (err) {
        console.error('Error processing images from JSON:', err);
      }
    }

    res.status(201).json({
      success: true,
      property: {
        ...newProperty,
        photoUrls,
        images: uploadedImages,
      },
    });
  } catch (error: any) {
    console.error('Error creating property:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: `Error creating property: ${error.message}`,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
  }
};

export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      favoriteIds,
      priceMin,
      priceMax,
      beds,
      baths,
      propertyType,
      squareFeetMin,
      squareFeetMax,
      amenities,
      availableFrom,
      latitude,
      longitude,
    } = req.query;

    let whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = (favoriteIds as string).split(',').map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
      );
    }

    if (priceMin) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`
      );
    }

    if (priceMax) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`
      );
    }

    if (beds && beds !== 'any') {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== 'any') {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }

    if (squareFeetMin) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
      );
    }

    if (squareFeetMax) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
      );
    }

    if (propertyType && propertyType !== 'any') {
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
      );
    }

    if (amenities && amenities !== 'any') {
      const amenitiesArray = (amenities as string).split(',');
      whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
    }

    if (availableFrom && availableFrom !== 'any') {
      const availableFromDate =
        typeof availableFrom === 'string' ? availableFrom : null;
      if (availableFromDate) {
        const date = new Date(availableFromDate);
        if (!isNaN(date.getTime())) {
          whereConditions.push(
            Prisma.sql`EXISTS (
              SELECT 1 FROM "Lease" l 
              WHERE l."propertyId" = p.id 
              AND l."startDate" <= ${date.toISOString()}
            )`
          );
        }
      }
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      // Only add the location filter if lat/lng are valid numbers
      if (!isNaN(lat) && !isNaN(lng)) {
        const radiusInKilometers = 1000;
        const degrees = radiusInKilometers / 111; // Converts kilometers to degrees

        whereConditions.push(
          Prisma.sql`ST_DWithin(
          l.coordinates::geometry,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${degrees}
        )`
        );
      }
    }

    const completeQuery = Prisma.sql`
      SELECT 
        p.*,
        json_build_object(
          'id', l.id,
          'address', l.address,
          'city', l.city,
          'state', l.state,
          'country', l.country,
          'postalCode', l."postalCode",
          'coordinates', json_build_object(
            'longitude', ST_X(l."coordinates"::geometry),
            'latitude', ST_Y(l."coordinates"::geometry)
          )
        ) as location
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      ${
        whereConditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
          : Prisma.empty
      }
    `;

    const properties = await prisma.$queryRaw<any[]>(completeQuery);

    res.json(properties);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving properties: ${error.message}` });
  }
};

export const getProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: {
        location: true,
      },
    });

    if (property) {
      const coordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

      const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || '');
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      // Ensure images and photoUrls are always arrays
      const propertyWithCoordinates = {
        ...property,
        photoUrls: Array.isArray(property.photoUrls) ? property.photoUrls : [],
        images: Array.isArray(property.images) ? property.images : [],
        location: {
          ...property.location,
          coordinates: {
            longitude,
            latitude,
          },
        },
      };

      res.json(propertyWithCoordinates);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (err: any) {
    console.error('Error retrieving property:', err);
    res
      .status(500)
      .json({ message: `Error retrieving property: ${err.message}` });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    const managerId = req.user?.id;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const { address, city, state, country, postalCode, ...propertyData } =
      req.body;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // First check if the property exists and belongs to the manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerId,
      },
      include: {
        location: true,
      },
    });

    if (!property) {
      res.status(404).json({
        message:
          'Property not found or you do not have permission to update it',
      });
      return;
    }

    // Get existing coordinates
    const coordinates: { coordinates: string }[] =
      await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

    const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || '');
    const existingLongitude = geoJSON.coordinates[0];
    const existingLatitude = geoJSON.coordinates[1];

    // Handle file uploads
    let newPhotoUrls: string[] = [];
    if (files && files.photos && Array.isArray(files.photos)) {
      // Use the property ID for folder organization
      const uploadPromises = files.photos.map((photo) => {
        return uploadPropertyImageToFolder(photo, propertyId);
      });

      const results = await Promise.all(uploadPromises);
      newPhotoUrls = results.filter(Boolean) as string[];
    }

    // Add new photos to existing ones
    if (newPhotoUrls.length > 0) {
      propertyData.photoUrls = [...(property.photoUrls || []), ...newPhotoUrls];
    }

    // Update location if address details are provided
    if (address && city && state && country && postalCode) {
      try {
        // Get coordinates from address using OpenStreetMap
        const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
          {
            street: address,
            city,
            state,
            country,
            postalcode: postalCode,
            format: 'json',
            limit: '1',
          }
        ).toString()}`;

        const geocodingResponse = await axios.get(geocodingUrl, {
          headers: {
            'User-Agent': 'Bolibro-Realty (bolibro623@gmail.com)',
          },
        });

        const [longitude, latitude] =
          geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
            ? [
                parseFloat(geocodingResponse.data[0]?.lon),
                parseFloat(geocodingResponse.data[0]?.lat),
              ]
            : [existingLongitude, existingLatitude];

        // Update the location
        await prisma.$queryRaw`
          UPDATE "Location"
          SET address = ${address}, 
              city = ${city}, 
              state = ${state}, 
              country = ${country}, 
              "postalCode" = ${postalCode},
              coordinates = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
          WHERE id = ${property.location.id}
        `;
      } catch (locationError) {
        console.error('Error updating location:', locationError);
        // Continue with other updates even if location update fails
      }
    }

    // Handle amenities and highlights
    let amenities = property.amenities || [];
    let highlights = property.highlights || [];

    // Try to parse amenities if provided
    if (propertyData.amenities !== undefined) {
      try {
        if (typeof propertyData.amenities === 'string') {
          // Try to parse as JSON first (this handles arrays sent as JSON strings)
          try {
            const parsedAmenities = JSON.parse(propertyData.amenities);
            if (Array.isArray(parsedAmenities)) {
              amenities = parsedAmenities;
            } else {
              amenities = [propertyData.amenities];
            }
          } catch (jsonError) {
            // Not valid JSON, handle as comma-separated string
            if (propertyData.amenities.includes(',')) {
              amenities = propertyData.amenities.split(',').filter(Boolean);
            } else if (propertyData.amenities.trim()) {
              amenities = [propertyData.amenities.trim()];
            } else {
              amenities = [];
            }
          }
        } else if (Array.isArray(propertyData.amenities)) {
          amenities = propertyData.amenities;
        }
      } catch (e) {
        console.error('Error parsing amenities:', e);
        // Fallback to existing values
        amenities = property.amenities || [];
      }
    }

    // Try to parse highlights if provided
    if (propertyData.highlights !== undefined) {
      try {
        if (typeof propertyData.highlights === 'string') {
          // Try to parse as JSON first (this handles arrays sent as JSON strings)
          try {
            const parsedHighlights = JSON.parse(propertyData.highlights);
            if (Array.isArray(parsedHighlights)) {
              highlights = parsedHighlights;
            } else {
              highlights = [propertyData.highlights];
            }
          } catch (jsonError) {
            // Not valid JSON, handle as comma-separated string
            if (propertyData.highlights.includes(',')) {
              highlights = propertyData.highlights.split(',').filter(Boolean);
            } else if (propertyData.highlights.trim()) {
              highlights = [propertyData.highlights.trim()];
            } else {
              highlights = [];
            }
          }
        } else if (Array.isArray(propertyData.highlights)) {
          highlights = propertyData.highlights;
        }
      } catch (e) {
        console.error('Error parsing highlights:', e);
        // Fallback to existing values
        highlights = property.highlights || [];
      }
    }

    // Synchronize images and photoUrls fields to ensure consistency
    const existingImages = property.images || [];
    const existingPhotoUrls = property.photoUrls || [];

    // Combine both arrays and remove duplicates
    const allImages = [
      ...new Set([...existingImages, ...existingPhotoUrls, ...newPhotoUrls]),
    ];

    // Use the combined array for both fields
    const syncedImages = allImages;
    const syncedPhotoUrls = allImages;

    // Prepare update data with type conversions
    const updateData = {
      name: propertyData.name || property.name,
      description: propertyData.description || property.description,
      photoUrls: syncedPhotoUrls,
      images: syncedImages,
      amenities,
      highlights,
      isPetsAllowed:
        propertyData.isPetsAllowed === 'true' ||
        propertyData.isPetsAllowed === true
          ? true
          : propertyData.isPetsAllowed === 'false' ||
            propertyData.isPetsAllowed === false
          ? false
          : property.isPetsAllowed,
      isParkingIncluded:
        propertyData.isParkingIncluded === 'true' ||
        propertyData.isParkingIncluded === true
          ? true
          : propertyData.isParkingIncluded === 'false' ||
            propertyData.isParkingIncluded === false
          ? false
          : property.isParkingIncluded,
      pricePerMonth: propertyData.pricePerMonth
        ? parseFloat(propertyData.pricePerMonth)
        : property.pricePerMonth,
      securityDeposit: propertyData.securityDeposit
        ? parseFloat(propertyData.securityDeposit)
        : property.securityDeposit,
      applicationFee: propertyData.applicationFee
        ? parseFloat(propertyData.applicationFee)
        : property.applicationFee,
      cleaningFee:
        propertyData.cleaningFee !== undefined
          ? parseFloat(propertyData.cleaningFee)
          : property.cleaningFee !== undefined
          ? property.cleaningFee
          : 0,
      beds: propertyData.beds ? parseInt(propertyData.beds) : property.beds,
      baths: propertyData.baths
        ? parseFloat(propertyData.baths)
        : property.baths,
      squareFeet: propertyData.squareFeet
        ? parseInt(propertyData.squareFeet)
        : property.squareFeet,
      propertyType: propertyData.propertyType || property.propertyType,
    };

    // Update the property
    try {
      const updatedProperty = await prisma.property.update({
        where: { id: Number(propertyId) },
        data: updateData,
        include: {
          location: true,
          manager: true,
        },
      });

      // Format location coordinates
      const updatedCoordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${updatedProperty.location.id}`;

      const updatedGeoJSON: any = wktToGeoJSON(
        updatedCoordinates[0]?.coordinates || ''
      );
      const updatedLongitude = updatedGeoJSON.coordinates[0];
      const updatedLatitude = updatedGeoJSON.coordinates[1];

      const propertyWithFormattedLocation = {
        ...updatedProperty,
        location: {
          ...updatedProperty.location,
          coordinates: {
            longitude: updatedLongitude,
            latitude: updatedLatitude,
          },
        },
      };

      res.json(propertyWithFormattedLocation);
    } catch (prismaError: any) {
      console.error('Prisma error updating property:', prismaError);
      res.status(400).json({
        message: `Error updating property in database: ${prismaError.message}`,
        details: prismaError.meta,
      });
    }
  } catch (err: any) {
    console.error('Error updating property:', err);
    console.error('Error stack:', err.stack);
    res
      .status(500)
      .json({ message: `Error updating property: ${err.message}` });
  }
};

export const deleteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id);
    const managerId = req.user?.id;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // First check if the property exists and belongs to the manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerId,
      },
    });

    if (!property) {
      res.status(404).json({
        message:
          'Property not found or you do not have permission to delete it',
      });
      return;
    }

    // Check if the property has active leases
    const activeLeases = await prisma.lease.findMany({
      where: {
        propertyId,
        endDate: {
          gte: new Date(),
        },
      },
    });

    if (activeLeases.length > 0) {
      res
        .status(400)
        .json({ message: 'Cannot delete property with active leases' });
      return;
    }

    // Delete the property
    await prisma.property.delete({
      where: {
        id: propertyId,
      },
    });

    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting property:', err);
    res
      .status(500)
      .json({ message: `Error deleting property: ${err.message}` });
  }
};

export const updatePropertyStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id);
    const { status } = req.body;
    const managerId = req.user?.id;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // First check if the property exists and belongs to the manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerId,
      },
    });

    if (!property) {
      res.status(404).json({
        message:
          'Property not found or you do not have permission to update it',
      });
      return;
    }

    // Update the property status
    const updatedProperty = await prisma.property.update({
      where: {
        id: Number(propertyId),
      },
      data: {
        status,
      },
    });

    res.status(200).json(updatedProperty);
  } catch (err: any) {
    console.error('Error updating property status:', err);
    res
      .status(500)
      .json({ message: `Error updating property status: ${err.message}` });
  }
};

export const updateBulkPropertyStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyIds, status } = req.body;
    const managerId = req.user?.id;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      res.status(400).json({ message: 'Property IDs array is required' });
      return;
    }

    // Check if all properties exist and belong to the manager
    const propertiesCount = await prisma.property.count({
      where: {
        id: {
          in: propertyIds.map((id) => Number(id)),
        },
        managerId,
      },
    });

    if (propertiesCount !== propertyIds.length) {
      res.status(403).json({
        message:
          'One or more properties were not found or you do not have permission to update them',
      });
      return;
    }

    // Update properties in a transaction for atomicity
    const updatedProperties = await prisma.$transaction(
      propertyIds.map((id) =>
        prisma.property.update({
          where: {
            id: Number(id),
          },
          data: {
            status,
          },
        })
      )
    );

    res.status(200).json({
      message: `Successfully updated ${updatedProperties.length} properties`,
      properties: updatedProperties,
    });
  } catch (err: any) {
    console.error('Error updating bulk property status:', err);
    res.status(500).json({
      message: `Error updating bulk property status: ${err.message}`,
    });
  }
};

export const uploadPropertyImage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const propertyIdParam = req.params.id;
      const { id: managerId } = req.user || {};

      // Check if this is a temporary ID for a new property
      const isTemporaryId = propertyIdParam.startsWith('new-');
      const propertyId = isTemporaryId
        ? propertyIdParam
        : Number(propertyIdParam);

      // Validate Supabase configuration
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error(
          'Supabase credentials are missing in environment variables'
        );
        res.status(500).json({
          message: 'Server configuration error: Missing Supabase credentials',
          details: {
            urlDefined: !!process.env.SUPABASE_URL,
            keyDefined: !!process.env.SUPABASE_SERVICE_KEY,
          },
        });
        return;
      }

      // Validate that the proper bucket exists
      try {
        const { data: buckets, error: bucketError } =
          await supabase.storage.listBuckets();

        if (bucketError) {
          console.error('Failed to list Supabase buckets:', bucketError);
          res.status(500).json({
            message: 'Failed to access Supabase storage',
            details: bucketError.message,
          });
          return;
        }

        const propertyImagesBucket = buckets.find(
          (b) => b.name === SUPABASE_BUCKETS.PROPERTY_IMAGES
        );

        if (!propertyImagesBucket) {
          console.error(
            `Bucket "${SUPABASE_BUCKETS.PROPERTY_IMAGES}" not found in Supabase`
          );

          // Try to create the bucket automatically
          try {
            const { error: createError } = await supabase.storage.createBucket(
              SUPABASE_BUCKETS.PROPERTY_IMAGES,
              {
                public: false,
                allowedMimeTypes: ['image/*'],
                fileSizeLimit: 10485760, // 10MB
              }
            );

            if (createError) {
              console.error(`Failed to create bucket: ${createError.message}`);

              // If we still can't create it, fail the request
              res.status(500).json({
                message: `Required storage bucket not found: ${SUPABASE_BUCKETS.PROPERTY_IMAGES}`,
                availableBuckets: buckets.map((b) => b.name),
                createError: createError.message,
              });
              return;
            }
          } catch (createErr: any) {
            console.error(`Error creating bucket: ${createErr.message}`);
            res.status(500).json({
              message: `Failed to create required bucket: ${SUPABASE_BUCKETS.PROPERTY_IMAGES}`,
              error: createErr.message,
            });
            return;
          }
        }
      } catch (bucketCheckError: any) {
        console.error('Error checking Supabase buckets:', bucketCheckError);
        res.status(500).json({
          message: 'Failed to verify Supabase storage configuration',
          details: bucketCheckError.message,
        });
        return;
      }

      // Get files from request
      const files = req.files as Express.Multer.File[];
      const imagesToUpload = Array.isArray(files) ? files : [];

      if (imagesToUpload.length === 0) {
        res.status(400).json({ message: 'No files uploaded' });
        return;
      }

      // Validate the first file
      if (imagesToUpload.length > 0) {
        const firstFile = imagesToUpload[0];

        // Validate file buffer
        if (!firstFile.buffer || firstFile.buffer.length === 0) {
          console.error('File buffer is empty or missing');
          res
            .status(400)
            .json({ message: 'Invalid file data: Buffer is empty or missing' });
          return;
        }
      }

      try {
        // For new properties, we don't need to find the property in the database
        let existingImages: string[] = [];

        // Only try to find the property if it's not a temporary ID
        if (!isTemporaryId) {
          const property = await prisma.property.findFirst({
            where: {
              id: propertyId as number,
              managerId,
            },
            select: {
              id: true,
              managerId: true,
              images: true,
            },
          });

          if (!property) {
            res.status(404).json({
              message:
                'Property not found or you do not have permission to update it',
            });
            return;
          }

          existingImages = property.images || [];
        }

        // Use the new utility function to upload images to property-specific folders
        const uploadResults = await Promise.all(
          imagesToUpload.map((file) =>
            uploadPropertyImageToFolder(file, propertyId)
          )
        );

        const successfulUploads = uploadResults.filter((url) => url !== null);

        // For temporary IDs, we don't update the database, we just return the URLs
        if (isTemporaryId) {
          res.status(200).json({
            success: true,
            imageUrls: successfulUploads,
            totalImages: successfulUploads.length,
            isTemporary: true,
          });
          return;
        }

        // Add new images to the property (for existing properties only)
        const updatedImages = [...existingImages, ...successfulUploads];

        await prisma.property.update({
          where: { id: Number(propertyId) },
          data: {
            images: updatedImages,
          },
        });

        res.status(200).json({
          success: true,
          imageUrls: successfulUploads,
          totalImages: updatedImages.length,
        });
      } catch (dbError: any) {
        console.error('Database error:', dbError.message || dbError);
        res.status(500).json({
          message: 'Database error during image upload',
          details: dbError.message,
        });
      }
    } catch (error: any) {
      console.error('Error in uploadPropertyImage controller:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        message: `Error uploading images: ${error.message}`,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      });
    }
  }
);

/**
 * Get all leases for a specific property
 * @route GET /api/properties/:id/leases
 * @access Private - Managers and tenants
 */
export const getPropertyLeases = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (isNaN(propertyId)) {
      res.status(400).json({ message: 'Invalid property ID' });
      return;
    }

    // Check if the property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        managerId: true,
      },
    });

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    // Verify authorization based on user role
    if (userRole === 'manager' && property.managerId !== userId) {
      res.status(403).json({
        message: 'You do not have permission to view leases for this property',
      });
      return;
    }

    // For tenants, we need to check if they have a lease for this property
    if (userRole === 'tenant') {
      const tenantLease = await prisma.lease.findFirst({
        where: {
          propertyId: propertyId,
          tenantId: userId,
        },
      });

      if (!tenantLease) {
        res.status(403).json({
          message:
            'You do not have permission to view leases for this property',
        });
        return;
      }
    }

    // Fetch leases for this property with related tenant information
    const leases = await prisma.lease.findMany({
      where: {
        propertyId: propertyId,
        // For tenants, only show their own lease
        ...(userRole === 'tenant' ? { tenantId: userId } : {}),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    res.status(200).json(leases);
  } catch (error: any) {
    console.error('Error fetching property leases:', error);
    res.status(500).json({
      message: 'Failed to fetch property leases',
      error: error.message,
    });
  }
};

/**
 * Get all payments for a specific property
 * @route GET /api/properties/:id/payments
 * @access Private - Managers and tenants
 */
export const getPropertyPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id, 10);

    if (isNaN(propertyId)) {
      res.status(400).json({ message: 'Invalid property ID' });
      return;
    }

    // First get all leases for this property
    const leases = await prisma.lease.findMany({
      where: {
        propertyId: propertyId,
      },
      select: {
        id: true,
      },
    });

    const leaseIds = leases.map((lease) => lease.id);

    // Now get all payments for these leases
    const payments = await prisma.payment.findMany({
      where: {
        leaseId: {
          in: leaseIds,
        },
      },
      include: {
        lease: {
          select: {
            id: true,
            propertyId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching property payments:', error);
    res.status(500).json({ message: 'Failed to fetch property payments' });
  }
};

/**
 * Update property images (rearrange or delete)
 * @route PUT /api/properties/:id/images
 * @access Private - Manager only
 */
export const updatePropertyImages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id, 10);
    const managerId = req.user?.id;
    const { images } = req.body;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!images || !Array.isArray(images)) {
      res.status(400).json({ message: 'Images array is required' });
      return;
    }

    // First check if the property exists and belongs to the manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerId,
      },
    });

    if (!property) {
      res.status(404).json({
        message:
          'Property not found or you do not have permission to update it',
      });
      return;
    }

    // Update the property with the new image URLs
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: images,
        photoUrls: images, // Keep both fields synchronized
      },
    });

    res.status(200).json({
      success: true,
      message: 'Property images updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating property images:', error);
    res.status(500).json({
      message: 'Failed to update property images',
      error: error.message,
    });
  }
};
