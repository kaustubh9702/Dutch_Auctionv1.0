// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract DutchAuction {

    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public auctionOpenedOn;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;

    address public judgeAddress;
    address  public sellerAddress;
    address public winnerAddress;
    bool public auctionOpen;
    bool public amountSent;
    constructor(uint256 _reservePrice, address _judgeAddress, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement)  {
        
        require(_reservePrice > 0);
        reservePrice = _reservePrice;
        judgeAddress = _judgeAddress;
        require(_numBlocksAuctionOpen > 0);
        numBlocksAuctionOpen = _numBlocksAuctionOpen; 
        auctionOpenedOn = block.number;
        require(_offerPriceDecrement > 0);
        offerPriceDecrement = _offerPriceDecrement;
        sellerAddress = msg.sender;

        initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;

        auctionOpen = true;
        amountSent = false;

    }

    function bid() public payable returns(address) {


        require(block.number < auctionOpenedOn + numBlocksAuctionOpen, "Auction not open");

        require(auctionOpen, "Auction not open");
        
        require(initialPrice - (block.number - auctionOpenedOn) * offerPriceDecrement <= msg.value, 
                "Offer less than currentPrice");

        require(judgeAddress != msg.sender, "Judge Cannot bid");
        require(msg.sender == tx.origin); // only allow EOA

        auctionOpen = false;
        if(judgeAddress == address(0)) {
            amountSent = true;
            _transfer(sellerAddress, msg.value);
        } else {
            winnerAddress = msg.sender;
        }

        return msg.sender;
    }

    function finalize() public {
        require(msg.sender == judgeAddress || msg.sender == winnerAddress);

        require(!amountSent);
        
        require(address(this).balance > 0);

        amountSent = true;
        _transfer(sellerAddress, address(this).balance);

    }

    function refund(uint256 refundAmount) public {
        require(msg.sender == judgeAddress);
        require(!amountSent);
        require(refundAmount > 0);
        require(address(this).balance >= refundAmount);

        amountSent = true;
        _transfer(winnerAddress, refundAmount);
    }




    //for testing framework
    function nop() public returns(bool) {
        return true;
    }

    function _transfer(address  _to, uint256 amount) internal {
        (bool success, ) = _to.call{value:amount}("");
        require(success, "Transfer failed.");
    }

}
