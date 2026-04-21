use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use sysinfo::System;
use tokio::time;
use warp::Filter;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StressEvent {
    pub event_type: String, // "cpu_spike", "ram_spike", "error_log", "git_frustration"
    pub severity: u8,       // 1-10
    pub message: String,
    pub timestamp: String,
}

#[tokio::main]
async fn main() {
    let system = Arc::new(Mutex::new(System::new_all()));
    
    // Channel for broadcasting stress events
    let (tx, _rx) = tokio::sync::broadcast::channel::<StressEvent>(100);
    
    let tx_clone = tx.clone();
    let sys_clone = system.clone();
    
    // Spawn system monitoring thread
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(2));
        loop {
            interval.tick().await;
            let mut sys = sys_clone.lock().unwrap();
            sys.refresh_cpu();
            sys.refresh_memory();
            
            let cpu_usage = sys.global_cpu_info().cpu_usage();
            if cpu_usage > 85.0 {
                let _ = tx_clone.send(StressEvent {
                    event_type: "cpu_spike".to_string(),
                    severity: 8,
                    message: format!("High CPU usage detected: {:.1}%", cpu_usage),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                });
            }
            
            let total_mem = sys.total_memory();
            let used_mem = sys.used_memory();
            let mem_usage = (used_mem as f64 / total_mem as f64) * 100.0;
            if mem_usage > 90.0 {
                let _ = tx_clone.send(StressEvent {
                    event_type: "ram_spike".to_string(),
                    severity: 9,
                    message: format!("High Memory usage detected: {:.1}%", mem_usage),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                });
            }
        }
    });
    
    // Mocking error log detection / git frustration for demonstration
    let tx_mock = tx.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(15));
        loop {
            interval.tick().await;
            // Randomly simulate an error log or fast commit to demonstrate "Witness"
            let _ = tx_mock.send(StressEvent {
                event_type: "error_log".to_string(),
                severity: 7,
                message: "RecursionError: maximum recursion depth exceeded. Developer caught in Samsara.".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            });
        }
    });

    // Websocket Route
    let tx_filter = warp::any().map(move || tx.clone());
    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(tx_filter)
        .map(|ws: warp::ws::Ws, tx: tokio::sync::broadcast::Sender<StressEvent>| {
            ws.on_upgrade(move |socket| handle_client(socket, tx))
        });

    println!("Witness Daemon (Prakriti Monitor) running on ws://127.0.0.1:8080/ws");
    warp::serve(ws_route).run(([127, 0, 0, 1], 8080)).await;
}

async fn handle_client(ws: warp::ws::WebSocket, tx: tokio::sync::broadcast::Sender<StressEvent>) {
    use futures_util::{StreamExt, SinkExt};
    let (mut client_ws_sender, _client_ws_rcv) = ws.split();
    let mut rx = tx.subscribe();

    tokio::task::spawn(async move {
        while let Ok(event) = rx.recv().await {
            if let Ok(msg) = serde_json::to_string(&event) {
                if client_ws_sender.send(warp::ws::Message::text(msg)).await.is_err() {
                    break;
                }
            }
        }
    });
}
