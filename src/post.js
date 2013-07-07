/* As of libgcrypt 1.5.2 rndlinux.c no longer tries to use select when accessing /dev/urandom
 * if file descriptor is > 63
 * so this workaround is no longer required..
 */
function __select(n){
    return 1;
}


