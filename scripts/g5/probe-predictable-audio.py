#!/usr/bin/env python3
"""Bulk-probe predictable Commons pronunciation filenames for G5 admission.

Uses grouped `titles=` requests to minimize Wikimedia API traffic. Results remain
provisional admission evidence only; product linkage still requires download/hash
and card-specific source audit.
"""
from __future__ import annotations
import html, json, re, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
POOL=ROOT/'content/g5/candidate-pool.json'
OUT=ROOT/'content/g5/commons-audio-admission-ledger.json'
API='https://commons.wikimedia.org/w/api.php'
UA='NameOnMyMind/0.1 (noncommercial pronunciation provenance research)'
GAP=6.5
PREFIX={
'en-US':['En-us-','En-US-'], 'de-DE':['De-','De-de-'], 'fr-FR':['Fr-','Fr-fr-'],
'es-ES':['Es-','Es-es-'], 'pt-BR':['Pt-br-','Pt-'], 'pt-PT':['Pt-pt-','Pt-'],
'ja-JP':['Ja-'], 'ko-KR':['Ko-'], 'zh-CN':['Zh-cn-','Zh-']}
last=0.0

def api(params):
 global last
 params={'format':'json','formatversion':2,'maxlag':5,**params}
 url=API+'?'+urllib.parse.urlencode(params)
 for attempt in range(7):
  wait=GAP-(time.monotonic()-last)
  if wait>0: time.sleep(wait)
  req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=40) as r:
    last=time.monotonic();return json.load(r)
  except urllib.error.HTTPError as e:
   last=time.monotonic()
   if e.code not in (429,503) or attempt==6: raise
   try: delay=max(5,float(e.headers.get('Retry-After','0')))
   except: delay=5*(2**attempt)
   print(f'RATE_LIMIT {e.code}: sleep {delay:.0f}s',flush=True);time.sleep(min(delay,60))
 raise RuntimeError('retry exhausted')

def clean(v):
 if isinstance(v,dict): v=v.get('value','')
 return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',html.unescape(str(v or '')))).strip()

def norm(s): return re.sub(r'[\s_-]+','',s.casefold())

def titles_for(c):
 term=c['term']; vals=[]
 for p in PREFIX.get(c['language_code'],[]):
  for term_variant in dict.fromkeys([term,term.lower()]):
   for ext in ['ogg','wav','oga']:
    vals.append(f'File:{p}{term_variant}.{ext}')
 return list(dict.fromkeys(vals))

def main():
 pool=json.loads(POOL.read_text())['candidates']
 title_map={}; all_titles=[]
 for idx,c in enumerate(pool):
  for t in titles_for(c): title_map.setdefault(t,[]).append(idx);all_titles.append(t)
 all_titles=list(dict.fromkeys(all_titles))
 details={}
 chunks=[all_titles[i:i+45] for i in range(0,len(all_titles),45)]
 for n,ch in enumerate(chunks,1):
  d=api({'action':'query','prop':'imageinfo','titles':'|'.join(ch),'iiprop':'url|sha1|mime|mediatype|extmetadata'})
  for page in d.get('query',{}).get('pages',[]):
   if page.get('missing') or not page.get('imageinfo'): continue
   ii=page['imageinfo'][0]; ext=ii.get('extmetadata',{})
   details[page['title']]={
    'title':page['title'],'url':ii.get('url'),'description_url':ii.get('descriptionurl'),'sha1':ii.get('sha1'),'mime':ii.get('mime'),'mediatype':ii.get('mediatype'),
    'creator':clean(ext.get('Artist')),'credit':clean(ext.get('Credit')),'description':clean(ext.get('ImageDescription')),
    'license_short_name':clean(ext.get('LicenseShortName')),'license_url':clean(ext.get('LicenseUrl')),'usage_terms':clean(ext.get('UsageTerms')),'attribution_required':clean(ext.get('AttributionRequired'))}
  print(f'BULK {n}/{len(chunks)} existing={len(details)}',flush=True)
 items=[]
 for idx,c in enumerate(pool):
  rows=[]
  for t in titles_for(c):
   # API normalizes title capitalization, so try normalized title identity too.
   row=details.get(t)
   if row is None:
    nt=norm(t)
    row=next((v for k,v in details.items() if norm(k)==nt),None)
   if not row: continue
   reasons=[]
   if row.get('mediatype')!='AUDIO': reasons.append('not_audio')
   if not row.get('creator'): reasons.append('creator_missing')
   if not row.get('license_short_name'): reasons.append('license_missing')
   if not row.get('sha1'): reasons.append('source_hash_missing')
   if norm(c['term']) not in norm((row.get('title') or '')+' '+(row.get('description') or '')): reasons.append('term_fit_unclear')
   prefixes=PREFIX.get(c['language_code'],[])
   if not any((row.get('title') or '').casefold().startswith(('file:'+p).casefold()) for p in prefixes): reasons.append('locale_fit_requires_manual_confirmation')
   r={**row,'provisional_status':'PROVISIONAL_PASS' if not reasons else 'REVIEW_REQUIRED','reasons':reasons}
   if not any(x['title']==r['title'] for x in rows): rows.append(r)
  rows.sort(key=lambda x:(x['provisional_status']!='PROVISIONAL_PASS',len(x['reasons']),x['title']))
  items.append({**c,'audio_candidates':rows,'audio_candidate_count':len(rows),'probe_method':'predictable_filename_bulk'})
 out={'schema_version':'1.0.0','purpose':'Admission research only; no result is product evidence until source-first download/hash/locale audit.','source':'Wikimedia Commons MediaWiki Action API bulk title probe','items':items}
 OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 stats={'candidate_count':len(items),'with_audio_candidate':sum(bool(x['audio_candidates']) for x in items),'with_provisional_pass':sum(any(y['provisional_status']=='PROVISIONAL_PASS' for y in x['audio_candidates']) for x in items),'by_language':{}}
 for x in items:
  d=stats['by_language'].setdefault(x['language_code'],{'total':0,'with_audio':0,'provisional':0});d['total']+=1;d['with_audio']+=bool(x['audio_candidates']);d['provisional']+=any(y['provisional_status']=='PROVISIONAL_PASS' for y in x['audio_candidates'])
 print(json.dumps(stats,ensure_ascii=False,indent=2))
if __name__=='__main__': main()
