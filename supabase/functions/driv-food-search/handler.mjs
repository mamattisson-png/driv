// Testbar HTTP-gräns. Bara den fasta OFF-tjänsten kan anropas; inga användaradresser.
const ORIGIN = 'https://driv.driveify.se';
const FIELDS = 'code,product_name,product_name_sv,brands,quantity,product_quantity,product_quantity_unit,serving_quantity,serving_quantity_unit,nutriments,last_modified_t,obsolete,data_quality_errors_tags';
export function createSearchHandler({keys, reserve, store, fetchImpl = fetch}) {
  return async function handler(req) {
    const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
      'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'apikey, content-type','Access-Control-Max-Age':'86400','Access-Control-Expose-Headers':'Retry-After'};
    const reply = (status, body, extra={}) => Response.json(body,{status,headers:{...headers,...extra}});
    if (req.headers.get('origin') !== ORIGIN) return reply(403,{error:'origin'});
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (req.method !== 'POST') return reply(405,{error:'method'});
    if (!keys.filter(Boolean).includes(req.headers.get('apikey'))) return reply(401,{error:'apikey'});
    try {
      if (!req.headers.get('content-type')?.includes('application/json')) return reply(400,{error:'json'});
      // Streambegränsning även när Content-Length saknas.
      const reader=req.body?.getReader(); let text='',bytes=0;
      if (!reader) return reply(400,{error:'body'});
      const decoder=new TextDecoder();
      for (;;) {
        const {done,value}=await reader.read(); if(done) break;
        bytes+=value.byteLength; if(bytes>2048) {await reader.cancel();return reply(413,{error:'body'});}
        text+=decoder.decode(value,{stream:true});
      }
      text+=decoder.decode();
      let body; try {body=JSON.parse(text);} catch {return reply(400,{error:'json'});}
      if (typeof body?.q !== 'string' || body.q.length>120 || /https?:\/\//i.test(body.q)) return reply(400,{error:'query'});
      const words=body.q.normalize('NFKC').toLocaleLowerCase('sv-SE').match(/[\p{L}\p{N}]+/gu) || [];
      const q=words.slice(0,12).join(' ');
      if(q.length<2 || q.length>120) return reply(400,{error:'query'});
      const gate=await reserve(q);
      if(gate.status==='cached') return reply(200,{hits:gate.hits});
      if(gate.status==='limited') return reply(429,{error:'limited',retry_after:gate.retry_after},{'Retry-After':String(gate.retry_after)});
      if(gate.status!=='fetch') throw Error('budget');
      const params=new URLSearchParams({q:`countries_tags:"en:sweden" ${q}`,langs:'sv,en',fields:FIELDS,page_size:'15'});
      const res=await fetchImpl(`https://search.openfoodfacts.org/search?${params}`,{
        headers:{'User-Agent':'Driv/1.0 (https://driv.driveify.se; product search)','Accept':'application/json'},
        signal:AbortSignal.timeout(12000),redirect:'error'});
      if(!res.ok) throw Error('upstream');
      const data=await res.json(); if(!Array.isArray(data.hits)) throw Error('response');
      const hits=data.hits.slice(0,15);
      await store(q,hits);
      return reply(200,{hits});
    } catch {return reply(502,{error:'unavailable'});}
  };
}
