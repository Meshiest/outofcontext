# Out Of Context Party Games

See [OutOfContext.party](https://www.outofcontext.party) for more info!

## Contribute

### Setup

1. Clone Repo
2. `npm install`

### Development

1. Leave `npm run watch` running to rebuild the frontend.
2. Leave `npm start` running for the backend, restart when server changes are made.
3. Use Lobby `aaaa` for development
4. Open `localhost:8080` in browser

### Production

1. Setup your `docker-compose.yml` and `nginx.conf`
2. Run `export MODE=production; npm run build` to build production frontend
3. `docker-compose up -d` to start containers
4. `git pull && npm run update` to update, will kill running games
5. `docker-compose kill && docker-compose rm -f` to stop containers


### LetsEncrypt

Copy `docker-compose.letsencrypt.yml` and `nginx.letsencrypt.conf` to `docker-compose.yml` and `nginx.conf` respectively. Edit as necessary

`certbot-auto` works using `public` as webroot. Do not use certbot auto's nginx option as this is a containerized environment.