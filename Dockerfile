# For easier deployment, use Docker to deploy boombot with ease.

FROM node:14

# Setup directories and files
RUN mkdir -p /boombot
COPY . /boombot

# Bind this volume to a directory on your machine to maintain persistent data 
# between container restarts or errors. This is highly required since the 
# "settings.json" must be included in this volume in order to start the bot.
VOLUME [ "/boombot/data" ]

# Setup Nodejs dependencies
RUN npm install

ENTRYPOINT [ "node" ]
CMD [ "src/bot.js" ]