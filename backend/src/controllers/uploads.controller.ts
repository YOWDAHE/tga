import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from '../types/api';
import { file_upload } from '../types/files';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.status(200).json({ message: 'GET uploads endpoint' });
  } catch (error) {
    next(error);
  }
};

const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.status(200).json({ message: `GET upload by idd: ${req.params.id}` });
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

    console.log("Reached here...")
    if (!req.file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }

    console.log('Received file:', req.file.originalname);
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'uploads' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      stream.end(req.file!.buffer);
    });

    res.status(201).json({
      message: "File uploaded successfully",
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    });
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
    res.status(200).json({ message: `UPDATE upload by id: ${req.params.id}` });
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
    const { id } = req.params;
    await cloudinary.uploader.destroy(id);
    res.status(200).json({ message: `Deleted upload with public_id: ${id}` });
  } catch (error) {
    next(error);
  }
};

export default { get, getById, create, update, remove };