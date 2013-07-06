EMCC= `./find-emcc.py`/emcc

GCRYPT_BUILD= build/libgcrypt-1.5.0
LIBS= -L./build/lib
GCRYPT= -lgcrypt -lgpg-error --pre-js ./src/pre.js --post-js ./src/post.js
OTR= -lotr
FASTMPI= --pre-js ./src/fast_mpi.js
OPTIMISATION = -O2 --closure 0 --llvm-opts 1 --llvm-lto 0 -s ASM_JS=0
OPTIMISATION_CHROME = -O1 --closure 0 --llvm-opts 0 --llvm-lto 0 -s ASM_JS=0

TEST_OBJS=benchmark.o basic.o pubkey.o keygen.o prime.o ac-data.o ac.o ac-schemes.o curves.o \
    fips186-dsa.o fipsdrv.o hmac.o mpitests.o pkcs1v2.o random.o register.o rsacvt.o t-kdf.o \
    t-mpi-bit.o tsexp.o version.o

all: libotr-test test

test: basic.o pubkey.o random.o
	
test-all: $(TEST_OBJS)

libotr-test:
	mkdir -p tests/
	$(EMCC) src/libotr-test.c -o tests/libotr-test.js -I./build/include --embed-file keys/alice.keys \
         $(LIBS) $(OTR) $(GCRYPT) $(FASTMPI) $(OPTIMISATION)

run-test-all: $(TEST_OBJS:.o=.run)
	echo "-- ran all tests --"

run-test: basic.run pubkey.run random.run
	echo "-- ran basic tests --"

clean:
	rm -fr tests/*

%.o:
	mkdir -p tests/
	$(EMCC) $(GCRYPT_BUILD)/tests/$(@) -o tests/$(@:.o=)-fast.js $(LIBS) $(GCRYPT) $(OPTIMISATION) $(FASTMPI)

%.run:
	node tests/$(@:.run=)-fast --verbose

