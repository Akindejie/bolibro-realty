import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Handles Prisma errors and returns appropriate HTTP responses
 * @param res Express response object
 * @param error The error object
 * @param operation Optional name of the operation that failed
 */
export function handlePrismaError(
  res: Response,
  error: any,
  operation?: string
): void {
  console.error(`Prisma error${operation ? ` in ${operation}` : ''}:`, error);

  // Import error classes from Prisma namespace
  const PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;
  const PrismaClientValidationError = Prisma.PrismaClientValidationError;
  const PrismaClientInitializationError =
    Prisma.PrismaClientInitializationError;

  if (error instanceof PrismaClientKnownRequestError) {
    // The .code property can be accessed in a type-safe manner
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        res.status(409).json({
          message: 'A record with this information already exists',
          details: error.meta?.target || error.message,
        });
        break;
      case 'P2025': // Record not found
        res.status(404).json({
          message: 'Record not found',
          details: error.meta?.cause || error.message,
        });
        break;
      case 'P2003': // Foreign key constraint violation
        res.status(400).json({
          message: 'Invalid relation',
          details: error.meta?.field_name || error.message,
        });
        break;
      default:
        res.status(500).json({
          message: 'Database error',
          code: error.code,
          details: error.message,
        });
    }
  } else if (error instanceof PrismaClientValidationError) {
    // Invalid model field provided
    res.status(400).json({
      message: 'Invalid data provided',
      details: error.message,
    });
  } else if (error instanceof PrismaClientInitializationError) {
    // Database connection error
    res.status(503).json({
      message: 'Database connection error',
      details: 'The server is having trouble connecting to the database',
    });
  } else {
    // Unexpected error
    res.status(500).json({
      message: 'An unexpected error occurred',
      details: error.message || 'Unknown error',
    });
  }
}
