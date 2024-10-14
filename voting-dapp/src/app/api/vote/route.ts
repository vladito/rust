import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {Votingdapp} from '@/../anchor/target/types/votingdapp';
import { BN, Program } from "@coral-xyz/anchor";

const IDL = require('@/../anchor/target/idl/votingdapp.json');

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon:"https://cdn.shopify.com/s/files/1/0156/2170/files/69_480x480.png",
    title: "Vote for your favourite sex position!",
    description: "Vote between missionaire and 69",
    label:"Vote",
    links:{
      actions: [
        {
          label: "Vote for 69",
          href: "/api/vote?candidate=sixtynine",
        },
        {
          label: "Vote for Missionaire",
          href: "/api/vote?candidate=missionaire",
        }
      ]
    }
  }
  return Response.json(actionMetadata, {headers: ACTIONS_CORS_HEADERS});
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if(candidate != "sixtynine" && candidate != "missionaire") {
    return new Response("Invalid candidate", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<Votingdapp> = new Program(IDL, {connection});

  const body: ActionPostRequest = await request.json();
  let voter = new PublicKey(body.account);

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid candidate", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }  

  const instruction = await program.methods
  .vote(candidate, new BN(1))
  .accounts({
    signer: voter,
  })
  .instruction();

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  })
  .add(instruction);

  const response = await createPostResponse({
      fields: {
        transaction: transaction
      }
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS});
}
