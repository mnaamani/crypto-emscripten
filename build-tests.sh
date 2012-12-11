EMSCRIPTEN=`./find-emcc.py`
LLVM_ROOT=`${EMSCRIPTEN}/em-config LLVM_ROOT`
export CPP="${LLVM_ROOT}/clang -E"

mkdir -p tests

export EMCC="${EMSCRIPTEN}/emcc"

make -e libotr-test gcrypt-tests-fastmpi gcrypt-tests
