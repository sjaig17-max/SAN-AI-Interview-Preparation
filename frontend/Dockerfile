FROM node:20-alpine AS builder

WORKDIR /app

# Copy package and lock files
COPY package.json ./

# Install packages
RUN npm install --frozen-lockfile --legacy-peer-deps

# Copy frontend source files
COPY . .

# Set dynamic build arguments
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the static pages and app bundle
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built outputs
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
