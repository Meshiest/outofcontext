# Out Of Context - production image (Node 22 LTS).
#
# Multi-stage build:
#   1) builder - installs ALL deps (root + client), typechecks the server, and runs the Vite
#      production build. Vite writes the client to /usr/src/app/public (see client/vite.config.ts
#      `build.outDir: '../public'`), which Express serves as static + SPA fallback (main.ts).
#   2) runtime - lean image with server (prod) deps only + the built public/, run as an
#      unprivileged user.
#
# Runtime = tsx, not compiled JS. `npm start` runs the TypeScript entry directly via tsx
# (`tsx --tsconfig server/tsconfig.json main.ts`). We deliberately do NOT `tsc` the server for
# runtime because server/tsconfig.json uses path aliases (e.g. @shared/*) and `tsc` alone does not
# rewrite those aliases in emitted output - a `node dist/main.js` runtime would fail to resolve
# them without an extra alias-rewrite step (tsc-alias) or an ESM loader. Matching the existing
# `npm start` (tsx) path is simpler and is the app's real run command.

# ---------------------------------------------------------------------------------------------
# Stage 1: builder
# ---------------------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Copy lockfiles first so the (expensive) dependency layers cache across source-only changes.
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/

# Reproducible, lockfile-driven installs for both the root (server + build tooling) and the client.
RUN npm ci
RUN cd client && npm ci

# Now bring in the sources (node_modules / public are excluded via .dockerignore, so the layers
# above are not clobbered).
COPY . .

# Build-time validation: typecheck the server. (The client build below runs `tsc -b` for the
# client half.) Remove this line if you prefer builds not to fail on server type errors.
RUN npm run typecheck:server

# Produce the production client into ../public (i.e. /usr/src/app/public). The client takes no
# build-time config: there are no VITE_-prefixed vars left, and fonts are self-hosted from npm.
RUN cd client && npm run build

# ---------------------------------------------------------------------------------------------
# Stage 2: runtime
# ---------------------------------------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Server (production) dependencies only.
# NOTE: `tsx` is required at runtime (npm start -> tsx main.ts) but currently lives in
# devDependencies, so `npm ci --omit=dev` alone would omit it. We install it explicitly here.
# RECOMMENDED (M9 cleanup): move `tsx` into "dependencies" in package.json, then this reduces to a
# single `npm ci --omit=dev` and the extra install can be deleted.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install --no-save tsx@4

# App source (run directly by tsx) + the built client from the builder stage. COPY, never ADD.
# server/ carries server/tsconfig.json, which tsx loads for path-alias resolution at runtime.
COPY main.ts gameInfo.ts ./
COPY core ./core
COPY server ./server
COPY shared ./shared
COPY --from=builder /usr/src/app/public ./public

# Save-store dir (also mounted as a compose volume). Owned by the unprivileged runtime user so the
# app can write lobby saves. When a host volume is mounted over this, the HOST dir must be writable
# by uid 1000 (the `node` user).
RUN mkdir -p persistence && chown node:node persistence

USER node
EXPOSE 8080
CMD ["npm", "start"]
