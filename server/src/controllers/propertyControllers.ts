import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { wktToGeoJSON } from '@terraformer/wkt';
import { S3Client } from '@aws-sdk/client-s3';
import { Location } from '@prisma/client';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import asyncHandler from 'express-async-handler';

// Define AuthenticatedRequest interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

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

    const properties = await prisma.$queryRaw(completeQuery);

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
      console.log(
        `Get property ${id}: photoUrls=${
          property.photoUrls?.length || 0
        }, images=${property.images?.length || 0}`
      );

      const coordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

      const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || '');
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      const propertyWithCoordinates = {
        ...property,
        photoUrls: property.photoUrls || [],
        images: property.images || [],
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

export const createProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const {
      address,
      city,
      state,
      country,
      postalCode,
      managerCognitoId,
      ...propertyData
    } = req.body;

    const photoUrls = await Promise.all(
      files.map(async (file) => {
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: `properties/${Date.now()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const uploadResult = await new Upload({
          client: s3Client,
          params: uploadParams,
        }).done();

        return uploadResult.Location;
      })
    );

    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
      {
        street: address,
        city,
        country,
        postalcode: postalCode,
        format: 'json',
        limit: '1',
      }
    ).toString()}`;
    const geocodingResponse = await axios.get(geocodingUrl, {
      headers: {
        'User-Agent': 'Bolibro-Rentals (bolibro623@gmail.com',
      },
    });
    const [longitude, latitude] =
      geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
        ? [
            parseFloat(geocodingResponse.data[0]?.lon),
            parseFloat(geocodingResponse.data[0]?.lat),
          ]
        : [0, 0];

    // create location
    const [location] = await prisma.$queryRaw<Location[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
    `;

    // create property
    const newProperty = await prisma.property.create({
      data: {
        ...propertyData,
        photoUrls,
        locationId: location.id,
        managerCognitoId,
        amenities:
          typeof propertyData.amenities === 'string'
            ? propertyData.amenities.split(',')
            : [],
        highlights:
          typeof propertyData.highlights === 'string'
            ? propertyData.highlights.split(',')
            : [],
        isPetsAllowed: propertyData.isPetsAllowed === 'true',
        isParkingIncluded: propertyData.isParkingIncluded === 'true',
        pricePerMonth: parseFloat(propertyData.pricePerMonth),
        securityDeposit: parseFloat(propertyData.securityDeposit),
        applicationFee: parseFloat(propertyData.applicationFee),
        beds: parseInt(propertyData.beds),
        baths: parseFloat(propertyData.baths),
        squareFeet: parseInt(propertyData.squareFeet),
      },
      include: {
        location: true,
        manager: true,
      },
    });

    res.status(201).json(newProperty);
  } catch (err: any) {
    console.error('Error creating property:', err); //I added this to check s3 error
    console.error('Error stack:', err.stack);
    res
      .status(500)
      .json({ message: `Error creating property: ${err.message}` });
  }
};

export const deleteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id);
    const managerCognitoId = req.user?.id;

    if (!managerCognitoId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // First check if the property exists and belongs to the manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerCognitoId,
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

export const updateProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id);
    const managerCognitoId = req.user?.id;
    const files = req.files as Express.Multer.File[];
    const { address, city, state, country, postalCode, ...propertyData } =
      req.body;

    console.log('Update property request:', {
      propertyId,
      managerCognitoId,
      files: files?.length || 0,
      requestBody: JSON.stringify(req.body, null, 2),
    });

    if (!managerCognitoId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // First check if the property exists and belongs to the manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerCognitoId,
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

    console.log('Found property:', {
      id: property.id,
      name: property.name,
      amenities: property.amenities,
      highlights: property.highlights,
    });

    // Get existing coordinates
    const coordinates: { coordinates: string }[] =
      await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

    const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || '');
    const existingLongitude = geoJSON.coordinates[0];
    const existingLatitude = geoJSON.coordinates[1];

    // Process new photos if provided
    let photoUrls = property.photoUrls as string[];

    if (files && files.length > 0) {
      console.log(`Processing ${files.length} uploaded files`);

      try {
        const newPhotoUrls = await Promise.all(
          files.map(async (file) => {
            const uploadParams = {
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: `properties/${Date.now()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };

            const uploadResult = await new Upload({
              client: s3Client,
              params: uploadParams,
            }).done();

            return uploadResult.Location;
          })
        );

        // Combine existing photos with new ones
        photoUrls = [...photoUrls, ...newPhotoUrls] as string[];
        console.log(
          `Updated photoUrls array (${photoUrls.length} total images)`
        );
      } catch (uploadError) {
        console.error('Error uploading photos:', uploadError);
        res.status(500).json({ message: 'Error uploading photos' });
        return;
      }
    }

    // Update location if address details are provided
    if (address && city && state && country && postalCode) {
      console.log('Updating location data with:', {
        address,
        city,
        state,
        country,
        postalCode,
      });
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
            'User-Agent': 'Bolibro-Rentals (bolibro623@gmail.com)',
          },
        });

        const [longitude, latitude] =
          geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
            ? [
                parseFloat(geocodingResponse.data[0]?.lon),
                parseFloat(geocodingResponse.data[0]?.lat),
              ]
            : [existingLongitude, existingLatitude];

        console.log('Location coordinates:', { longitude, latitude });

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
        console.log('Location updated successfully');
      } catch (locationError) {
        console.error('Error updating location:', locationError);
        // Continue with other updates even if location update fails
      }
    }

    // Handle amenities and highlights
    let amenities = property.amenities || [];
    let highlights = property.highlights || [];

    // Log incoming values for debugging
    console.log('Incoming amenities (raw):', propertyData.amenities);
    console.log('Incoming amenities (type):', typeof propertyData.amenities);
    console.log('Incoming highlights (raw):', propertyData.highlights);
    console.log('Incoming highlights (type):', typeof propertyData.highlights);

    // Try to parse amenities if provided
    if (propertyData.amenities !== undefined) {
      try {
        if (typeof propertyData.amenities === 'string') {
          // Try to parse as JSON first (this handles arrays sent as JSON strings)
          try {
            const parsedAmenities = JSON.parse(propertyData.amenities);
            if (Array.isArray(parsedAmenities)) {
              amenities = parsedAmenities;
              console.log('Successfully parsed amenities from JSON string');
            } else {
              console.log(
                'Parsed amenities is not an array, using as single value'
              );
              amenities = [propertyData.amenities];
            }
          } catch (jsonError) {
            // Not valid JSON, handle as comma-separated string
            if (propertyData.amenities.includes(',')) {
              amenities = propertyData.amenities.split(',').filter(Boolean);
              console.log('Parsed amenities from comma-separated string');
            } else if (propertyData.amenities.trim()) {
              amenities = [propertyData.amenities.trim()];
              console.log('Using amenities as single string value');
            } else {
              amenities = [];
              console.log('Empty amenities string, using empty array');
            }
          }
        } else if (Array.isArray(propertyData.amenities)) {
          amenities = propertyData.amenities;
          console.log('Using amenities directly as array');
        }
      } catch (e) {
        console.error('Error parsing amenities:', e);
        // Fallback to existing values
        amenities = property.amenities || [];
        console.log('Using existing amenities due to parsing error');
      }
    } else {
      console.log('No amenities provided, keeping existing values');
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
              console.log('Successfully parsed highlights from JSON string');
            } else {
              console.log(
                'Parsed highlights is not an array, using as single value'
              );
              highlights = [propertyData.highlights];
            }
          } catch (jsonError) {
            // Not valid JSON, handle as comma-separated string
            if (propertyData.highlights.includes(',')) {
              highlights = propertyData.highlights.split(',').filter(Boolean);
              console.log('Parsed highlights from comma-separated string');
            } else if (propertyData.highlights.trim()) {
              highlights = [propertyData.highlights.trim()];
              console.log('Using highlights as single string value');
            } else {
              highlights = [];
              console.log('Empty highlights string, using empty array');
            }
          }
        } else if (Array.isArray(propertyData.highlights)) {
          highlights = propertyData.highlights;
          console.log('Using highlights directly as array');
        }
      } catch (e) {
        console.error('Error parsing highlights:', e);
        // Fallback to existing values
        highlights = property.highlights || [];
        console.log('Using existing highlights due to parsing error');
      }
    } else {
      console.log('No highlights provided, keeping existing values');
    }

    // Log processed values
    console.log('Processed amenities:', amenities);
    console.log('Processed highlights:', highlights);

    // Prepare update data with type conversions
    const updateData = {
      name: propertyData.name || property.name,
      description: propertyData.description || property.description,
      photoUrls,
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
      beds: propertyData.beds ? parseInt(propertyData.beds) : property.beds,
      baths: propertyData.baths
        ? parseFloat(propertyData.baths)
        : property.baths,
      squareFeet: propertyData.squareFeet
        ? parseInt(propertyData.squareFeet)
        : property.squareFeet,
      propertyType: propertyData.propertyType || property.propertyType,
    };

    console.log(
      'Update data prepared:',
      JSON.stringify(
        {
          ...updateData,
          photoUrls: updateData.photoUrls?.length || 0,
          amenities: updateData.amenities,
          highlights: updateData.highlights,
        },
        null,
        2
      )
    );

    // Update the property
    try {
      const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
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

      console.log('Property updated successfully:', propertyId);
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

export const updatePropertyStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const propertyId = parseInt(req.params.id);
    const { status } = req.body;
    const managerCognitoId = req.user?.id;

    if (!managerCognitoId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // First check if the property exists and belongs to the manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerCognitoId,
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
        id: propertyId,
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
    const managerCognitoId = req.user?.id;

    if (!managerCognitoId) {
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
        managerCognitoId,
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

export const uploadPropertyImages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Access authenticated user from the request
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: { manager: true },
    });

    // Check if property exists
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Ensure property belongs to authenticated user
    if (property.manager.cognitoId !== userId) {
      res.status(403);
      throw new Error('Not authorized to update this property');
    }

    // Handle files from multer middleware
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400);
      throw new Error('No images provided');
    }

    try {
      // Process multiple files
      const imageUrls = await Promise.all(
        files.map(async (file) => {
          // Convert buffer to base64 string for demonstration
          // In production, use a service like AWS S3, Cloudinary, etc.
          const base64Image = file.buffer.toString('base64');
          const imageUrl = `data:${file.mimetype};base64,${base64Image}`;

          // In a real environment, you'd upload to a storage service and get a URL
          // const imageUrl = await uploadToStorageService(file.buffer);

          return imageUrl;
        })
      );

      // Update property with new image URLs
      const updatedProperty = await prisma.property.update({
        where: { id: Number(id) },
        data: {
          images: {
            push: imageUrls,
          },
        },
      });

      res.status(200).json({ imageUrls });
    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500);
      throw new Error('Failed to upload images');
    }
  }
);

export const updatePropertyImages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Access authenticated user from the request
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const { id } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images)) {
      res.status(400);
      throw new Error('Images must be an array of URLs');
    }

    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: { manager: true },
    });

    // Check if property exists
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Ensure property belongs to authenticated user
    if (property.manager.cognitoId !== userId) {
      res.status(403);
      throw new Error('Not authorized to update this property');
    }

    // Update property with new image array
    const updatedProperty = await prisma.property.update({
      where: { id: Number(id) },
      data: {
        images,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedProperty,
    });
  }
);

// Add getPropertyLeases endpoint if it's missing
export const getPropertyLeases = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const propertyId = Number(id);

    const leases = await prisma.lease.findMany({
      where: { propertyId },
      include: {
        tenant: true,
      },
    });

    res.status(200).json(leases);
  }
);
