# Frontend (Vite + React)
FROM node:22-alpine
WORKDIR /app

# Install deps first (use package*.json for cache)
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
