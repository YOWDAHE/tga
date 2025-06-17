import { desc } from 'drizzle-orm';
import { pgTable, serial, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

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
    file_url: varchar('file_url', { length: 500 }).notNull(),      // secure_url from Cloudinary
    public_id: varchar('public_id', { length: 255 }).notNull(),    // public_id from Cloudinary
    view_count: integer('view_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const news = pgTable('news', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    visual_content: jsonb('visual_content'),
    content: text('content').notNull(),
    source: varchar('source', { length: 100 }),
    source_id: varchar('source_id', { length: 255 }),
    message_id: varchar('message_id', { length: 255 }),
    published_date: timestamp('published_date', { withTimezone: true }),
    created_by: varchar('created_by', { length: 100 }),
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
    role: varchar('role', { length: 50 }).notNull(),
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

    about_us: text('about_us').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
})

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


//testimonials
export const testimonials = pgTable('testimonials', {
    id: serial('id').primaryKey(),
    client: varchar('client', { length: 100 }).notNull(),
    position: text('position').notNull(),
    content: text('content').notNull(),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull(),
});