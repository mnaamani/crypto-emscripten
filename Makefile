EMCC= `./find-emcc.py`/emcc

GCRYPT_BUILD= build/libgcrypt-1.5.2
LIBS= -L./build/lib
GCRYPT= -lgcrypt -lgpg-error
OTR= -lotr
NODE= --pre-js ./src/pre-node.js
PRE= --pre-js ./src/pre.js --pre-js ./src/fast_mpi.js
#see notes.txt for best options to use
OPTIMISATION= -O2 --llvm-opts 1 --llvm-lto 0 -s ASM_JS=1 --closure 1 \
    -s EXPORTED_FUNCTIONS="['_main','_malloc','_free','__gcry_strerror','__gcry_mpi_new','__gcry_mpi_set','__gcry_mpi_release', \
            '__gcry_mpi_scan','__gcry_mpi_print']" -s IGNORED_FUNCTIONS="['__gcry_mpi_powm','__gcry_mpi_mulpowm','__gcry_mpi_invmod']"

TEST_OBJS=benchmark.js basic.js pubkey.js keygen.js prime.js ac-data.js ac.js ac-schemes.js curves.js \
    fips186-dsa.js fipsdrv.js hmac.js mpitests.js pkcs1v2.js random.js register.js rsacvt.js t-kdf.js \
    t-mpi-bit.js tsexp.o version.js

all: libotr-test test

test: basic.js pubkey.js random.js
	
test-all: $(TEST_OBJS)

libotr-test:
	mkdir -p tests/
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./build/include --embed-file keys/alice.keys \
         $(LIBS) $(OTR) $(GCRYPT) $(OPTIMISATION) $(NODE) $(PRE)

run-test-all: $(TEST_OBJS:.js=.run-silent)

run-test: basic.run pubkey.run random.run

clean:
	rm -fr tests/*

%.js:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/$(@:.js=.o) -o tests/$(@) $(LIBS) $(GCRYPT) $(OPTIMISATION) $(NODE) $(PRE)

%.run:
	node tests/$(@:.run=) --verbose

%.run-silent:
	node tests/$(@:.run-silent=)

web:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/basic.o -o tests/basic.html $(LIBS) $(GCRYPT) $(OPTIMISATION) $(PRE) --shell-file ./src/shell.html
