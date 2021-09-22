
import './config.ts';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

import { ethers } from "ethers";
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import { Account, Pending, PendingTransaction, Transaction, BlockTransaction } from './models/models';
import generateKeyPair from 'crypto';

const GAS_LIMIT = 7550000;

const ETH_TRADE = 1;
const DAI_TRADE = 500;

async function main() {

    // subscribePendingTransactions();
    // let socketProvider = process.env.MATIC_VIGIL_MAINNET_WEBSOCKET ?? '';
    // let routerAddress = process.env.MATIC_ROUTER_ADDRESS ?? '';
    // subscribePendingTransactionsByChain(socketProvider, routerAddress);

    // subscribeNewBlockHeaders();
    // subscribeAddressLogs();
    //  getPrices();

    //  getStatsUsingProvider('ether');

    etherArbitrage();
}

async function etherArbitrage() {

    /*


    https://ropsten.etherscan.io/address/0x6766e24f409ce81dcd43f330a4652439fa926e81
    https://remix.ethereum.org/#optimize=false&runs=200&evmVersion=null&version=soljson-v0.6.12+commit.27d51765.js
    */
    const flashLoanerAddress = process.env.FLASH_LOANER_ADDRESS ?? '';
    const provider = new ethers.providers.InfuraProvider(
        "ropsten",
        process.env.INFURA_PROJECT_ID
    );


    const walletPrivateKey = process.env.ROPSTEN_PRIVATE_KEY ?? '';
    const wallet = new ethers.Wallet(walletPrivateKey, provider);
    console.log(' wallet ', wallet);

    console.log("DAI_TRADE  Amount:_", DAI_TRADE);



    const UniswapV2Pair = require("./abi/IUniswapV2Pair.json");
    const UniswapV2Factory = require("./abi/IUniswapV2Factory.json");

    let sushiSwapFactoryAddress = process.env.TESTNET_SUSHISWAP_FACTORY_ADDRESS ?? '';
    let uniSwapFactoryAddress = process.env.TESTNET_UNISWAP_FACTORY_ADDRESS ?? '';

    const sushiFactory = new ethers.Contract(
        sushiSwapFactoryAddress,
        UniswapV2Factory.abi,
        wallet
    );
    const uniswapFactory = new ethers.Contract(
        uniSwapFactoryAddress,
        UniswapV2Factory.abi,
        wallet
    );

    // +-Ethereum Ropsten TestNet Token Addresses:_
    // const daiAddress = "0xad6d458402f60fd3bd25163575031acdce07538d";
    // const usdtAddress = "0x110a13fc3efe6a245b50102d2d79b3e76125ae83";


    const daiAddress = "0xc2118d4d90b274016cB7a54c03EF52E6c537D957";
    const uniswapDaiAddress = "0xaD6D458402F60fD3Bd25163575031ACDce07538D";
    const uniswapWethAddress = "0xc778417e063141139fce010982780140aa0cd5ab";
    // const sushiDaiAddress = "0xc2118d4d90b274016cb7a54c03ef52e6c537d957";


    const getPairSushiWethDai = await sushiFactory.getPair(uniswapWethAddress, daiAddress);
    console.log("getPairSushiWethDai ", getPairSushiWethDai);

    const getPairUniswapWethDai = await uniswapFactory.getPair(uniswapWethAddress, daiAddress);
    console.log("getPairUniswapWethDai ", getPairUniswapWethDai);

    let sushiEthDai = new ethers.Contract(
        getPairSushiWethDai,
        UniswapV2Pair.abi,
        wallet
    );

    let uniswapEthDai = new ethers.Contract(
        getPairUniswapWethDai,
        UniswapV2Pair.abi,
        wallet
    );



    provider.on("block", async (blockNumber) => {
        //  console.log("on(block) blockNumber ", blockNumber);

        try {
            console.log('on("block" ) => blockNumber : ', blockNumber);

            const sushiReserves = await sushiEthDai.getReserves();
            console.log('sushiReserves ', sushiReserves);


            const uniswapReserves = await uniswapEthDai.getReserves();
            console.log('uniswapReserves ', sushiReserves);


            const reserve0Sushi = Number(
                ethers.utils.formatUnits(sushiReserves[0], 18)
            );

            const reserve1Sushi = Number(
                ethers.utils.formatUnits(sushiReserves[1], 18)
            );

            const reserve0Uni = Number(
                ethers.utils.formatUnits(uniswapReserves[0], 18)
            );
            const reserve1Uni = Number(
                ethers.utils.formatUnits(uniswapReserves[1], 18)
            );

            const priceUniswap = reserve0Uni / reserve1Uni;
            console.log("priceUniswap --> ", priceUniswap);
            const priceSushiswap = reserve0Sushi / reserve1Sushi;
            console.log("priceSushiswap ", priceSushiswap);


            const shouldStartEth = priceUniswap < priceSushiswap;
            const spread = Math.abs((priceSushiswap / priceUniswap - 1) * 100) - 0.6;
            console.log("spread ", spread);

            /** +-If the Trade Starts with ETH, It will use ETH worth = DAI_TRADE:_
            (If "const DAI_TRADE = 1000;", it will use 1000 DAI in ETH):_ */

            const shouldTrade =
                spread >
                (shouldStartEth ? ETH_TRADE : DAI_TRADE) /
                Number(
                    ethers.utils.formatEther(uniswapReserves[shouldStartEth ? 1 : 0])
                );
            console.log("shouldTrade ", shouldTrade);
            console.log(`UNISWAP PRICE ${priceUniswap}`);
            console.log(`SUSHISWAP PRICE ${priceSushiswap}`);
            console.log(`PROFITABLE? ${shouldTrade}`);
            console.log(`CURRENT SPREAD: ${(priceSushiswap / priceUniswap - 1) * 100}%`);
            console.log(`ABSOLUTE SPREAD: ${spread}`);

            if (!shouldTrade) {

                console.log('WILL NOT TRADE : Reason: ( Not Profitable ) \n\n');
                return;
            }


            //   const gasLimit = await sushiEthDai.estimateGas.swap(
            //    !shouldStartEth ? DAI_TRADE : 0,
            //    shouldStartEth ? ETH_TRADE : 0,
            //    flashLoanerAddress,
            //    ethers.utils.toUtf8Bytes('1'),
            //    );
            const gasLimit = 2550000;
            console.log('gasLimit :  ', gasLimit);

            const gasPrice = await wallet.getGasPrice();
            console.log("gasPrice ", gasPrice);
            const gasCost = Number(ethers.utils.formatEther(gasPrice.mul(gasLimit)));
            console.log("gasCost ", gasCost);
            /*
             DeFi transactions like this can be very expensive.
             There may appear to be a profitable arbitrage,
             but any profit margin may be eaten up by the cost of gas.
             An important check of our program is to make
             sure our gas costs don’t eat into our spread:_
            */

            const shouldSendTx = shouldStartEth
                ? gasCost / ETH_TRADE < spread
                : gasCost / (DAI_TRADE / priceUniswap) < spread;

            console.log("shouldSendTx ", shouldSendTx);
            // don't trade if gasCost is higher than the spread
            if (!shouldSendTx) {
                console.log('WILL NOT TRADE : Reason: ( gasCost too high ) \n\n');
                return;

            }

            const options = {
                gasPrice,
                gasLimit,
            };
            const tx = await sushiEthDai.swap(
                !shouldStartEth ? DAI_TRADE : 0,
                shouldStartEth ? ETH_TRADE : 0,
                flashLoanerAddress,
                ethers.utils.toUtf8Bytes("1"),
                options
            );

            console.log("ARBITRAGE EXECUTED! PENDING Transaction TO BE MINED \n", tx);


            await tx.wait();

            console.log("SUCCESS! Transaction MINED \n\n ");
        } catch (err) {
            console.error(err);
        }
    });
}

