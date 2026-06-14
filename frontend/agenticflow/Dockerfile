FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Bake in the backend API URL at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8005
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8005
ARG NEXT_PUBLIC_MODEL_API_URL=http://localhost:8006
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_MODEL_API_URL=$NEXT_PUBLIC_MODEL_API_URL

# Build the app
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
