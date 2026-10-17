/**
 * Agrapart 시음 퀴즈 · 구글 시트 저장용 Apps Script
 *
 * 설치
 * 1. 새 구글 시트 생성 → 확장 프로그램 → Apps Script
 * 2. 기본 코드를 모두 지우고 이 파일 내용을 붙여넣고 저장
 * 3. 배포 → 새 배포 → 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 * 4. 처음 한 번 권한 승인 → 나오는 웹 앱 URL(…/exec)을 index.html의 SHEET_URL에 넣기
 *
 * 시트 구성 (자동 생성)
 * - picks: key | side | player | sel | updated
 * - state: done_t | done_m | updated
 */

var PLAYERS = ['영광', '상민', '정인', '유진', '호빈'];
var SIDES = ['t', 'm'];

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}
function picksSheet_() { return sheet_('picks', ['key', 'side', 'player', 'sel', 'updated']); }
function stateSheet_() {
  var sh = sheet_('state', ['done_t', 'done_m', 'updated']);
  if (sh.getLastRow() < 2) sh.appendRow([false, false, new Date()]);
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readAll_() {
  var sh = picksSheet_();
  var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues() : [];
  var picks = [];
  rows.forEach(function (r) {
    var sel = [];
    try { sel = JSON.parse(r[3] || '[]'); } catch (e) {}
    picks.push({ side: String(r[1]), player: String(r[2]), sel: sel });
  });
  var st = stateSheet_().getRange(2, 1, 1, 2).getValues()[0];
  return { ok: true, picks: picks, done: { t: st[0] === true, m: st[1] === true } };
}

function doGet() {
  return json_(readAll_());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.action === 'pick') {
      if (SIDES.indexOf(body.side) < 0 || PLAYERS.indexOf(body.player) < 0) return json_({ ok: false, error: 'bad player' });
      var sel = (Array.isArray(body.sel) ? body.sel : []).filter(function (x) { return typeof x === 'string' && x.length < 30; }).slice(0, 40);
      var sh = picksSheet_();
      var key = body.side + '|' + body.player;
      var keys = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [];
      var row = -1;
      for (var i = 0; i < keys.length; i++) if (keys[i][0] === key) { row = i + 2; break; }
      var values = [[key, body.side, body.player, JSON.stringify(sel), new Date()]];
      if (row > 0) sh.getRange(row, 1, 1, 5).setValues(values);
      else sh.appendRow(values[0]);
      return json_({ ok: true });
    }

    if (body.action === 'done') {
      var d = body.done || {};
      stateSheet_().getRange(2, 1, 1, 3).setValues([[d.t === true, d.m === true, new Date()]]);
      return json_({ ok: true });
    }

    if (body.action === 'reset') {
      var ps = picksSheet_();
      var st = stateSheet_();
      var cur = st.getRange(2, 1, 1, 2).getValues()[0];
      if (body.side === 'all') {
        if (ps.getLastRow() > 1) ps.deleteRows(2, ps.getLastRow() - 1);
        st.getRange(2, 1, 1, 3).setValues([[false, false, new Date()]]);
      } else if (SIDES.indexOf(body.side) > -1) {
        for (var r = ps.getLastRow(); r >= 2; r--) {
          if (ps.getRange(r, 2).getValue() === body.side) ps.deleteRow(r);
        }
        st.getRange(2, 1, 1, 3).setValues([[body.side === 't' ? false : cur[0], body.side === 'm' ? false : cur[1], new Date()]]);
      }
      return json_({ ok: true });
    }

    return json_({ ok: false, error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
}
