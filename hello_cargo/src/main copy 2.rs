// fn main() {
//     for number in (1..4).rev() {
//         println!("{number}!");
//     }
//     println!("LIFTOFF!!!");
// }

fn main() {
    {
        let y = "popo";
        println!("{}", y);
    }
    //println!("{}", s);
    let s = "hello";
    println!("{}", s);

    let x = 5;
    let y = x;
    println!("{}", x);
    println!("{}", y);

    let s1 = String::from("hello");
    let s2 = s1.clone();
    println!("{}", s1);
    println!("{}", s2);   

    takes_ownership(s2);
    //println!("{}", s2);
}

fn takes_ownership(some_string: String) { // some_string comes into scope
    println!("{some_string} a");
} // Here, some_string goes out of scope and `drop` is called. The backing
  // memory is freed.