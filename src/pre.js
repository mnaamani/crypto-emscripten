try{
    Module["crypto"] = this["crypto"] || require("crypto");
}catch(e){}

Module["preRun"] = Module["preRun"] || [];

(function(){
    this["_i32______gpg_err_init_to_void_____"]=function(){}
}).call(globalScope);

function _i32______gpg_err_init_to_void_____(){}

Module['preRun'].push(function(){
    FS.init();
    var devFolder = FS.findObject("/dev") || Module['FS_createFolder']("/","dev",true,true);

    var randomByte = (function(crypto){
       if(!crypto) throw new Error("no source of random data found!");
       if(crypto["randomBytes"]) {
          return (function(){
            return crypto["randomBytes"](1)[0];
          });
       }else{
         return (function(){
            var buf = new Uint8Array(1);
            crypto["getRandomValues"](buf);
            return buf[0];
         });
       }
    })(Module["crypto"]);
    
    Module['FS_createDevice'](devFolder,"random",randomByte);
    Module['FS_createDevice'](devFolder,"urandom",randomByte);
});
