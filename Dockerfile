# For easier deployment, use Docker to deploy boombot with ease.

FROM node:20.18.3-bullseye-slim

RUN ldd --version

# Connect repo to container
# Example usage in docker-compose:
# volumes:
#     - ./BoomBot:/boombot
WORKDIR "/boombot"

COPY src src
COPY package.json package.json
COPY icon.jpg icon.jpg

# Setup Nodejs dependencies
RUN npm install

ENTRYPOINT [ "npm" ]
CMD [ "start" ]
