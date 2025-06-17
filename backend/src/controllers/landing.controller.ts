import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { landing, testimonials, contactUsInfo } from '../db/schema';
import { eq } from 'drizzle-orm';

// GET all landing data
const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const landingData = await db.select().from(landing).limit(1);
    const testimonialsData = await db.select().from(testimonials);
    const contactUsData = await db.select().from(contactUsInfo);

    res.status(200).json({
      message: 'Landing page data fetched successfully',
      status: 'success',
      error: null,
      data: {
        landing: landingData[0] || null,
        testimonials: testimonialsData,
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

// CREATE landing, testimonials, and contact us info
const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { landing: landingData, testimonials: testimonialsArr, contactUs: contactUsArr } = req.body;

    const [createdLanding] = await db.insert(landing).values(landingData).returning();

    let createdTestimonials: any[] = [];
    if (Array.isArray(testimonialsArr)) {
      createdTestimonials = await db.insert(testimonials).values(testimonialsArr).returning();
    }

    let createdContactUs: any[] = [];
    if (Array.isArray(contactUsArr)) {
      createdContactUs = await db.insert(contactUsInfo).values(contactUsArr).returning();
    }

    res.status(201).json({
      message: 'Landing data created successfully',
      status: 'success',
      error: null,
      data: {
        landing: createdLanding,
        testimonials: createdTestimonials,
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

// UPDATE landing, testimonials, and contact us info
const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { landing: landingData, testimonials: testimonialsArr, contactUs: contactUsArr } = req.body;

    let updatedLanding = null;
    if (landingData && landingData.id) {
      [updatedLanding] = await db.update(landing)
        .set(landingData)
        .where(eq(landing.id, landingData.id))
        .returning();
    }

    // (replace all: delete then insert)
    let updatedTestimonials: any[] = [];
    if (Array.isArray(testimonialsArr)) {
      await db.delete(testimonials);
      updatedTestimonials = await db.insert(testimonials).values(testimonialsArr).returning();
    }

    // (replace all: delete then insert)
    let updatedContactUs: any[] = [];
    if (Array.isArray(contactUsArr)) {
      await db.delete(contactUsInfo);
      updatedContactUs = await db.insert(contactUsInfo).values(contactUsArr).returning();
    }

    res.status(200).json({
      message: 'Landing data updated successfully',
      status: 'success',
      error: null,
      data: {
        landing: updatedLanding,
        testimonials: updatedTestimonials,
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

// REMOVE landing (and all testimonials/contact us info)
const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await db.delete(landing);
    await db.delete(testimonials);
    await db.delete(contactUsInfo);

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