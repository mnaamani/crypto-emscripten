var Module = {};

Module["preRun"]=[];

Module["MPI_HOOK"] = {};
Module["MPI_HOOK"]["BigInt"]= require("bigint");

/* emcc is generating this code when libgpg-error is compiled to js.. :(
__ATINIT__ = __ATINIT__.concat([
  { func: _i32______gpg_err_init_to_void_____ }
]);
*/
function _i32______gpg_err_init_to_void_____(){};//workaround.. TODO:investigate

function __dump_profile(){
}

var _static_buffer_ptr;
var _static_new_mpi_ptr_ptr;
var gcry_ = {};
var jsapi_ = {};
var otrl_ = {};

//consider:copy directly between memory and bigint array.. (faster than string conversions?..)
function __mpi2bigint(mpi_ptr){
    var GCRYMPI_FMT_HEX = 4; //gcrypt.h:    GCRYMPI_FMT_HEX = 4,    /* Hex format. */
    //gcry_error_t gcry_mpi_print (enum gcry_mpi_format format, unsigned char *buffer, size_t buflen, size_t *nwritten, const gcry_mpi_t a)
    var err = gcry_.mpi_print(GCRYMPI_FMT_HEX,_static_buffer_ptr,4096,0,mpi_ptr);
    if(err) {
       var strerr = gcry_.strerror(err);
       console.log("error in gcry_mpi_aprint:",strerr);     
       process.exit();
    }
    var mpi_str_ptr = _static_buffer_ptr;
    var mpi_str = Module['Pointer_stringify'](mpi_str_ptr);
    return Module["MPI_HOOK"]["BigInt"]["str2bigInt"](mpi_str,16);   
}

function __bigint2mpi(mpi_ptr,bi_num){
    //convert bi_num to string.. and scan it into a new mpi using gcry_mpi_scan
    //copy/set the new mpi to mpi_ptr
    var new_mpi_ptr_ptr = _static_new_mpi_ptr_ptr;
    var bi_num_str = Module["MPI_HOOK"]["BigInt"]["bigInt2str"](bi_num,16);
    //gcry_error_t gcry_mpi_scan (gcry_mpi_t *r_mpi, enum gcry_mpi_format format, const unsigned char *buffer, size_t buflen, size_t *nscanned)
    var err = gcry_.mpi_scan(new_mpi_ptr_ptr,4,bi_num_str,0,0);
    if(err){
        var strerr = gcry_.strerror(err);
        console.log("gcrypt_error in gcry_mpi_scan:",strerr);
        process.exit();
    }
    var scanned_mpi_ptr = getValue(new_mpi_ptr_ptr,"i32");
    if(scanned_mpi_ptr==0){
        console.log("NULL scanned mpi in bigint2mpi()");
        process.exit();
    }
    //todo check if mpi_ptr can store scanned_mpi.. otherwise expand it before we set
    
    var same = gcry_.mpi_set(mpi_ptr,scanned_mpi_ptr);
    //TODO: make a custom scanner that doesn't malloc new mpi   
    gcry_.mpi_release(scanned_mpi_ptr);
    if(same && same != mpi_ptr){
        //console.log("unexpected: gcry_mpi_set created a new mpi!");
        //process.exit();
        return same;
    }
}

