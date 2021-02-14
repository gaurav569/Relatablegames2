// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;


interface IERC1155Game {
    
    
    function getTokenType(uint256 tokenId) external view
            returns (uint8);        
    function getBurnTokensDish(uint256 tokenId) external view
            returns (uint256[] memory, uint256[] memory);
    function addERC20Coin(address coinAddress, uint8 index) external  returns(bool);
    function getCoinAddress(uint8 index) external view
            returns (address);
    function createIngredientNFT(address to, uint256 initialSupply, string calldata _Uri,
        bytes calldata _data, uint8 _class) external  returns (uint256);
    function fixSaleNFT(uint256 id, uint256[] memory fixPrice) external  returns(bool);
    function buyIngredientNFT(uint256 id, uint8 _tokenName) external payable returns(bool);
    function createDishNFT(address to, uint256 initialSupply, string calldata _Uri,
        bytes calldata _data, uint256[] memory _burnTokenIdRequired, uint256[] memory _burnTokensQtyRequired) 
        external  returns (uint256);
    function cookDish(uint256 id, address owner, bytes memory data) external returns (bool);
    function changeTimeBid(uint _timePeriodBid) external ;
    function createAuction(uint256 tokenId, uint _bidIncrement, uint256 _basePrice, uint8 _tokenName) external  returns (bool);
    function getHighestBid(uint256 tokenId) external view
            returns (uint);
    function placeBid(uint256 tokenId, uint256 _amount)  external
            returns (bool);
    function auctionEnd(uint256 tokenId) external ;
    function cancelAuction(uint256 tokenId)  external 
            returns (bool);
    function withdraw(uint256 tokenId) external
            returns (bool);
    
}
