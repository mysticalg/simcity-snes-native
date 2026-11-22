// CODE_03B916..03B967, DATA_03B969. Calls follow scheduled field
// updates at CODE_038154. Practice mode ($003E == 1) draws nothing.
export function selectRomRandomDisaster({practice=false,difficulty=0,pollution=0,disabled=false,messagePending=false,messageBypass=false},nextBounded,nextWord){
 if(disabled||(messagePending&&!messageBypass)||practice)return null;
 if(nextBounded([4800,2400,1200][difficulty])!==0)return null;
 const kind=nextWord()&7;
 if(kind<2)return 'Fire';
 if(kind<4)return 'Flood';
 if(kind===5)return 'Tornado';
 if(kind===6)return 'Earthquake';
 return pollution>=80?'Monster':null;
}
