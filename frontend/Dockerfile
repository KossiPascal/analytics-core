FROM node:22 AS build
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
CMD ["npm", "run", "dev"]
