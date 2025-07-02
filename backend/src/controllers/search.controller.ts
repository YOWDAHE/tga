import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { documents } from '../db/schema';
import { and, eq, ilike, or, asc, desc } from 'drizzle-orm';

const get = async (
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

    if (q) {
      whereClauses.push(
        or(
          ilike(documents.title, `%${q}%`),
          ilike(documents.content_text, `%${q}%`)
        )
      );
    }

    if (category && !isNaN(Number(category))) {
      whereClauses.push(eq(documents.category_id, Number(category)));
    }

    const sortFieldMap = {
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      title: documents.title,
    } as const;
    const allowedSortFields = Object.keys(sortFieldMap);
    const sortFieldKey = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortColumn = sortFieldMap[sortFieldKey as keyof typeof sortFieldMap];

    // Compose query
    const baseQuery = db.select().from(documents);
    const filteredQuery = whereClauses.length > 0
      ? baseQuery.where(and(...whereClauses))
      : baseQuery;

    const orderedQuery = filteredQuery.orderBy(
      order === 'asc'
        ? asc(sortColumn)
        : desc(sortColumn)
    );

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: documents.id })
      .from(documents)
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
      .execute();
    
    const totalCount = totalCountResult.length;

    const data = await orderedQuery
      .limit(pageSize)
      .offset((pageNum - 1) * pageSize)
      .execute();

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      message: 'Documents fetched successfully',
      status: 'success',
      error: null,
      data: {
        documents: data,
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
      message: 'Failed to search documents',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get };