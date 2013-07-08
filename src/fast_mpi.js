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

try{
Module["BigInt"]= this["BigInt"] || require("bigint");
}catch(e){}

Module['preRun'].push(function(){
    if(typeof asm !== 'undefined') return;
    var gcry_ = {};
    var BigInt = Module["BigInt"];
    /*
     * convert a gcry_mpi_t to a BigInt
     */
    function mpi2bigint(mpi_ptr){
        if(!mpi2bigint.buffer) mpi2bigint.buffer = _malloc(4096);
        //gcry_error_t gcry_mpi_print (enum gcry_mpi_format format, unsigned char *buffer, size_t buflen, size_t *nwritten, const gcry_mpi_t a)
        var err = gcry_.mpi_print(4,mpi2bigint.buffer,4096,0,mpi_ptr);// 4 == HEX Format
        assert(err==0,"mpi2bigint"+gcry_.strerror(err));
        var mpi_str = Module['Pointer_stringify'](mpi2bigint.buffer);
        return BigInt["str2bigInt"](mpi_str,16);
    }

    /*
     *   convert bi_num (BigInt) to hex string then scan it into a new gcry_mpi_t, using gcry_mpi_scan
     *   copy the new mpi to mpi_ptr
    */
    function bigint2mpi(mpi_ptr,bi_num){
        if(!bigint2mpi.handle) bigint2mpi.handle = _malloc(4);//pointer to *gcry_mpi_t
        var bi_num_str = BigInt["bigInt2str"](bi_num,16);
        //gcry_error_t gcry_mpi_scan (gcry_mpi_t *r_mpi, enum gcry_mpi_format format, const unsigned char *buffer, size_t buflen, size_t *nscanned)
        var err = gcry_.mpi_scan(bigint2mpi.handle,4,bi_num_str,0,0); //4 == HEX Format
        assert(err===0,"bigint2mpi:"+gcry_.strerror(err));
    
        var scanned_mpi_ptr = getValue(bigint2mpi.handle,"i32");
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

    gcry_.mpi_new = cwrap('_gcry_mpi_new','number',['number']);
    gcry_.mpi_set = cwrap('_gcry_mpi_set','number',['number','number']);
    gcry_.mpi_release = cwrap('_gcry_mpi_release','',['number']);
    gcry_.mpi_scan = cwrap('_gcry_mpi_scan','number',['number','number','string','number','number']);
    gcry_.mpi_print = cwrap('_gcry_mpi_print','number',['number','number','number','number','number']);
    gcry_.strerror = cwrap('_gcry_strerror','string',['number']);
    
        __gcry_mpi_mod = globalScope['Module']['__gcry_mpi_mod'] = (function (mpi_r,mpi_x,mpi_n){
            //r = x mod n
            var x = mpi2bigint(mpi_x);
            var n = mpi2bigint(mpi_n);
            bigint2mpi(mpi_r, BigInt["mod"](x,n));
        });
        
        var original_powm = __gcry_mpi_powm;
        __gcry_mpi_powm = globalScope['Module']['__gcry_mpi_powm'] = (function (w, b, e, m){
          var bi_expo = mpi2bigint(e);
          //elliptic curves exponents 2 or 3, (y^2 = x^3 + ax + b)
          if(bi_expo[0]==2 || bi_expo[0]==3){
            original_powm(w,b,e,m); //faster for small exponents.
            return;
          }
          //RSA and DSA use large exponents.. 
          var bi_base = mpi2bigint(b);
          var bi_mod  = mpi2bigint(m);
          var result = BigInt["powMod"](bi_base,bi_expo,bi_mod);
          bigint2mpi(w,result);
        });

        //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
        __gcry_mpi_invm = globalScope['Module']['__gcry_mpi_invm'] = (function (x,a,m){
            var bi_a = mpi2bigint(a);
            var bi_m = mpi2bigint(m);
            var result = BigInt["inverseMod"](bi_a,bi_m);
            if(result){
                bigint2mpi(x,result);
                return 1;
            }else{
                return 0;//no inverse mod exists
            }
        });

        __gcry_mpi_mulpowm = globalScope['Module']['__gcry_mpi_mulpowm'] = (function (mpi_r,mpi_array_base,mpi_array_exp,mpi_m){
            var indexer = 1;
            var mpi1, mpi2, bi_m,bi_result;
            mpi1 = getValue(mpi_array_base,"i32");
            mpi2 = getValue(mpi_array_exp,"i32");
            bi_m = mpi2bigint(mpi_m);
            var BE = [];
            var O = [];
            while(mpi1 && mpi2){
                BE.push({b:mpi2bigint(mpi1),e:mpi2bigint(mpi2)});
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
            bigint2mpi(mpi_r,bi_result);
        });
 
});
