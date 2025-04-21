import { Prisma } from '@prisma/client';

declare module '@prisma/client' {
  namespace Prisma {
    export const sql: any;
    export const join: any;
    export const empty: any;

    export class PrismaClientKnownRequestError extends Error {
      code: string;
      meta?: {
        target?: string;
        cause?: string;
        field_name?: string;
      };
    }

    export class PrismaClientValidationError extends Error {}
    export class PrismaClientInitializationError extends Error {}
  }
}
