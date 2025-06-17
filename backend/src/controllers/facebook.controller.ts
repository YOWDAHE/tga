import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const secret_key = process.env.FACEBOOK_APP_SECRET;

function validateSignature(signature, body) {
  const hmac = crypto.createHmac('sha256', secret_key!);
  const digest = hmac.update(JSON.stringify(body)).digest('hex');
  return `sha256=${digest}` === signature;
}

const getWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.query['hub.verify_token'] === secret_key) {
      res.status(200).json({
        message: 'News updated successfully',
        status: 'success',
        error: null,
        data: req.query['hub.challenge'],
      });
      return;
    }
    res.status(403).json({
      message: 'Failed to get facebook news',
      status: 'error',
      error: 'Invalid verify token',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get facebook news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const postWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    if (validateSignature(signature, req.body)) {
      res.status(200).json({
        message: 'News updated successfully',
        status: 'success',
        error: null,
        data: req.body.entry,
      });
      return;
    }
    res.status(403).json({
      message: 'Failed to get facebook news',
      status: 'error',
      error: 'Invalid verify token',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get facebook news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Implement your logic to get data by id here
  } catch (error) {
    next(error);
  }
};

const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Implement your logic to create data here
  } catch (error) {
    next(error);
  }
};

const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Implement your logic to update data here
  } catch (error) {
    next(error);
  }
};

const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Implement your logic to remove data here
  } catch (error) {
    next(error);
  }
};

export default { getWebhook, postWebhook, getById, create, update, remove };