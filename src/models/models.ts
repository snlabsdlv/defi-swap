// export interface Transaction {
// }

/*
//   Class is essentially an object factory (ie. a blueprint of what an object is supposed to look like and then implemented)
//   Interface is a structure used solely for type-checking.
//   While a class may have initialized properties and methods to help create objects,
//   an interface essentially defines the properties and type an object can have.
//   In the scenario you described, one would use the interface to set the type for UserLogin.
 */

export class Account {
    "address": string;
    "privateKey": string;

}
export class Transaction {
    "blockHash": string;
    "blockNumber": number;
    "from": string;
    "gas": number;
    "gasPrice": string;
    "hash": string;
    "input": string;
    "nonce": number;
    "r": string;
    "s": string;
    "to": string;
    "transactionIndex": number;
    "type": number;
    "v": string;
    "value": string;

}

export class BlockTransaction {
    "hash": string;
    "parentHash": string;
    "nonce": string;
    "sha3Uncles": string;
    "logsBloom": string;

    "transactionsRoot": string;
    "stateRoot": string;
    "miner": string;
    "difficulty": string;
    "totalDifficulty": string;
    "size": number;
    "extraData": string;
    "gasLimit": number;
    "gasUsed": number;
    "timestamp": number;

    "transactions": [];
    "uncles": [];

}

export class PendingTransaction {

    "accessList": [];
    "blockHash": string;
    "blockNumber": number;
    "chainId": string;
    "from": string;
    "gas": number;
    "gasPrice": string;
    "hash": string;
    "input": string;
    "maxFeePerGas": string;
    "maxPriorityFeePerGas": string;
    "nonce": number;
    "r": string;
    "s": string;
    "to": number;
    "transactionIndex": number;
    "type": number;


}

export class Pending {

    "baseFeePerGas": string;
    "difficulty": string;
    "extraData": string;
    "gasLimit": number;
    "gasUsed": number;
    "hash": string;
    "logsBloom": string;
    "miner"?: string | null;
    "mixHash": string;
    "nonce"?: string | null;
    "number": number;
    "parentHash": string;
    "receiptsRoot": string;
    "sha3Uncles": string;
    "size"?: number | null;
    "stateRoot": string;
    "timestamp": number;
    "totalDifficulty?": string
    "transactions": Transaction[];


}