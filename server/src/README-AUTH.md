# Authentication System Documentation

## Overview

This application uses Supabase for authentication and user management. The backend API is implemented using Express.js, and user data is stored in a PostgreSQL database via Prisma ORM.

## Migration from AWS Cognito to Supabase

This project was originally built using AWS Cognito for authentication but has been migrated to Supabase Auth. We have updated our schema and codebase to use `supabaseId` consistently instead of `cognitoId` to reflect this change.

## Database Schema

The database now uses these column names:

- `supabaseId` in the `Manager` and `Tenant` tables
- `managerSupabaseId` in the `Property` table
- `tenantSupabaseId` in the `Lease` and `Application` tables

These column names clearly indicate that they store **Supabase user IDs**.

## Authentication Flow

1. **Client-side Authentication**:

   - The client application uses Supabase's JavaScript SDK to handle user registration, login, and session management.
   - Upon successful authentication, Supabase provides a JWT token.

2. **API Authentication**:

   - The client includes the Supabase JWT in the Authorization header of API requests.
   - The server's `authMiddleware` verifies the token using Supabase's auth API.
   - User ID and role are extracted from the verified token and stored in `req.user`.

3. **Authorization**:
   - Route-level middleware checks if the user has the required role.
   - Controller-level checks verify that users can only access their own data.

## Code Structure

- **Middleware**: `authMiddleware.ts` handles token verification and role-based access control.
- **Types**: `authenticatedRequest.ts` defines the type for requests with authenticated users.
- **Controllers**: Handle business logic and include security checks to ensure users can only access appropriate data.
- **Routes**: Apply authentication middleware to protected endpoints.

## Important Considerations for Developers

1. **Column Naming**: When referencing user IDs in database queries, use the `supabaseId` field name (or `managerSupabaseId`, `tenantSupabaseId` depending on the table).

2. **Parameter Naming**: In API routes and controller methods, we use `userId` as the parameter name for better semantic clarity, which maps to the `supabaseId` column in the database.

3. **Security Checks**: Always implement proper security checks in controllers:

   ```typescript
   // Example security check
   if (userRole !== 'tenant' || authUserId !== userId) {
     res.status(403).json({ message: 'Unauthorized access' });
     return;
   }
   ```

## Migration Notes

If you encounter any references to `cognitoId` in the codebase:

1. Replace `cognitoId` with `supabaseId`
2. Replace `managerCognitoId` with `managerSupabaseId`
3. Replace `tenantCognitoId` with `tenantSupabaseId`

After making these changes, be sure to regenerate your Prisma client to ensure type consistency:

```bash
npx prisma generate
```

If you need to update types for the frontend, you may need to run additional processes to generate updated types.

## Testing Authentication

When testing the API, ensure that:

1. Your request includes a valid Supabase JWT token in the Authorization header:
   ```
   Authorization: Bearer <supabase-jwt-token>
   ```
2. The user has the appropriate role for the endpoint being accessed.
3. For user-specific endpoints, the user ID in the URL matches the ID in the token.
