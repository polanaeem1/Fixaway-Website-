import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res: Response, message: string, statusCode = 400, errors?: any) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

export const sendCreated = (res: Response, data: any, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};
