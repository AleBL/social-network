FROM node:22.12.0

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN if ! command -v yarn >/dev/null 2>&1; then npm install -g yarn; fi

RUN yarn install

COPY . .

EXPOSE 3000
