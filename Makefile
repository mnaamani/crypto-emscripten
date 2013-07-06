EMCC= `./find-emcc.py`/emcc

GCRYPT_BUILD= build/libgcrypt-1.5.0
LIBS= -L./build/lib
GCRYPT= -lgcrypt -lgpg-error --pre-js ./src/pre.js --post-js ./src/post.js
OTR= -lotr
FASTMPI= --pre-js ./src/fast_mpi.js
OPTIMISATION = -O2 --closure 0 --llvm-opts 1 --llvm-lto 0 -s ASM_JS=0

TEST_OBJS=benchmark.o basic.o pubkey.o keygen.o prime.o ac-data.o ac.o ac-schemes.o curves.o \
    fips186-dsa.o fipsdrv.o hmac.o mpitests.o pkcs1v2.o random.o register.o rsacvt.o t-kdf.o \
    t-mpi-bit.o tsexp.o version.o

TESTS=$(TEST_OBJS:.o=._js)
TESTS_FASTMPI=$(TEST_OBJS:.o=.__js)

all: libotr-test tests-fastmpi tests

tests: $(TESTS)

tests-fastmpi: $(TESTS_FASTMPI)

libotr-test:
	mkdir -p tests/
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./build/include --embed-file keys/alice.keys \
         $(LIBS) $(OTR) $(GCRYPT) $(FASTMPI) $(OPTIMISATION)

clean:
	rm -fr tests/*

%._js:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/$(@:._js=.o) -o tests/$(@:._js=).js $(LIBS) $(GCRYPT) $(OPTIMISATION)

%.__js:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/$(@:.__js=.o) -o tests/$(@:.__js=)-fast.js $(LIBS) $(GCRYPT) $(OPTIMISATION) $(FASTMPI)