async function chooseEthereumProvider(providerType: string) {
    // console.log('process.env.ETHEREUM_LIBRARY  ',process.env.ETHEREUM_LIBRARY );
    if (providerType == "ether") {
        const provider = process.env.INFURA_MAINNET_ENDPOINT_URL ?? '';
        const ethProvider = new ethers.providers.JsonRpcProvider(provider);
        etherStats(ethProvider);

    } else {
        const provider = process.env.INFURA_MAINNET_ENDPOINT_URL ?? '';
        const web3Provider = new Web3.providers.HttpProvider(provider);
        const web3 = new Web3(web3Provider);
        web3Stats(web3);
    }
}


async function etherStats(ethersProvider: any) {
    // let provider = await chooseEthereumProvider('ether');
    let block = await ethersProvider.getBlockNumber();
    console.log('block ', block);

    let balance = await ethersProvider.getBalance("ethers.eth");
    console.log('balance ', balance);
    let formatedBalance = ethers.utils.formatEther(balance);
    console.log('formatedBalance ', formatedBalance);
    let parsedEth = ethers.utils.parseEther("1.0");
    console.log('parsedEth ', parsedEth);
}

async function web3Stats(web3Provider: any) {


    /* CREATE NEW ACCOUNT */
    /*
    let newAccount = await createAccount(web3);
    console.log('newAccount ', newAccount);
    */

    let accounts = await getAccounts(web3Provider);
    console.log('accounts ', accounts);

    let walletBalance = await getBalance(web3Provider, "0x407d73d8a49eeb85d32cf465507dd71d507100c1");
    console.log('walletBalance ', walletBalance);

    let currentBlock = await getCurrentBlock(web3Provider);
    console.log('currentBlock ', currentBlock);


    let transactionCount = await getBlockTransactionCount(web3Provider, currentBlock);
    console.log('transactionCount ', transactionCount);

    // let blockData = await getBlockData(web3Provider, currentBlock);
    // console.log('getBlockData  blockData ', blockData);

    // let transactionsArr = [...blockData.transactions];
    //  console.log(' transactionsArr ', transactionsArr);

    // let pendingTransactions = await getPendingTransactions(web3Provider);
    // console.log(' pendingTransactions ', pendingTransactions);
    // console.log(' pendingTransactions.transactions', pendingTransactions.transactions);
    // for (let elem of pendingTransactions.transactions) {
    //     console.log(`Hash : ${elem.blockHash}  Gas : ${elem.gas}, Price : ${elem.gasPrice}`);
    // }

}


