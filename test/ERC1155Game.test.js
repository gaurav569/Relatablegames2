const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ether = require('@openzeppelin/test-helpers/src/ether');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');
const { ethers,upgrades } = require('hardhat');

  const initialURI = 'https://token-cdn-domain/{id}.json';

  describe('Game Contract',()=>{

    let ERC1155Game,USDCContract, USDC, gameContract,owner,beneficiary,bidder1,bidder2,bidder1Wallet,bidder2Wallet,DAIERC20Bidder1,DAI;
  
    beforeEach(async ()=> {

      [owner, beneficiary, bidder1, bidder2, ...otherAccount] = await ethers.getSigners();

      Token=await ethers.getContractFactory('ERC1155RG');
      ERC1155Game=await ethers.getContractFactory('ERC1155Game');
      USDCContract=await ethers.getContractFactory('ERC20RG');

      USDC=await USDCContract.deploy("USDC","USDC");
      await USDC.transfer(bidder1.address,5000000000000000);
      await USDC.transfer(bidder2.address,5000000000000000);

      token = await Token.deploy(initialURI,owner.address);


      // gameContract = await ERC1155Game.deploy(owner.address, token.address, beneficiary.address, USDC.address);
      gameContract = await upgrades.deployProxy(ERC1155Game, [ token.address, beneficiary.address, USDC.address], { initializer: 'initialize' });
      await gameContract.deployed();
    
      await token.setContract(gameContract.address);

      bidder1Wallet= gameContract.connect(bidder1);
      bidder2Wallet= gameContract.connect(bidder2);

      var USDCERC20Bidder1 = USDC.connect(bidder1);
      USDCERC20Bidder1.approve(gameContract.address, 500000000000000);
      var USDCERC20Bidder2 = USDC.connect(bidder2);
      USDCERC20Bidder2.approve(gameContract.address, 500000000000000);
      
      var tokenBidder1Wallet=token.connect(bidder1);
      tokenBidder1Wallet.setApprovalForAll(gameContract.address, true);


      var DAIContract=await ethers.getContractFactory('ERC20RG');

       DAI=await DAIContract.deploy("DAI","DAI");
      await DAI.transfer(bidder1.address,5000000000000000);

      DAIERC20Bidder1 = DAI.connect(bidder1);
      DAIERC20Bidder1.approve(gameContract.address, 500000000000000);
      
      // console.log(token.address)
      // console.log(beneficiary.address)
      // console.log(gameContract.address)
      // console.log(USDC.address)

      const data="0x";
      
      const ownerGame= gameContract.connect(owner);
      
      // token ID=1 // BUTTER
      await ownerGame.createIngredientNFT(owner.address, 0, initialURI, data ,1);

      // token ID=2 // PANEER
      await ownerGame.createIngredientNFT(owner.address, 0, initialURI, data ,2);

      // token ID=3 // BUTTER PANEER
      await ownerGame.createDishNFT(owner.address, 0, initialURI, data ,[1], [1]);

    });
  
    describe('#owner', () => {

      it('owner should be set correct', async()=>{

          expect(await gameContract.owner()).to.equal(owner.address)
      })
    });

    describe('#createIngredientNFT', () => {

      it('should send event',async()=>{
        
        const data = '0x12345678';
    
        await expect(gameContract.createIngredientNFT(owner.address, 0, initialURI, data ,1))
                  .to.emit(token, 'URI')
                  .withArgs(
                    initialURI,
                     4
                  );
      });

      it('totalSupply should be 0',async()=>{

        expect(await token.totalSupply(4)).to.equal(0)
      })

    });
    
    describe('#createAuction', () => {

      const bidIncrement=5;
      const basePrice = 1;
      var tokenType=0

      var tokenId = 2;
      const newBid = 5;
      var balance;

      it('should place auction',async()=>{
                 
        await expect(gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType))
          .to.emit(gameContract, 'LogCreate');
        })

        it('owner cant bid',async()=>{
          // Owner can't bid 
          await expect(gameContract.placeBid(tokenId, newBid)).to.be.reverted;
        });

        it('should not place auction again before 24 hrs',async()=>{
                
          await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

          await expect(gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType))
            .to.be.revertedWith("Earlier auction not finished");
          })
            
        it('should place bid correctly',async()=>{
          await expect(gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType))
          .to.emit(gameContract, 'LogCreate');

          await expect(bidder1Wallet.placeBid(tokenId, newBid))
                        .to.emit(gameContract, 'LogBid')
                        .withArgs(
                          tokenId, bidder1.address, newBid
                        );
        });

        it('balance change check',async()=>{
          await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

          balance=await USDC.balanceOf(bidder1.address);
          console.log("Bal:"+balance);

          await bidder1Wallet.placeBid(tokenId, newBid);


          await expect(await USDC.balanceOf(bidder1.address))
          .to.be.equal(balance-newBid)

          })


          it('totalSupply should be 0',async()=>{
            await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);
            await bidder1Wallet.placeBid(tokenId, newBid);

            expect(await token.totalSupply(tokenId)).to.equal(0)
          })
    
    });
    
    describe('#fixSaleNFT', () => {
      const fixPriceArr = [5];
      const fixPrice=5;

      var tokenId = 1;
      var tokenType=0;
      var balance;
        
      it('should place sale on ingredient NFT',async()=>{
                 
        await expect(gameContract.fixSaleNFT(tokenId, fixPriceArr))
          .to.emit(gameContract, 'LogSale')             
          .withArgs(
            tokenId,
             fixPriceArr
          );
        });

        
        it('should buy ingredient NFT correctly',async()=>{
          await gameContract.fixSaleNFT(tokenId, fixPriceArr);

          await expect(bidder1Wallet.buyIngredientNFT(tokenId, tokenType))
            .to.emit(gameContract, 'LogBuy')
            .withArgs(
              tokenId, tokenType, bidder1.address
            );
        });

        it('balance change check',async()=>{
          balance=await USDC.balanceOf(bidder1.address);
          
          await gameContract.fixSaleNFT(tokenId, fixPriceArr);

          await bidder1Wallet.buyIngredientNFT(tokenId, tokenType);

          await expect(await USDC.balanceOf(bidder1.address))
          .to.be.equal(balance-fixPrice)

          })

          it('totalSupply should be 1',async()=>{
            await gameContract.fixSaleNFT(tokenId, fixPriceArr);

            await bidder1Wallet.buyIngredientNFT(tokenId, tokenType);

            expect(await token.totalSupply(tokenId)).to.equal(1);
          })

     
    });
    
    describe('#fixSaleNFT afer adding DAI', async() => {
      const fixPriceArr = [5,5];
      const fixPrice=5;

      var tokenId = 1;
      var balance;

      it('should add ERC20 Coin',async()=>{
        await gameContract.addERC20Coin(DAI.address, 1)
        await expect(await gameContract.getCoinAddress(1))
          .to.be.equal(DAI.address);
        });

        it('shouldno add ERC20 Coin at same index again',async()=>{
          await gameContract.addERC20Coin(DAI.address, 1)
          await expect( gameContract.addERC20Coin(DAI.address, 1))
            .to.be.revertedWith("Already mapped index");
          });
  
        it('should place sale on ingredient NFT',async()=>{
          await gameContract.addERC20Coin(DAI.address, 1)
          await gameContract.getCoinAddress(1);
  
          await expect(gameContract.fixSaleNFT(tokenId, fixPriceArr))
            .to.emit(gameContract, 'LogSale')             
            .withArgs(
              tokenId,
               fixPriceArr
            );
          });
  
        it('should buy ingredient NFT correctly for both coins',async()=>{
          await gameContract.addERC20Coin(DAI.address, 1)
          await gameContract.getCoinAddress(1);

          await gameContract.fixSaleNFT(tokenId, fixPriceArr);

          await expect(bidder1Wallet.buyIngredientNFT(tokenId, 0))
            .to.emit(gameContract, 'LogBuy')
            .withArgs(
              tokenId, 0, bidder1.address
            );

            await expect(bidder1Wallet.buyIngredientNFT(tokenId, 1))
            .to.emit(gameContract, 'LogBuy')
            .withArgs(
              tokenId, 1, bidder1.address
            );
        });

        it('balance change check both',async()=>{

          await gameContract.addERC20Coin(DAI.address, 1)
          await gameContract.getCoinAddress(1);

          balance=await USDC.balanceOf(bidder1.address);
          let balanceDAI=await DAI.balanceOf(bidder1.address);
          console.log("DAIBAL:"+balanceDAI)
          
          await gameContract.fixSaleNFT(tokenId, fixPriceArr);

          await bidder1Wallet.buyIngredientNFT(tokenId, 0);

          await expect(await USDC.balanceOf(bidder1.address))
          .to.be.equal(balance-fixPrice)


          await bidder1Wallet.buyIngredientNFT(tokenId, 1);

          await expect(await DAI.balanceOf(bidder1.address))
          .to.be.equal(balanceDAI-fixPrice)
          })

          it('should not buy ingredient given ZERO value',async()=>{
            await gameContract.addERC20Coin(DAI.address, 1)
            await gameContract.getCoinAddress(1);
  
            await gameContract.fixSaleNFT(tokenId, [0,5]);

            await expect(bidder1Wallet.buyIngredientNFT(tokenId, 1))
              .to.emit(gameContract, 'LogBuy')
              .withArgs(
                tokenId, 1, bidder1.address
              );
  
              await expect(bidder1Wallet.buyIngredientNFT(tokenId, 0))
              .to.be.revertedWith("Cannot buy using this token");

          });
  
          it('totalSupply should be 2',async()=>{
            await gameContract.addERC20Coin(DAI.address, 1)
            await gameContract.getCoinAddress(1);
  
            await gameContract.fixSaleNFT(tokenId, fixPriceArr);

            await bidder1Wallet.buyIngredientNFT(tokenId, 0);
            await bidder1Wallet.buyIngredientNFT(tokenId, 1);

            expect(await token.totalSupply(tokenId)).to.equal(2);
          })

     
    });
    
    describe('#createDishNFT', () => {

      it('should send event',async()=>{
        
        const data = '0x12345678';
    
        await expect(gameContract.createDishNFT(owner.address, 0, initialURI, data ,[1,2], [1,1]))
                  .to.emit(token, 'URI')
                  .withArgs(
                    initialURI,
                     4
                  );
      });

      it('totalSupply should be 0',async()=>{

        expect(await token.totalSupply(4)).to.equal(0)
      })

    });
    

    describe('#cookDish', () => {
      const data = '0x12345678';
      const tokenId=3;
      const fixPriceArr = [5];
      var tokenType=0;

      it('should send event',async()=>{
        
        // buy butter
        await gameContract.fixSaleNFT(1, fixPriceArr);

        await bidder1Wallet.buyIngredientNFT(1, tokenType);

        await expect(bidder1Wallet.cookDish(tokenId, bidder1.address, data))
                  .to.emit(gameContract, 'CookedDish')
                  .withArgs(
                    tokenId,
                     bidder1.address
                  );
        });

      it('totalSupply should be 1',async()=>{

         // buy butter
         await gameContract.fixSaleNFT(1, fixPriceArr);

         await bidder1Wallet.buyIngredientNFT(1, tokenType);
        
         // butter cooked
         await bidder1Wallet.cookDish(tokenId, bidder1.address, data);
 
         expect(await token.totalSupply(3)).to.equal(1)
      })

    });



    describe('#withdraw from auction', () => {

      const bidIncrement=5;
      const basePrice = 1;
      var tokenType=0

      var tokenId = 2;
      const newBid = 5;
      var balance;

      
      it('withdraw by bid loser',async()=>{
        await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

        await bidder1Wallet.placeBid(tokenId, newBid);

        await bidder2Wallet.placeBid(tokenId, newBid+5);


        await expect(await bidder1Wallet.withdraw(tokenId))
        .to.emit(gameContract, 'LogWithdrawal')
        .withArgs(
          tokenId,
            bidder1.address,
            newBid
        );  
        })

        it('calculate bid winner correctly after twice bidding',async()=>{
          await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);
  
          await bidder1Wallet.placeBid(tokenId, 5);
  
          await bidder2Wallet.placeBid(tokenId, 10);
  
          await bidder1Wallet.placeBid(tokenId, 10);
  
          await expect(await bidder2Wallet.withdraw(tokenId))
          .to.emit(gameContract, 'LogWithdrawal')
          .withArgs(
            tokenId,
              bidder2.address,
              10
          );  
          })
  

        it('withdraw by bid loser should transfer balance',async()=>{
          await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

          balance=await USDC.balanceOf(bidder1.address);

          await bidder1Wallet.placeBid(tokenId, newBid);

          await bidder2Wallet.placeBid(tokenId, newBid+5);
          
          await bidder1Wallet.withdraw(tokenId);

          await expect(await USDC.balanceOf(bidder1.address))
          .to.be.equal(balance)
          })

        it('withdraw by bid winner not allow',async()=>{
          await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

          await bidder1Wallet.placeBid(tokenId, newBid);

          await bidder2Wallet.placeBid(tokenId, newBid+5);


          await expect( bidder2Wallet.withdraw(tokenId))
          .to.be.revertedWith("Highest bidder can't withdraw");
          })

       
    });




    describe('#auctionEnd', () => {

      const bidIncrement=5;
      const basePrice = 1;
      var tokenType=0

      var tokenId = 2;
      const newBid = 5;
      var balance;

      
      it('totalSupply should be 0 before endAuction',async()=>{
        await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

        await bidder1Wallet.placeBid(tokenId, newBid);

        await bidder2Wallet.placeBid(tokenId, newBid+5);
        
        balance=await USDC.balanceOf(gameContract.address);

        expect(await token.totalSupply(tokenId)).to.equal(0)
      })
      
      it('transfer USDC to beneficiary',async()=>{
        await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

        await bidder1Wallet.placeBid(tokenId, newBid);

        await bidder2Wallet.placeBid(tokenId, newBid+5);
        
        
        await expect(await gameContract.auctionEnd(tokenId))
        .to.emit(USDC, 'Transfer')
        .withArgs(
            gameContract.address,
            beneficiary.address,
            newBid+5
        );  
        })

        it('transfer NFT to highest bidder',async()=>{
          await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);
  
          await bidder1Wallet.placeBid(tokenId, newBid);
  
          await bidder2Wallet.placeBid(tokenId, newBid+5);
          
          
          await expect(await gameContract.auctionEnd(tokenId))
          .to.emit(token, 'TransferSingle')
          .withArgs(
              gameContract.address,
              ZERO_ADDRESS,
              bidder2.address,
              tokenId,
              1
          );  
          })

    });



  

    describe('#cancelAuction', () => {

      const bidIncrement=5;
      const basePrice = 1;
      var tokenType=0

      var tokenId = 2;
      const newBid = 5;
      var balance;

      
      it('emit event',async()=>{
        await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

        await expect( gameContract.cancelAuction(tokenId))
        .to.emit(gameContract, 'LogCanceled')
        .withArgs(
            tokenId
        );  
      })
      

      
      it('not allowed to bid',async()=>{
        await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);
        await gameContract.cancelAuction(tokenId);

        await expect( bidder1Wallet.placeBid(tokenId, newBid)).to.be.revertedWith("Bidding already canceled");

      })

      it('cannot cancel after bid',async()=>{
        await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);

        await bidder1Wallet.placeBid(tokenId, newBid);
        await expect( gameContract.cancelAuction(tokenId)).to.be.
          revertedWith("Cannot cancel once bidding starts");        
      
        })

        it('end Auction shouldnt transfer',async()=>{
          await gameContract.createAuction(tokenId, bidIncrement, basePrice,tokenType);
          await gameContract.cancelAuction(tokenId);
          await expect( gameContract.auctionEnd(tokenId)).to.be.
          revertedWith("Noone participated in bid");        
      

          })

      });

       




  });

