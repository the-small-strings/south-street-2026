help: ## show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%s\033[0m|%s\n", $$1, $$2}' \
	| column -t -s '|'

run-web: ## run the web application
#	# Override the API URL to point to localhost:3000 for local development
# 	(cd src/web && VITE_API_URL=http://localhost:3000 npm run dev)
	(cd src/web && npm run dev)

run-api-test: ## run the api with test data
	(cd src/api && ASSET_FOLDER=test STATE_FILE=$(CURDIR)/.api-state/test.json npm run dev)
	
run-api-ss1: ## run the api with ss1 data
	(cd src/api && ASSET_FOLDER=ss1 STATE_FILE=$(CURDIR)/.api-state/ss1.json npm run dev)

test-api: ## run the api tests
	(cd src/api && npm test)

# Docker commands
docker-build-api: ## build the api docker image
	docker build -t tss-api:latest src/api

docker-build-web: ## build the web docker image
	docker build -t tss-web:latest src/web

docker-build-all: docker-build-api docker-build-web ## build all docker images

docker-run-api: ## run the api docker container (default: ss1 assets)
	mkdir -p $(CURDIR)/.api-state && touch $(CURDIR)/.api-state/ss1.json
	docker run -it --rm --name tss-api -p 33001:33001 -e ASSET_FOLDER=ss1 -e STATE_FILE=/data/state.json -v $(CURDIR)/.api-state/ss1.json:/data/state.json tss-api:latest

docker-stop-api: ## stop the api docker container
	docker stop tss-api

docker-run-api-test: ## run the api docker container with test assets
	mkdir -p $(CURDIR)/.api-state && touch $(CURDIR)/.api-state/test.json
	docker run -it --rm --name tss-api -p 33001:33001 -e ASSET_FOLDER=test -e STATE_FILE=/data/state.json -v $(CURDIR)/.api-state/test.json:/data/state.json tss-api:latest

docker-run-web: ## run the web docker container
# 	docker run -it --rm --name tss-web -p 8080:80 -e API_BASE_URL=$(API_BASE_URL) tss-web:latest
	docker run -it --rm --name tss-web -p 8080:80 -e API_BASE_URL tss-web:latest

docker-stop-web: ## stop the web docker container
	docker stop tss-web