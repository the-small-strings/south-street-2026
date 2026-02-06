help: ## show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%s\033[0m|%s\n", $$1, $$2}' \
	| column -t -s '|'

# REVEAL_DELAY_MS ?= 5000
REVEAL_DELAY_MS ?= 10000

run-web: ## run the web application
#	# Override the API URL to point to localhost:3000 for local development
# 	(cd src/web && VITE_API_URL=http://localhost:3000 npm run dev)
	(cd src/web && npm run dev)

run-api-test: ## run the api with test data
	(cd src/api && REVEAL_DELAY_MS=$(REVEAL_DELAY_MS) ASSET_FOLDER=test STATE_FILE=$(CURDIR)/.api-state/test.json npm run dev)
	
run-api-ss1: ## run the api with ss1 data
	(cd src/api && REVEAL_DELAY_MS=$(REVEAL_DELAY_MS) ASSET_FOLDER=ss1 STATE_FILE=$(CURDIR)/.api-state/ss1.json npm run dev)

test-api: ## run the api tests
	(cd src/api && npm test)

run-stomp: ## run the stomp controller
	(cd src/tss-stomp && USE_MOCK_GPIO=true API_BASE_URL=http://localhost:33001 uv run -m tss_stomp.main)

reset-api-state: ## reset the api state files
	rm -f $(CURDIR)/.api-state/*.json
	mkdir -p $(CURDIR)/.api-state

# Docker Compose commands
ASSET_FOLDER ?= ss1
STATE_FILE ?= $(CURDIR)/.api-state/$(ASSET_FOLDER).json
API_BASE_URL ?= http://localhost:33001

docker-build-api: ## build the api docker image
	docker compose build api

docker-build-web: ## build the web docker image
	docker compose build web

docker-build-all: ## build all docker images
	docker compose build

docker-up: docker-ensure-state ## run all services via docker compose (default: ss1)
	ASSET_FOLDER=$(ASSET_FOLDER) STATE_FILE=$(STATE_FILE) REVEAL_DELAY_MS=$(REVEAL_DELAY_MS) API_BASE_URL=$(API_BASE_URL) docker compose up

docker-up-detached: docker-ensure-state ## run all services via docker compose in detached mode
	ASSET_FOLDER=$(ASSET_FOLDER) STATE_FILE=$(STATE_FILE) REVEAL_DELAY_MS=$(REVEAL_DELAY_MS) API_BASE_URL=$(API_BASE_URL) docker compose up -d

docker-down: ## stop all docker compose services
	docker compose down

docker-logs: ## view logs from docker compose services
	docker compose logs -f

docker-ensure-state: ## ensure state file exists
	mkdir -p $(CURDIR)/.api-state && touch $(STATE_FILE)

# Docker Compose with ss1 config
docker-up-ss1: ## run all services with ss1 config
	$(MAKE) docker-up ASSET_FOLDER=ss1 STATE_FILE=$(CURDIR)/.api-state/ss1.json

docker-up-ss1-detached: ## run all services with ss1 config in detached mode
	$(MAKE) docker-up-detached ASSET_FOLDER=ss1 STATE_FILE=$(CURDIR)/.api-state/ss1.json

# Docker Compose with test config
docker-up-test: ## run all services with test config
	$(MAKE) docker-up ASSET_FOLDER=test STATE_FILE=$(CURDIR)/.api-state/test.json

docker-up-test-detached: ## run all services with test config in detached mode
	$(MAKE) docker-up-detached ASSET_FOLDER=test STATE_FILE=$(CURDIR)/.api-state/test.json

# Individual service commands (for backward compatibility)
docker-run-api: docker-ensure-state ## run only the api service (default: ss1)
	ASSET_FOLDER=$(ASSET_FOLDER) STATE_FILE=$(STATE_FILE) REVEAL_DELAY_MS=$(REVEAL_DELAY_MS) docker compose up api

docker-run-api-ss1: ## run the api service with ss1 config
	$(MAKE) docker-run-api ASSET_FOLDER=ss1 STATE_FILE=$(CURDIR)/.api-state/ss1.json

docker-run-api-test: ## run the api service with test config
	$(MAKE) docker-run-api ASSET_FOLDER=test STATE_FILE=$(CURDIR)/.api-state/test.json

docker-run-web: ## run only the web service
	API_BASE_URL=$(API_BASE_URL) docker compose up web

docker-stop-api: ## stop the api service
	docker compose stop api

docker-stop-web: ## stop the web service
	docker compose stop web