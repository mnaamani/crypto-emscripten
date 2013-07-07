#!/bin/bash

#library versions
LIBGPG_ERROR_VERSION="1.10"
LIBGCRYPT_VERSION="1.5.2"
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

#always rebuild from scratch
rm "libgpg-error-${LIBGPG_ERROR_VERSION}/config.status"
rm "libgcrypt-${LIBGCRYPT_VERSION}/config.status"
rm "libotr-${LIBOTR_VERSION}/config.status"

#configure and build libgpg-error
if [ ! -e "libgpg-error-${LIBGPG_ERROR_VERSION}/config.status" ]
then
	tar xjf "libgpg-error-${LIBGPG_ERROR_VERSION}.tar.bz2"
	pushd "libgpg-error-${LIBGPG_ERROR_VERSION}"
	BASEDIR=$(dirname $(pwd))
	${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --enable-static --disable-shared
    mv src/Makefile src/Makefile.original
    sed -e 's:\$(CC_FOR_BUILD) -I\. -I\$(srcdir) -o $@:\$(CC_FOR_BUILD) -I. -I\$(srcdir) -o $@.js:' \
        -e 's:\./mkerrcodes:node ./mkerrcodes.js:' src/Makefile.original > src/Makefile
    make
    make install
	popd
fi

#configure and build-libgcrypt
if [ ! -e "libgcrypt-${LIBGCRYPT_VERSION}/config.status" ]
then
    tar xjf "libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2"
    pushd "libgcrypt-${LIBGCRYPT_VERSION}"
    BASEDIR=$(dirname $(pwd))
    ${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --with-gpg-error-prefix=${BASEDIR} --disable-asm --enable-static --disable-shared
    mv config.h config.h.original
    sed -e "s:#define HAVE_SYSLOG 1::" \
        -e "s:#define HAVE_SYS_SELECT_H 1::" config.h.original > config.h
    mv mpi/mpi-internal.h mpi/mpi-internal.h.original
    sed -e 's:#include "mpi-inline.h"::' mpi/mpi-internal.h.original > mpi/mpi-internal.h
    make
    make install
    popd
fi

#configure and build libotr
if [ ! -e "libotr-${LIBOTR_VERSION}/config.status" ]
then
    tar xzf "libotr-${LIBOTR_VERSION}.tar.gz"
    pushd "libotr-${LIBOTR_VERSION}"
    BASEDIR=$(dirname $(pwd))
    ${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --with-libgcrypt-prefix=${BASEDIR} --disable-static --enable-shared
    make
    make install
    popd
fi

popd
