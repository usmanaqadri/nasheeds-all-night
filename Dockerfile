FROM node:18-alpine

WORKDIR /usr/local/app

ENV NODE_ENV=production

COPY public/ /usr/local/app/public
COPY src/ /usr/local/app/src/
COPY package.json /usr/local/app/

RUN npm install

EXPOSE 3000
