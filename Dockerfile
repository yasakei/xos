# Multi-stage build for XOS React monorepo

# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/proxy/package.json ./packages/proxy/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build backend
RUN pnpm --filter backend build

# Build frontend
RUN pnpm --filter frontend build

# Production stage
FROM node:18-alpine

# Install pnpm and wget
RUN npm install -g pnpm
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy the entire app structure to maintain relative paths
COPY --from=builder /app ./

# Install only production dependencies
RUN pnpm --filter backend --prod install
RUN pnpm --filter frontend --prod install

# Create VFS directory
RUN mkdir -p /app/packages/backend/vfs

# Expose port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start integrated server
CMD ["node", "packages/backend/dist/integrated-server.js"]