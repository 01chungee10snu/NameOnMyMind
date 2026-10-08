// Source-separated dictionary federation. No credentials or live NIKL endpoint.
import { createDictionaryClient, normalizeHeadword, DictionaryError, fetchJsonBounded } from './dictionary.mjs';
const PIN='49385654031976a0a14cb1da2f95ca4d58a6dfd4feb581c45cfa9f95e314e33d';
const VERSION='nikl-v24-'+PIN.slice(0,16);
const LICENSE='https://creativecommons.org/licenses/by-sa/2.0/kr/';
const COVERAGE='PARTIAL_SEARCH_CAPTURE_ONLY_NOT_FULL_ENTRY';
const reject=()=>{throw new DictionaryError('INVALID_DATA')};
const abortCheck=signal=>{if(signal?.aborted)throw signal.reason||new DictionaryError('ABORTED')};
const boundedLimit=value=>Math.max(1,Math.min(50,Number.isFinite(value)?Math.floor(value):12));
const canonicalUrl=code=>'https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo='+code+'&nation=eng';

export function mergeRankedResults({officialRows=[],wiktionaryRows=[]}={},query,limit=12){
  const q=normalizeHeadword(query);
  const official=officialRows.filter(row=>typeof row?.[1]==='string'&&row[1].includes(q)).map(row=>[row[0],row[1],row[2],'NIKL']);
  const preferredWords=new Set(official.map(row=>row[1]));
  const wiki=wiktionaryRows.filter(row=>typeof row?.[1]==='string'&&row[1].includes(q)&&!preferredWords.has(row[1])).map(row=>[row[0],row[1],row[2],'WIKTIONARY']);
  const rows=[...official,...wiki];
  const rank=word=>word===q?0:word.startsWith(q)?1:2;
  rows.sort((a,b)=>rank(a[1])-rank(b[1]) || (a[3]==='NIKL'?0:1)-(b[3]==='NIKL'?0:1) || a[1].length-b[1].length || a[1].localeCompare(b[1],'ko') || (a[3]==='NIKL'&&b[3]==='NIKL'?Number(a[2])-Number(b[2]):0) || a[0].localeCompare(b[0],'en'));
  return {total:rows.length,unique_words:new Set(rows.map(row=>row[1])).size,rows:rows.slice(0,boundedLimit(limit))};
}
export function rankOfficialEntries(entries,query,limit=12){return mergeRankedResults({officialRows:entries},query,limit)}

export function validateOfficialEntry(entry){
  if(!entry||typeof entry!=='object'||!/^NK[1-9]\d*$/.test(entry.id||'')||!/^\d+$/.test(entry.target_code||''))reject();
  if(entry.id!=='NK'+entry.target_code||typeof entry.word!=='string'||normalizeHeadword(entry.word)!==entry.word||!/^\d+$/.test(entry.homonym||''))reject();
  if(entry.provider!=='NIKL'||entry.status!=='DICTIONARY_SEARCH_ONLY'||entry.source_url!==canonicalUrl(entry.target_code)||entry.coverage!==COVERAGE)reject();
  if(entry.license!=='CC BY-SA 2.0 KR'||entry.license_url!==LICENSE||entry.pos!==''||!Number.isFinite(Date.parse(entry.capture_date)))reject();
  if(!Array.isArray(entry.senses)||!entry.senses.length||entry.senses.length>200)reject();
  for(const s of entry.senses){
    if(typeof s.definition!=='string'||!s.definition.trim()||s.definition.length>1000||s.sense_order!==null||s.sense_order_status!=='API_DID_NOT_PROVIDE_VALID_ORDER')reject();
  }
  return entry;
}
function validateManifestHeader(m){
  if(!m||m.version!==VERSION||m.source_sha256!==PIN||m.provider!=='NIKL'||m.status!=='DICTIONARY_SEARCH_ONLY'||m.records!==287||m.unique_words!==277||m.coverage!==COVERAGE)reject();
  if(m.license!=='CC BY-SA 2.0 KR'||m.license_url!==LICENSE||m.official_sense_numbers_known!==false||m.daily_card_promotion!==false||!Number.isFinite(Date.parse(m.retrieved_at)))reject();
  for(const f of ['index.json','dictionary.json']){
    const item=m.files?.[f];if(!item||!/^[a-f0-9]{64}$/.test(item.sha256)||!Number.isSafeInteger(item.bytes)||item.bytes<=0||item.bytes>1_500_000)reject();
  }
}
export function validateOfficialManifest(manifest,index,dictionary){
  validateManifestHeader(manifest);
  if(index?.version!==manifest.version||dictionary?.version!==manifest.version||!Array.isArray(index.entries)||index.entries.length!==manifest.records||!dictionary.entries||Object.keys(dictionary.entries).length!==manifest.records)throw new DictionaryError('SNAPSHOT_MISMATCH');
  const ids=new Set(),words=new Set();let senses=0;
  for(const row of index.entries){
    if(!Array.isArray(row)||row.length!==3||typeof row[0]!=='string'||ids.has(row[0]))reject();
    const e=dictionary.entries[row[0]];validateOfficialEntry(e);
    if(e.id!==row[0]||e.word!==row[1]||e.homonym!==row[2]||e.capture_date!==manifest.retrieved_at)reject();
    ids.add(row[0]);words.add(row[1]);senses+=e.senses.length;
  }
  if(words.size!==manifest.unique_words||senses!==manifest.definition_count)reject();
  return true;
}
async function withDeadline(operation,externalSignal,timeoutMs){
  abortCheck(externalSignal);
  const c=new AbortController(),onAbort=()=>c.abort(externalSignal.reason);
  externalSignal?.addEventListener('abort',onAbort,{once:true});
  const timer=setTimeout(()=>c.abort(new DictionaryError('UNAVAILABLE')),timeoutMs);
  try {const value=await operation(c.signal);abortCheck(c.signal);abortCheck(externalSignal);return value;}
  finally {c.abort();clearTimeout(timer);externalSignal?.removeEventListener('abort',onAbort);}
}

