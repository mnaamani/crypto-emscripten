#include <stdio.h>
#include <gcrypt.h>
#include <libotr/proto.h>
#include <libotr/userstate.h>
#include <libotr/privkey.h>

void initialise(){
    puts("initialising...");
    /* Version check should be the very first call because it
          makes sure that important subsystems are intialized. */
	if (!gcry_check_version (GCRYPT_VERSION))
    {
      fputs ("libgcrypt version mismatch\n", stderr);
      exit (2);
    }

    gcry_control (GCRYCTL_INITIALIZATION_FINISHED, 0);
    OTRL_INIT;
}

gcry_error_t
test_generate_key(OtrlUserState userstate, const char* keys, const char* accountname, const char* protocol){
    char fingerprint[45];

    puts("generating key");
    gcry_error_t error = otrl_privkey_generate(userstate, keys,accountname,protocol);

    if(error){
		printf("test_generate_key failed: %s\n",gcry_strerror(error));
	}else{
        otrl_privkey_fingerprint(userstate, fingerprint, accountname,protocol);
        printf("fingerprint of generated key: %s\n",fingerprint);
    }
    return error;
}

gcry_error_t
test_read_file(OtrlUserState userstate, const char* keys, const char* accountname, const char* protocol){
    char fingerprint[45];
    printf("reading %s\n", keys);
	gcry_error_t error = otrl_privkey_read(userstate, keys);

	if(error){
		printf("test_read_file failed: %s\n",gcry_strerror(error));
	}else{
    	otrl_privkey_fingerprint(userstate, fingerprint, "alice@telechat.org", "telechat");
        printf("fingerprint: %s\n",fingerprint);
    }
    return error;
}

int
main(){
    initialise();
    printf("libotr %s\n",otrl_version());
    OtrlUserState userstate = otrl_userstate_create();
    test_read_file(userstate,"./keys/alice.keys","alice@telechat.org","telechat");
    test_generate_key(userstate,"./keys/alice.keys","alice@telechat.org","telechat");
    test_read_file(userstate,"./keys/alice.keys","alice@telechat.org","telechat");
    otrl_userstate_free(userstate);
    return 0;
}
