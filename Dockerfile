FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-deps

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY backend ./backend
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "backend/server.js"]
