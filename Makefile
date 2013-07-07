EMCC= `./find-emcc.py`/emcc

GCRYPT_BUILD= build/libgcrypt-1.5.2
LIBS= -L./build/lib
GCRYPT= -lgcrypt -lgpg-error --pre-js ./src/pre.js --post-js ./src/post.js
OTR= -lotr
FASTMPI= --pre-js ./src/fast_mpi.js
OPTIMISATION = -O2 --closure 0 --llvm-opts 1 --llvm-lto 0 -s ASM_JS=0
OPTIMISATION_CHROME = -O1 --closure 0 --llvm-opts 0 --llvm-lto 0 -s ASM_JS=0

TEST_OBJS=benchmark.js basic.js pubkey.js keygen.js prime.js ac-data.js ac.js ac-schemes.js curves.js \
    fips186-dsa.js fipsdrv.js hmac.js mpitests.js pkcs1v2.js random.js register.js rsacvt.js t-kdf.js \
    t-mpi-bit.js tsexp.o version.js

all: libotr-test test

test: basic.js pubkey.js random.js
	
test-all: $(TEST_OBJS)

libotr-test:
	mkdir -p tests/
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./build/include --embed-file keys/alice.keys \
         $(LIBS) $(OTR) $(GCRYPT) $(FASTMPI) $(OPTIMISATION)

run-test-all: $(TEST_OBJS:.js=.run-silent)

run-test: basic.run pubkey.run random.run

clean:
	rm -fr tests/*

%.js:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/$(@:.js=.o) -o tests/$(@) $(LIBS) $(GCRYPT) $(OPTIMISATION) $(FASTMPI)

%.run:
	node tests/$(@:.run=) --verbose

%.run-silent:
	node tests/$(@:.run-silent=)

web:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/basic.o -o tests/basic-web.js $(LIBS) $(GCRYPT) $(OPTIMISATION_CHROME) $(FASTMPI)
