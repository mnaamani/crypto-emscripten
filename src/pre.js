this['Module'] = Module = {};
Module["preRun"] = [];

/* emcc is generating this code when libgpg-error is compiled to js.. :(
__ATINIT__ = __ATINIT__.concat([
  { func: _i32______gpg_err_init_to_void_____ }
]);
*/
function _i32______gpg_err_init_to_void_____(){};//workaround

Module['preRun'].push(function(){
    require("bigint");

    FS.init();
    var devFolder = FS.findObject("/dev") || Module['FS_createFolder']("/","dev",true,true);

    Module['FS_createDevice'](devFolder,"random",(function(){
      return Math.randomByte();
    }));

    Module['FS_createDevice'](devFolder,"urandom",(function(){
      return Math.randomByte();
    }));
});
