FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
