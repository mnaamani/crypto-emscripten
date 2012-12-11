##Libgcrypt and libotr cross-compiled to javascript

###Build script to cross-compile [GNU Libgcrypt](http://www.gnu.org/software/libgcrypt/) and [Off-the-Record Messaging](http://www.cypherpunks.ca/otr/) C libraries javascript using the awsome [Emscripten](http://emscripten.org) compiler.

Public-Key Crypto booster:
Some of libgcrypt's mpi functions are overidden with a javascript implementation using [bigint.js]() for a significant performance boost of the public key crypto.

   _gcry_mpi_gcd
   _gcry_mpi_mod
   _gcry_mpi_powm
   _gcry_mpi_invm
   _gcry_mpi_mulpowm
   gen_prime

A Cryptographically secure pseudo-random number generator (CSPRNG):

The /dev/random and /dev/urandom virtual devices are implementation using the technique borrowed from arlo's [otr javascript implementation](), which utilises [seedrandom.js]() 


1. customise the build script: ./build-libs 
    EMSCRIPTEN_HOME= location of emcc emscripten compiler
    CLANG_HOME = location of llvm clang

2. customise the Makefile with location of Emscripten

3. build the libraries
    ./build-libs

run some tests..

basic libgcrypt tests
    make gcrypt-tests-fastmpi
    node tests/basic-fast.js --verbose

basic libotr test
    make libotr-test
    node tests/libotr-test.js
