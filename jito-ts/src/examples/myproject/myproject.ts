import { Keypair, Connection, Transaction, SystemProgram, PublicKey, VersionedTransaction } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as jito from 'jito-ts'
import { BundleResult } from '../../gen/block-engine/bundle';

(async () => {
    // Establish a connection to the Solana mainnet
    const connection = new Connection("https://api.mainnet-beta.solana.com");

    // Resolve the file path to ensure it's correct
    const keypairFilePath = path.resolve(__dirname, '../../../keys/J1toAAn3AndTLj3UU4MqMYfKqRXM7bL627CdGjXW915d.json');

    // Initialize the keypair variable
    let keypair: Keypair;
    try {
        // Read and parse the secret key from the JSON file
        const secretKeyData = fs.readFileSync(keypairFilePath, 'utf-8');
        const secretKeyArray = new Uint8Array(JSON.parse(secretKeyData));

        // Create a Keypair from the secret key
        keypair = Keypair.fromSecretKey(secretKeyArray);
        console.log('Keypair loaded successfully');
    } catch (error) {
        console.error('Error loading keypair or reading secret key file:', error);
        return; // Exit early if the keypair loading fails
    }

    try {
        // Create a transaction to send a tiny amount of lamports to itself (for testing)
        const importantTransaction = new Transaction().add(SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: keypair.publicKey, // Self-transfer for testing
            lamports: 1 // Amount to transfer (in lamports)
        }));

        // Set transaction parameters
        importantTransaction.feePayer = keypair.publicKey;

        // Fetch the latest blockhash and assign it to the transaction
        const { blockhash } = await connection.getLatestBlockhash();
        importantTransaction.recentBlockhash = blockhash;

        // // Sign the transaction with the keypair
        // importantTransaction.sign(keypair);

        // // Send the serialized transaction
        // const transactionSignature = await connection.sendRawTransaction(importantTransaction.serialize());
        // console.log('Transaction sent with signature:', transactionSignature);

        const client = jito.searcher.searcherClient("ny.mainnet.block-engine.jito.wtf");

        const tipAccount = new PublicKey((await client.getTipAccounts())[0]);
        const tip = 10_000;

        importantTransaction.add(SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: tipAccount,
            lamports: tip        
        }));

        importantTransaction.sign(keypair);
        
        const tx : VersionedTransaction = VersionedTransaction.deserialize(importantTransaction.serialize());

        const bundle = new jito.bundle.Bundle([tx], 5);

        const onSucess = (bundleResult: BundleResult) => {
            console.log("Bundle sent successfully! " + bundleResult.bundleId);
            if(bundleResult.accepted){
                console.log("Bundle was accepted! "+bundleResult.accepted);
            }
            if(bundleResult.rejected){
                console.log("Bundle was rejected! "+bundleResult.rejected);
            }
            if(bundleResult.dropped){
                console.log("Bundle was dropped! "+bundleResult.dropped);
            }
        }
        const onError = (e: Error) => {
            console.log("Could not send bundle! "+e);
        }

        client.onBundleResult(onSucess, onError);

        const bundledUID = await client.sendBundle(bundle);

        console.log(bundledUID);
    } catch (transactionError) {
        console.error('Error while creating or sending transaction:', transactionError);
    }

})();
