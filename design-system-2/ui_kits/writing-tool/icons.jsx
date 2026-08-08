/* Onda Write · Icon-Shim — das Set lebt im Design System (components/display/Icon.jsx).
   window.WT.Icon löst die DS-Komponente beim ersten Zugriff auf, nicht beim Laden:
   diese Datei wird auch in den Bundle kompiliert und läuft dort, bevor die Namespace-Variable existiert. */
(function(){
  const WT=window.WT=window.WT||{};
  if(Object.prototype.hasOwnProperty.call(WT,'Icon'))return;
  const resolve=()=>{
    const ns=Object.keys(window).find(k=>k.startsWith('AuraDesignSystem_'));
    return ns&&window[ns]?window[ns].Icon:undefined;
  };
  Object.defineProperty(WT,'Icon',{configurable:true,enumerable:true,
    get(){const I=resolve();if(I){Object.defineProperty(WT,'Icon',{value:I,writable:true,configurable:true,enumerable:true});return I}
      return function(){return null};},
    set(v){Object.defineProperty(WT,'Icon',{value:v,writable:true,configurable:true,enumerable:true})}});
})();
