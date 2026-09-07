(async ()=>{
  try{
    const res = await fetch('https://createbill.vercel.app/api/me');
    console.log('STATUS', res.status);
    for (const [k, v] of res.headers) console.log(k + ':', v);
    const text = await res.text();
    console.log('BODY', text);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
