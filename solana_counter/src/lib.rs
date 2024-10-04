use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

pub struct Counter;

impl Counter {
    pub fn increment(counter_account: &mut u64) {
        *counter_account += 1;
    }
}

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Log a message to the blockchain
    msg!("Hello, Solana!");

    // Get the account to store the counter
    let account = &accounts[0];
    let mut counter: u64 = account.try_borrow_mut_data()?.try_into().unwrap_or(0);

    // Call our counter increment function
    Counter::increment(&mut counter);

    // Store the updated counter value back in the account data
    account.try_borrow_mut_data()?.copy_from_slice(&counter.to_le_bytes());

    msg!("Counter is now: {}", counter);

    Ok(())
}
