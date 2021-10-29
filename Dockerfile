from node

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Create app directory
WORKDIR /home/node/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

expose 3000

RUN npm install

USER node

# Bundle app source
COPY --chown=node:node . .

CMD [ "/usr/local/bin/node","server.js"]
