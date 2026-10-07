FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Build TS to JS


EXPOSE 3000

CMD ["npx", "tsx", "index.ts"]
