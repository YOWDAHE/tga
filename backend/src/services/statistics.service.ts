import { db } from '../db';
import { 
  pageViews, 
  contentStatistics, 
  dailyStatistics, 
  news,
  documents,
  categories,
  auditLog,
  remarks
} from '../db/schema';
import { count, desc, eq, gte, and } from 'drizzle-orm';

function toSQLDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface PageViewData {
    page_type: string;
    page_id?: number | null;
    user_id?: number | null;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    session_id?: string | null;
}

export async function recordPageView(data: PageViewData) {
    // 1. Insert the raw page view event
    await db.insert(pageViews).values({
      page_type: data.page_type,
      page_id: data.page_id,
      user_id: data.user_id,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      referrer: data.referrer,
      session_id: data.session_id,
      view_timestamp: new Date(),
    });

    // 2. Update content-specific aggregate statistics
    if (data.page_id) {
        const existingStats = await db.select().from(contentStatistics)
            .where(and(eq(contentStatistics.content_type, data.page_type), eq(contentStatistics.content_id, data.page_id)))
            .limit(1);

        if (existingStats.length > 0) {
            await db.update(contentStatistics)
                .set({ total_views: existingStats[0].total_views + 1, last_viewed: new Date() })
                .where(eq(contentStatistics.id, existingStats[0].id));
        } else {
            await db.insert(contentStatistics).values({
                content_type: data.page_type,
                content_id: data.page_id,
                total_views: 1,
                unique_views: 1, // Simplified for now
                last_viewed: new Date(),
            });
        }
    }

    // 3. Update daily aggregate statistics
    const sqlToday = toSQLDate(new Date());
    const existingDailyStats = await db.select().from(dailyStatistics)
        .where(eq(dailyStatistics.date, sqlToday))
        .limit(1);

    const updateData: { [key: string]: any } = { total_views: 1 };
    if (data.page_type === 'news') updateData.news_views = 1;
    if (data.page_type === 'document') updateData.document_views = 1;
    if (data.page_type === 'landing') updateData.landing_views = 1;
    if (data.page_type === 'category') updateData.category_views = 1;

    if (existingDailyStats.length > 0) {
        const stat = existingDailyStats[0];
        await db.update(dailyStatistics)
            .set({
                total_views: stat.total_views + 1,
                news_views: data.page_type === 'news' ? stat.news_views + 1 : stat.news_views,
                document_views: data.page_type === 'document' ? stat.document_views + 1 : stat.document_views,
                landing_views: data.page_type === 'landing' ? stat.landing_views + 1 : stat.landing_views,
                category_views: data.page_type === 'category' ? stat.category_views + 1 : stat.category_views,
            })
            .where(eq(dailyStatistics.id, stat.id));
    } else {
        await db.insert(dailyStatistics).values({
            date: sqlToday,
            total_views: 1,
            unique_visitors: 1, // Simplified
            news_views: data.page_type === 'news' ? 1 : 0,
            document_views: data.page_type === 'document' ? 1 : 0,
            landing_views: data.page_type === 'landing' ? 1 : 0,
            category_views: data.page_type === 'category' ? 1 : 0,
            new_users: 0, // Placeholder
            active_users: 0, // Placeholder
        });
    }
}


