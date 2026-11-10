# Social Network Frontend

Vue 3 app built with [Vite](https://vite.dev), tested with [Vitest](https://vitest.dev).

Requires Node.js from the repo [`.nvmrc`](../.nvmrc) and Yarn 1 (`corepack enable`).

| Command | What it does |
|---|---|
| `yarn install` | Install dependencies |
| `yarn dev` | Dev server with hot reload on http://localhost:8080 |
| `yarn build` | Production build into `dist/` |
| `yarn preview` | Serve the production build locally |
| `yarn lint` | Lint with ESLint (`yarn lint:fix` to auto-fix) |
| `yarn test` | Run unit tests once (`yarn test:watch` to watch) |

Configuration: [`vite.config.js`](vite.config.js) (dev server, aliases, Vitest) and [`eslint.config.js`](eslint.config.js).

## Environment

Copy [`.env.example`](.env.example) to `.env` in this folder. `VITE_API_URL` is the backend base URL (default `http://localhost:3000`). Vite inlines it at build time, so changing it requires a new build. The backend must allow this app's origin in its `CORS_ORIGIN`.
