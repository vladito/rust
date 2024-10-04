use std::io::{self, Write};

pub fn get_input() -> String {
    let mut input = String::new();
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut input).expect("Failed to read line");
    input.trim().to_string()
}
