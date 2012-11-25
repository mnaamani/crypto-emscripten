EMCC= ~/Dev/emscripten/emcc
GCRYPT_TESTS= build/libgcrypt-1.5.0/tests
LIBS= -lgcrypt -lgpg-error -L./build/lib --pre-js ./src/pre.js
FASTMPI= -lgcrypt -lgpg-error -L./build/lib --pre-js ./src/fast_mpi.js 

libotr-test:
	mkdir tests/
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./build/include -lotr \
		--embed-file src/alice.keys $(FASTMPI)

gcrypt-tests:
	mkdir tests/
	$(EMCC) $(GCRYPT_TESTS)/benchmark.o -o tests/benchmark.js $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/benchmark.o -o tests/benchmark-fast.js $(FASTMPI)
	$(EMCC) $(GCRYPT_TESTS)/basic.o     -o tests/basic.js  $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/pubkey.o    -o tests/pubkey.js $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/keygen.o    -o tests/keygen.js $(LIBS)
	$(EMCC) $(GCRYPT_TESTS)/prime.o     -o tests/prime.js  $(LIBS)
