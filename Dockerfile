FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# FROM node:22-alpine AS runner
# WORKDIR /app

# COPY --from=builder /app .
# # Copy standalone output
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static
# COPY --from=builder /app/public ./public 

# ENV NEXT_PUBLIC_API_URL=http://frontend:3001/office/api
# ENV BACKEND_URL=http://backend:3000
# ENV BACKEND_API_URL=http://backend:3000/api
# EXPOSE 3001

# CMD ["npm", "run", "start"]

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy ONLY what standalone needs:
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set environment variables
ENV NEXT_PUBLIC_API_URL=http://frontend:3001/office/api
ENV BACKEND_URL=http://backend:3000
ENV BACKEND_API_URL=http://backend:3000/api
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

EXPOSE 3001

USER nextjs

# Run the standalone server directly
CMD ["node", "server.js"]