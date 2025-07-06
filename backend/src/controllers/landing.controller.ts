import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { landing, stats, partners, practices, contactUsInfo } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from './audit.controller';

// GET all landing data
const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const landingData = await db.select().from(landing).limit(1);
    const statsData = await db.select().from(stats);
    const partnersData = await db.select().from(partners);
    const practicesData = await db.select().from(practices);
    const contactUsData = await db.select().from(contactUsInfo);

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
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch landing data',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
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
    const { landing: landingData, stats: statsArr, partners: partnersArr, practices: practicesArr, contactUs: contactUsArr } = req.body;

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
    const { landing: landingData, stats: statsArr, partners: partnersArr, practices: practicesArr, contactUs: contactUsArr } = req.body;

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
    await db.delete(landing);
    await db.delete(stats);
    await db.delete(partners);
    await db.delete(practices);
    await db.delete(contactUsInfo);
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

export default { get, create, update, remove };