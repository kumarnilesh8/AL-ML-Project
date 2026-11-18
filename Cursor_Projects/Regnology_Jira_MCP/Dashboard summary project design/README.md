# Middle East Portfolio Dashboard

## Overview

This project contains a standalone browser-based dashboard for viewing a Middle East project portfolio delivery summary.

The dashboard is delivered as a static HTML page and can be opened directly in a browser. It is intended for lightweight portfolio reporting, visual review, and sharing project delivery status without requiring a database or backend service.

## Project Contents

- `Middle East Portfolio Dashboard.html`  
  Main bundled dashboard page. Open this file in a browser to run the dashboard.

- `support.js`  
  Runtime support script used by the dashboard page.

## What It Does

The dashboard provides a Regnology-branded project portfolio summary experience. It supports:

- Viewing project delivery summary information.
- Loading data from a local Excel, XLS, or CSV file.
- Loading data from a URL or network path where browser security allows it.
- Using sample data for demos or testing.
- Running fully in the browser as a static web page.

## How To Run Locally

1. Open the project folder:

   ```text
   C:\AI_ML\Cursor_Projects\Regnology_Jira_MCP\Dashboard summary project design
   ```

2. Double-click:

   ```text
   Middle East Portfolio Dashboard.html
   ```

3. The dashboard opens in your default browser.

4. Choose one of the data feed options in the dashboard:

   - `Local file`
   - `URL / network path`
   - `Sample`

## Loading Data

### Local File

Use this option when the workbook is on your machine or on a mapped network drive.

1. Select `Local file`.
2. Click `Choose .xlsx file`.
3. Select the Excel, XLS, or CSV file.
4. The dashboard reads the file and updates the report.

Supported formats:

```text
.xlsx
.xls
.csv
```

### URL / Network Path

Use this option for HTTP links, SharePoint download links, or network paths.

Examples:

```text
https://example/path/file.xlsx
file://server/share/file.xlsx
\\server\share\file.xlsx
```

Browser restrictions may block some links, especially SharePoint page URLs, `file://` links, and UNC paths. If loading fails, download the file locally or use the `Local file` option.

### Sample

Use the `Sample` option to verify that the dashboard renders correctly without providing an external workbook.

## Sharing With Other Users

For one-off sharing, send users the HTML file and `support.js` together in the same folder.

For regular internal use, host the folder as a static website using IIS or another internal web server.

Recommended IIS folder:

```text
C:\inetpub\wwwroot\dashboard
```

Recommended URL format:

```text
http://server-name/dashboard/
```

For easier hosting, rename the main HTML file to:

```text
index.html
```

Then users can open the dashboard using the folder URL instead of the full HTML file name.

## Important Notes

- The dashboard runs in the user's browser.
- It does not save uploaded files.
- It does not require a backend service for basic local usage.
- JavaScript must be enabled in the browser.
- Microsoft Edge or Google Chrome is recommended.
- SharePoint and network path loading can fail because of browser security, authentication, or CORS restrictions.

## Troubleshooting

### The Dashboard Does Not Open

Confirm both files are present in the same folder:

```text
Middle East Portfolio Dashboard.html
support.js
```

Then open the HTML file with Microsoft Edge or Google Chrome.

### The Page Shows A JavaScript Error

Refresh the page. If the issue continues, confirm that `support.js` is in the same folder as the HTML file.

### The Excel File Does Not Load

Try these steps:

1. Use the `Local file` option.
2. Download the workbook from SharePoint first.
3. Avoid SharePoint list/page URLs.
4. Use a direct file download link if using URL mode.

### Network Path Loading Fails

Browsers often block direct loading from `file://` or UNC network paths. Use the `Local file` option and browse to the mapped network drive instead.

## Future Improvements

Possible enhancements:

- Host the dashboard on IIS for organization-wide internal access.
- Add a backend service to fetch SharePoint or network data automatically.
- Convert source data to JSON for faster loading.
- Add authentication if hosted as an internal web app.
- Add scheduled refresh from a central data source.

## Summary

The Middle East Portfolio Dashboard is a lightweight static dashboard for project portfolio reporting. It is easy to run locally by opening the HTML file, and it can be shared more reliably by hosting it as an internal static website.
