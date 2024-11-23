FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN mkdir -p logs
RUN chown -R node:node /app

USER node
EXPOSE 3000

CMD ["npm", "start"]