var Module = {};

Module["preRun"]=[];

/* emcc is generating this code when libgpg-error is compiled to js.. :(
__ATINIT__ = __ATINIT__.concat([
  { func: _i32______gpg_err_init_to_void_____ }
]);
*/
function _i32______gpg_err_init_to_void_____(){};//workaround.. TODO:investigate

Module['preRun'].push(function(){
    //select doesn't really have a place in a NODE/JS environment.. since i/o is non-blocking    
    _select = (function() {
      return 3;//this means all the three socket sets passed to the function are have sockets ready for reading.
    });

    Module["FS"]=FS;
    FS.init();
    var devFolder = Module['FS'].findObject("/dev") || Module['FS_createFolder']("/","dev",true,true);
    Module['FS_createDevice'](devFolder,"random",(function(){
      return Math.floor(Math.random() * 256);
    }));

    Module['FS_createDevice'](devFolder,"urandom",(function(){
      return Math.floor(Math.random() * 256);
    }));
    
});

