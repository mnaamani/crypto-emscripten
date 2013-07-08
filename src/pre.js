Module["Random"] = this["Random"] || require("random"); 
Module["preRun"] = Module["preRun"] || [];

(function(){
    this["_i32______gpg_err_init_to_void_____"]=function(){}
}).call(null);

function _i32______gpg_err_init_to_void_____(){}

Module['preRun'].push(function(){
    FS.init();
    var devFolder = FS.findObject("/dev") || Module['FS_createFolder']("/","dev",true,true);

    Module['FS_createDevice'](devFolder,"random",(function(){
      return Module["Random"]["getByte"]();
    }));

    Module['FS_createDevice'](devFolder,"urandom",(function(){
      return Module["Random"]["getByte"]();
    }));
});
