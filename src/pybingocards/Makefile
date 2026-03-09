help: ## show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%s\033[0m|%s\n", $$1, $$2}' \
	| column -t -s '|'


generate: ## generate bingo cards and update summaries
	python3 generate_bingo_v5.py ${CONFIG_FILE}
	python3 generate_winning_summary.py ${CONFIG_FILE}
	python3 render_cards_pdf.py
	python3 render_cards_v2.py --output bingo_cards_v2_1_per_page.pdf
	python3 render_cards_v2.py --cards-per-page 2 --output bingo_cards_v2_2_per_page.pdf
	