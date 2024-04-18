# -------------------------- Dev ---------------------------------------

FROM node:18-bullseye as dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        git bash g++ make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

RUN git config --global --add safe.directory /code


# -------------------------- Builder ---------------------------------------
FROM dev AS builder

COPY ./package.json ./yarn.lock /code/
RUN yarn install --frozen-lockfile && yarn cache clean

COPY . /code/
