docker-compose build --build-arg PLATFORM="$PLATFORM" --build-arg VCAP_SERVICES="$VCAP_SERVICES" --build-arg VCAP_APPLICATION="$VCAP_APPLICATION"  --build-arg SNYK_TOKEN="$SNYK_TOKEN" --build-arg AWS_CONFIG="$AWS_CONFIG" fs-intake-frontend
docker-compose build --build-arg PLATFORM="$PLATFORM" --build-arg VCAP_SERVICES="$VCAP_SERVICES" --build-arg VCAP_APPLICATION="$VCAP_APPLICATION"  --build-arg SNYK_TOKEN="$SNYK_TOKEN" --build-arg AWS_CONFIG="$AWS_CONFIG" fs-intake-server
