# --- Base image ---
FROM node:20-alpine AS base
WORKDIR /app

# --- Dependencies (cached layer) ---
FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev

# --- Runtime image ---
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run as a non-root user
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser

EXPOSE 5000

# Basic container-level healthcheck against the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
