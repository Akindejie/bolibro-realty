import { Request, Response } from 'express';
import app from '../src/vercel';

export default async function handler(req: Request, res: Response) {
  // Let the Express app handle the request
  return app(req, res);
}
