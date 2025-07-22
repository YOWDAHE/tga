import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { landing, stats, partners, practices, contactUsInfo, news_links, pageViews } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { logAudit } from './audit.controller';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET all landing data
const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  console.log('get landing data');
  try {
    
    
    // Then, fetch all the necessary data in parallel.
    const [landingData, statsData, partnersData, practicesData, contactUsData, newsLinksData] = await Promise.all([
      db.select().from(landing).limit(1),
      db.select().from(stats),
      db.select().from(partners),
      db.select().from(practices),
      db.select().from(contactUsInfo),
      db.select().from(news_links),
    ]);

    if (landingData.length > 0) {
      // Increment view count
      await db.update(landing)
        .set({ view_count: sql`${landing.view_count} + 1` })
        .where(eq(landing.id, landingData[0].id));
    }


    // Log the page view if landing data exists
    if (landingData && landingData.length > 0) {
      await db.insert(pageViews).values({
        page_type: 'landing',
        page_id: landingData[0].id,
        user_id: req.user?.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string,
      });
    }

    res.status(200).json({
      message: 'Landing page data fetched successfully',
      status: 'success',
      error: null,
      data: {
        landing: landingData[0] || null,
        stats: statsData,
        partners: partnersData,
        practices: practicesData,
        contactUs: contactUsData,
        newsLinks: newsLinksData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// CREATE landing, stats, partners, practices, and contact us info
const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { landing: landingData, stats: statsArr, partners: partnersArr, practices: practicesArr, contactUs: contactUsArr, newsLinks: newsLinksArr } = req.body;

    const [createdLanding] = await db.insert(landing).values(landingData).returning();
    await logAudit({
      tableName: 'landing',
      action: 'INSERT',
      description: 'Created landing page',
      oldData: null,
      newData: createdLanding,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    let createdStats: any[] = [];
    if (Array.isArray(statsArr)) {
      createdStats = await db.insert(stats).values(statsArr).returning();
      await logAudit({
        tableName: 'stats',
        action: 'INSERT',
        description: 'Created stats',
        oldData: null,
        newData: createdStats,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let createdPartners: any[] = [];
    if (Array.isArray(partnersArr)) {
      createdPartners = await db.insert(partners).values(partnersArr).returning();
      await logAudit({
        tableName: 'partners',
        action: 'INSERT',
        description: 'Created partners',
        oldData: null,
        newData: createdPartners,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let createdPractices: any[] = [];
    if (Array.isArray(practicesArr)) {
      createdPractices = await db.insert(practices).values(practicesArr).returning();
      await logAudit({
        tableName: 'practices',
        action: 'INSERT',
        description: 'Created practices',
        oldData: null,
        newData: createdPractices,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let createdContactUs: any[] = [];
    if (Array.isArray(contactUsArr)) {
      createdContactUs = await db.insert(contactUsInfo).values(contactUsArr).returning();
      await logAudit({
        tableName: 'contact_us_info',
        action: 'INSERT',
        description: 'Created contact info',
        oldData: null,
        newData: createdContactUs,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let createdNewsLinks: any[] = [];

    if (Array.isArray(newsLinksArr)) {
      // Remove id field from news links data to let database auto-generate
      const sanitizedNewsLinks = newsLinksArr.map(({ id, ...rest }) => rest);
      createdNewsLinks = await db.insert(news_links).values(sanitizedNewsLinks).returning();
      await logAudit({
        tableName: 'news_links',
        action: 'INSERT',
        description: 'Created news links',
        oldData: null,
        newData: createdNewsLinks,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    res.status(201).json({
      message: 'Landing data created successfully',
      status: 'success',
      error: null,
      data: {
        landing: createdLanding,
        stats: createdStats,
        partners: createdPartners,
        practices: createdPractices,
        contactUs: createdContactUs,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create landing data',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// UPDATE landing, stats, partners, practices, and contact us info
const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { landing: landingData, stats: statsArr, partners: partnersArr, practices: practicesArr, contactUs: contactUsArr, newsLinks: newsLinksArr } = req.body;

    let updatedLanding = null;
    if (landingData && landingData.id) {
      const oldLanding = await db.select().from(landing).where(eq(landing.id, landingData.id));
      [updatedLanding] = await db.update(landing)
        .set(landingData)
        .where(eq(landing.id, landingData.id))
        .returning();
      await logAudit({
        tableName: 'landing',
        action: 'UPDATE',
        description: 'Updated landing page data',
        oldData: oldLanding[0] || null,
        newData: updatedLanding,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let updatedStats: any[] = [];
    if (statsArr && Array.isArray(statsArr)) {
      // Replace all stats only if statsArr is present
      const oldStats = await db.select().from(stats);
      await db.delete(stats);
      updatedStats = await db.insert(stats).values(statsArr).returning();
      await logAudit({
        tableName: 'stats',
        action: 'UPDATE',
        description: 'Updated stats',
        oldData: oldStats,
        newData: updatedStats,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let updatedPartners: any[] = [];
    if (partnersArr && Array.isArray(partnersArr)) {
      const oldPartners = await db.select().from(partners);
      await db.delete(partners);
      updatedPartners = await db.insert(partners).values(partnersArr).returning();
      await logAudit({
        tableName: 'partners',
        action: 'UPDATE',
        description: 'Updated partners',
        oldData: oldPartners,
        newData: updatedPartners,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let updatedPractices: any[] = [];
    if (practicesArr && Array.isArray(practicesArr)) {
      const oldPractices = await db.select().from(practices);
      await db.delete(practices);
      updatedPractices = await db.insert(practices).values(practicesArr).returning();
      await logAudit({
        tableName: 'practices',
        action: 'UPDATE',
        description: 'Updated practices',
        oldData: oldPractices,
        newData: updatedPractices,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let updatedContactUs: any[] = [];
    if (contactUsArr && Array.isArray(contactUsArr)) {
      const oldContactUs = await db.select().from(contactUsInfo);
      await db.delete(contactUsInfo);
      updatedContactUs = await db.insert(contactUsInfo).values(contactUsArr).returning();
      await logAudit({
        tableName: 'contact_us_info',
        action: 'UPDATE',
        description: 'Updated contact info',
        oldData: oldContactUs,
        newData: updatedContactUs,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    let updatedNewsLinks: any[] = [];

    if (newsLinksArr && Array.isArray(newsLinksArr)) {
      const oldNewsLinks = await db.select().from(news_links);
      await db.delete(news_links);
      
      // Remove id field from news links data to let database auto-generate
      const sanitizedNewsLinks = newsLinksArr.map(({ id, ...rest }) => rest);
      
      updatedNewsLinks = await db.insert(news_links).values(sanitizedNewsLinks).returning();
      await logAudit({    
        tableName: 'news_links',
        action: 'UPDATE',
        description: 'Updated news links',
        oldData: oldNewsLinks,
        newData: updatedNewsLinks,
        user_id: req.user?.id,
        changedBy: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
    }

    res.status(200).json({
      message: 'Landing data updated successfully',
      status: 'success',
      error: null,
      data: {
        landing: updatedLanding,
        stats: updatedStats,
        partners: updatedPartners,
        practices: updatedPractices,
        contactUs: updatedContactUs,
        newsLinks: updatedNewsLinks,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update landing data',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// REMOVE landing (and all stats, partners, practices, contact us info)
const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const oldLanding = await db.select().from(landing);
    const oldStats = await db.select().from(stats);
    const oldPartners = await db.select().from(partners);
    const oldPractices = await db.select().from(practices);
    const oldContactUs = await db.select().from(contactUsInfo);
    const oldNewsLinks = await db.select().from(news_links);
    await db.delete(landing);
    await db.delete(stats);
    await db.delete(partners);
    await db.delete(practices);
    await db.delete(contactUsInfo);
    await db.delete(news_links);
    await logAudit({
      tableName: 'landing',
      action: 'DELETE',
      description: 'Deleted landing',
      oldData: oldLanding,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    await logAudit({
      tableName: 'stats',
      action: 'DELETE',
      description: 'Deleted stats',
      oldData: oldStats,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    await logAudit({
      tableName: 'partners',
      action: 'DELETE',
      description: 'Deleted partners',
      oldData: oldPartners,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    await logAudit({
      tableName: 'practices',
      action: 'DELETE',
      description: 'Deleted practices',
      oldData: oldPractices,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    await logAudit({
      tableName: 'contact_us_info',
      action: 'DELETE',
      description: 'Deleted contact info',
      oldData: oldContactUs,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    await logAudit({
      tableName: 'news_links',
      action: 'DELETE',
      description: 'Deleted news links',
      oldData: oldNewsLinks,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Landing data removed successfully',
      status: 'success',
      error: null,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to remove landing data',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// UPLOAD IMAGE
const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { imageType } = req.body; // 'hero_image' or 'logo'
    
    if (!req.file) {
      res.status(400).json({
        message: "File is required",
        status: 'error',
        error: "Validation error",
        data: null,
      });
      return;
    }

    if (!imageType || !['hero_image', 'logo'].includes(imageType)) {
      res.status(400).json({
        message: "imageType must be either 'hero_image' or 'logo'",
        status: 'error',
        error: "Validation error",
        data: null,
      });
      return;
    }

    // Upload file to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'landing', 
          resource_type: 'auto',
          transformation: imageType === 'hero_image' ? [
            { width: 1920, height: 1080, crop: 'fill' }
          ] : [
            { width: 200, height: 200, crop: 'fill' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    // Get existing landing data
    const existingLanding = await db.select().from(landing).limit(1);
    
    if (existingLanding.length === 0) {
      res.status(404).json({
        message: "No landing page data found. Please create landing page first.",
        status: 'error',
        error: "Not found",
        data: null,
      });
      return;
    }

    const landingId = existingLanding[0].id;
    const oldData = existingLanding[0];

    // Update the landing page with the new image URL
    const updateData: any = {};
    if (imageType === 'hero_image') {
      updateData.hero_image_url = uploadResult.secure_url;
    } else if (imageType === 'logo') {
      updateData.logo_url = uploadResult.secure_url;
    }

    const [updatedLanding] = await db.update(landing)
      .set(updateData)
      .where(eq(landing.id, landingId))
      .returning();

    await logAudit({
      tableName: 'landing',
      action: 'UPDATE',
      description: `Updated ${imageType} for landing page`,
      oldData: oldData,
      newData: updatedLanding,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    res.status(200).json({
      message: `${imageType} uploaded successfully`,
      status: 'success',
      error: null,
      data: {
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        updatedLanding: updatedLanding,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload image",
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// UPLOAD PARTNER IMAGE TO SERVER
const uploadPartnerImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        message: "File is required",
        status: 'error',
        error: "Validation error",
        data: null,
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        message: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed",
        status: 'error',
        error: "Validation error",
        data: null,
      });
      return;
    }

    // Validate file size (max 5MB)
    // const maxSize = 5 * 1024 * 1024; // 5MB
    // if (req.file.size > maxSize) {
    //   res.status(400).json({
    //     message: "File size too large. Maximum size is 5MB",
    //     status: 'error',
    //     error: "Validation error",
    //     data: null,
    //   });
    //   return;
    // }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'backend', 'uploads', 'partners');
    console.log(uploadsDir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } else {
      console.log('uploadsDir already exists');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(req.file.originalname);
    const filename = `partner_${timestamp}_${randomString}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to server
    const writeFile = promisify(fs.writeFile);
    try {
      await writeFile(filePath, req.file.buffer);
    } catch (err) {
      res.status(500).json({
        message: "Failed to save file to server",
        status: 'error',
        error: err instanceof Error ? err.message : err,
        data: null,
      });
      return;
    }

    // Generate public URL for serving the image
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const publicUrl = `${backendUrl}/uploads/partners/${filename}`;

    res.status(200).json({
      message: "Partner image uploaded successfully",
      status: 'success',
      error: null,
      data: {
        imageUrl: publicUrl,
        filename: filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload partner image",
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// SERVE UPLOADED FILES
const serveUploadedFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { folder, filename } = req.params;
    
    // Validate folder to prevent directory traversal
    const allowedFolders = ['partners'];
    if (!allowedFolders.includes(folder)) {
      res.status(400).json({
        message: "Invalid folder",
        status: 'error',
        error: "Validation error",
        data: null,
      });
      return;
    }

    const filePath = path.join(process.cwd(), 'uploads', folder, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        message: "File not found",
        status: 'error',
        error: "Not found",
        data: null,
      });
      return;
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Detect content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      message: "Failed to serve file",
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, create, update, remove, uploadImage, uploadPartnerImage, serveUploadedFile };