# Stage 1: Builder
FROM node:20-alpine as builder

# Cache bust argument to force fresh builds
ARG CACHEBUST=1

# Arguments for Vite build time variables
ARG GEMINI_API_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run build with environment variables available to Vite
RUN GEMINI_API_KEY=$GEMINI_API_KEY \
    VITE_GEMINI_API_KEY=$GEMINI_API_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    npm run build

# Stage 2: Runner
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Copy dist from builder
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Install ONLY production dependencies (express, google libs)
# We need to install them because we are starting from a fresh image
RUN npm install --omit=dev

COPY server.js ./
COPY lib/ ./lib/
COPY data/ ./data/

# Expose port
EXPOSE 8080

CMD ["node", "server.js"]
