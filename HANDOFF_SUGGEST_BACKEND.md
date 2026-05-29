# Handoff: Suggest Widget — Google Apps Script Backend

## The idea
The Suggest widget (bottom-right floating button on lendpaper.com) currently has a placeholder Formspree endpoint. The better backend is a Google Apps Script web app that writes submissions directly to a Google Sheet.

## The challenge it solves
Google Forms/Sheets doesn't support cross-origin JSON responses. If you submit directly to a Google Form from another domain, you have to use `mode: 'no-cors'` in the fetch call — which means you fire the request blind and can't confirm success or failure. For a low-stakes suggestion form that's workable, but it means users see a fake success state even if the submission silently failed.

A Google Apps Script published as a web app accepts a real POST request, writes to Sheets, and returns a proper JSON response — so the widget can show a genuine success or surface a real error.

## The ideal solution

**Step 1 — Create the Sheet**
- New Google Sheet named "LendPaper Suggestions"
- Columns: Timestamp / Idea / Role / Email

**Step 2 — Write the Apps Script**
In the Sheet: Extensions → Apps Script. Replace the default code with:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.idea || '',
    data.role || '',
    data.email || ''
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**Step 3 — Publish**
Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy → copy the web app URL.

**Step 4 — Swap the endpoint in index.html**
Find the `FORMSPREE_ID` variable in the Suggest Widget JS block and replace the entire fetch URL:

```js
// Replace this:
var FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
// ...
fetch('https://formspree.io/f/' + FORMSPREE_ID, { ... })

// With this:
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
// ...
fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({ idea: data.get('idea'), role: data.get('role'), email: data.get('email') }),
  headers: { 'Content-Type': 'application/json' }
})
```

**Step 5 — Optional: email notification**
In Apps Script, add to `doPost` after `appendRow`:
```javascript
MailApp.sendEmail('info@lendpaper.com', 'New suggestion', 
  'Role: ' + data.role + '\nEmail: ' + data.email + '\n\n' + data.idea);
```

## Why this beats Formspree
- Responses land in a Sheet — easier to spot patterns across submissions than scanning inbox emails
- Role column lets you filter: "what are brokers asking for vs. loan officers"
- No third-party account or submission limits
- Sheet becomes a live product backlog by default
- Proper success/error handling in the widget
