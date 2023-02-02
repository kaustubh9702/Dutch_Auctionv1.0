// Each test should consist of a single call to run with the list of accounts, the done callback,
// and an auction schema describing the auction to run.
//
// An auction schema is an object with the following properties:
//    type:               A string denoting the type of auction to run.
//    reservePrice:       The auction reserve price.
//    judgeAddress:       For auctions with a judge, the address of the judge.
//    actions:            An ordered list of actions to run.
//
// An action is an object with the following properties:
//    block:              The block in which the action should occur.
//    action:             A string or callback function. If the action is a function, then running
//                        the action will cause the callback to be invoked with the list of
//                        accounts as its argument.
//
// If action is a string, the action must have the following additional properties:
//    succeed:            Whether the action should succeed.
//    on_error:           A message to show if the action succeeded when succeed is false or vice
//                        versa.
//
// "bid" actions can have the following additional properties:
//    account:            The index of the account that should bid.
//    payment:            The number of wei to bid.
//
// "finalize" actions take no additional properties.
//

// Implementation
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { DutchAuction } from "../../typechain-types";
import { ethers } from "hardhat";
import { expect } from "chai";

// Run a test with the given accounts, done callback, and auction schema.
export const run = async function (
  accounts: SignerWithAddress[],
  schema: any
) {

  var C = await ethers.getContractFactory("DutchAuction");
  schema.judgeAddress = schema.judgeAddress.address ? schema.judgeAddress.address : schema.judgeAddress
  let instance = await C.connect(accounts[0]).deploy(
    schema.reservePrice,
    schema.judgeAddress,
    schema.biddingTimePeriod,
    schema.offerPriceDecrement
  );
  let actions = schema.actions;
  let nopaccount = accounts[accounts.length  - 1];


  function error(message:string) {
    return (Error("Test: " + message));
  }

  function fail(action:any, message:any) {
    return (Error("Action " + action + ": " + message));
  }

  async function run_(block:number, index:number): Promise<any> {
    //console.log("web3.eth.blockNumber: " + web3.eth.blockNumber + " block=" + block + " index=" + index);
    // If we've run out of actions, the test has passed.
    if (index >= actions.length) {
      return undefined;
    }
    var action = actions[index];
    var nextBlock = block + 1;
    var nextIndex = index + 1;
    // If the next action takes place in a future block, delay.
    if (action.block > block) {
      await instance.connect(nopaccount).nop();
      
      return await run_(nextBlock, index);
    }
    // If the next action takes place in a previous block, error.
    if (action.block != block) {
      return  error("Current block is " + block + ", but action " + index +
          " takes place in prior block " + action.block);
    }
    // If the next action is a callback, execute it.
    if (typeof(action.action) == "function") {
      let result = action.action();
      if (result) {
        return fail(index, result);
      }
      // On successful evaluation of the callback, reinvoke ourselves.
      return await run_(block, nextIndex);
    }

    //console.log("Running action: " + action.action);
    // Run the action and get a promise.
    var promise;
    var account = accounts[action.account] || accounts[0];
    let balance = await account.getBalance();
    let sellerBalance = await accounts[0].getBalance();

    switch (action.action) {
      case "bid":
        promise = instance.connect(account).bid({ value: action.payment});
        if(schema.judgeAddress.includes("0x00000")) {
          action.post = async (bal:BigNumber) => {
            expect(balance.sub(action.payment).gt(bal))
              .to.be.true;
            expect(await accounts[0].getBalance()).equal(sellerBalance.add(action.payment));
          }
        }

        break;
      case "finalize":
        promise = instance.connect(account).finalize();
        if(action.payment)
        action.post = async (bal:BigNumber) => {
          expect(balance.sub(action.payment).gt(bal)).to.be.true;
          expect(await accounts[0].getBalance()).equal(sellerBalance.add(action.payment));
        }

        break;
      default:
        return error("Unknown action " + action.action);
    }
    // Continue the computation after the promise.


    if(!action.succeed)
      await expect(promise, action.on_error).to.be.reverted;
    else
      await expect(promise, action.on_error).to.not.be.reverted;
    
    if (action.post && action.succeed) {
        await action.post(await account.getBalance());
    }


    return await run_(nextBlock, nextIndex);
  }




    return await run_(1,0);
};
