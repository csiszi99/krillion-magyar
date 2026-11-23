"""Kérdésbank ellenőrzése és questions.js építése.
Használat: python3 tools/build.py   (a krillion mappából)"""
import json, re, sys, unicodedata, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'^(a|az|the)\s+', '', s)
    return re.sub(r'[^a-z0-9]', '', s)

allq, problems, seen_ids = [], [], set()
for f in sorted(glob.glob(os.path.join(ROOT, 'q', '*.json'))):
    try:
        data = json.load(open(f, encoding='utf-8'))
    except Exception as e:
        problems.append(f'{f}: JSON hiba {e}'); continue
    for q in data:
        qid = q.get('id')
        if qid in seen_ids: problems.append(f'{qid}: duplikált id')
        seen_ids.add(qid)
        for k in ('id', 'cat', 'q', 'a'):
            if k not in q: problems.append(f'{qid}: hiányzó mező {k}')
        ans = q.get('a', [])
        if len(ans) < 20: problems.append(f'{qid}: csak {len(ans)} válasz')
        keys, tiers = {}, [0]*7
        clean = []
        for item in ans:
            if not (isinstance(item, list) and len(item) == 2 and isinstance(item[1], int) and 1 <= item[1] <= 6):
                problems.append(f'{qid}: hibás válaszelem {item}'); continue
            tiers[item[1]] += 1
            names = [n.strip() for n in item[0].split('|') if n.strip()]
            uniq = []
            for n in names:
                k = norm(n)
                if not k: continue
                if k in keys and keys[k] != names[0]:
                    problems.append(f'{qid}: alias-ütközés "{n}" ({keys[k]} / {names[0]})')
                    continue
                keys.setdefault(k, names[0])
                if n not in uniq: uniq.append(n)
            if uniq: clean.append(['|'.join(uniq), item[1]])
        if tiers[1] == 0: problems.append(f'{qid}: nincs 1-es tier')
        if tiers[5] + tiers[6] == 0: problems.append(f'{qid}: nincs 5-6-os tier')
        q['a'] = clean
        q['hint'] = q.get('hint', '') or ''
        allq.append({'id': q['id'], 'cat': q['cat'], 'q': q['q'], 'hint': q['hint'], 'a': q['a']})

# hasonló kérdésszövegek
texts = {}
for q in allq:
    k = norm(q['q'])
    if k in texts: problems.append(f"{q['id']}: ugyanaz a kérdés, mint {texts[k]}")
    texts[k] = q['id']

print(f'{len(allq)} kérdés, átlag {sum(len(q["a"]) for q in allq)/max(1,len(allq)):.1f} válasz')
for p in problems: print(' -', p)
with open(os.path.join(ROOT, 'questions.js'), 'w', encoding='utf-8') as out:
    out.write('window.QBANK=' + json.dumps(allq, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('questions.js kész', os.path.getsize(os.path.join(ROOT, 'questions.js')) // 1024, 'KB')