Module['preRun'].push(function(){

    Module["malloc"]=_malloc;
    Module["free"]=_free;

    //select doesn't really have a place in a NODE/JS environment.. since i/o is non-blocking
    _select = (function() {
      return 3;//this means all the three socket sets passed to the function are have sockets ready for reading.
    });
    
    //Math.random = profile(Math.random);
    //if entropy is low.. it will significantly increase time for crypto keygen..
    Module['FS_createDevice']("/dev/","random",(function(){
      return Math.floor(Math.random() * 256);//just temporary.. need a platform specific implementation..
    }));

    Module['FS_createDevice']("/dev/","urandom",(function(){
      return Math.floor(Math.random() * 256);
    }));
    console.error("created /dev/random and /dev/urandom devices.");
    
    _static_buffer_ptr = allocate(4096,"i8",ALLOC_STATIC);//verify _malloc works with closure compiler 
    _static_new_mpi_ptr_ptr = allocate(4,"i8",ALLOC_STATIC);

    Module["libgcrypt"] = {};
    Module["libgcrypt"]["mpi_new"] = gcry_.mpi_new = cwrap('_gcry_mpi_new','number',['number']);
    Module["libgcrypt"]["mpi_set"] = gcry_.mpi_set = cwrap('_gcry_mpi_set','number',['number','number']);
    Module["libgcrypt"]["mpi_release"] = gcry_.mpi_release = cwrap('_gcry_mpi_release','',['number']);
    Module["libgcrypt"]["mpi_scan"] = gcry_.mpi_scan = cwrap('_gcry_mpi_scan','number',['number','number','string','number','number']);
    Module["libgcrypt"]["mpi_print"] = gcry_.mpi_print = cwrap('_gcry_mpi_print','number',['number','number','number','number','number']);
    Module["libgcrypt"]["strerror"] = gcry_.strerror = cwrap('_gcry_strerror','string',['number']);
    
/* native alot faster don't override
        __gcry_mpi_add = function BigInt_MPI_ADD(w,u,v){
            var ww = BI.add( __mpi2bigint(u), __mpi2bigint(v) );
            __bigint2mpi(w,ww);
        };
*/
/* not tested but my guess is it wont significantly increase performance
        __gcry_mpi_sub = function BigInt_MPI_SUB(w,u,v){
            var ww = BI.sub( __mpi2bigint(u), __mpi2bigint(v) );
            __bigint2mpi(w,ww);
        };
*/
/*native is faster, but its still quite fast!
        __gcry_mpi_mul = function BigInt_MPI_MULT(w,u,v){
            var ww = BI.mult( __mpi2bigint(u), __mpi2bigint(v) );
            __bigint2mpi(w,ww);
        };
*/
/*
//void gcry_mpi_mul_2exp (gcry_mpi_t w, gcry_mpi_t u, unsigned long e)
//w = u * 2^e.
    __gcry_mpi_mul2exp = function BigInt_MPI_MUL2EXP(mpi_w, mpi_u, e){     
    };
*/


//_gcry_mpi_tdiv_qr( gcry_mpi_t quot, gcry_mpi_t rem, gcry_mpi_t num, gcry_mpi_t den)
/** !!!!!!! EL GAMAL FAILS in pubkey.js test!!!! so does ECC DSA!! // due to emscripten or llvm optimisations?
    __gcry_mpi_tdiv_qr = function BigInt_MPI_DIVIDE_(mpi_quot,mpi_rem,mpi_num,mpi_den){
        var q = BI.str2bigInt("0",16,512);//should have enough elements to store Q
        var r = BI.str2bigInt("0",16,512);//what is the best size determined from sizes of num and den?
        var num = __mpi2bigint(mpi_num);
        var den = __mpi2bigint(mpi_den);
        BI.divide_(num,den,q,r);
        if(mpi_quot) __bigint2mpi(mpi_quot,q);
        if(mpi_rem) __bigint2mpi(mpi_rem, r);
    };
*/      
        console.log("overriding __gcry_mpi_gcd");
        __gcry_mpi_gcd = function BigInt_MPI_GCD(mpi_g, mpi_a, mpi_b){
            //console.log(">__gcry_mpi_gcd()");
            var a = __mpi2bigint(mpi_a);
            var b = __mpi2bigint(mpi_b);
            //assert a.length == b.length
            var g = Module["MPI_HOOK"]["BigInt"]["GCD"](a,b);
            __bigint2mpi(mpi_g, g);
            if( Module["MPI_HOOK"]["BigInt"]["equalsInt"](g,1) ) return 1;
            return 0;
        };
      console.log("overriding __gcry_mpi_mod");
        __gcry_mpi_mod = function BigInt_MPI_MOD(mpi_r,mpi_x,mpi_n){
            //console.log(">__gcry_mpi_mod()");
            //r = x mod n
            var x = __mpi2bigint(mpi_x);
            var n = __mpi2bigint(mpi_n);
            __bigint2mpi(mpi_r, Module["MPI_HOOK"]["BigInt"]["mod"](x,n));
        };
        
        console.log("overriding __gcry_mpi_powm");
//confirmed bigint mulpowm, powm and invm, gcd  enhance performance..
        __gcry_mpi_powm = function BigInt_MPI_POWMOD(w, b, e, m){
            //console.log(">__gcry_mpi_powm()");
          var bi_base = __mpi2bigint(b);
          var bi_expo = __mpi2bigint(e);
          var bi_mod  = __mpi2bigint(m);
          var result = Module["MPI_HOOK"]["BigInt"]["powMod"](bi_base,bi_expo,bi_mod);
          __bigint2mpi(w,result);
        };

      console.log("overriding __gcry_mpi_invm");

        //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
        __gcry_mpi_invm = function BigInt_MPI_INVERSEMOD(x,a,m){
            //console.log(">__gcry_mpi_invm()");
            var bi_a = __mpi2bigint(a);
            var bi_m = __mpi2bigint(m);
            var result = Module["MPI_HOOK"]["BigInt"]["inverseMod"](bi_a,bi_m);
            if(result){
                __bigint2mpi(x,result);
                return 1;
            }else{
                return 0;//no inverse mod exists
            }
        };
/*
//no significant improvement, but if enabled without mulpowm -- degrades performance!
        // w = u * v mod m --> (u*v) mod m  ===  u * (v mod m) ? 
        __gcry_mpi_mulm = function BigInt_MPI_MULTMOD(w, u, v, m){
          var bi_u = __mpi2bigint(u);
          var bi_v = __mpi2bigint(v);
          var bi_m = __mpi2bigint(m);
          //faster when v < u (and gives correct value!)
          var result = BI.greater(bi_u,bi_v) ? BI.multMod(bi_u,bi_v,bi_m) :BI.multMod(bi_v,bi_u,bi_m);
          __bigint2mpi(w,result);
        };
*/
      console.log("overriding __gcry_mpi_mulpowm");
        __gcry_mpi_mulpowm = function BigInt_MPI_MULPOWM(mpi_r,mpi_array_base,mpi_array_exp,mpi_m){
            //console.log(">__gcry_mpi_mulpowm()");
            var indexer = 1;
            var mpi1, mpi2, bi_m,bi_result;
            mpi1 = getValue(mpi_array_base,"i32");
            mpi2 = getValue(mpi_array_exp,"i32");
            bi_m = __mpi2bigint(mpi_m);
            var BE = [];
            var O = [];
            while(mpi1 && mpi2){
                BE.push({b:__mpi2bigint(mpi1),e:__mpi2bigint(mpi2)});
                mpi1 = getValue(mpi_array_base+(indexer*4),"i32");
                mpi2 = getValue(mpi_array_exp+ (indexer*4),"i32");
                indexer++;
            }
            if(BE.length){
                BE.forEach(function(be){
                    O.push(Module["MPI_HOOK"]["BigInt"]["powMod"](be.b,be.e,bi_m));
                });
                bi_result = Module["MPI_HOOK"]["BigInt"]["str2bigInt"]("1",16);
                O.forEach(function(k){
                    bi_result = Module["MPI_HOOK"]["BigInt"]["mult"](bi_result,k);
                });
            }
            bi_result = Module["MPI_HOOK"]["BigInt"]["mod"](bi_result,bi_m);
            __bigint2mpi(mpi_r,bi_result);
        };

//TODO: _gcry_generate_fips186_2_prime
//      _gcry_generate_elg_prime

      console.log("overriding _gen_prime");

/*static gcry_mpi_t gen_prime (unsigned int nbits, int secret, int randomlevel,
                             int (*extra_check)(void *, gcry_mpi_t),
                             void *extra_check_arg);*/
    _gen_prime = function BigInt_Prime(nbits,secretlevel,randomlevel,xtracheck,xtracheck_args){
        var mpi_prime = gcry_.mpi_new ( nbits );
        for(;;){
            var bi_prime = Module["MPI_HOOK"]["BigInt"]["randTruePrime"](nbits);
            __bigint2mpi(mpi_prime,bi_prime);
            if(xtracheck && FUNCTION_TABLE[xtracheck](xtracheck_args,mpi_prime)){                
                   continue;//prime rejected!                
            }
            return mpi_prime;
        }
    };
});

