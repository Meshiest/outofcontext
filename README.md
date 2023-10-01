# Out Of Context Party Games

See [OutOfContext.party](https://www.outofcontext.party) for more info!

## Contribute

### Setup

1. Clone Repo
2. `npm install`

### Development

1. Leave `npm run watch` running to rebuild the frontend.
2. Leave `npm start` running for the backend, restart when server changes are made.
3. Use Lobby `devaaaa` for development
4. Open `localhost:8080` in browser

### Production

1. Setup your `docker-compose.yml`
2. Run `export MODE=production; npm run build` to build production frontend
3. `docker-compose up -d` to start containers
4. `git pull && npm i && npm run update` to update, will kill running games
5. `docker-compose kill && docker-compose rm -f` to stop containers
6. Setup nginx based on the `nginx.conf` (no ssl) or `nginx.letsencrypt.conf`

### LetsEncrypt

Follow nginx instructions on certbot
