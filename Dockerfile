FROM node:20-alpine AS builder 

WORKDIR /app

COPY package.json package-lock.json ./
 
RUN npm install

COPY . .

RUN npm run build

#--Stage2:Production--

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD [ "node","dist/server.js" ]
