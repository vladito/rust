use crate::models::task::Task;
use std::fs::{File, OpenOptions};
use std::io::{BufReader, BufRead, BufWriter, Write};
use std::error::Error;

const FILE_NAME: &str = "tasks.txt";

// Save tasks to a file
pub fn save_tasks(tasks: &[Task]) -> Result<(), Box<dyn Error>> {
    let file = OpenOptions::new().create(true).write(true).truncate(true).open(FILE_NAME)?;
    let mut writer = BufWriter::new(file);

    for task in tasks {
        writeln!(writer, "{}|{}", task.description, task.completed)?;
    }

    Ok(())
}

// Load tasks from a file
pub fn load_tasks() -> Result<Vec<Task>, Box<dyn Error>> {
    let file = File::open(FILE_NAME)?;
    let reader = BufReader::new(file);

    let mut tasks = Vec::new();
    for line in reader.lines() {
        let line = line?;
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() == 2 {
            let description = parts[0].to_string();
            let completed = parts[1].parse::<bool>()?;
            tasks.push(Task { description, completed });
        }
    }

    Ok(tasks)
}