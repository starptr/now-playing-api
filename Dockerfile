FROM node:12 AS build
WORKDIR /root/
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
CMD ["yarn", "deploy"]
