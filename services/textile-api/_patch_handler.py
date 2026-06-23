import sys

f = r'd:\ExportReady-Battery\backend\internal\handlers\export_job_handlers.go'
with open(f, 'rb') as fh:
    c = fh.read()

old = (
    b'"CSV":\n'
    b'\t\tjobType = models.ExportJobTypeCSV\n'
    b'\tdefault:\n'
    b'\t\trespondError(w, http.StatusBadRequest, "Invalid job_type. Must be QR_ZIP, LABELS_PDF, or CSV")'
)

new = (
    b'"CSV":\n'
    b'\t\tjobType = models.ExportJobTypeCSV\n'
    b'\tcase "DUE_DILIGENCE":\n'
    b'\t\tjobType = models.ExportJobTypeDueDiligence\n'
    b'\tdefault:\n'
    b'\t\trespondError(w, http.StatusBadRequest, "Invalid job_type. Must be QR_ZIP, LABELS_PDF, CSV, or DUE_DILIGENCE")'
)

if old in c:
    c = c.replace(old, new, 1)
    with open(f, 'wb') as fh:
        fh.write(c)
    print('OK: handler updated')
else:
    print('NOT FOUND')
    sys.exit(1)
