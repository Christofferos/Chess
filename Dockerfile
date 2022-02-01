# Choose the Image which has Node installed already
FROM node:alpine

# Create app directory
WORKDIR /usr/src/chess-app

# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN yarn
RUN cd client && yarn
RUN cd server && yarn

# COPY all the files from Current Directory into the Container
COPY . .

# Build the app
RUN cd client && yarn build:prod

EXPOSE 8989
CMD [ "yarn", "start" ]

### CHEAT SHEET ###

# docker build -t ekriwer/docker-nodejs-chess .
# docker images
# docker logs
# docker container run -it -p 8989:8989 -d --name chess-container ekriwer/docker-nodejs-chess

# ------------------------------ #

## How to start and stop the container 
# docker stop <containername/id>  # to stop the container which is running in background mode
# docker container start <containername/id> # to start the already stopped container

## Monitoring the Container 
# docker container list # list the containers created
# docker container ls -a  #to list the containers including not running containers
# docker ps    #to list the running container
# docker info #docker engine status including container running/paused/stopped containers list
# docker container stats <containername/id> #prints the CPU and MEM usage data of the container name
# docker container stats #prints the CPU and MEM usage of all running containers
# docker container top <containername/id> #executes the top command in the container specified, fails if the specified container is not running

## How to remove/delete the container
# docker container rm <containername/id> # Remove the Container 

## How to remove/delete the image
# docker container rmi <imagename/imageid> # Remove the image

## How to view the logs of the running container
# docker container logs <containername/id> # to view the logs of the container 

# ------------------------------ #