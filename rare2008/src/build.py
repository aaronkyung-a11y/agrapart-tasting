"""원본(deck.src.html) → ../index.html (GitHub Pages용 완전한 문서, 사진·QR 내장)
   쓰는 법:  cd rare2008/src && python3 build.py            (QR 주소는 아래 기본값)
            python3 build.py https://다른.주소/              (QR 주소를 바꿀 때)
   out/artifact.html 은 Claude 아티팩트에 올릴 때 쓰는 조각(문서 틀 없음)이다."""
import base64, os, re, secrets, sys
URL = 'https://aaronkyung-a11y.github.io/agrapart-tasting/rare2008/'
s = open('deck.src.html', encoding='utf-8').read()
n = 0
def inl(m):
    global n; n += 1
    return 'src="data:image/jpeg;base64,' + base64.b64encode(open('img/' + m.group(1), 'rb').read()).decode() + '"'
s = re.sub(r'src="img/([^"]+)"', inl, s)
assert n == 8 and 'src="img/' not in s, n
if not os.path.exists('relay_topic.txt'): open('relay_topic.txt', 'w').write('yj-rare08-' + secrets.token_hex(8))
topic = open('relay_topic.txt').read().strip()
assert s.count("'__RELAY_TOPIC__'") == 1
s = s.replace("'__RELAY_TOPIC__'", "'" + topic + "'")
assert s.count('<!--QR-->') == 1
os.makedirs('out', exist_ok=True)
open('out/artifact.html', 'w', encoding='utf-8').write(s)
print('artifact', len(s), 'bytes')

url = sys.argv[1] if len(sys.argv) > 1 else URL
doc = s
if url:
    import qrcode
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=4, box_size=1)
    q.add_data(url); q.make(fit=True)
    m = q.get_matrix(); size = len(m); d = []
    for y, row in enumerate(m):
        x = 0
        while x < size:
            if row[x]:
                x0 = x
                while x < size and row[x]: x += 1
                d.append('M%d %dh%dv1h-%dz' % (x0, y, x - x0, x - x0))
            else: x += 1
    svg = '<svg viewBox="0 0 %d %d" role="img" aria-label="접속 QR 코드" shape-rendering="crispEdges"><path fill="currentColor" d="%s"></path></svg>' % (size, size, ''.join(d))
    doc = doc.replace('<!--QR-->', svg)
    print('qr', size, 'modules for', url)
cut = doc.index('</style>') + len('</style>')
head, body = doc[:cut].replace('<meta name="claude:viewport-fit-sides" content="cover">', ''), doc[cut:]
icon = "data:image/svg+xml," + "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230b1310'/%3E%3Cpath d='M32 32c-6-9-18-9-18 0s12 9 18 0 18-9 18 0-12 9-18 0z' fill='none' stroke='%23d8b565' stroke-width='3.5'/%3E%3C/svg%3E"
page = ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="robots" content="noindex, nofollow">\n<meta name="theme-color" content="#0b1310">\n'
        '<link rel="icon" href="' + icon + '">\n'
        '<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}html,body{overscroll-behavior:none}</style>\n'
        + head.strip() + '\n</head>\n<body>\n' + body.strip() + '\n</body>\n</html>\n')
open('../index.html', 'w', encoding='utf-8').write(page)
print('pages', len(page), 'bytes', 'topic', topic[:9] + '…')
