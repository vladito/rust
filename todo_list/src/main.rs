mod utils;
mod todo;
mod models;
mod storage;

fn main() {
    let mut todo_list = todo::TodoList::new();

    // Load tasks from file if any
    if let Ok(tasks) = storage::load_tasks(){
        todo_list.load_tasks(tasks);
    }

    loop{
        // Display menu and handle user input
        println!("--- Todo List Menu ---");
        println!("1. Add a task");
        println!("2. Remove a task");
        println!("3. Mark task as completed");
        println!("4. List all tasks");
        println!("5. Save and Exit");
        println!("Enter your choice:");

       let choice = utils::get_input(); // Optional: utility to handle user input
       
       match choice.trim() {
           "1" => {
                println!("Add description of the task:");
                let input = utils::get_input();
                todo_list.add_task(input);
            },
           "2" => {
                println!("Enter task number to remove:");
                let index = utils::get_input().trim().parse::<usize>().unwrap();
                todo_list.remove_task(index);
           }
           "3" => {
                println!("Enter task number to mark as completed:");
                let index = utils::get_input().trim().parse::<usize>().unwrap();
                todo_list.mark_completed(index);
            },
           "4" => todo_list.list_tasks(),
           "5" => {
            storage::save_tasks(&todo_list.get_tasks()).expect("Failed to save tasks.");
            println!("Tasks saved. Goodbye!");
            break;
        },
        _ => {
            println!("Invalid choice. Please try again.");
        }
       }

   }
}
