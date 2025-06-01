import { pgTable, serial, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
});

export const documents = pgTable('documents', {
    id: serial('id').primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    category_id: integer('category_id').references(() => categories.id).notNull(),
    author: varchar('author', { length: 100 }),
    upload_date: timestamp('upload_date', { withTimezone: true }).defaultNow(),
    content_text: text('content_text'),
    file_url: varchar('file_url', { length: 500 }).notNull(),
});

export const news = pgTable('news', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    visual_content: jsonb('visual_content'),
    content: text('content').notNull(),
    source: varchar('source', { length: 100 }),
    source_id: varchar('source_id', { length: 255 }),
    published_date: timestamp('published_date', { withTimezone: true }),
    created_by: varchar('created_by', { length: 100 }),
});

// Users Table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull(),
    phone_number: varchar('phone_number', { length: 100 }).notNull(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull(),
});