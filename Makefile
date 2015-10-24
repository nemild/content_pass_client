CONCATER=webpack

compile:
	$(CONCATER) --optimize-minimize

development:
	$(CONCATER) -d

watch:
	$(CONCATER) -w

clean:
	rm ./js/backend.js ./js/backend.js.map ./js/frontend.js ./js/frontend.js.map
