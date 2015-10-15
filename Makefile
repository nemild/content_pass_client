SRC_RAW=./src/
SRC=./src/*.js

DEST=./js
DEST_FINAL=./js/src

CONCAT_INPUT=extension_script.js
CONCAT_OUTPUT=backend.js

TRANSPILER=babel
CONCATER=webpack
WATCH=watch

compile:
	$(TRANSPILER) $(SRC) -d $(DEST)
	$(CONCATER) $(DEST_FINAL)/$(CONCAT_INPUT) $(DEST_FINAL)/$(CONCAT_OUTPUT)

watch:
	$(WATCH) "make" $(SRC_RAW)
