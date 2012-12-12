EMCC= `./find-emcc.py`/emcc

GCRYPT= build/libgcrypt-1.5.0
LIBS= -lgcrypt -lgpg-error -L./build/lib --pre-js ./src/pre.js
FASTMPI= -lgcrypt -lgpg-error -L./build/lib --pre-js ./src/fast_mpi.js 
#malloc fails if -O2 used without llvm-opts 1
OPTIMISATION = -O2 --closure 0 --llvm-opts 1 --llvm-lto 0

TEST_OBJS=benchmark.o basic.o pubkey.o keygen.o prime.o ac-data.o ac.o ac-schemes.o curves.o \
    fips186-dsa.o fipsdrv.o hmac.o mpitests.o pkcs1v2.o random.o register.o rsacvt.o t-kdf.o \
    t-mpi-bit.o tsexp.o version.o

TESTS=$(TEST_OBJS:.o=._js)
TESTS_FASTMPI=$(TEST_OBJS:.o=.__js)

all: libotr-test tests-fastmpi tests

tests: $(TESTS)

tests-fastmpi: $(TESTS_FASTMPI)

libotr-test:
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./build/include -lotr \
		--embed-file keys/alice.keys $(FASTMPI) $(OPTIMISATION)
clean:
	rm -fr tests/*

%._js:
	$(EMCC) $(GCRYPT)/tests/$(@:._js=.o) -o tests/$(@:._js=).js $(LIBS) $(OPTIMISATION)

%.__js:
	$(EMCC) $(GCRYPT)/tests/$(@:.__js=.o) -o tests/$(@:.__js=)-fast.js $(LIBS) $(OPTIMISATION) $(FASTMPI)
