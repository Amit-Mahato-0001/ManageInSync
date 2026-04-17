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

COPY backend/package*.json ./backend/
COPY backend/server.js ./backend/server.js
COPY backend/src ./backend/src
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((response) => { if (!response.ok) { throw new Error(`HTTP ${response.status}`) } process.exit(0) }).catch((error) => { console.error(error.message); process.exit(1) })"]

CMD ["node", "backend/server.js"]
