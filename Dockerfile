FROM node:12.18.4 as build
WORKDIR /core
COPY ./ /core
RUN curl https://install.meteor.com/ | sh
RUN meteor npm install
RUN meteor build --server-only --directory dist/ --allow-superuser
RUN cat dist/bundle/programs/server/app/app.js | grep "theme-custom-css" -A10

FROM node:12.18.4-buster-slim
# dependencies
RUN groupadd -g 65533 -r rocketchat \
    && useradd -u 65533 -r -g rocketchat rocketchat \
    && mkdir -p /app/uploads \
    && chown rocketchat:rocketchat /app/uploads \
    && apt-get update \
    && apt-get install -y --no-install-recommends fontconfig

COPY --from=build /core/dist/ /app

RUN ls /app
RUN cat /app/bundle/programs/server/app/app.js | grep "theme-custom-css" -A10

RUN aptMark="$(apt-mark showmanual)" \
    && apt-get install -y --no-install-recommends g++ make python ca-certificates \
    && cd /app/bundle/programs/server \
    && npm install \
    && apt-mark auto '.*' > /dev/null \
    && apt-mark manual $aptMark > /dev/null \
    && find /usr/local -type f -executable -exec ldd '{}' ';' \
       | awk '/=>/ { print $(NF-1) }' \
       | sort -u \
       | xargs -r dpkg-query --search \
       | cut -d: -f1 \
       | sort -u \
       | xargs -r apt-mark manual \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && npm cache clear --force \
    && chown -R rocketchat:rocketchat /app

USER rocketchat

VOLUME /app/uploads

WORKDIR /app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

CMD ["node", "main.js"]
