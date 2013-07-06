/*
 Copyright (c) 2012-2013 Mokhtar Naamani

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 and associated documentation files (the "Software"), to deal in the Software without restriction,
 including without limitation the rights to use, copy, modify, merge, publish, distribute, 
 sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
 is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies
 or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
 AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
if(!this['Module']){
    this['Module'] = Module = {};
    this['Module']["preRun"]=[];
}
var BigInt = require("bigint");

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
    return BigInt["str2bigInt"](mpi_str,16);   
}

function __bigint2mpi(mpi_ptr,bi_num){
    //convert bi_num to string.. and scan it into a new mpi using gcry_mpi_scan
    //copy/set the new mpi to mpi_ptr
    var new_mpi_ptr_ptr = _static_new_mpi_ptr_ptr;
    var bi_num_str = BigInt["bigInt2str"](bi_num,16);
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

    var same = gcry_.mpi_set(mpi_ptr,scanned_mpi_ptr);
    gcry_.mpi_release(scanned_mpi_ptr);
    if(same && same != mpi_ptr){
        return same;
    }
}

Module['preRun'].push(function(){
    console.log("activating FAST MPI");
    _static_buffer_ptr = allocate(4096,"i8",ALLOC_NORMAL);
    _static_new_mpi_ptr_ptr = allocate(4,"i8",ALLOC_NORMAL);

    Module["libgcrypt"] = {};
    Module["libgcrypt"]["mpi_new"] = gcry_.mpi_new = cwrap('_gcry_mpi_new','number',['number']);
    Module["libgcrypt"]["mpi_set"] = gcry_.mpi_set = cwrap('_gcry_mpi_set','number',['number','number']);
    Module["libgcrypt"]["mpi_release"] = gcry_.mpi_release = cwrap('_gcry_mpi_release','',['number']);
    Module["libgcrypt"]["mpi_scan"] = gcry_.mpi_scan = cwrap('_gcry_mpi_scan','number',['number','number','string','number','number']);
    Module["libgcrypt"]["mpi_print"] = gcry_.mpi_print = cwrap('_gcry_mpi_print','number',['number','number','number','number','number']);
    Module["libgcrypt"]["strerror"] = gcry_.strerror = cwrap('_gcry_strerror','string',['number']);
    
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
       /* does mpi_gcd override effect pubkey.c test: _check_x931_derived_key fails self test when generating key
        console.log("overriding __gcry_mpi_gcd");
        __gcry_mpi_gcd = function BigInt_MPI_GCD(mpi_g, mpi_a, mpi_b){
            //console.log(">__gcry_mpi_gcd()");
            var a = __mpi2bigint(mpi_a);
            var b = __mpi2bigint(mpi_b);
            //assert a.length == b.length
            var g = BigInt["GCD"](a,b);
            __bigint2mpi(mpi_g, g);
            if( BigInt["equalsInt"](g,1) ) return 1;
            return 0;
        };
        */
        __gcry_mpi_mod = globalScope['Module']['__gcry_mpi_mod'] = (function (mpi_r,mpi_x,mpi_n){
            //r = x mod n
            var x = __mpi2bigint(mpi_x);
            var n = __mpi2bigint(mpi_n);
            __bigint2mpi(mpi_r, BigInt["mod"](x,n));
        });
        
        __gcry_mpi_powm = globalScope['Module']['__gcry_mpi_powm'] = (function (w, b, e, m){
          var bi_base = __mpi2bigint(b);
          var bi_expo = __mpi2bigint(e);
          var bi_mod  = __mpi2bigint(m);
          var result = BigInt["powMod"](bi_base,bi_expo,bi_mod);
          __bigint2mpi(w,result);
        });

        //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
        __gcry_mpi_invm = globalScope['Module']['__gcry_mpi_invm'] = (function (x,a,m){
            var bi_a = __mpi2bigint(a);
            var bi_m = __mpi2bigint(m);
            var result = BigInt["inverseMod"](bi_a,bi_m);
            if(result){
                __bigint2mpi(x,result);
                return 1;
            }else{
                return 0;//no inverse mod exists
            }
        });
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
        __gcry_mpi_mulpowm = globalScope['Module']['__gcry_mpi_mulpowm'] = (function (mpi_r,mpi_array_base,mpi_array_exp,mpi_m){
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
                    O.push(BigInt["powMod"](be.b,be.e,bi_m));
                });
                bi_result = BigInt["str2bigInt"]("1",16);
                O.forEach(function(k){
                    bi_result = BigInt["mult"](bi_result,k);
                });
            }
            bi_result = BigInt["mod"](bi_result,bi_m);
            __bigint2mpi(mpi_r,bi_result);
        });
});
