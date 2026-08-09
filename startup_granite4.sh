#!/bin/bash
# Install Docker
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Install Caddy
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# Get public IP
IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
DASH_IP=$(echo $IP | tr '.' '-')
DOMAIN="$DASH_IP.sslip.io"

# Configure Caddy
cat <<EOF > /etc/caddy/Caddyfile
$DOMAIN {
    reverse_proxy localhost:11434
}
EOF
systemctl restart caddy

# Run the Ollama container
docker run -d --restart unless-stopped -p 11434:11434 \
  -v ollama:/root/.ollama \
  --name ollama-granite4 \
  ollama/ollama

# Wait for Ollama to start, then pull Granite4 model
# Adjust the model name 'granite-code:8b' or similar based on exact requirements
sleep 10
docker exec ollama-granite4 ollama pull granite3.1-dense:8b
