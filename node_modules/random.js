;(function () {

  var root = this;
  
  var Random = {
    getByte: function(){
      if(Date.now() > (seededAT + (5 * 60 * 1000))){
        seed();//reseed if more than 5 minutes passed
      }
      return state.getBytes(1)[0];
    }          
  };
  
  var Salsa20, crypto, seededAT, state;

  if (typeof require !== 'undefined') {
    module.exports = Random;
    Salsa20 = require('./salsa20.js')
    crypto = require('crypto')
  } else {
    Salsa20 = root.Salsa20;
    crypto = root.crypto;
    root.Random = Random;
  }

 
  function seed() {
    var buf
    if (typeof require !== 'undefined') {
      try {
        buf = crypto.randomBytes(40)
      } catch (e) { throw e }
    } else if ( (typeof crypto !== 'undefined') &&
                (typeof crypto.getRandomValues === 'function')
    ) {
      buf = new Uint8Array(40)
      crypto.getRandomValues(buf)
    } else {
      throw new Error('Keys should not be generated without CSPRNG.')
    }

    state = new Salsa20([
      buf[00], buf[01], buf[02], buf[03], buf[04], buf[05], buf[06], buf[07],
      buf[ 8], buf[ 9], buf[10], buf[11], buf[12], buf[13], buf[14], buf[15],
      buf[16], buf[17], buf[18], buf[19], buf[20], buf[21], buf[22], buf[23],
      buf[24], buf[25], buf[26], buf[27], buf[28], buf[29], buf[30], buf[31]
    ],[
      buf[32], buf[33], buf[34], buf[35], buf[36], buf[37], buf[38], buf[39]
    ])

    seededAT = Date.now();
  }

  seed();
  
}).call(this)