async function getPrices() {
    const abi = fs.readFileSync(path.resolve(__dirname, 'abi/IUniswapV2Factory.json'), 'utf8');
    const abi2 = fs.readFileSync(path.resolve(__dirname, 'abi/IUniswapV2Pair.json'), 'utf8');
    const abi3 = fs.readFileSync(path.resolve(__dirname, 'abi/IUniswapV2ERC20.json'), 'utf8');
    let socketProvider = process.env.INFURA_ENDPOINT_URL ?? '';
    let web3 = new Web3(socketProvider)
    let univ2factory = new web3.eth.Contract(JSON.parse(abi).abi, "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");

    //get first pair contract
    let response = await univ2factory.methods.allPairs(0).call();

    let unipair = new web3.eth.Contract(JSON.parse(abi2).abi, response);

    let token0 = await unipair.methods.token0().call();
    let token1 = await unipair.methods.token1().call();

    let token0C = new web3.eth.Contract(JSON.parse(abi3).abi, token0)
    let name0 = await token0C.methods.symbol().call();
    let token1C = new web3.eth.Contract(JSON.parse(abi3).abi, token1)
    let name1 = await token1C.methods.symbol().call();


    let { reserve0, reserve1 } = await unipair.methods.getReserves().call();
    console.log(`${name0}: ${reserve0} ${name1}: ${reserve1}  price:${reserve0 / (reserve1 / 1000000000000)}`);
}





async function getBlockData(web3Instance: any, blockNumber: number) {
    return web3Instance.eth.getBlock(blockNumber).then((blockData: BlockTransaction) => {

        return blockData;
    });
}
async function getPendingTransactions(web3Instance: any) {
    return web3Instance.eth.getBlock('pending', true).then((pending: Pending) => {

        return pending;
    });
}

// async function getPendingTransactions(web3Instance: any) {
//     return web3Instance.eth.getPendingTransactions().then((pending: any) => {
//         return pending;
//     });
// }


async function getBlockTransactionCount(web3Instance: any, block: any) {
    return web3Instance.eth.getBlockTransactionCount(block).then((totalCount: any) => {
        return totalCount;
    });
}
async function getHashrate(web3Instance: any) {
    return web3Instance.eth.getHashrate().then((hashrate: any) => {
        return hashrate;
    });

}
async function getBalance(web3Instance: any, address: string) {
    return web3Instance.eth.getBalance(address).then((balance: any) => {
        return balance;
    });

}


async function getCurrentBlock(web3Instance: any) {
    return web3Instance.eth.getBlockNumber().then((currentBlock: any) => {
        return currentBlock;
    });
}

async function getAccounts(web3Instance: any) {
    return web3Instance.eth.getAccounts().then((accounts: any) => {
        return accounts;
    });
}

async function createAccount(web3Instance: any) {
    let account = web3Instance.eth.accounts.create();
    return account;

}

