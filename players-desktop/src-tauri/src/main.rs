#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows release

// Simple Tauri entrypoint. We can add commands later for file I/O, LAN discovery, etc.
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
