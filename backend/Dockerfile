FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Use --omit=dev for better compatibility; npm ci is the default but needs a lockfile
RUN npm install --omit=dev
COPY . .
RUN mkdir -p uploads
EXPOSE 5000
CMD ["node", "server.js"]
