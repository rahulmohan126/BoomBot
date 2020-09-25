# For easier deployment, use Docker to deploy boombot with ease.

FROM node:latest

RUN ldd --version

# Connect repo to container
# Example usage in docker-compose:
# volumes:
#     - ./BoomBot:/boombot
WORKDIR "/boombot"

COPY src src
COPY package.json package.json

# Setup Nodejs dependencies
RUN npm install

ENTRYPOINT [ "npm" ]
CMD [ "start" ]