export function createOfficialDictionaryClient(baseUrl,{timeoutMs=4500,retryDelayMs=30000}={}){
  const base=new URL('../nikl/',new URL(baseUrl,globalThis.location?.href||'http://localhost/'));
  let dataset=null,failedUntil=0,state={available:false,error:null},settled=false;
  async function load(signal){
    abortCheck(signal);
    if(dataset)return dataset;
    if(Date.now()<failedUntil)return null;
    // No shared abortable promise: concurrent callers cannot cancel one another.
    try {
      const result=await withDeadline(async localSignal=>{
        const manifest=await fetchJsonBounded(new URL('manifest.json',base),{signal:localSignal,limit:50000});
        validateManifestHeader(manifest);
        const [index,dictionary]=await Promise.all([
          fetchJsonBounded(new URL('index.json',base),{signal:localSignal,limit:500000,expectedHash:manifest.files['index.json'].sha256}),
          fetchJsonBounded(new URL('dictionary.json',base),{signal:localSignal,limit:1500000,expectedHash:manifest.files['dictionary.json'].sha256})
        ]);
        validateOfficialManifest(manifest,index,dictionary);
        return {manifest,index:index.entries,dictionary:dictionary.entries};
      },signal,timeoutMs);
      abortCheck(signal);dataset=result;state={available:true,error:null};settled=true;return dataset;
    }catch(e){
      abortCheck(signal);
      if(dataset)return dataset;
      state={available:false,error:typeof e.code==='string'?e.code:'UNAVAILABLE'};failedUntil=Date.now()+retryDelayMs;settled=true;return null;
    }
  }
  async function matchingRows(query,signal){
    const q=normalizeHeadword(query),d=await load(signal);
    if(!d)throw new DictionaryError(state.error||'UNAVAILABLE');
    return d.index.filter(row=>row[1].includes(q)).map(row=>[...row,'NIKL']);
  }
  return {
    load,matchingRows,
    async search(query,signal){
      const rows=await matchingRows(query,signal);
      return {...rankOfficialEntries(rows,query),providers:{official:{...state}}};
    },
    async entry(id,signal){
      if(!/^NK[1-9]\d*$/.test(String(id)))throw new DictionaryError('INVALID_QUERY');
      const d=await load(signal);if(!d)throw new DictionaryError(state.error||'UNAVAILABLE');
      const e=d.dictionary[id];if(!e)throw new DictionaryError('NOT_FOUND');
      return structuredClone(e);
    },
    get status(){return {...state}},get settled(){return settled},get manifest(){return dataset?.manifest||null}
  };
}

export function createFederatedDictionaryClient(baseUrl,options={}){
  const wiki=createDictionaryClient(baseUrl),official=createOfficialDictionaryClient(baseUrl,options);
  return {
    async search(query,signal){
      const q=normalizeHeadword(query);abortCheck(signal);
      const outcomes=await Promise.allSettled([
        withDeadline(s=>official.matchingRows(q,s),signal,options.providerTimeoutMs||6500),
        withDeadline(s=>wiki.matchingRows(q,s),signal,options.providerTimeoutMs||6500)
      ]);
      abortCheck(signal);
      const info=result=>({available:result.status==='fulfilled',error:result.status==='fulfilled'?null:(typeof result.reason?.code==='string'?result.reason.code:'UNAVAILABLE')});
      const providers={official:info(outcomes[0]),wiktionary:info(outcomes[1])};
      if(!providers.official.available&&!providers.wiktionary.available)throw new DictionaryError('ALL_PROVIDERS_UNAVAILABLE');
      const merged=mergeRankedResults({officialRows:providers.official.available?outcomes[0].value:[],wiktionaryRows:providers.wiktionary.available?outcomes[1].value:[]},q);
      return {...merged,providers,official_available:providers.official.available,query:q};
    },
    async entry(id,signal){
      if(/^NK[1-9]\d*$/.test(String(id)))return official.entry(id,signal);
      if(!/^WD[a-f0-9]{16}$/.test(String(id)))throw new DictionaryError('INVALID_QUERY');
      return {...await wiki.entry(id,signal),provider:'WIKTIONARY'};
    },
    async live(query,signal){return {...await wiki.live(query,signal),provider:'WIKTIONARY'}},
    get officialStatus(){return official.status}
  };
}
export const createNiklDictionaryClient=createOfficialDictionaryClient;
