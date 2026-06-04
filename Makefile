PORT := 8765
PREVIEW := workspace/waterfall_preview.html

.PHONY: preview apply stop

preview:
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || true
	@cp waterfall.html $(PREVIEW)
	@python3 -m http.server $(PORT) --directory . > /dev/null 2>&1 &
	@sleep 0.4
	@open http://localhost:$(PORT)/$(PREVIEW)
	@echo "Preview → http://localhost:$(PORT)/$(PREVIEW)"
	@echo "Edit $(PREVIEW) freely, then run: make apply"

apply:
	@cp $(PREVIEW) waterfall.html
	@echo "Applied $(PREVIEW) → waterfall.html"

stop:
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || true
	@echo "Server stopped"
