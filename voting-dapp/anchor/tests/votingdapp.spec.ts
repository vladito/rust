import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js';
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import {Votingdapp} from '../target/types/votingdapp'

const IDL = require('../target/idl/votingdapp.json');
const votingAddress = new PublicKey("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

describe('votingdapp', () => {
  // Configure the client to use the local cluster.
  
  let context;
  let provider;
  let votingProgram: Program<Votingdapp>;

  beforeAll(async () => {
    context = await startAnchor("", [{name: "votingdapp", programId: votingAddress}], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Votingdapp>(
      IDL,
      provider,
    );   
  })


  it("Initialize poll", async () => {
    await votingProgram.methods.initialisePoll(
      new anchor.BN(1),
      "What is your favourite position?",
      new anchor.BN(0),
      new anchor.BN(1828786527),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [ new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your favourite position?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("Initialize candidate", async () => {
    await votingProgram.methods.initialiseCandidate(
      "69",
      new anchor.BN(1),
    ).rpc();
    
    await votingProgram.methods.initialiseCandidate(
      "missionaire",
      new anchor.BN(1),
    ).rpc();

    const [sixtynineAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("69")], 
      votingAddress
    )
    const sixtynineCandidate = await votingProgram.account.candidate.fetch(sixtynineAddress);
    console.log(sixtynineCandidate);
    expect(sixtynineCandidate.candidateVotes.toNumber()).toEqual(0);

    const [missionaireAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("missionaire")], 
      votingAddress
    )
    const missionaireCandidate = await votingProgram.account.candidate.fetch(missionaireAddress);
    console.log(missionaireCandidate);
    expect(missionaireCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("Vote", async () => {
    await votingProgram.methods.vote(
      "69",
      new anchor.BN(1)
    ).rpc();

    const [sixtynineAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("69")], 
      votingAddress
    )
    const sixtynineCandidate = await votingProgram.account.candidate.fetch(sixtynineAddress);
    console.log(sixtynineCandidate);
    expect(sixtynineCandidate.candidateVotes.toNumber()).toEqual(1);

  });

});
