use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrinterInfo {
    pub name: String,
    pub vid: u16,
    pub pid: u16,
    pub connected: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ZplPayload {
    pub qr_data: String,
    pub serial: String,
    pub batch_name: String,
    pub width_mm: Option<u32>,
    pub height_mm: Option<u32>,
}

/// Detect USB printers by VID/PID (Zebra, TSC, Godex, etc.)
#[tauri::command]
pub fn detect_usb_printers() -> Vec<PrinterInfo> {
    let mut printers = Vec::new();

    // Known thermal printer VID/PID ranges
    let known_printers = [
        (0x0a5f, 0x000a, "Zebra ZD420"),
        (0x0a5f, 0x008b, "Zebra ZD230"),
        (0x0a5f, 0x008c, "Zebra ZD621"),
        (0x1203, 0x0001, "TSC TTP-244"),
        (0x1203, 0x0002, "TSC TTP-247"),
        (0x0dd4, 0x015d, "Godex G500"),
    ];

    match rusb::devices() {
        Ok(devices) => {
            for device in devices.iter() {
                if let Ok(desc) = device.device_descriptor() {
                    for &(vid, pid, name) in &known_printers {
                        if desc.vendor_id() == vid && desc.product_id() == pid {
                            printers.push(PrinterInfo {
                                name: name.to_string(),
                                vid,
                                pid,
                                connected: true,
                            });
                        }
                    }
                }
            }
        }
        Err(_) => {}
    }

    // Also try Windows WMI / CUPS fallback for generic USB printers
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("wmic")
            .args(["printer", "get", "name", "/format:csv"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(1) {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 2 {
                    let name = parts.last().unwrap_or(&"").trim();
                    if !name.is_empty() && name.to_lowercase().contains("zebra") || name.to_lowercase().contains("tsc") {
                        printers.push(PrinterInfo {
                            name: name.to_string(),
                            vid: 0,
                            pid: 0,
                            connected: true,
                        });
                    }
                }
            }
        }
    }

    printers
}

/// Generate ZPL II code for a QR label
#[tauri::command]
pub fn generate_zpl(payload: ZplPayload) -> String {
    let w = payload.width_mm.unwrap_or(50);
    let h = payload.height_mm.unwrap_or(30);
    let qr_size = std::cmp::min(w, h) as i32 * 4;

    format!(
        "^XA
^PW{w}
^LL{h}
^FO20,20
^BQN,2,{qr_size}
^FDMA,{qr_data}^FS
^FO20,{y_text}
^A0N,24,24
^FD{serial}^FS
^FO20,{y_batch}
^A0N,18,18
^FD{batch}^FS
^XZ",
        w = w * 8,
        h = h * 8,
        qr_data = payload.qr_data,
        serial = payload.serial,
        batch = payload.batch_name,
        qr_size = qr_size / 10,
        y_text = qr_size + 30,
        y_batch = qr_size + 60,
    )
}

/// Send ZPL to printer via Windows print command
/// On Linux this would use CUPS `lp` command
#[tauri::command]
pub fn print_zpl(printer_name: String, zpl: String) -> PrintResult {
    #[cfg(target_os = "windows")]
    {
        // Write ZPL to temp file and print via lpr or copy to USB
        let temp_path = std::env::temp_dir().join("label.zpl");
        if let Err(e) = std::fs::write(&temp_path, &zpl) {
            return PrintResult {
                success: false,
                message: format!("Failed to write temp file: {}", e),
            };
        }

        // Try Windows print command
        match Command::new("cmd")
            .args([
                "/c",
                "copy",
                temp_path.to_str().unwrap_or(""),
                format!("\\\\{}\\", printer_name).as_str(),
            ])
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    PrintResult {
                        success: true,
                        message: "Label sent to printer".to_string(),
                    }
                } else {
                    PrintResult {
                        success: false,
                        message: format!(
                            "Print failed: {}",
                            String::from_utf8_lossy(&output.stderr)
                        ),
                    }
                }
            }
            Err(e) => PrintResult {
                success: false,
                message: format!("Failed to execute print command: {}", e),
            },
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Linux/Mac fallback: use lp command
        match Command::new("lp")
            .args(["-d", &printer_name, "-o", "raw"])
            .stdin(std::process::Stdio::piped())
            .spawn()
        {
            Ok(mut child) => {
                use std::io::Write;
                if let Some(stdin) = child.stdin.take() {
                    let mut stdin = stdin;
                    let _ = stdin.write_all(zpl.as_bytes());
                }
                PrintResult {
                    success: true,
                    message: "Label sent to printer".to_string(),
                }
            }
            Err(e) => PrintResult {
                success: false,
                message: format!("Failed to spawn lp: {}", e),
            },
        }
    }
}

#[tauri::command]
pub fn print_test_page(printer_name: String) -> PrintResult {
    let zpl = "^XA^FO20,20^A0N,30,30^FDTest Print^FS^XZ".to_string();
    print_zpl(printer_name, zpl)
}