async function getPastEvents() {
    const socketProvider = process.env.INFURA_ENDPOINT_WEBSOCKET ?? '';
    const webSocketProvider = new Web3.providers.WebsocketProvider(socketProvider);
    const web3 = new Web3(webSocketProvider);

    const ABI: any = 'YOUR ABI HERE';
    const CONTRACT_ADDRESS = 'YOUR CONTRACT ADDRESS HERE';
    const myContract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
    let options = {
        filter: {
            value: ['1000', '1337']//Only get events where transfer value was 1000 or 1337
        },
        fromBlock: 0, //Number || "earliest" || "pending" || "latest"
        toBlock: 'latest'
    };

    myContract.getPastEvents('Transfer', options)
        .then((results: any) => {
            console.log('getPastEvents results ', results);
        })
        .catch((err: any) => {
            console.log('getPastEvents err ', err);
            throw err
        });
}

async function subscribeAddressLogs() {

    const socketProvider = process.env.INFURA_MAINNET_ENDPOINT_WEBSOCKET ?? '';
    const webSocketProvider = new Web3.providers.WebsocketProvider(socketProvider);
    const web3 = new Web3(webSocketProvider);

    let options = {
        fromBlock: 0,
        //Only get events from specific addresses
        address: ['0xe381C25de995d62b453aF8B931aAc84fcCaa7A62', '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F'],
        //What topics to subscribe to
        topics: []
    };
    let subscription = web3.eth.subscribe('logs', options, (err: any, event: any) => {
        if (!err) {
            console.log('subscribeAddress() logs ', event);
        }
    });
    subscription.on('data', (event: any) => {
        console.log('subscribeAddress() data ', event);
    });
    subscription.on('changed', (changed: any) => {
        console.log('subscribeAddress() changed ', changed)
    });
    subscription.on('error', (err: any) => {
        console.log('subscribeAddress() err ', err);
        throw err;
    })
    subscription.on('connected', (nr: any) => {
        console.log('subscribeAddress connected ', nr);
    });
    // subscription.unsubscribe((error, success) => {
    //     if (success)
    //         console.log('subscribeAddressLogs() unsubscribed ', success);
    // });
}
async function subscribePendingTransactions() {

    const socketProvider = process.env.INFURA_MAINNET_ENDPOINT_WEBSOCKET ?? '';
    const webSocketProvider = new Web3.providers.WebsocketProvider(socketProvider);
    const web3 = new Web3(webSocketProvider);

    let subscription = web3.eth.subscribe('pendingTransactions', (error, result) => {
        if (error) {
            console.log('subscribePendingTransactions error ', error);
        }

    }).on("data", (txHash) => {

        setTimeout(async () => {
            try {

                let tx = await web3.eth.getTransaction(txHash);
                //  console.log('subscribePendingTransactions [DATA] tx ', tx);
                // UNISWAP Transaction --> to
                if (tx && tx['to'] == process.env.UNISWAP_ROUTER_ADDRESS) {
                    console.log('=====================================') // a visual separator
                    console.log('TX hash: ', txHash); // transaction hash
                    console.log('TX to: ', tx.to); // transaction to
                    console.log('TX from: ', tx.from); // transaction from
                    console.log('TX confirmation: ', tx.transactionIndex); // "null" when transaction is pending
                    console.log('TX nonce: ', tx.nonce); // number of transactions made by the sender prior to this one
                    console.log('TX block hash: ', tx.blockHash); // hash of the block where this transaction was in. "null" when transaction is pending
                    console.log('TX block number: ', tx.blockNumber); // number of the block where this transaction was in. "null" when transaction is pending
                    console.log('TX sender address: ', tx.from); // address of the sender
                    console.log('TX amount(in Ether): ', web3.utils.fromWei(tx.value, 'ether')); // value transferred in ether
                    console.log('TX date: ', new Date()); // transaction date
                    console.log('TX gas price: ', tx.gasPrice); // gas price provided by the sender in wei
                    console.log('TX gas: ', tx.gas); // gas provided by the sender.
                    console.log('TX input: ', tx.input); // the data sent along with the transaction.
                    console.log('=====================================') // a visual separator
                }
            } catch (err) {
                console.error(err);
            }
        }, 500);
    });

    // unsubscribes the subscription
    // subscription.unsubscribe((error, success) => {
    //     if (success)
    //         console.log('subscribePendingTransactions() unsubscribed ', success);
    // });
}
async function subscribeNewBlockHeaders() {

    const socketProvider = process.env.INFURA_MAINNET_ENDPOINT_WEBSOCKET ?? '';
    const webSocketProvider = new Web3.providers.WebsocketProvider(socketProvider);
    const web3 = new Web3(webSocketProvider);

    let subscription = web3.eth.subscribe('newBlockHeaders', (error, result) => {
        if (!error) {
            return;
        }
        console.log('subscribeNewBlockHeaders() error ', error);

    }).on("connected", (subscriptionId) => {
        console.log('subscribeNewBlockHeaders() connected ', subscriptionId);

    }).on("data", (blockHeader: any) => {
        // console.log('subscribeNewBlockHeaders()  [DATA]  ', blockHeader);
        setTimeout(async () => {
            try {

                if (blockHeader) {
                    console.log('=====================================') // a visual separator
                    // console.log('TX Full Header: ', blockHeader); // transaction hash
                    console.log('TX number : ', blockHeader.number); // TX number
                    console.log('TX miner : ', blockHeader.miner); // miner
                    console.log('TX difficulty : ', blockHeader.difficulty); // difficulty
                    console.log('TX sha3Uncles : ', blockHeader.sha3Uncles); // miner

                    console.log('TX block hash: ', blockHeader.hash); // hash of the block where this transaction was in. "null" when transaction is pending
                    console.log('TX parent hash : ', blockHeader.parentHash); // miner

                    console.log('TX date: ', new Date()); // transaction date
                    console.log('TX gasLimit: ', blockHeader.gasLimit); // gas price provided by the sender in wei
                    console.log('TX gasUsed: ', blockHeader.gasUsed); // gas provided by the sender.
                    console.log('TX Base Gas per fees : ', blockHeader.baseFeePerGas); // miner

                    console.log('=====================================') // a visual separator
                }
            } catch (err) {
                console.error(err);
            }
        }, 500);

    }).on("error", console.error);

    // // unsubscribes the subscription
    // subscription.unsubscribe((error, success) => {
    //     if (success) {
    //         console.log('subscribeNewBlockHeaders() unsubscribed ', success);
    //     }
    // });
}






