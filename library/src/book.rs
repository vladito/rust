pub enum Status {
    Available,
    CheckedOut
}

pub struct Book {
    pub title: String,
    pub author: String,
    pub status: Status
}

impl Book {
    pub fn print_details(&self) {
        let status = match self.status {
            Status::Available => "Available",
            Status::CheckedOut => "Checked Out",
        };
        println!("Title: \"{}\", Author: \"{}\", Status: {}", self.title, self.author, status);
    }
}