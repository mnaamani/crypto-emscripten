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
    gcry_error_t error = otrl_privkey_generate(userstate, "bob.keys","bob@telechat.org","telechat");

    if(error){
		printf("test_generate_key FAILED.\n");
	}else{
        otrl_privkey_fingerprint(userstate, fingerprint, "bob@telechat.org", "telechat");
        printf("fingerprint of generated key: %s\n",fingerprint);
    }
    return error;
}

gcry_error_t
test_read_file(OtrlUserState userstate, const char* keys, const char* accountname, const char* protocol){
    char fingerprint[45];
    puts("reading alice.keys");
	gcry_error_t error = otrl_privkey_read(userstate, "alice.keys");

	if(error){
		printf("test_read_file FAILED.\n");
	}else{
    	otrl_privkey_fingerprint(userstate, fingerprint, "alice@telechat.org", "telechat");
        printf("fingerprint: %s\n",fingerprint);
    }
    return error;
}
void
test_mpi_to_bigint_conversions(int T){
    gcry_mpi_t u = gcry_mpi_set_ui(NULL,2);
    gcry_mpi_t w = gcry_mpi_set_ui(NULL,1);
    int i;
    for(i=0; i<T; i++) {
        gcry_mpi_mul(w,w,u);
    }
    gcry_mpi_dump(w);
}

int
main(){
    initialise();
    OtrlUserState userstate = otrl_userstate_create();

    test_read_file(userstate,"alice.keys","alice@telechat.org","telechat");
    test_generate_key(userstate,"bob.keys","bob@telechat.org","telechat");

    otrl_userstate_free(userstate);
    return 0;
}
