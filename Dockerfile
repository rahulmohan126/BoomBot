# For easier deployment, use Docker to deploy boombot with ease.

FROM node:14

# Connect repo to container
# Example usage in docker-compose:
# volumes:
#     - ./BoomBot:/boombot
VOLUME [ "/boombot" ]

# Setup Nodejs dependencies
RUN cd boombot && npm install

ENTRYPOINT [ "npm" ]
CMD [ "start" ]