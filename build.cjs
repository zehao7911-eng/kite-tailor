const fs=require('fs'),path=require('path');let root=__dirname,code=['sdk.mjs','app.mjs'].map(n=>fs.readFileSync(path.join(root,n),'utf8').replace(/^import .*?;\s*/gm,'').replace(/\bexport\s+/g,''));let lib='';let html=fs.readFileSync(path.join(root,'index-source.html'),'utf8').replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'</style>').replace('<script src="vendor/three.min.js"></script>',()=>'<script>'+lib.replace(/<\/script/gi,'<\\/script')+'</script>').replace('<script type="module" src="app.mjs"></script>',()=>'<script>(()=>{'+code.join('\n')+'})();</script>');for(let n of ['index.html','standalone.html'])fs.writeFileSync(path.join(root,n),html);console.log('Built offline KITE TAILOR game '+Buffer.byteLength(html)+' bytes');




