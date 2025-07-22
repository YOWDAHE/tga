import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { news, documents, categories, auditLog, remarks, landing } from '../db/schema';
import { count, desc, eq, gte, sql, sum } from 'drizzle-orm';

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

    // Get date for last month comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get total counts
    const [newsCount] = await db.select({ count: count() }).from(news);
    const [documentsCount] = await db.select({ count: count() }).from(documents);
    const [categoriesCount] = await db.select({ count: count() }).from(categories);
    const [landingCount] = await db.select({count: landing.view_count}).from(landing);

    // Get view counts
    const [newsViews] = await db.select({ total: sum(news.view_count) }).from(news);
    const [documentsViews] = await db.select({ total: sum(documents.view_count) }).from(documents);
    const [landingViews] = await db.select({ total: sum(landing.view_count) }).from(landing);

    // Get this month's view counts
    const [thisMonthNewsViews] = await db
      .select({ total: sum(news.view_count) })
      .from(news)
      .where(gte(news.createdAt, lastMonth));

    const [thisMonthDocumentsViews] = await db
      .select({ total: sum(documents.view_count) })
      .from(documents)
      .where(gte(documents.createdAt, lastMonth));

    const [thisMonthLandingViews] = await db
      .select({ total: sum(landing.view_count) })
      .from(landing)
      .where(gte(landing.createdAt, lastMonth));

    // Get last month's view counts (for comparison)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const [lastMonthNewsViews] = await db
      .select({ total: sum(news.view_count) })
      .from(news)
      .where(sql`${news.createdAt} >= ${twoMonthsAgo} AND ${news.createdAt} < ${lastMonth}`);

    const [lastMonthDocumentsViews] = await db
      .select({ total: sum(documents.view_count) })
      .from(documents)
      .where(sql`${documents.createdAt} >= ${twoMonthsAgo} AND ${documents.createdAt} < ${lastMonth}`);

    const [lastMonthLandingViews] = await db
      .select({ total: sum(landing.view_count) })
      .from(landing)
      .where(sql`${landing.createdAt} >= ${twoMonthsAgo} AND ${landing.createdAt} < ${lastMonth}`);

    // Calculate percentage changes for view growth
    const calculateViewGrowth = (current: number, previous: number): { change: string; changeType: "positive" | "negative" | "neutral"; growth: number } => {
      if (previous === 0) {
        return current > 0 ? { change: "+100%", changeType: "positive", growth: 100 } : { change: "0%", changeType: "neutral", growth: 0 };
      }
      const percentage = ((current - previous) / previous) * 100;
      const change = percentage >= 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
      const changeType = percentage > 0 ? "positive" : percentage < 0 ? "negative" : "neutral";
      return { change, changeType, growth: percentage };
    };

    const newsViewGrowth = calculateViewGrowth(Number(thisMonthNewsViews.total) || 0, Number(lastMonthNewsViews.total) || 0);
    const documentsViewGrowth = calculateViewGrowth(Number(thisMonthDocumentsViews.total) || 0, Number(lastMonthDocumentsViews.total) || 0);
    const landingViewGrowth = calculateViewGrowth(Number(thisMonthLandingViews.total) || 0, Number(lastMonthLandingViews.total) || 0);

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

    const dashboardData = {
      stats: [
        {
          title: "Total News",
          value: newsCount.count.toString(),
          change: "+12%",
          changeType: "positive",
        },
        {
          title: "Archives",
          value: documentsCount.count.toString(),
          change: "+8%",
          changeType: "positive",
        },
        // {
        //   title: "Categories",
        //   value: categoriesCount.count.toString(),
        //   change: "+2",
        //   changeType: "neutral",
        // },
        {
          title: "Landing Page Views",
          value: landingCount.count.toString(),
          change: "+12%",
          changeType: "positive",
        }
      ],
      viewStats: [
        {
          title: "News Views",
          value: (newsViews.total || 0).toString(),
          change: newsViewGrowth.change,
          changeType: newsViewGrowth.changeType,
          growth: newsViewGrowth.growth,
        },
        {
          title: "Document Views",
          value: (documentsViews.total || 0).toString(),
          change: documentsViewGrowth.change,
          changeType: documentsViewGrowth.changeType,
          growth: documentsViewGrowth.growth,
        },
        {
          title: "Landing Page Views",
          value: (landingViews.total || 0).toString(),
          change: landingViewGrowth.change,
          changeType: landingViewGrowth.changeType,
          growth: landingViewGrowth.growth,
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