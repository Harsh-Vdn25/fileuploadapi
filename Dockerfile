FROM node:20-slim AS builder 

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package.json package-lock.json ./
 
RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build

#--Stage2:Production--

FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --only=production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD [ "node","dist/server.js" ]
