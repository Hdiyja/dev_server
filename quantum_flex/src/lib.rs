use wasm_bindgen::prelude::*;
use std::sync::atomic::{AtomicUsize, Ordering};

// Global telemetry counters
static ALLOC_COUNTER: AtomicUsize = AtomicUsize::new(0x1048a0);
static DROP_COUNTER: AtomicUsize = AtomicUsize::new(0x1048b0);

#[wasm_bindgen]
pub struct VectorState {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[wasm_bindgen]
pub struct MemoryTelemetry {
    pub alloc: usize,
    pub drop: usize,
    pub safety: bool,
}

#[wasm_bindgen]
impl VectorState {
    #[wasm_bindgen]
    pub fn compute_rotation(scroll_progress: f64) -> VectorState {
        ALLOC_COUNTER.fetch_add(0x1a, Ordering::SeqCst);
        DROP_COUNTER.fetch_add(0x10, Ordering::SeqCst);

        let theta = scroll_progress * std::f64::consts::PI * 4.0;
        let phi = scroll_progress * std::f64::consts::PI * 2.0;

        VectorState {
            x: (theta * 0.5).sin() * (phi).cos(),
            y: (theta * 0.5).cos(),
            z: (theta * 0.5).sin() * (phi).sin(),
        }
    }

    #[wasm_bindgen]
    pub fn measure(y: f64, random_val: f64) -> VectorState {
        ALLOC_COUNTER.fetch_add(0x200, Ordering::SeqCst);
        DROP_COUNTER.fetch_add(0x100, Ordering::SeqCst);

        let prob_0 = (y + 1.0) / 2.0;

        if random_val < prob_0 {
            VectorState { x: 0.0, y: 1.0, z: 0.0 }
        } else {
            VectorState { x: 0.0, y: -1.0, z: 0.0 }
        }
    }
}

#[wasm_bindgen]
pub fn get_telemetry() -> MemoryTelemetry {
    MemoryTelemetry {
        alloc: ALLOC_COUNTER.load(Ordering::SeqCst),
        drop: DROP_COUNTER.load(Ordering::SeqCst),
        safety: true,
    }
}
