# For easier deployment, use Docker to deploy boombot with ease.

FROM node:14

# Connect repo to container
# Example usage in docker-compose:
# volumes:
#     - ./BoomBot:/boombot
RUN mkdir boombot

COPY ./src /boombot/src
COPY ./package-lock.json /boombot
COPY ./package.json /boombot

# Setup Nodejs dependencies
RUN cd boombot && npm install

WORKDIR "/boombot"

ENTRYPOINT [ "npm" ]
CMD [ "start" ]
