import { desc, like } from 'drizzle-orm';
import { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

export const documents = pgTable('documents', {
    id: serial('id').primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    category_id: integer('category_id').references(() => categories.id).notNull(),
    author: varchar('author', { length: 100 }),
    content_text: text('content_text'),
    file_size: integer('file_size').notNull(), // size in bytes
    file_url: varchar('file_url', { length: 500 }).notNull(),      // secure_url from Cloudinary
    description: text('description'),
    public_id: varchar('public_id', { length: 255 }).notNull(),    // public_id from Cloudinary
    view_count: integer('view_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const news = pgTable('news', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    visual_content: jsonb('visual_content'),
    links: jsonb('links'),
    content: text('content').notNull(),
    source: varchar('source', { length: 100 }),
    view_count: integer('view_count').default(0).notNull(),
    source_id: varchar('source_id', { length: 255 }),
    message_id: varchar('message_id', { length: 255 }),
    telegram_message_id: jsonb('telegram_message_id'), // Array of message IDs
    linkedin_message_id: varchar('linkedin_message_id', { length: 255 }),
    twitter_message_id: integer('twitter_message_id'),
    published_date: timestamp('published_date', { withTimezone: true }),
    created_by: varchar('created_by', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

// News comments table
export const comments = pgTable('comments', {
    id: serial('id').primaryKey(),
    news_id: integer('news_id').references(() => news.id).notNull(),
    user_name: text('user_name'),
    likes: integer('likes').default(0).notNull(),
    dislikes: integer('dislikes').default(0).notNull(),
    visible: boolean('visible').default(true).notNull(),
    edited: boolean('edited').default(false).notNull(),
    flagged: boolean('flagged').default(false).notNull(),
    flagged_reason: text('flagged_reason'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

// Users Table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull(),
    phone_number: varchar('phone_number', { length: 100 }).notNull(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    role_name: varchar('role_name', { length: 100 }),
    roles: jsonb('roles').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

//landing page
export const landing = pgTable('landing', {
    id: serial('id').primaryKey(),

    logo_url: varchar('logo_url', { length: 500 }).notNull(),
    hero_image_url: varchar('hero_image_url', { length: 500 }).notNull(),
    hero_title: varchar('title', { length: 255 }).notNull(),

    about_us: text('about_us'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
})

export const news_links = pgTable('news_links', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    link: varchar('link', { length: 500 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

//stats
export const stats = pgTable('stats', {
    id: serial('id').primaryKey(),
    stat: text('stat').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

//stats
export const practices = pgTable('practices', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

// partners
export const partners = pgTable('partners', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    logo_url: varchar('logo_url', { length: 500 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});


// contact us info
export const contactUsInfo = pgTable('contact_us_info', {
    id: serial('id').primaryKey(),
    medium: varchar('medium', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }),
    phone_number: varchar('phone_number', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

// remarks
export const remarks = pgTable('remarks', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }).notNull(),
    content: text('content').notNull(),
    response: text('response'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});

export const auditLog = pgTable('audit_log', {
    id: serial('id').primaryKey(),
    tableName: text('table_name').notNull(),
    action: text('action', {
        enum: ['INSERT', 'UPDATE', 'DELETE'],
    }).notNull(),
    description: text('description').notNull(),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    user_id: integer('user_id').references(() => users.id).notNull(),
    changedBy: text('changed_by'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    changeTimestamp: timestamp('change_timestamp').defaultNow().notNull(),
});