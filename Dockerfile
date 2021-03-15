FROM node:14
EXPOSE 8080
ADD . /usr/src/app
WORKDIR /usr/src/app
RUN npm install
ENV MODE production
RUN npm run build
