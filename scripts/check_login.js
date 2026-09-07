(async ()=>{
  try{
    const res = await fetch('https://createbill.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@buildbill.ai', password: 'buildbill123' })
    });

    console.log('STATUS', res.status);
    for (const [k, v] of res.headers) console.log(k + ':', v);
    const text = await res.text();
    console.log('BODY', text);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
