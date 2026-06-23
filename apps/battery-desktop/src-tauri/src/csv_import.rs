use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufRead, BufReader};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CsvRow {
    pub serial_number: String,
    pub chemistry: Option<String>,
    pub voltage: Option<String>,
    pub capacity: Option<String>,
    pub weight: Option<String>,
    pub manufacturer: Option<String>,
    pub country_of_origin: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CsvPreview {
    pub rows: Vec<CsvRow>,
    pub total: usize,
    pub valid: usize,
    pub errors: Vec<String>,
}

#[tauri::command]
pub fn parse_csv(path: String) -> Result<CsvPreview, String> {
    let file = File::open(&path).map_err(|e| format!("Failed to open file: {}", e))?;
    let reader = BufReader::new(file);
    let mut rows = Vec::new();
    let mut errors = Vec::new();
    let mut line_num: usize = 0;

    for line in reader.lines() {
        line_num += 1;
        let line = match line {
            Ok(l) => l,
            Err(e) => {
                errors.push(format!("Line {}: read error - {}", line_num, e));
                continue;
            }
        };

        if line_num == 1 {
            // Skip header row
            continue;
        }

        let cols: Vec<&str> = line.split(',').collect();
        if cols.len() < 1 {
            errors.push(format!("Line {}: no serial_number column", line_num));
            continue;
        }

        let serial = cols[0].trim().to_string();
        if serial.is_empty() {
            errors.push(format!("Line {}: empty serial_number", line_num));
            continue;
        }

        rows.push(CsvRow {
            serial_number: serial,
            chemistry: cols.get(1).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
            voltage: cols.get(2).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
            capacity: cols.get(3).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
            weight: cols.get(4).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
            manufacturer: cols.get(5).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
            country_of_origin: cols.get(6).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
        });
    }

    let valid = rows.len();
    Ok(CsvPreview {
        rows,
        total: line_num.saturating_sub(1),
        valid,
        errors,
    })
}

#[tauri::command]
pub fn generate_serials_from_csv(
    rows: Vec<CsvRow>,
    batch_id: String,
) -> Result<Vec<crate::db::PrintJob>, String> {
    let mut jobs = Vec::new();
    for row in rows {
        let qr_data = format!("{}/{}", batch_id, row.serial_number);
        let zpl = crate::printer::generate_zpl(crate::printer::ZplPayload {
            qr_data: qr_data.clone(),
            serial: row.serial_number.clone(),
            batch_name: batch_id.clone(),
            width_mm: Some(50),
            height_mm: Some(30),
        });

        // PrintJob is created but not persisted here — caller decides
        jobs.push(crate::db::PrintJob {
            id: uuid::Uuid::new_v4().to_string(),
            batch_id: batch_id.clone(),
            serial_number: row.serial_number,
            zpl_data: zpl,
            status: "pending".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            printed_at: None,
        });
    }
    Ok(jobs)
}