export async function fetchDashboardData() {
  // 1. Fetch all raw data concurrently
  const [
    newsCountResult, 
    documentsCountResult, 
    categoriesCountResult,
    recentActivityData
  ] = await Promise.all([
    db.select({ count: count() }).from(news),
    db.select({ count: count() }).from(documents),
    db.select({ count: count() }).from(categories),
    db.select().from(auditLog).orderBy(desc(auditLog.changeTimestamp)).limit(5)
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // <-- THIS IS THE FIX for Today's Overview
  const sqlToday = toSQLDate(today);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
      todayNewsCountResult, 
      todayDocumentsCountResult, 
      totalRemarksCountResult, 
  ] = await Promise.all([
      db.select({ count: count() }).from(news).where(gte(news.createdAt, today)),
      db.select({ count: count() }).from(documents).where(gte(documents.createdAt, today)),
      db.select({ count: count() }).from(remarks),
  ]);
  
  const last30DaysStats = await db.select().from(dailyStatistics).where(gte(dailyStatistics.date, toSQLDate(lastMonth))).orderBy(desc(dailyStatistics.date));

  // 2. Safely initialize and convert all numeric values
  const newsCountNum = Number(newsCountResult[0]?.count || 0);
  const documentsCountNum = Number(documentsCountResult[0]?.count || 0);
  const categoriesCountNum = Number(categoriesCountResult[0]?.count || 0);
  const todayNewsCountNum = Number(todayNewsCountResult[0]?.count || 0);
  const todayDocumentsCountNum = Number(todayDocumentsCountResult[0]?.count || 0);
  const totalRemarksCountNum = Number(totalRemarksCountResult[0]?.count || 0);

  const newsViewsNum = last30DaysStats.reduce((sum, day) => sum + Number(day.news_views), 0);
  const documentsViewsNum = last30DaysStats.reduce((sum, day) => sum + Number(day.document_views), 0);
  const landingViewsNum = last30DaysStats.reduce((sum, day) => sum + Number(day.landing_views), 0);
  const totalViewsNum = newsViewsNum + documentsViewsNum + landingViewsNum;
  
  // 3. Perform calculations
  const calculateGrowth = (current: number, previous: number): { change: string; changeType: "positive" | "negative" | "neutral"; growth: number } => {
      if (previous === 0) return current > 0 ? { change: "+100%", changeType: "positive", growth: 100 } : { change: "0%", changeType: "neutral", growth: 0 };
      const percentage = ((current - previous) / previous) * 100;
      return {
          change: percentage >= 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`,
          changeType: percentage > 0 ? "positive" : (percentage < 0 ? "negative" : "neutral"),
          growth: percentage
      };
  };

  const previousMonthNewsViews = last30DaysStats.length > 30 ? last30DaysStats.slice(30, 60).reduce((sum, day) => sum + Number(day.news_views), 0) : 0;
  const newsGrowth = calculateGrowth(newsViewsNum, previousMonthNewsViews);

  const previousMonthDocumentsViews = last30DaysStats.length > 30 ? last30DaysStats.slice(30, 60).reduce((sum, day) => sum + Number(day.document_views), 0) : 0;
  const documentsGrowth = calculateGrowth(documentsViewsNum, previousMonthDocumentsViews);
  
  const previousMonthLandingViews = last30DaysStats.length > 30 ? last30DaysStats.slice(30, 60).reduce((sum, day) => sum + Number(day.landing_views), 0) : 0;
  const landingGrowth = calculateGrowth(landingViewsNum, previousMonthLandingViews);

  const previousTotalViews = last30DaysStats.length > 30 ? last30DaysStats.slice(30, 60).reduce((sum, day) => sum + Number(day.total_views), 0) : 0;
  const totalViewsGrowth = calculateGrowth(totalViewsNum, previousTotalViews);
  
  const totalContentCount = newsCountNum + documentsCountNum + categoriesCountNum;

  // 4. Assemble and return final object
  return {
    stats: [
      { title: "Total News", value: newsCountNum.toString(), change: newsGrowth.change, changeType: newsGrowth.changeType },
      { title: "Archives", value: documentsCountNum.toString(), change: documentsGrowth.change, changeType: documentsGrowth.changeType },
      { title: "Categories", value: categoriesCountNum.toString(), change: "+0", changeType: "neutral" as const },
      { title: "Total Views", value: totalViewsNum.toString(), change: totalViewsGrowth.change, changeType: totalViewsGrowth.changeType },
    ],
    viewStats: [
      { title: "News Views", value: newsViewsNum.toString(), ...newsGrowth },
      { title: "Document Views", value: documentsViewsNum.toString(), ...documentsGrowth },
      { title: "Landing Page Views", value: landingViewsNum.toString(), ...landingGrowth },
    ],
    todayOverview: {
      articlesPublished: todayNewsCountNum,
      documentsUploaded: todayDocumentsCountNum,
      flaggedComments: 0,
      pendingRemarks: totalRemarksCountNum,
    },
    recentActivity: recentActivityData.map(activity => ({
      id: activity.id,
      type: activity.tableName === 'news' ? 'news' : 'archive' as const,
      title: `${activity.action} on ${activity.tableName}`,
      description: activity.description || 'N/A',
      time: new Date(activity.changeTimestamp).toLocaleTimeString(),
      user: activity.changedBy || 'System',
      avatar: "/placeholder.svg",
    })),
    charts: {
      content_distribution: [
        { id: 0, value: totalContentCount > 0 ? Math.round((newsCountNum / totalContentCount) * 100) : 0, label: 'News', color: '#228be6' },
        { id: 1, value: totalContentCount > 0 ? Math.round((documentsCountNum / totalContentCount) * 100) : 0, label: 'Documents', color: '#40c057' },
        { id: 2, value: totalContentCount > 0 ? Math.round((categoriesCountNum / totalContentCount) * 100) : 0, label: 'Categories', color: '#fd7e14' },
      ],
      daily: last30DaysStats.slice(0, 7).map(d => ({ date: d.date, total_views: Number(d.total_views), news_views: Number(d.news_views), document_views: Number(d.document_views) })).reverse(),
    },
  };
} 