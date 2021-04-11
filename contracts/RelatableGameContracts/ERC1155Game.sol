// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
import "../math/Math.sol";
import "../math/SafeMath.sol";
import "../upgradablecontracts/access/OwnableUpgradeable.sol";
import "../upgradablecontracts/utils/ContextUpgradeable.sol";
import "./IERC1155RG.sol";
import "./IERC20.sol";
import "../upgradablecontracts/utils/ReentrancyGuardUpgradeable.sol";

contract ERC1155Game is  OwnableUpgradeable, ReentrancyGuardUpgradeable{

    using Math for uint256;
    using SafeMath for uint256;

    IERC1155 ERC1155Token;

    // IERC20 USDCToken;
    // =IERC20(0xdA5289fCAAF71d52a80A254da614a192b693e977);
    // IERC20 DAIToken;
    // =IERC20(0x27a44456bEDb94DbD59D0f0A14fE977c777fC5C3);

    mapping(uint8=>IERC20) tokenNames;
    
    //tokenid-> tokenname-> Fix price of ingredient
    mapping(uint256=> mapping(uint8 => uint256)) private fixPriceMap;

    //tokenid-> tokenname-> Variable fix price of ingredient
    mapping(uint256=> mapping(uint8 => uint256)) private fixVarPriceMap;

    // struct Bids{
    // uint  bidIncrement;
    // uint  startTime;
    // uint  endTime;
    // uint256  basePrice;

    // // state
    // bool  canceled;
    // uint256  highestBid;
    // address  highestBidder;
    // mapping(address => uint256) fundsByBidder;
    // bool ownerHasWithdrawn;

    // uint8 tokenName;    
    // }

    // //tokenid-> Bids
    // mapping(uint256 => Bids) private bidMap;
    address private beneficiary;

    uint timePeriodBid;

    event LogSale(uint256 tokenId, uint256[] fixPrices);
    event LogBuy(uint256 tokenId, uint8 _tokenName, address buyer);

    // event LogCreate(uint256 tokenId,  uint _startTime, uint _endTime, uint256 _bidIncrement, uint256  _basePrice);
    // event LogBid(uint256 tokenId, address bidder, uint bid);
    // event LogWithdrawal(uint256 tokenId, address withdrawalAccount, uint amount);
    // event LogCanceled(uint256 tokenId);

    event CookedDish(uint256 tokenId, address owner);


    function initialize( address _tokenAddress, address _beneficiary, address USDCToken) public initializer {

        beneficiary = _beneficiary;
        ERC1155Token = IERC1155(_tokenAddress);
        
        timePeriodBid=1 days;
        OwnableUpgradeable.__Ownable_init();

        tokenNames[0]=IERC20(USDCToken);
 
    }


    struct TokenType{

        uint8 _type; //ingredient NFT=1 (fix price )or 2(bidding) or Dish NFT=3
        uint256[] burnTokenIdRequired;
        uint256[] burnTokensQtyRequired;
        
    }

    // tokenID => TokenType
    mapping (uint256 => TokenType) private tokenType;

    function getTokenType(uint256 tokenId) public view
            returns (uint8){

            return tokenType[tokenId]._type;
    }

    function getBurnTokensDish(uint256 tokenId) public view
            returns (uint256[] memory, uint256[] memory){

            return (tokenType[tokenId].burnTokenIdRequired,tokenType[tokenId].burnTokensQtyRequired);
    }

    // provide coin address & index to be used in tokenNames
    // Note index=0 => MATIC coin,  index=1 => USDC coin,   index=2 => DAI coin
    function addERC20Coin(address coinAddress, uint8 index) public onlyOwner returns(bool){

        require(address(tokenNames[index])==address(0), "Already mapped index");
        tokenNames[index] = IERC20(coinAddress);
        return true;

    }

    // get coin address by index
    function getCoinAddress(uint8 index) public view
            returns (address){

            return address(tokenNames[index]);
    }

    //class=1=>fix price or 2=>fix price variable
    function createIngredientNFT(address to, uint256 initialSupply, string calldata _Uri,
        bytes calldata _data, uint8 _class) public onlyOwner nonReentrant returns (uint256){

        uint256 id = ERC1155Token.create( to,  initialSupply,  _Uri,  _data);

        tokenType[id]._type=_class;
        tokenType[id].burnTokenIdRequired=new uint256[](0);
        tokenType[id].burnTokensQtyRequired=new uint256[](0);
        
        return id;

    }

    //type 1 constant price
    function fixSale1NFT(uint256 id, uint256[] memory fixPrice) public onlyOwner returns(bool){

        require(tokenType[id]._type==1,"ERC1155Game: The token type should be 1");
        
        for(uint8 i=0;i<fixPrice.length;i++)
            fixPriceMap[id][i]=fixPrice[i];

        emit LogSale(id, fixPrice);
        return true;

    }

    //type 2 variable price
    function fixSale2NFT(uint256 id, uint256[] memory fixPrice) public onlyOwner returns(bool){

        require(tokenType[id]._type==2,"ERC1155Game: The token type should be 2");
        
        for(uint8 i=0;i<fixPrice.length;i++)
            fixVarPriceMap[id][i]=fixPrice[i];

        emit LogSale(id, fixPrice);
        return true;

    }

    //type 1 constant price
    function buyIngredient1NFT(uint256 id, uint8 _tokenName) public nonReentrant payable returns(bool){

        //transfer ERC20 tokens to recipient
        // if fixprice is transferred
        require(tokenType[id]._type==1,"ERC1155Game: The token type should be 1");
        require(fixPriceMap[id][_tokenName]>0,"Cannot buy using this token");

        IERC20 ERC20Token = tokenNames[_tokenName];
        ERC20Token.transferFrom(_msgSender(), beneficiary, fixPriceMap[id][_tokenName]);

        ERC1155Token.mint(_msgSender(), id, 1, "0x");

        emit LogBuy(id,_tokenName,_msgSender());

        return true;
    }

    //type 2 variable price
    function buyIngredient2NFT(uint256 id, uint8 _tokenName) public nonReentrant payable returns(bool){

        //transfer ERC20 tokens to recipient
        // if fixprice is transferred
        require(tokenType[id]._type==2,"ERC1155Game: The token type should be 2");
        require(fixVarPriceMap[id][_tokenName]>0,"Cannot buy using this token");

        uint totalSupply = ERC1155Token.totalSupply(id);
        // y = x^2+1 => Factor = (x^2+1)/100 +1 => (x^2+101)/100
        uint multiplyFactor =SafeMath.div(SafeMath.add(SafeMath.mul(totalSupply,2),101),100);
        uint currPrice = SafeMath.mul(fixVarPriceMap[id][_tokenName], multiplyFactor);

        IERC20 ERC20Token = tokenNames[_tokenName];
        ERC20Token.transferFrom(_msgSender(), beneficiary, currPrice);

        ERC1155Token.mint(_msgSender(), id, 1, "0x");

        emit LogBuy(id,_tokenName,_msgSender());

        return true;
    }


    function createDishNFT(address to, uint256 initialSupply, string calldata _Uri,
        bytes calldata _data, uint256[] memory _burnTokenIdRequired, uint256[] memory _burnTokensQtyRequired) 
        public onlyOwner nonReentrant returns (uint256){

        uint256 id = ERC1155Token.create( to,  initialSupply,  _Uri,  _data);

        tokenType[id]._type = 3;
        tokenType[id].burnTokenIdRequired = _burnTokenIdRequired;
        tokenType[id].burnTokensQtyRequired = _burnTokensQtyRequired;

        return id;

    }

    function cookDish(uint256 id, address owner, bytes memory data) public nonReentrant returns (bool){
        
        require(
            owner == _msgSender() || ERC1155Token.isApprovedForAll(owner, _msgSender()),
            "ERC1155GAME: caller is not owner nor approved"
        );

        require(tokenType[id]._type==3,"ERC1155Game: The token type should be 3 for dishes");

        ERC1155Token.burnBatch(owner,tokenType[id].burnTokenIdRequired, tokenType[id].burnTokensQtyRequired);
        ERC1155Token.mint(owner, id, 1, data);

        emit CookedDish(id,owner);
        return true;
        
    }

    // // 1 day by default
    // function changeTimeBid(uint _timePeriodBid) external onlyOwner{
    //     timePeriodBid=_timePeriodBid;
    // }

    // // will be available for 24 hours // token type=2, USDC
    // function createAuction(uint256 tokenId, uint _bidIncrement, uint256 _basePrice, uint8 _tokenName) public onlyOwner returns (bool){

    //         require(tokenType[tokenId]._type==2, "Type of NFT token should be 2");
    //         // check if already auction had same tokenid
    //         if(bidMap[tokenId].ownerHasWithdrawn!=true){
    //             require(block.timestamp>bidMap[tokenId].endTime,"Earlier auction not finished");
    //         }

    //         bidMap[tokenId].bidIncrement = _bidIncrement;
    //         bidMap[tokenId].startTime = block.timestamp;
    //         bidMap[tokenId].endTime = block.timestamp+timePeriodBid;
    //         bidMap[tokenId].basePrice = _basePrice;
    //         bidMap[tokenId].canceled = false;
    //         bidMap[tokenId].ownerHasWithdrawn = false;
    //         bidMap[tokenId].tokenName = _tokenName;
    //         bidMap[tokenId].highestBidder = address(this);//default

    //         LogCreate(tokenId,  block.timestamp,  block.timestamp+timePeriodBid,  _bidIncrement,  _basePrice);

    //         return true;
    //     }

    //     function getHighestBid(uint256 tokenId) public view
    //         returns (uint)
    //     {
    //         return bidMap[tokenId].highestBid;
    //     }

    //     function placeBid(uint256 tokenId, uint256 _amount)  public
            
            
    //         returns (bool)
    //     {
    //         require (block.timestamp > bidMap[tokenId].startTime,"Bidding not yet started" );
    //         require (block.timestamp < bidMap[tokenId].endTime, "Bidding already ended" );
    //         require (bidMap[tokenId].canceled==false, "Bidding already canceled" );

    //         // if the user isn't even willing to overbid the highest binding bid, there's nothing for us
    //         // to do except revert the transaction.


    //         // calculate the user's total bid based on the current amount they've sent to the contract
    //         // plus whatever has been sent with this transaction
    //         uint256 newBid = SafeMath.add(bidMap[tokenId].fundsByBidder[_msgSender()] , _amount);
    //         require(newBid>= SafeMath.add(bidMap[tokenId].highestBid,bidMap[tokenId].bidIncrement) && _amount>=bidMap[tokenId].basePrice,"Bidding amount should be more than highest/base bid by bidIncrement");

    //         uint8 _tokenName=bidMap[tokenId].tokenName;
    //         IERC20 ERC20Token = tokenNames[_tokenName];
    //         ERC20Token.transferFrom(_msgSender(), address(this), _amount);

    //         bidMap[tokenId].fundsByBidder[_msgSender()] = newBid;

    //         bidMap[tokenId].highestBidder = _msgSender();
    //         bidMap[tokenId].highestBid = newBid;
        
    //         emit LogBid(tokenId, _msgSender(), newBid);
    //         return true;
    //     }

    //     function auctionEnd(uint256 tokenId) public onlyOwner {

    //         // require ( block.timestamp > bidMap[tokenId].endTime, "Bidding canceled or not ended" );
    //         require(!bidMap[tokenId].ownerHasWithdrawn, "auctionEnd has already been called.");
    //         require (bidMap[tokenId].highestBidder!=address(this), "Noone participated in bid");

    //         ERC1155Token.mint(bidMap[tokenId].highestBidder,tokenId,1,"");
            
    //         IERC20 ERC20Token = tokenNames[bidMap[tokenId].tokenName];
    //         ERC20Token.transfer(beneficiary,bidMap[tokenId].highestBid);

    //         bidMap[tokenId].ownerHasWithdrawn = true;

    //     }

    //     function cancelAuction(uint256 tokenId)  public
    //         onlyOwner
    //         returns (bool)
    //     {
    //         require (bidMap[tokenId].canceled==false, "Bidding already canceled" );
    //         require (block.timestamp < bidMap[tokenId].endTime, "Bidding already ended" );
    //         require (bidMap[tokenId].highestBidder==address(this), "Cannot cancel once bidding starts" );

    //         bidMap[tokenId].canceled = true;
    //         LogCanceled(tokenId);
    //         return true;
    //     }

    //     function withdraw(uint256 tokenId) public 
    //         nonReentrant
    //         returns (bool)
    //     {

    //         // require ( block.timestamp > bidMap[tokenId].endTime, "Bidding canceled or not ended" );
    //         require ( _msgSender() != bidMap[tokenId].highestBidder, "Highest bidder can't withdraw" );
        
    //         // anyone who participated but did not win the bidMap[tokenId] should be allowed to withdraw
    //         // the full amount of their funds
    //         address payable withdrawalAccount = _msgSender();
    //         uint256 withdrawalAmount = bidMap[tokenId].fundsByBidder[withdrawalAccount];
                

    //         if (withdrawalAmount == 0) revert();

    //         bidMap[tokenId].fundsByBidder[withdrawalAccount] -= withdrawalAmount;

    //         // send the funds

    //         IERC20 ERC20Token = tokenNames[bidMap[tokenId].tokenName];
    //         ERC20Token.transfer(withdrawalAccount, withdrawalAmount);

    //         emit LogWithdrawal(tokenId, withdrawalAccount, withdrawalAmount);

    //         return true;
    //     }




}