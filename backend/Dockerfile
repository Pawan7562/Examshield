FROM node:20-alpine

# Install native compilers, runtimes, and tini init system for clean process reaping (zero defunct zombies)
RUN apk add --no-cache g++ gcc make python3 openjdk17-jdk tini

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p uploads
EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--max-old-space-size=256", "server.js"]
