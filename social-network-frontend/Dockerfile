FROM node:24.22.2

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN if ! command -v yarn >/dev/null 2>&1; then npm install -g yarn; fi

RUN yarn install

COPY . .

# Development image: docker-compose runs the Vite dev server (yarn dev).
# The production build (yarn build) runs on the static host (see render.yaml).
EXPOSE 8080
