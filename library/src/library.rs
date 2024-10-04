use crate::book::{Book, Status};
use crate::utils;

pub struct Library {
   pub books: Vec<Book>
}

impl Library{
    pub fn new() -> Self{
        Library { books: Vec::new()}
    }

    pub fn add_book(&mut self){

        println!("Title of the book:");
        let title = utils::get_input();

        println!("Author of the book:");
        let author = utils::get_input();       

        let book = Book{
                title: title,
                author: author,
                status: Status::Available
        };

        self.books.push(book);
        println!("New book {0} added to the collection!", self.books.last().unwrap().title);
    }

    pub fn remove_book(&mut self){
        println!("Title of the book:");
        let book_title = utils::get_input();

        self.books.retain(|book| book.title != book_title);
        println!("Book {} removed successfully!", book_title);
    }

    pub fn check_out_book(&mut self){
        println!("Title of the book to be check out:");
        let book_title = utils::get_input();
        for book in &mut self.books{
            if book.title == book_title && matches!(book.status, Status::Available) {
                book.status = Status::CheckedOut;
                println!("Book '{}' checked out!", book.title);
                return;
            }
        }
        println!("Book '{}' not found or already checked out.", book_title);
    }

    pub fn return_book(&mut self){
        println!("Title of the book to be returned:");
        let book_title = utils::get_input();
        for book in &mut self.books{
            if book.title == book_title && matches!(book.status, Status::CheckedOut){
                book.status = Status::Available;
                println!("Book returned!");
                return;
            }
        }
        println!("Book not found or not checked out.");    
    }

    pub fn list_books(&self){
        for book in &self.books{
            book.print_details(); 
        }
        println!("Total books: {}", self.books.len());
    }
}