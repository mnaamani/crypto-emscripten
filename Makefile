EMCC= ~/Dev/emscripten/emcc
GCRYPT_TESTS= build/libgcrypt-1.5.0/tests
LIBS= -lgcrypt -lgpg-error -L./build/lib --pre-js ./src/pre.js

libotr-test:
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./buid/include -lotr \
		--embed-file src/alice.keys $(LIBS)

gcrypt-tests:
	$(EMCC) $(GCRYPT_TESTS)/benchmark.o -o tests/benchmark.js $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/basic.o     -o tests/basic.js  $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/pubkey.o    -o tests/pubkey.js $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/keygen.o    -o tests/keygen.js $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/prime.o     -o tests/prime.js  $(LIBS)

