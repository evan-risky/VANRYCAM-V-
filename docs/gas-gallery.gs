/**
 * Cuplikan handler galeri untuk Google Apps Script (GAS).
 *
 * PENTING: file ini hanya dokumentasi. JANGAN menimpa kode production GAS yang
 * sudah live tanpa izin eksplisit. Gabungkan cabang `action=listGallery` ke
 * fungsi `doGet` yang sudah ada, lalu deploy ulang Web App.
 *
 * Kontrak respons yang diharapkan `src/lib/gas.ts`:
 * { ok: true, files: [{ id, name, size, mimeType, createdAt }] }
 *
 * Hanya file gambar (mimeType berawalan "image/"), diurutkan createdAt DESC.
 */

var GALLERY_DRIVE_FOLDER_ID = "1MABCea1U99q63pVkN1WKb00DuJkGQirR";

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";

  if (action === "listGallery") {
    return jsonOutput_(listGallery_());
  }

  return jsonOutput_({
    ok: false,
    message: "Aksi tidak dikenal.",
  });
}

function listGallery_() {
  try {
    var folder = DriveApp.getFolderById(GALLERY_DRIVE_FOLDER_ID);
    var iterator = folder.getFiles();
    var files = [];

    while (iterator.hasNext()) {
      var file = iterator.next();
      var mimeType = file.getMimeType();
      if (!/^image\//.test(mimeType)) continue;

      files.push({
        id: file.getId(),
        name: file.getName(),
        size: file.getSize(),
        mimeType: mimeType,
        createdAt: file.getDateCreated().toISOString(),
      });
    }

    files.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { ok: true, files: files };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
