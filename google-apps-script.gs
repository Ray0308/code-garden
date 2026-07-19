const SHEET_NAME = '研修記録';

function doPost(event) {
  const data = JSON.parse(event.postData.contents);
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['セッションID','氏名','研修開始','階層','階層名','階層開始','クリア時刻','所要秒数','ソースコード']);
  }
  const safe = value => /^[=+\-@]/.test(String(value)) ? `'${value}` : value;
  sheet.appendRow([data.sessionId,safe(data.name),data.sessionStartedAt,data.floor,safe(data.floorTitle),data.floorStartedAt,data.completedAt,data.elapsedSeconds,safe(data.sourceCode)]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
