help: ## show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%s\033[0m|%s\n", $$1, $$2}' \
	| column -t -s '|'

run-web: ## run the web application
	(cd src/web && npm run dev)

run-api-test: ## run the api with test data
	(cd src/api && ASSET_FOLDER=test npm run dev)
	
run-api-ss1: ## run the api with ss1 data
	(cd src/api && ASSET_FOLDER=ss1 npm run dev)
	