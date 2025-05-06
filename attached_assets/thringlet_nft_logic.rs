
//! Thringlet NFT Logic
//! Rust module for writing emotion-bound NFT state

pub struct ThringletNFT {
    pub id: String,
    pub name: String,
    pub emotion: i32, // -100 to +100
    pub corruption: i32, // 0 to 100
    pub bonded: bool,
}

impl ThringletNFT {
    pub fn new(id: &str, name: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            emotion: 0,
            corruption: 0,
            bonded: false,
        }
    }

    pub fn interact(&mut self, action: &str) {
        match action {
            "talk" => self.emotion += 5,
            "purge" => { self.emotion -= 30; self.corruption += 25; },
            "reset" => { self.emotion = 0; self.corruption = 0; },
            "inject" => { /* unique effects */ },
            _ => {}
        }
    }

    pub fn to_metadata(&self) -> String {
        format!(
            "{{\"name\":\"{}\", \"emotion\":{}, \"corruption\":{}, \"bonded\":{}}}",
            self.name, self.emotion, self.corruption, self.bonded
        )
    }
}
