FROM node:12 AS build
WORKDIR /
COPY package.json yarn.lock ./
RUN yarn install --production
COPY ./bin .
CMD ["node", "./now-playing-api.js"]
