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

//TODO: turn this into a library...

(function(){
    Module["BigInt"]= this["BigInt"] || require("bigint");

    /* convert a gcry_mpi_t to a BigInt */
    function mpi2bigint(mpi_ptr){
        if(!this.buffer) this.buffer = Module["_malloc"](4096);
        //gcry_error_t gcry_mpi_print (enum gcry_mpi_format format, unsigned char *buffer, size_t buflen, size_t *nwritten, const gcry_mpi_t a)
        var err = Module["libgcrypt"]["mpi_print"](4,this.buffer,4096,0,mpi_ptr);// 4 == HEX Format
        assert(err==0,"mpi2bigint"+Module["libgcrypt"]["strerror"](err));
        var mpi_str = Module["Pointer_stringify"](this.buffer);
        return Module["BigInt"]["str2bigInt"](mpi_str,16);
    }

     /* convert bi_num (BigInt) to hex string then scan it into a new gcry_mpi_t, using gcry_mpi_scan
        copy the new mpi to mpi_ptr */
    function bigint2mpi(mpi_ptr,bi_num){
        if(!this.handle) this.handle = Module["_malloc"](4);//pointer to *gcry_mpi_t
        var bi_num_str = Module["BigInt"]["bigInt2str"](bi_num,16);
        //gcry_error_t gcry_mpi_scan (gcry_mpi_t *r_mpi, enum gcry_mpi_format format, const unsigned char *buffer, size_t buflen, size_t *nscanned)
        var err = Module["libgcrypt"]["mpi_scan"](this.handle,4,bi_num_str,0,0); //4 == HEX Format
        assert(err===0,"bigint2mpi:"+Module["libgcrypt"]["strerror"](err));
    
        var scanned_mpi_ptr = Module["getValue"](this.handle,"i32");
        assert(scanned_mpi_ptr !==0, "NULL scanned mpi in bigint2mpi()");
    
        Module["libgcrypt"]["mpi_set"](mpi_ptr,scanned_mpi_ptr);
        Module["libgcrypt"]["mpi_release"](scanned_mpi_ptr);
    }

    function override_mpi_powm(mpi_w,mpi_b,mpi_e,mpi_m){
          //w = b^e mod m
          var bi_base = mpi2bigint(mpi_b);
          var bi_expo = mpi2bigint(mpi_e);
          var bi_mod  = mpi2bigint(mpi_m);
          var result = Module["BigInt"]["powMod"](bi_base,bi_expo,bi_mod);
          bigint2mpi(mpi_w,result);
    }

    function override_mpi_mulpowm(mpi_r,mpi_array_base,mpi_array_exp,mpi_m){
        var indexer = 1;
        var mpi1, mpi2, bi_m,bi_result;
        mpi1 = Module["getValue"](mpi_array_base,"i32");
        mpi2 = Module["getValue"](mpi_array_exp,"i32");
        bi_m = mpi2bigint(mpi_m);
        var BE = [];
        var O = [];
        while(mpi1 && mpi2){
            BE.push({"b":mpi2bigint(mpi1),"e":mpi2bigint(mpi2)});
            mpi1 = Module["getValue"](mpi_array_base+(indexer*4),"i32");
            mpi2 = Module["getValue"](mpi_array_exp+ (indexer*4),"i32");
            indexer++;
        }
        if(BE.length){
            BE.forEach(function(be){
                O.push(Module["BigInt"]["powMod"](be["b"],be["e"],bi_m));
            });
            bi_result = Module["BigInt"]["str2bigInt"]("1",16);
            O.forEach(function(k){
                bi_result = Module["BigInt"]["mult"](bi_result,k);
            });
        }
        bi_result = Module["BigInt"]["mod"](bi_result,bi_m);
        bigint2mpi(mpi_r,bi_result);
    }

    function override_mpi_invm(mpi_x,mpi_a,mpi_m){
        // (x**(-1) mod n)
        var bi_a = mpi2bigint(mpi_a);
        var bi_m = mpi2bigint(mpi_m);
        var result = Module["BigInt"]["inverseMod"](bi_a,bi_m);
        if(result){
            bigint2mpi(mpi_x,result);
            return 1;//inverse mod calculated
        }else{
            return 0;//no inverse mod exists
        }
    }

    this["__gcry_mpi_powm"]= Module['__gcry_mpi_powm_override'] = override_mpi_powm;
    this["__gcry_mpi_mulpowm"]= Module['__gcry_mpi_mulpowm_override'] = override_mpi_mulpowm;
    this["__gcry_mpi_invm"]= Module['__gcry_mpi_invm_override'] = override_mpi_invm;

}).call(globalScope);

Module['preRun'].push(function(){
    Module["libgcrypt"] = {
        "mpi_new":Module["cwrap"]('_gcry_mpi_new','number',['number']),
        "mpi_set":Module["cwrap"]('_gcry_mpi_set','number',['number','number']),
        "mpi_release":Module["cwrap"]('_gcry_mpi_release','',['number']),
        "mpi_scan":Module["cwrap"]('_gcry_mpi_scan','number',['number','number','string','number','number']),
        "mpi_print":Module["cwrap"]('_gcry_mpi_print','number',['number','number','number','number','number']),
        "strerror":Module["cwrap"]('_gcry_strerror','string',['number'])
    };

   globalScope["__gcry_mpi_powm"] = Module['__gcry_mpi_powm_override'];
   globalScope["__gcry_mpi_mulpowm"] = Module['__gcry_mpi_mulpowm_override'];
   globalScope["__gcry_mpi_invm"] = Module['__gcry_mpi_invm_override'];
});
