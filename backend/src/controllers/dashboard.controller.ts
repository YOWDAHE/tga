import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { news, documents, categories, auditLog, remarks } from '../db/schema';
import { count, desc, eq, gte, sql } from 'drizzle-orm';

// GET dashboard data
const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get current date for today's calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total counts
    const [newsCount] = await db.select({ count: count() }).from(news);
    const [documentsCount] = await db.select({ count: count() }).from(documents);
    const [categoriesCount] = await db.select({ count: count() }).from(categories);

    // Get today's activity counts
    const [todayNewsCount] = await db
      .select({ count: count() })
      .from(news)
      .where(gte(news.createdAt, today));

    const [todayDocumentsCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(gte(documents.createdAt, today));

    // Get total remarks count (for now, we'll use total count as pending)
    const [totalRemarksCount] = await db
      .select({ count: count() })
      .from(remarks);

    // Get recent activity (last 10 audit log entries)
    const recentActivity = await db
      .select({
        id: auditLog.id,
        tableName: auditLog.tableName,
        action: auditLog.action,
        description: auditLog.description,
        changedBy: auditLog.changedBy,
        changeTimestamp: auditLog.changeTimestamp,
      })
      .from(auditLog)
      .orderBy(desc(auditLog.changeTimestamp))
      .limit(10);

    // Calculate percentage changes (mock data for now)
    const newsChange = "+12%";
    const archivesChange = "+8%";
    const categoriesChange = "+2";

    const dashboardData = {
      stats: [
        {
          title: "Total News",
          value: newsCount.count.toString(),
          change: newsChange,
          changeType: "positive",
        },
        {
          title: "Archives",
          value: documentsCount.count.toString(),
          change: archivesChange,
          changeType: "positive",
        },
        {
          title: "Categories",
          value: categoriesCount.count.toString(),
          change: categoriesChange,
          changeType: "neutral",
        },
      ],
      todayOverview: {
        articlesPublished: todayNewsCount.count,
        documentsUploaded: todayDocumentsCount.count,
        flaggedComments: 0, // No flagged field in remarks table
        pendingRemarks: totalRemarksCount.count,
      },
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        type: activity.tableName === 'news' ? 'news' : 
              activity.tableName === 'documents' ? 'archive' : 'category',
        title: `${activity.action} ${activity.tableName}`,
        description: activity.description,
        time: getTimeAgo(activity.changeTimestamp),
        user: activity.changedBy || 'System',
        avatar: "/placeholder.svg?height=32&width=32",
      })),
    };

    res.status(200).json({
      message: 'Dashboard data fetched successfully',
      status: 'success',
      error: null,
      data: dashboardData,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// Helper function to format time ago
function getTimeAgo(timestamp: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

export default { get }; 