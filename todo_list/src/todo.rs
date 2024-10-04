use crate::models::task::Task;

pub struct TodoList {
    tasks:Vec<Task>
}

impl TodoList {
    pub fn new() -> TodoList {
        TodoList { tasks: Vec::new()}
    }

    pub fn add_task(&mut self, description: String){
        let task = Task::new(description);
        self.tasks.push(task);
        println!("New task {0} added to the collection!", self.tasks.last().unwrap().description);
    }

    pub fn list_tasks(&self) {
        if self.tasks.is_empty() {
            println!("No tasks available.");
        } else {
            for (i, task) in self.tasks.iter().enumerate() {
                let status = if task.completed { "[x]" } else { "[ ]" };
                println!("{}: {} {}", i, status, task.description);
            }
        }
    }

    pub fn remove_task(&mut self, index: usize) {
        if index < self.tasks.len() {
            self.tasks.remove(index);
        } else {
            println!("Invalid task number.");
        }
    }

    pub fn mark_completed(&mut self, index: usize) {
        if let Some(task) = self.tasks.get_mut(index) {
            task.completed = true;
        } else {
            println!("Invalid task number.");
        }
    }

    pub fn get_tasks(&self) -> &Vec<Task> {
        &self.tasks
    }

    pub fn load_tasks(&mut self, tasks: Vec<Task>) {
        self.tasks = tasks;
    }
}
    