async function subscribePendingTransactionsByChain(socketProvider: string, addressTo: string) {

    const webSocketProvider = new Web3.providers.WebsocketProvider(socketProvider);
    const web3 = new Web3(webSocketProvider);

    let subscription = web3.eth.subscribe('pendingTransactions', (error, result) => {
        if (error) {
            console.log('subscribePendingTransactions error ', error);
        }
        // console.log('subscribePendingTransactions result ', result);
    }).on("data", (txHash) => {
        // console.log('subscribePendingTransactions [DATA] txHash ', txHash);
        setTimeout(async () => {
            try {

                let tx = await web3.eth.getTransaction(txHash);
                console.log('subscribePendingTransactions [DATA] tx ', tx);
                // UNISWAP Transaction --> to
                if (tx && tx['to'] == addressTo) {
                    console.log('=====================================') // a visual separator
                    console.log('TX hash: ', txHash); // transaction hash
                    console.log('TX to: ', tx.to); // transaction to
                    console.log('TX from: ', tx.from); // transaction from
                    console.log('TX confirmation: ', tx.transactionIndex); // "null" when transaction is pending
                    console.log('TX nonce: ', tx.nonce); // number of transactions made by the sender prior to this one
                    console.log('TX block hash: ', tx.blockHash); // hash of the block where this transaction was in. "null" when transaction is pending
                    console.log('TX block number: ', tx.blockNumber); // number of the block where this transaction was in. "null" when transaction is pending
                    console.log('TX sender address: ', tx.from); // address of the sender
                    console.log('TX amount(in Ether): ', web3.utils.fromWei(tx.value, 'ether')); // value transferred in ether
                    console.log('TX date: ', new Date()); // transaction date
                    console.log('TX gas price: ', tx.gasPrice); // gas price provided by the sender in wei
                    console.log('TX gas: ', tx.gas); // gas provided by the sender.
                    console.log('TX input: ', tx.input); // the data sent along with the transaction.
                    console.log('=====================================') // a visual separator
                }
            } catch (err) {
                console.error(err);
            }
        }, 500);
    });


}




async function unsubscribeFromSub(web3Instance: any) {
    // unsubscribes the subscription
    web3Instance.eth.clearSubscriptions();
}


async function calculateGasToEth() { }
main();
