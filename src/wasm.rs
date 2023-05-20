use wasm_bindgen::prelude::wasm_bindgen;

use crate::SafeDecimal;

#[wasm_bindgen(js_name = SafeDecimal)]
pub struct SafeDecimalJS {
    value: SafeDecimal<f64>,
}

#[wasm_bindgen(js_class = SafeDecimal)]
impl SafeDecimalJS {
    #[wasm_bindgen(constructor)]
    pub fn from(value: f64) -> Self {
        SafeDecimalJS {
            value: SafeDecimal::from(value),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn field(&self) -> i32 {
        self.field
    }

    pub fn add(&self, rhs: SafeDecimalJS) -> Self {
        SafeDecimalJS {
            value: self.value + rhs.value,
        }
    }
}
