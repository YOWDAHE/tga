FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app .

ENV NEXT_PUBLIC_API_URL=http://frontend:3001
EXPOSE 3001

CMD ["npm", "run", "start"]
