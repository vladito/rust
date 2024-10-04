mod book;
mod library;
mod utils;

use crate::library::Library;

fn main() {
    let mut library = Library::new();
    println!("Created a new library with {} books.", library.books.len());

    loop{
         // Display menu and handle user input
         println!("Welcome to the Library Management System!");
         println!("1. Add a book");
         println!("2. Remove a book");
         println!("3. Check out a book");
         println!("4. Return a book");
         println!("5. List all books");
         println!("6. Exit");
         println!("Enter your choice:");

        let choice = utils::get_input(); // Optional: utility to handle user input
        
        match choice.trim() {
            "1" => library.add_book(),
            "2" => library.remove_book(),
            "3" => library.check_out_book(),
            "4" => library.return_book(),
            "5" => library.list_books(),
            "6" => break,
            _ => println!("Invalid choice, please try again."),
        }

    }
}
