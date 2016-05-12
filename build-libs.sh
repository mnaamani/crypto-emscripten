#!/bin/bash

#library versions
LIBGPG_ERROR_VERSION="1.22"
LIBGCRYPT_VERSION="1.6.2"
LIBOTR_VERSION="4.1.1"


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
  curl -O "https://otr.cypherpunks.ca/libotr-${LIBOTR_VERSION}.tar.gz"
fi

tar xjf "libgpg-error-${LIBGPG_ERROR_VERSION}.tar.bz2"
tar xjf "libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2"
tar xzf "libotr-${LIBOTR_VERSION}.tar.gz"

#configure and build libgpg-error
pushd "libgpg-error-${LIBGPG_ERROR_VERSION}"
BASEDIR=$(dirname $(pwd))
${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --enable-shared --disable-static --disable-nls --disable-threads --disable-doc --host=x86-unknown-linux "CFLAGS=-m32"
cp config.h src/root_config.h
cp src/Makefile src/Makefile.original
sed -e 's:\$(CC_FOR_BUILD) -I\. -I\$(srcdir) -o $@:\$(CC_FOR_BUILD) -I. -I\$(srcdir) -o $@.js:' \
    -e 's:\./mkerrcodes:node ./mkerrcodes.js:' \
    -e 's:gen-posix-lock-obj\$(EXEEXT):gen-posix-lock-obj.js:' \
    -e 's:Makefile gen-posix-lock-obj posix-lock-obj.h:Makefile gen-posix-lock-obj.js posix-lock-obj.h:' \
    -e 's:\./gen-posix-lock-obj >\$@:node ./gen-posix-lock-obj.js >\$@:' \
    -e 's:\$(CC_FOR_BUILD) -g -O0 -I. -I\$(srcdir) -o \$@ \$(srcdir)/mkheader.c:\$(CC_FOR_BUILD) -g -O0 -I. -I\$(srcdir) -o \$@.js \$(srcdir)/mkheader.c --embed-file ./root_config.h --embed-file ./gpg-error.h.in --embed-file ./err-sources.h.in --embed-file ./err-codes.h.in --embed-file ./errnos.in --embed-file ./lock-obj-pub.native.h:' \
    -e 's:\./mkheader $(host_os) $(host_triplet)  $(srcdir)/gpg-error.h.in:node ./mkheader.js $(host_os) $(host_triplet)  $(srcdir)/gpg-error.h.in:' \
    -e 's:\.\./config.h \$(PACKAGE_VERSION) \$(VERSION_NUMBER) >\$@:./root_config.h $(PACKAGE_VERSION) $(VERSION_NUMBER) >$@:' \
    src/Makefile.original > src/Makefile

# Skip tests
cp Makefile Makefile.original
sed -e 's:DIST_SUBDIRS = m4 src doc tests po lang:DIST_SUBDIRS = m4 src doc po lang:' \
    -e 's:SUBDIRS = m4 src \$(doc) tests po \$(lang_subdirs):SUBDIRS = m4 src $(doc) po $(lang_subdirs):' \
    Makefile.original > Makefile

make clean
make
make install
popd

#patch ec_powm function to use multiplication instead of exponentiation
patch "libgcrypt-${LIBGCRYPT_VERSION}/mpi/ec.c" patches/ec_powm.patch

#override powm, mulpowm, and invmod
cp patches/mpi-pow.c "libgcrypt-${LIBGCRYPT_VERSION}/mpi/"
cp patches/mpi-mpow.c "libgcrypt-${LIBGCRYPT_VERSION}/mpi/"
cp patches/mpi-inv.c "libgcrypt-${LIBGCRYPT_VERSION}/mpi/"

#configure and build-libgcrypt
pushd "libgcrypt-${LIBGCRYPT_VERSION}"
BASEDIR=$(dirname $(pwd))
${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --with-gpg-error-prefix=${BASEDIR} --disable-asm --enable-shared --disable-static --host=x86-unknown-linux "CFLAGS=-m32"
mv config.h config.h.original
sed -e "s:#define HAVE_SYSLOG 1::" \
    -e "s:#define HAVE_SYS_SELECT_H 1::" config.h.original > config.h

mv doc/Makefile doc/Makefile.original
sed -e 's:\$(CC_FOR_BUILD) -o $@ \$(srcdir)/yat2m.c:\gcc -o $@ \$(srcdir)/yat2m.c:' doc/Makefile.original > doc/Makefile

make clean
make
make install
popd

#configure and build libotr
pushd "libotr-${LIBOTR_VERSION}"
BASEDIR=$(dirname $(pwd))
${EMSCRIPTEN}/emconfigure ./configure --prefix=${BASEDIR} --with-libgcrypt-prefix=${BASEDIR} --disable-static --enable-shared --disable-gcc-hardening --host=x86-unknown-linux "CFLAGS=-m32"
make clean
make
make install
popd

popd
