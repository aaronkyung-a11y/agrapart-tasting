# Agrapart 시음 노트

Pascal Agrapart 생산자 이야기, 5인 블라인드 향 퀴즈, 상식 퀴즈를 담은 한 페이지 웹앱.

- `index.html` — GitHub Pages로 서비스되는 페이지
- `apps-script.gs` — 5명의 답을 구글 시트에 모으는 Apps Script (웹 앱으로 배포)

## 연결
1. 구글 시트 → 확장 프로그램 → Apps Script에 `apps-script.gs` 붙여넣기
2. 배포 → 새 배포 → 웹 앱 (실행: 나 / 액세스: 모든 사용자)
3. 웹 앱 URL을 `index.html`의 `SHEET_URL`에 넣기

`SHEET_URL`이 비어 있으면 이 기기에만 저장됩니다.
