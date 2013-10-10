EMCC= `./find-emcc.py`/emcc

GCRYPT_BUILD= build/libgcrypt-1.5.3
LIBS= -L./build/lib
GCRYPT= -lgcrypt -lgpg-error
OTR= -lotr
NODE= --pre-js ./src/pre-node.js
OPTIMISATION= -O2 --llvm-opts 1 --llvm-lto 0 -s ASM_JS=1 --closure 1 --js-library src/library_gcrypt.js \
    -s LINKABLE=1 -s EXPORTED_FUNCTIONS="['_main','__gcry_mpi_new','__gcry_mpi_set','__gcry_mpi_release','__gcry_mpi_print','__gcry_mpi_scan','__gcry_strerror']"

TEST_OBJS=benchmark.js basic.js pubkey.js keygen.js prime.js ac-data.js ac.js ac-schemes.js curves.js \
    fips186-dsa.js fipsdrv.js hmac.js mpitests.js pkcs1v2.js random.js register.js rsacvt.js t-kdf.js \
    t-mpi-bit.js tsexp.o version.js

all: libotr-test test

test: basic.js pubkey.js random.js
	
test-all: $(TEST_OBJS)

libotr-test:
	mkdir -p tests/
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./build/include --embed-file keys/alice.keys \
         $(LIBS) $(OTR) $(GCRYPT) $(NODE) $(OPTIMISATION)

run-test-all: $(TEST_OBJS:.js=.run-silent)

run-test: basic.run pubkey.run random.run

clean:
	rm -fr tests/*

%.js:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/$(@:.js=.o) -o tests/$(@) $(LIBS) $(GCRYPT) $(NODE) $(OPTIMISATION)

%.run:
	node tests/$(@:.run=) --verbose

%.run-silent:
	node tests/$(@:.run-silent=)

web:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/basic.o -o tests/basic.html $(LIBS) $(GCRYPT) $(OPTIMISATION) --shell-file ./src/shell.html

bench:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/benchmark.o -o tests/benchmark.js $(LIBS) $(GCRYPT) $(NODE) $(OPTIMISATION)
