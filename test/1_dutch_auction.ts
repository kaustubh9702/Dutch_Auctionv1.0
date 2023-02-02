import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {run} from './shared'

describe('Dutch Auction', async function () {
  let accounts:SignerWithAddress[] = [];
  this.beforeAll(async () => {
    accounts  = await ethers.getSigners();
  })
  it("creates a dutch auction", async function () {
    await run(accounts, {
      type:                "dutch",
      reservePrice:        500,
      judgeAddress:        "0x0000000000000000000000000000000000000000",
      biddingTimePeriod:   10,
      offerPriceDecrement: 25,
      actions: [

      ],
    });
  });
  it("rejects a low bid", async function () {
    await run(accounts ,  {
      type:                "dutch",
      reservePrice:        500,
      judgeAddress:        "0x0000000000000000000000000000000000000000",
      biddingTimePeriod:   10,
      offerPriceDecrement: 25,
      actions: [
        { block: 1, action: "bid", account: 1, payment: 450, succeed: false, on_error: "Low bid accepted" },
      ],
    });
  });

  it("accepts good bid", async function () {
    await run(accounts, {
      type:                "dutch",
      reservePrice:        500,
      judgeAddress:        "0x0000000000000000000000000000000000000000",
      biddingTimePeriod:   10,
      offerPriceDecrement: 25,
      actions: [
        { block: 1, action: "bid", account: 1, payment: 725, succeed: true, on_error: "Valid bid rejected" },
      ],
    });
  });

  it("rejects second bid", async function () {
    await run(accounts,  {
      type:                "dutch",
      reservePrice:        500,
      judgeAddress:        "0x0000000000000000000000000000000000000000",
      biddingTimePeriod:   10,
      offerPriceDecrement: 25,
      actions: [
        { block: 1, action: "bid", account: 1, payment: 725, succeed: true,  on_error: "Valid bid rejected" },
        { block: 2, action: "bid", account: 2, payment: 750, succeed: false, on_error: "Second bid accepted" },
      ],
    });
  });
    it("doesn't reject a finalize after accepting a bid with no judge", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        "0x0000000000000000000000000000000000000000",
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "bid",      account: 1, payment: 725, succeed: true,  on_error: "Valid bid rejected" },
          { block: 2, action: "finalize",                           succeed: false, on_error: "Early finalize accepted" },
        ],
      });
    });

    it("doesn't reject a finalize after accepting a bid with no judge", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        "0x0000000000000000000000000000000000000000",
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "finalize",                           succeed: false, on_error: "Early finalize accepted" },
        ],
      });
    });

    it("doesn't reject a finalize after rejecting a bid with no judge", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        "0x0000000000000000000000000000000000000000",
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "bid",      account: 1, payment: 500, succeed: false,  on_error: "Invalid bid accepted" },
          { block: 2, action: "finalize",                           succeed: false, on_error: "Early finalize accepted" },
        ],
      });
    });

    it("doesn't reject a finalize after accepting a bid with no judge", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        accounts[3],
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "bid",      account: 1, payment: 725, succeed: true, on_error: "Valid bid accepted" },
          { block: 2, action: "finalize", account: 3,               succeed: true, on_error: "Valid finalize rejected" },
        ],
      });
    });


    it("doesn't reject a finalize after accepting a bid with judge", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        accounts[3],
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "bid",      account: 1, payment: 725, succeed: true, on_error: "Valid bid accepted" },
          { block: 2, action: "finalize", account: 4,               succeed: false, on_error: "Invalid finalize accepted" },
        ],
      });
    });
    it("doesn't reject a second finalize", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        accounts[3],
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "bid",      account: 1, payment: 725, succeed: true, on_error: "Valid bid accepted" },
          { block: 2, action: "finalize", account: 3,               succeed: true, on_error: "Valid finalize rejected" },
          { block: 3, action: "finalize", account: 3,               succeed: false, on_error: "Invalid finalize accepted" },
        ],
      });
    });
    it("doesn't reject a finalize even though no winner", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        accounts[3],
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 2, action: "finalize", account: 3,               succeed: false, on_error: "Invalid finalize accepted" },
        ],
      });
    });

    it("accepts a bid on the last round", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        "0x0000000000000000000000000000000000000000",
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 9, action: "bid", account: 1, payment: 750, succeed: true, on_error: "Valid bid rejected" },
        ],
      });
    });
    it("rejects a bid after the last round", async function () {
      await run(accounts, {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        "0x0000000000000000000000000000000000000000",
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 10, action: "bid", account: 1, payment: 750, succeed: false, on_error: "Invalid bid accepted" },
        ],
      });
    });
    it("rejects a bid after the last round", async function () {
      await run(accounts,  {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        accounts[3],
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 10, action: "bid",      account: 1, payment: 750, succeed: false, on_error: "Invalid bid accepted" },
          { block: 11, action: "finalize", account: 3,               succeed: false, on_error: "finalize rejected" },
          { block: 12, action: "finalize", account: 1,               succeed: false, on_error: "finalize rejected" },
        ],
      });
    });
    it("doesn't reject a second finalize", async function () {
      await run(accounts, {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        accounts[3],
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "bid",      account: 1, payment: 725, succeed: true, on_error: "Valid bid accepted" },
          { block: 15, action: "finalize", account: 1,               succeed: true, on_error: "Valid finalize rejected" },
        ],
      });
    });
    it("reject a second finalize",  async function () {
      await run(accounts, {
        type:                "dutch",
        reservePrice:        500,
        judgeAddress:        accounts[3],
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
          { block: 1, action: "bid",      account: 1, payment: 725, succeed: true, on_error: "Valid bid accepted" },
          { block: 2, action: "finalize", account: 1,               succeed: true, on_error: "Valid finalize rejected" },
          { block: 3, action: "finalize", account: 1,               succeed: false, on_error: "Valid finalize rejected" },
        ],
      });
    })


  });

