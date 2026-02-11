FROM node:20-slim AS builder 

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package.json package-lock.json ./
 
RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build

RUN npm prune --omit=dev
#--Stage2:Production--

FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD [ "node","dist/server.js" ]
