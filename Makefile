dev: fonts
	npm run dev

render: fonts
	./render.sh

fonts: vendor/Roboto.ttf vendor/Roboto-Italic.ttf

vendor/Roboto.ttf:
	mkdir -p vendor
	curl -sL "https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf" -o $@

vendor/Roboto-Italic.ttf:
	mkdir -p vendor
	curl -sL "https://github.com/google/fonts/raw/main/ofl/roboto/Roboto-Italic%5Bwdth%2Cwght%5D.ttf" -o $@
