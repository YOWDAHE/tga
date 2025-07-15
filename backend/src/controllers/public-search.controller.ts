import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { news, categories } from '../db/schema';
import { and, eq, ilike, or, asc, desc, count } from 'drizzle-orm';

const searchNews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      q,
      category,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);

    const whereClauses = [];

    // Search in title, content, and hashtags
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereClauses.push(
        or(
          ilike(news.title, searchTerm),
          ilike(news.content, searchTerm),
          ilike(news.hashtags, searchTerm),
          ilike(news.created_by, searchTerm),
          ilike(news.source, searchTerm)
        )
      );
    }

    // Filter by category if provided
    if (category && category.trim()) {
      const categoryTerm = `%${category.trim()}%`;
      whereClauses.push(ilike(categories.name, categoryTerm));
    }

    const sortFieldMap = {
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      title: news.title,
      published_date: news.published_date,
      view_count: news.view_count,
    } as const;
    
    const allowedSortFields = Object.keys(sortFieldMap);
    const sortFieldKey = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortColumn = sortFieldMap[sortFieldKey as keyof typeof sortFieldMap];

    // Build the base query with category join
    const baseQuery = db.select().from(news).leftJoin(categories, eq(news.category_id, categories.id));
    
    // Apply filters
    const filteredQuery = whereClauses.length > 0
      ? baseQuery.where(and(...whereClauses))
      : baseQuery;

    // Apply sorting
    const orderedQuery = filteredQuery.orderBy(
      order === 'asc'
        ? asc(sortColumn)
        : desc(sortColumn)
    );

    // Get total count for pagination
    const totalCountQuery = whereClauses.length > 0
      ? db.select({ count: count() }).from(news).leftJoin(categories, eq(news.category_id, categories.id)).where(and(...whereClauses))
      : db.select({ count: count() }).from(news).leftJoin(categories, eq(news.category_id, categories.id));
    
    const totalCountResult = await totalCountQuery;
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated results
    const data = await orderedQuery
      .limit(pageSize)
      .offset((pageNum - 1) * pageSize)
      .execute();

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      message: 'News search completed successfully',
      status: 'success',
      error: null,
      data: {
        news: data,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: pageSize,
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to search news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { searchNews }; 