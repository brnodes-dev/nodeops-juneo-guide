# Use a more modern base image to support glibc >= 2.34
FROM node:20-bookworm

LABEL maintainer="Docker Expert"

# Install necessary system tools
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ca-certificates git wget curl procps unzip && \
    rm -rf /var/lib/apt/lists/*

# Create juneogo user
RUN useradd --create-home --home-dir /home/juneogo --shell /bin/bash juneogo

# Working directory
WORKDIR /opt/juneo-web

# Copy Node app
COPY package.json /opt/juneo-web/
COPY server.js /opt/juneo-web/
COPY entrypoint.sh /opt/juneo-web/
COPY public /opt/juneo-web/public

# Permissions for web app entrypoint
RUN chmod +x /opt/juneo-web/entrypoint.sh

# Install dependencies
RUN npm install --only=production

# 1. Clone Juneo binaries into a temporary location
RUN git clone https://github.com/Juneo-io/juneogo-binaries /tmp/juneogo-binaries

# 2. Prepare base directories for juneogo user ($HOME is /home/juneogo)
RUN mkdir -p /home/juneogo/.juneogo/plugins \
    && mkdir -p /home/juneogo/.juneogo/staking \
    && chown -R juneogo:juneogo /home/juneogo

# 3. Grant execution permissions to all required binaries in the temporary clone
RUN chmod +x /tmp/juneogo-binaries/juneogo \
    && chmod +x /tmp/juneogo-binaries/plugins/jevm \
    && chmod +x /tmp/juneogo-binaries/plugins/srEr2XGGtowDVNQ6YgXcdUb16FGknssLTGUFYg7iMqESJ4h8e

# 4. Move binaries to their final, documented locations:
#    - juneogo moves to /home/juneogo/
#    - plugins move to /home/juneogo/.juneogo/plugins/
RUN mv /tmp/juneogo-binaries/juneogo /home/juneogo/juneogo \
    && mv /tmp/juneogo-binaries/plugins/jevm /home/juneogo/.juneogo/plugins/jevm \
    && mv /tmp/juneogo-binaries/plugins/srEr2XGGtowDVNQ6YgXcdUb16FGknssLTGUFYg7iMqESJ4h8e /home/juneogo/.juneogo/plugins/srEr2XGGtowDVNQ6YgXcdUb16FGknssLTGUFYg7iMqESJ4h8e \
    && rm -rf /tmp/juneogo-binaries # Clean up the temporary clone

# Expose HTTP and RPC
EXPOSE 8080 9650

# Run as root to start services
USER root

ENTRYPOINT ["/opt/juneo-web/entrypoint.sh"]

