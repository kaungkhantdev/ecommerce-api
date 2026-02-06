#!/usr/bin/env bash
set -euo pipefail

# Usage: deploy.sh <image-tag> <environment> <dockerhub-username>
# Example: deploy.sh sha-abc1234 staging myuser

IMAGE_TAG="${1:?Error: Image tag is required (e.g. sha-abc1234)}"
ENVIRONMENT="${2:?Error: Environment is required (staging or production)}"
DOCKERHUB_USERNAME="${3:?Error: Docker Hub username is required}"
IMAGE_NAME="${DOCKERHUB_USERNAME}/ecommerce-api"
COMPOSE_PROJECT="ecommerce-${ENVIRONMENT}"

echo "=== Deploying ${IMAGE_NAME}:${IMAGE_TAG} to ${ENVIRONMENT} ==="

# Pull the latest image
echo "Pulling image..."
docker pull "${IMAGE_NAME}:${IMAGE_TAG}"

# Tag as current for the environment
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${IMAGE_NAME}:${ENVIRONMENT}-current"

# Run database migrations
echo "Running database migrations..."
docker run --rm \
  --network "${COMPOSE_PROJECT}_default" \
  --env-file "/opt/${COMPOSE_PROJECT}/.env" \
  "${IMAGE_NAME}:${IMAGE_TAG}" \
  run prisma:migrate:deploy

# Stop existing container and start new one
echo "Restarting application..."
cd "/opt/${COMPOSE_PROJECT}"
export IMAGE_TAG="${IMAGE_TAG}"
docker compose pull api
docker compose up -d api

# Health check
echo "Waiting for health check..."
RETRIES=10
DELAY=5
for i in $(seq 1 $RETRIES); do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "Health check passed on attempt ${i}"
    break
  fi
  if [ "$i" -eq "$RETRIES" ]; then
    echo "Health check failed after ${RETRIES} attempts"
    exit 1
  fi
  echo "Attempt ${i}/${RETRIES} failed, retrying in ${DELAY}s..."
  sleep $DELAY
done

# Clean up old images (keep last 3)
echo "Cleaning up old images..."
docker image prune -f
docker images "${IMAGE_NAME}" --format '{{.ID}} {{.CreatedAt}}' \
  | sort -k2 -r \
  | tail -n +4 \
  | awk '{print $1}' \
  | xargs -r docker rmi 2>/dev/null || true

echo "=== Deployment to ${ENVIRONMENT} complete ==="
