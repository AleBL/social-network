FROM node:24.22.2

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN if ! command -v yarn >/dev/null 2>&1; then npm install -g yarn; fi

RUN yarn install

COPY . .

EXPOSE 3000
