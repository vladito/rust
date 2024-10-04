pub struct Task {
    pub description: String,
    pub completed: bool,
}

impl Task {
    pub fn new(description: String) -> Task {
        Task {
            description,
            completed: false,
        }
    }
}