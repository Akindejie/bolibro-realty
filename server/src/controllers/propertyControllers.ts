import { Request, Response } from 'express';
import { PrismaClient, Prisma, Location } from '@prisma/client';
// @ts-ignore
const { wktToGeoJSON } = require('@terraformer/wkt');
import axios from 'axios';
import asyncHandler from 'express-async-handler';
import { supabase, SUPABASE_BUCKETS } from '../config/supabase';
import { uploadFile } from '../utils/fileUpload';

// Define AuthenticatedRequest interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const prisma = new PrismaClient();

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
    console.log(`Getting property with ID: ${id}`);

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

      console.log(
        'Property data from database:',
        JSON.stringify({
          id: property.id,
          photoUrls: property.photoUrls,
          images: property.images,
          photoUrlsType: property.photoUrls
            ? typeof property.photoUrls
            : 'undefined',
          imagesType: property.images ? typeof property.images : 'undefined',
          photoUrlsIsArray: Array.isArray(property.photoUrls),
          imagesIsArray: Array.isArray(property.images),
        })
      );

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

      console.log(
        'Sending property response with images:',
        propertyWithCoordinates.images?.length || 0,
        'photoUrls:',
        propertyWithCoordinates.photoUrls?.length || 0
      );

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

export const createProperty = async (req: Request, res: Response) => {
  try {
    // Log user authentication details to diagnose authentication issues
    console.log('Authentication details:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization
        ? `${req.headers.authorization.substring(0, 15)}...`
        : 'None',
    });

    const {
      name,
      description,
      type,
      bedrooms,
      bathrooms,
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
    } = req.body;

    // Log incoming data for debugging
    console.log('Creating property with data:', {
      name,
      type,
      bedrooms,
      city,
      managerId,
      hasImages:
        !!req.files && Array.isArray(req.files) && req.files.length > 0,
      imageCount: req.files && Array.isArray(req.files) ? req.files.length : 0,
      imagesFromJson: images
        ? typeof images === 'string'
          ? JSON.parse(images).length
          : images.length
        : 0,
      amenities: typeof amenities === 'string' ? amenities : 'non-string',
      highlights: typeof highlights === 'string' ? highlights : 'non-string',
    });

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
          console.log('Using amenities as string value(s):', parsedAmenities);
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
          console.log('Using highlights as string value(s):', parsedHighlights);
        }
      } else if (Array.isArray(highlights)) {
        parsedHighlights = highlights;
      }
    } catch (error) {
      console.error('Failed to parse highlights:', error);
      parsedHighlights = [];
    }

    // Get location coordinates from the address
    let latitude = 0;
    let longitude = 0;

    if (address && city) {
      try {
        const addressString = `${address}, ${city}, ${state || ''} ${
          postalCode || ''
        }, ${country || 'USA'}`;
        console.log('Geocoding address:', addressString);

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressString
        )}`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'BolibrosRental/1.0',
          },
        });

        if (response.data && response.data.length > 0) {
          latitude = parseFloat(response.data[0].lat);
          longitude = parseFloat(response.data[0].lon);
          console.log('Found coordinates:', { latitude, longitude });
        } else {
          console.warn('No coordinates found for the address');
        }
      } catch (error) {
        console.error('Error getting location coordinates:', error);
      }
    }

    // Process uploaded photos
    const photoUrls: string[] = [];
    const uploadedImages: string[] = [];

    // First, process files uploaded through FormData
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded photos`);

      const uploadPromises = req.files.map(async (file) => {
        // Try different bucket names if needed
        const bucketNamesToTry = [
          SUPABASE_BUCKETS.PROPERTY_IMAGES,
          'property-images',
        ];

        let uploadedUrl = null;

        for (const bucketName of bucketNamesToTry) {
          try {
            console.log(`Attempting upload to bucket: "${bucketName}"`);
            // Create a unique filename
            const fileName = `${Date.now()}-${file.originalname.replace(
              /\s+/g,
              '_'
            )}`;
            const filePath = `properties/${fileName}`;

            const { data, error } = await supabase.storage
              .from(bucketName)
              .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
              });

            if (error) {
              console.log(`Upload to "${bucketName}" failed:`, error.message);
              continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);

            uploadedUrl = urlData.publicUrl;
            console.log(
              `Successfully uploaded to bucket "${bucketName}"`,
              uploadedUrl
            );
            break;
          } catch (err) {
            console.error(`Error trying bucket "${bucketName}":`, err);
          }
        }

        return uploadedUrl;
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((url) => url !== null);
      photoUrls.push(...successfulUploads);
      uploadedImages.push(...successfulUploads);

      console.log(
        `Successfully uploaded ${successfulUploads.length} of ${req.files.length} photos`
      );
    }

    // Second, process any images provided in JSON format (for sync from offline mode)
    let parsedImages = [];
    try {
      if (images) {
        if (typeof images === 'string') {
          parsedImages = JSON.parse(images);
        } else if (Array.isArray(images)) {
          parsedImages = images;
        }

        console.log(`Processing ${parsedImages.length} images from JSON data`);

        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          // Add the images from JSON to our arrays
          // These are already uploaded and have URLs
          photoUrls.push(...parsedImages);
          uploadedImages.push(...parsedImages);
        }
      }
    } catch (error) {
      console.error('Error processing images from JSON:', error);
    }

    // First create the location using raw SQL to handle PostGIS geography type
    const locationResult = await prisma.$queryRaw`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (
        ${address || ''},
        ${city || ''},
        ${state || ''},
        ${country || 'USA'},
        ${postalCode || ''},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      RETURNING id
    `;

    // Add type checking and error handling for locationResult
    if (
      !locationResult ||
      !Array.isArray(locationResult) ||
      locationResult.length === 0
    ) {
      throw new Error('Failed to create location: Invalid query result');
    }

    // Get the inserted location ID with type assertion
    const locationId = (locationResult as Array<{ id: number }>)[0].id;
    console.log(`Created location with ID: ${locationId}`);

    // Now create the property with the locationId
    const newProperty = await prisma.property.create({
      data: {
        name,
        description: description || '',
        propertyType:
          (type || 'Apartment').charAt(0).toUpperCase() +
          (type || 'Apartment').slice(1).toLowerCase(),
        beds: parseInt(bedrooms) || 1,
        baths: parseFloat(bathrooms) || 1,
        squareFeet: parseFloat(area) || 0,
        pricePerMonth: parseFloat(price) || 0,
        securityDeposit: 0, // Default value
        applicationFee: 0, // Default value
        photoUrls,
        images: uploadedImages,
        amenities: parsedAmenities || [],
        highlights: parsedHighlights || [],
        location: {
          connect: {
            id: locationId,
          },
        },
        manager: {
          connect: {
            cognitoId: req.user?.id || '',
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

    console.log('Property created successfully:', {
      id: newProperty.id,
      name: newProperty.name,
      photoCount: newProperty.photoUrls.length,
    });

    return res.status(201).json({
      success: true,
      property: newProperty,
    });
  } catch (error: any) {
    console.error('Error creating property:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message,
    });
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

export const updateProperty = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      const managerCognitoId = req.user?.id;
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const { address, city, state, country, postalCode, ...propertyData } =
        req.body;

      console.log('Update property request:', {
        propertyId,
        managerCognitoId,
        files: files?.photos?.length || 0,
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

      // Handle file uploads
      let newPhotoUrls: string[] = [];
      if (files && files.photos && Array.isArray(files.photos)) {
        const uploadPromises = files.photos.map((photo) => {
          return uploadFile(photo, 'properties');
        });

        const results = await Promise.all(uploadPromises);
        newPhotoUrls = results.filter(Boolean) as string[];
      }

      // Add new photos to existing ones
      if (newPhotoUrls.length > 0) {
        propertyData.photoUrls = [
          ...(property.photoUrls || []),
          ...newPhotoUrls,
        ];
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
      console.log(
        'Incoming highlights (type):',
        typeof propertyData.highlights
      );

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

      // Synchronize images and photoUrls fields to ensure consistency
      const existingImages = property.images || [];
      const existingPhotoUrls = property.photoUrls || [];

      console.log('Existing image fields before sync:');
      console.log(`- images: ${existingImages.length} items`);
      console.log(`- photoUrls: ${existingPhotoUrls.length} items`);

      // Combine both arrays and remove duplicates
      const allImages = [
        ...new Set([...existingImages, ...existingPhotoUrls, ...newPhotoUrls]),
      ];
      console.log(`Combined unique images: ${allImages.length} items`);

      // Use the combined array for both fields
      const syncedImages = allImages;
      const syncedPhotoUrls = allImages;

      console.log('Using synchronized image arrays for both fields');

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
            images: updateData.images?.length || 0,
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
  }
);

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

export const uploadPropertyImage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const propertyIdParam = req.params.id;
      const { id: managerCognitoId } = req.user || {};

      // Check if this is a temporary ID for a new property
      const isTemporaryId = propertyIdParam.startsWith('new-');
      const propertyId = isTemporaryId
        ? propertyIdParam
        : Number(propertyIdParam);

      console.log(
        `Starting image upload for property ${propertyId} by manager ${managerCognitoId} (Temporary ID: ${isTemporaryId})`
      );

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

      // Check supabase URL
      const supabaseUrl = process.env.SUPABASE_URL;
      console.log('Using Supabase URL:', supabaseUrl.substring(0, 20) + '...');

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

        console.log(
          'Available Supabase buckets:',
          buckets.map((b) => b.name).join(', ')
        );
        console.log('Looking for bucket:', SUPABASE_BUCKETS.PROPERTY_IMAGES);
        console.log(
          'Bucket name type:',
          typeof SUPABASE_BUCKETS.PROPERTY_IMAGES
        );
        console.log(
          'Bucket name length:',
          SUPABASE_BUCKETS.PROPERTY_IMAGES.length
        );

        // Debug each bucket
        buckets.forEach((bucket) => {
          console.log(
            `Bucket "${bucket.name}" - matches our bucket: ${
              bucket.name === SUPABASE_BUCKETS.PROPERTY_IMAGES
            }`
          );
        });

        const propertyImagesBucket = buckets.find(
          (b) => b.name === SUPABASE_BUCKETS.PROPERTY_IMAGES
        );

        if (!propertyImagesBucket) {
          console.error(
            `Bucket "${SUPABASE_BUCKETS.PROPERTY_IMAGES}" not found in Supabase`
          );
          console.error(
            'Available buckets:',
            buckets.map((b) => b.name).join(', ')
          );

          // Try to create the bucket automatically
          try {
            console.log(
              `Attempting to create missing bucket "${SUPABASE_BUCKETS.PROPERTY_IMAGES}"...`
            );
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
            } else {
              console.log(
                `Successfully created bucket "${SUPABASE_BUCKETS.PROPERTY_IMAGES}"`
              );
            }
          } catch (createErr: any) {
            console.error(`Error creating bucket: ${createErr.message}`);
            res.status(500).json({
              message: `Failed to create required bucket: ${SUPABASE_BUCKETS.PROPERTY_IMAGES}`,
              error: createErr.message,
            });
            return;
          }
        } else {
          console.log(
            `Found bucket "${SUPABASE_BUCKETS.PROPERTY_IMAGES}" - continuing with upload`
          );
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
        console.log('No files found in request');
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        res.status(400).json({ message: 'No files uploaded' });
        return;
      }

      console.log(
        `Processing ${imagesToUpload.length} images for property ${propertyId}`
      );

      // Log the first file details for debugging
      if (imagesToUpload.length > 0) {
        const firstFile = imagesToUpload[0];
        console.log('First file details:');
        console.log('- Filename:', firstFile.originalname);
        console.log('- Size:', firstFile.size);
        console.log('- MIME type:', firstFile.mimetype);
        console.log(
          '- Buffer length:',
          firstFile.buffer?.length || 'No buffer'
        );

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
              managerCognitoId,
            },
            select: {
              id: true,
              managerCognitoId: true,
              images: true,
            },
          });

          if (!property) {
            console.log(
              `Property ${propertyId} not found or not owned by manager ${managerCognitoId}`
            );
            res.status(404).json({
              message:
                'Property not found or you do not have permission to update it',
            });
            return;
          }

          console.log(
            `Found property. Current images length: ${
              property.images?.length || 0
            }`
          );

          existingImages = property.images || [];
        } else {
          console.log(
            `Using temporary ID ${propertyId} for new property images`
          );
        }

        // Try different bucket names if the main one fails
        const tryBucketUpload = async (
          file: Express.Multer.File,
          fileName: string,
          bucketNames: string[]
        ) => {
          for (const bucketName of bucketNames) {
            console.log(`Trying upload to bucket: "${bucketName}"`);

            try {
              const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file.buffer, {
                  contentType: file.mimetype,
                  upsert: true,
                });

              if (error) {
                console.log(`Upload to "${bucketName}" failed:`, error);
                continue; // Try next bucket
              }

              // Success, get URL
              console.log(`Upload to "${bucketName}" successful!`);
              const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

              return urlData.publicUrl;
            } catch (uploadError) {
              console.error(`Error uploading to "${bucketName}":`, uploadError);
            }
          }

          return null; // All buckets failed
        };

        // Define fallback bucket names to try in order
        const bucketNamesToTry = [
          SUPABASE_BUCKETS.PROPERTY_IMAGES,
          'property-images',
          'Property Images',
        ];

        // Upload files with bucket fallback
        const uploadPromises = imagesToUpload.map(async (file, index) => {
          try {
            const timestamp = Date.now();
            const safeFilename = file.originalname.replace(
              /[^a-zA-Z0-9.-]/g,
              '_'
            );
            // Use a special folder for temporary IDs
            const folderPrefix = isTemporaryId ? 'temp' : propertyId;
            const fileName = `${folderPrefix}/${timestamp}-${safeFilename}`;

            console.log(`Uploading file ${index + 1}/${imagesToUpload.length}`);

            // Try upload with bucket fallbacks
            const fileUrl = await tryBucketUpload(
              file,
              fileName,
              bucketNamesToTry
            );

            if (fileUrl) {
              return fileUrl;
            }

            console.error(
              `All bucket upload attempts failed for file ${index + 1}`
            );
            return null;
          } catch (error) {
            console.error(`Error processing file ${index + 1}:`, error);
            return null;
          }
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(Boolean) as string[];

        console.log(
          `Upload results: ${results.length} total, ${successfulUploads.length} successful`
        );

        if (successfulUploads.length === 0) {
          console.error('Failed to upload any images');
          res.status(500).json({
            message: 'Failed to upload any images',
            totalAttempted: results.length,
          });
          return;
        }

        // For temporary IDs, we don't update the database, we just return the URLs
        if (isTemporaryId) {
          console.log('Returning uploaded image URLs for new property');
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

        console.log(
          `Updating property with ${updatedImages.length} images (${existingImages.length} existing + ${successfulUploads.length} new)`
        );

        await prisma.property.update({
          where: { id: Number(propertyId) },
          data: {
            images: updatedImages,
          },
        });

        console.log('Property updated successfully with new images');

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

    // Get current images to identify deleted ones
    const currentImages = property.images || [];

    // Find deleted images to remove from storage
    const deletedImages = currentImages.filter((url) => !images.includes(url));

    console.log(
      `Found ${deletedImages.length} images to delete:`,
      deletedImages
    );

    // Remove deleted files from Supabase storage
    if (deletedImages.length > 0) {
      try {
        // Extract paths from URLs
        const deletedPaths = deletedImages
          .map((url) => {
            // Extract the path after the bucket name in the URL
            try {
              const urlObj = new URL(url);
              // Properly encode the bucket name for URL comparison
              const bucketName = encodeURIComponent(
                SUPABASE_BUCKETS.PROPERTY_IMAGES
              );
              // Handle both encoded and unencoded bucket names in the URL
              const encodedPathRegex = new RegExp(`/${bucketName}/(.+)$`);
              const unencodedPathRegex = new RegExp(
                `/${SUPABASE_BUCKETS.PROPERTY_IMAGES.replace(
                  / /g,
                  '%20'
                )}/(.+)$`
              );

              let pathMatch = urlObj.pathname.match(encodedPathRegex);
              if (!pathMatch) {
                pathMatch = urlObj.pathname.match(unencodedPathRegex);
              }

              const path = pathMatch ? pathMatch[1] : null;
              console.log(`Extracting path from URL ${url} -> ${path}`);
              return path;
            } catch (urlError) {
              console.error(`Error parsing URL ${url}:`, urlError);
              return null;
            }
          })
          .filter(Boolean) as string[];

        console.log(
          `Extracted ${deletedPaths.length} valid paths for deletion:`,
          deletedPaths
        );

        if (deletedPaths.length > 0) {
          console.log(
            `Attempting to delete ${deletedPaths.length} files from ${SUPABASE_BUCKETS.PROPERTY_IMAGES}`
          );
          const { error } = await supabase.storage
            .from(SUPABASE_BUCKETS.PROPERTY_IMAGES)
            .remove(deletedPaths);

          if (error) {
            console.warn('Error removing deleted images from storage:', error);
            // Continue with the update even if storage deletion fails
          } else {
            console.log('Successfully deleted files from storage');
          }
        }
      } catch (error) {
        console.warn('Error processing deleted images:', error);
        // Continue with the update even if storage deletion fails
      }
    }

    // Update property with new image array
    const updatedProperty = await prisma.property.update({
      where: { id: Number(id) },
      data: {
        images: images,
        photoUrls: images, // Keep both fields in sync
      },
    });

    console.log(`Updated property ${id} with ${images.length} images`);
    console.log('Both images and photoUrls fields have been synchronized');

    res.status(200).json({
      success: true,
      data: updatedProperty,
    });
  }
);

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
