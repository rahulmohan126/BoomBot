# For easier deployment, use Docker to deploy boombot with ease.

FROM node:18-bullseye

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
