import {createSearchHandler} from './handler.mjs';
const env=(name:string)=>Deno.env.get(name) || '';
function readKeys(name:string) {
  try {return Object.values(JSON.parse(env(name) || '{}')).filter((x):x is string=>typeof x==='string');}
  catch {return [];}
}
const serverKey=readKeys('SUPABASE_SECRET_KEYS')[0] || env('SUPABASE_SERVICE_ROLE_KEY');
async function rpc(name:string,body:unknown) {
  const res=await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${name}`,{
    method:'POST',headers:{apikey:serverKey,'Content-Type':'application/json',
      ...(serverKey.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${serverKey}`})},
    body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
  if(!res.ok) throw Error('database');
  const text=await res.text();return text?JSON.parse(text):null;
}
Deno.serve(createSearchHandler({
  keys:[...readKeys('SUPABASE_PUBLISHABLE_KEYS'),env('SUPABASE_ANON_KEY')],
  reserve:(q:string)=>rpc('driv_food_search_reserve',{p_query:q}),
  store:(q:string,hits:unknown[])=>rpc('driv_food_search_store',{p_query:q,p_hits:hits}),
}));
