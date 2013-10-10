#!/bin/bash

#library versions
LIBGPG_ERROR_VERSION="1.12"
LIBGCRYPT_VERSION="1.5.3"
LIBOTR_VERSION="4.0.0"


#commandline argument
EMSCRIPTEN=$1
if [ "${EMSCRIPTEN}" == "" ]
then
    #environment variable EMSCRIPTEN_ROOT
    EMSCRIPTEN=${EMSCRIPTEN_ROOT}
    if [ "${EMSCRIPTEN}" == "" ]
    then
        #EMSCRIPTEN_ROOT from ~/.emscripten python config file
        EMSCRIPTEN=`./find-emcc.py`
    fi
fi

if [ ! -e "${EMSCRIPTEN}/emcc" ]
then
  echo "emscripten not found at ${EMSCRIPTEN}"
  exit 1
fi

LLVM_ROOT=`${EMSCRIPTEN}/em-config LLVM_ROOT`
export CPP="${LLVM_ROOT}/clang -E"

mkdir -p build
mkdir -p build/patches
cp src/patches/* build/patches/

pushd build

# download libgpg-error
if [ ! -e "libgpg-error-${LIBGPG_ERROR_VERSION}.tar.bz2" ]
then
  echo "Downloding libgpg-error-${LIBGPG_ERROR_VERSION}.tar.bz2"
  curl -O "ftp://ftp.gnupg.org/gcrypt/libgpg-error/libgpg-error-${LIBGPG_ERROR_VERSION}.tar.bz2" 
fi

# download libgcrypt
if [ ! -e "libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2" ]
then
  echo "Downloading libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2"
  curl -O "ftp://ftp.gnupg.org/gcrypt/libgcrypt/libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2"
fi

# download libotr
if [ ! -e "libotr-${LIBOTR_VERSION}.tar.gz" ]
then
  echo "Downloading libotr-${LIBOTR_VERSION}.tar.gz"
  curl -O "http://www.cypherpunks.ca/otr/libotr-${LIBOTR_VERSION}.tar.gz"
fi

tar xjf "libgpg-error-${LIBGPG_ERROR_VERSION}.tar.bz2"
tar xjf "libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2"
tar xzf "libotr-${LIBOTR_VERSION}.tar.gz"

#configure and build libgpg-error
pushd "libgpg-error-${LIBGPG_ERROR_VERSION}"
BASEDIR=$(dirname $(pwd))
${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --enable-static --disable-shared --disable-nls
mv src/Makefile src/Makefile.original
sed -e 's:\$(CC_FOR_BUILD) -I\. -I\$(srcdir) -o $@:\$(CC_FOR_BUILD) -I. -I\$(srcdir) -o $@.js:' \
    -e 's:\./mkerrcodes:node ./mkerrcodes.js:' src/Makefile.original > src/Makefile
make
make install
popd

#patch ec_powm function to use multiplication instead of exponentiation
patch "libgcrypt-${LIBGCRYPT_VERSION}/mpi/ec.c" patches/ec_powm.patch

#override powm, mulpowm, and invmod
cp patches/mpi-*.c "libgcrypt-${LIBGCRYPT_VERSION}/mpi/"

#configure and build-libgcrypt
pushd "libgcrypt-${LIBGCRYPT_VERSION}"
BASEDIR=$(dirname $(pwd))
${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --with-gpg-error-prefix=${BASEDIR} --disable-asm --enable-static --disable-shared
mv config.h config.h.original
sed -e "s:#define HAVE_SYSLOG 1::" \
    -e "s:#define HAVE_SYS_SELECT_H 1::" config.h.original > config.h
make
make install
popd

#configure and build libotr
pushd "libotr-${LIBOTR_VERSION}"
BASEDIR=$(dirname $(pwd))
${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --with-libgcrypt-prefix=${BASEDIR} --disable-static --enable-shared --disable-gcc-hardening
make
make install
popd

popd
