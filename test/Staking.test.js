const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ether = require('@openzeppelin/test-helpers/src/ether');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');
const { ethers,upgrades } = require('hardhat');

  const initialURI = 'https://token-cdn-domain/{id}.json';

  describe('Staking Contract',()=>{

    let ERC1155Game,USDCContract, USDC, gameContract,owner,beneficiary,
        account1,account2,account1Wallet,account2Wallet,DAIERC20account1,DAI, 
        StakingContract, staking,stakingaccount1,stakingaccount2;
  
    beforeEach(async ()=> {

      [owner, beneficiary, account1, account2, ...otherAccount] = await ethers.getSigners();

      Token=await ethers.getContractFactory('ERC1155RG');
      ERC1155Game=await ethers.getContractFactory('ERC1155Game');
      USDCContract=await ethers.getContractFactory('ERC20RG');
      StakingContract=await ethers.getContractFactory('StakingRewards');

      
      USDC=await USDCContract.deploy("USDC","USDC");
      await USDC.transfer(account1.address,5000000000000000);
      await USDC.transfer(account2.address,5000000000000000);
      await USDC.transfer(owner.address,'50000000000000000000');

      token = await Token.deploy(initialURI,owner.address);

      gameContract = await upgrades.deployProxy(ERC1155Game, [ token.address, beneficiary.address, USDC.address], { initializer: 'initialize' });
      await gameContract.deployed();

      await token.setContract(gameContract.address);

      staking = await StakingContract.deploy(owner.address, owner.address, USDC.address, token.address,gameContract.address);
      
      account1Wallet= gameContract.connect(account1);
      account2Wallet= gameContract.connect(account2);

      var USDCERC20account1 = USDC.connect(account1);
      USDCERC20account1.approve(gameContract.address, 500000000000000);
      
      var USDCERC20account2 = USDC.connect(account2);
      USDCERC20account2.approve(gameContract.address, 500000000000000);
      
      var tokenaccount1Wallet=token.connect(account1);
      tokenaccount1Wallet.setApprovalForAll(gameContract.address, true);
      tokenaccount1Wallet.setApprovalForAll(staking.address, true);

      var tokenaccount2Wallet=token.connect(account2);
      tokenaccount2Wallet.setApprovalForAll(gameContract.address, true);
      tokenaccount2Wallet.setApprovalForAll(staking.address, true);

      var DAIContract=await ethers.getContractFactory('ERC20RG');

      DAI=await DAIContract.deploy("DAI","DAI");
      await DAI.transfer(account1.address,5000000000000000);

      DAIERC20account1 = DAI.connect(account1);
      DAIERC20account1.approve(gameContract.address, 500000000000000);

      USDC.approve(staking.address, 500000000000000);
      USDC.transfer(staking.address, 50000000000000);
      // USDC.transfer(account1.address, 5000000000000);

      // console.log(token.address)
      // console.log(beneficiary.address)
      // console.log(gameContract.address)
      // console.log(USDC.address)

      stakingaccount1 = staking.connect(account1);
      stakingaccount2 = staking.connect(account2);


      const data="0x";

      // token ID=1 // BUTTER
      await gameContract.createIngredientNFT(owner.address, 0, initialURI, data ,1);

      // account 1 & 2 has NFT
      await gameContract.fixSaleNFT(1, [10]);
      await account1Wallet.buyIngredientNFT(1, 0);
      await account1Wallet.buyIngredientNFT(1, 0);

      await account2Wallet.buyIngredientNFT(1, 0);

      // token ID=2 // PANEER
      await gameContract.createIngredientNFT(owner.address, 0, initialURI, data ,2);
      await gameContract.createAuction(2, 1, 1, 0);
      await account1Wallet.placeBid(2, 1);
      await gameContract.auctionEnd(2);

      // token ID=3 // BUTTER PANEER
      await gameContract.createDishNFT(owner.address, 0, initialURI, data ,[1,2], [1,1]);

    });
  
    describe('#owner', () => {

      it('owner should be set correct', async()=>{

          expect(await staking.owner()).to.equal(owner.address)
      })
    });

    describe('#setRewardsDuration', () => {

      it('should send event',async()=>{
        
        const reward = '200000';
    
        await expect(staking.notifyRewardAmount(reward))
                  .to.emit(staking, 'RewardAdded')
                  .withArgs(
                    reward
                  );
        });

    });
    
    describe('#stake', () => {

      const tokenId=1;
      const quantity=1;
     
      it('should send event',async()=>{


        const reward = '20000000000000';

        await staking.notifyRewardAmount(reward);

        await expect(stakingaccount1.stake(tokenId,quantity))
                  .to.emit(staking, 'Staked')
                  .withArgs(
                    account1.address,
                    tokenId,
                    quantity,
                    1000
                  );
      });
    });

      after( ()=> {
        describe('#earnings', () => {
          const tokenId=1;

          it('correct NFT balance of account1',async ()=>{
     
            await expect(await staking.balanceOfNFT(account1.address, tokenId))
            .to.be.equal(1);
    
        
          });

          it('correct valuation balance of account1',async ()=>{
     
            await expect(await staking.balanceOf(account1.address))
            .to.be.equal(1000);
    
        
          });
      
          it('should have correct total balance',async ()=>{
        

            await expect(await staking.totalSupply())
            .to.be.equal(1000);
          });
    
         
      });

    });


    after( ()=> {
      describe('#earnings', () => {

        var earnings;

        it('should have earnings',async ()=>{
          await staking.getReward();

          const earning1=await staking.earned(account1.address);
          earnings=Number(earning1);
          await expect(earnings)
          .to.be.equal(333333333333);

          console.log(earnings);
                      
        });

        it('should have correct rewardPerToken',async ()=>{
        
          const RPT=await staking.rewardPerToken();

          await expect(RPT)
          .to.be.equal("333333333333000000000000000");
        });
  
        it('should receive staking rewards correctly',async ()=>{

            const initialBal=await USDC.balanceOf(account1.address);

            await stakingaccount1.getReward();
                       
            await expect(await USDC.balanceOf(account1.address))
            .to.be.equal(Number(initialBal)+666666666666);
  
         });
      
    });
    


  });

  after( ()=> {
    describe('#withdraw', () => {

      const tokenId=1;
      const quantity=1;

      var initialBal;

      it('should withdraw correct',async ()=>{

        initialBal = await token.balanceOf(account1.address,tokenId);

        await expect(stakingaccount1.withdraw(tokenId,quantity))
        .to.emit(staking, 'Withdrawn')
        .withArgs(
          account1.address,
          tokenId,
          quantity,
          1000);                    
      });


      it('correct NFT balance of account1',async ()=>{
     
        await expect(await staking.balanceOfNFT(account1.address, tokenId))
        .to.be.equal(0);

      });

      it('correct valuation balance of account1',async ()=>{
 
        await expect(await staking.balanceOf(account1.address))
        .to.be.equal(0);
    
      });
  
      it('should have correct total balance',async ()=>{
    
        await expect(await staking.totalSupply())
        .to.be.equal(0);
      });


      it('should receive NFTs correctly',async ()=>{

          await stakingaccount1.getReward();
                     
          await expect(await token.balanceOf(account1.address,tokenId))
          .to.be.equal(2);

       });
    
    });
  
  });

  after( ()=> {
    describe('#exit', () => {

      const tokenId=1;
      const quantity=1;

      var initialBal;

      it('should exit correct',async ()=>{

        await stakingaccount1.stake(tokenId,quantity);

        initialBal = await token.balanceOf(account1.address,tokenId);

        await expect(stakingaccount1.exit(tokenId))
        .to.emit(staking, 'Withdrawn')
        .withArgs(
          account1.address,
          tokenId,
          quantity,
          1000);                    
      });


      it('correct NFT balance of account1',async ()=>{
     
        await expect(await staking.balanceOfNFT(account1.address, tokenId))
        .to.be.equal(0);

      });

      it('correct valuation balance of account1',async ()=>{
 
        await expect(await staking.balanceOf(account1.address))
        .to.be.equal(0);
    
      });
  
      it('should have correct total balance',async ()=>{
    
        await expect(await staking.totalSupply())
        .to.be.equal(0);
      });


      it('should receive NFTs correctly',async ()=>{

          await stakingaccount1.getReward();
                     
          await expect(await token.balanceOf(account1.address,tokenId))
          .to.be.equal(2);

       });
    
    });
  
  });


  after( ()=> {
    describe('#stake DISH', () => {

      const tokenId=3;
      const quantity=1;

         
          it('should send event',async()=>{
      
      
            await account1Wallet.cookDish(3, account1.address, "0x")

            await expect(stakingaccount1.stake(tokenId,quantity))
                      .to.emit(staking, 'Staked')
                      .withArgs(
                        account1.address,
                        tokenId,
                        quantity,
                        1008
                      );
          });
        });
      });
        after( ()=> {
      
          describe('#DISH earnings', () => {
      
            var earnings;
            const tokenId=3;

            it('correct NFT balance of account1',async ()=>{
     
              await expect(await staking.balanceOfNFT(account1.address, tokenId))
              .to.be.equal(1);
      
            });
      
            it('correct valuation balance of account1',async ()=>{
       
              await expect(await staking.balanceOf(account1.address))
              .to.be.equal(1008);
          
            });
        
            it('should have correct total balance',async ()=>{
          
              await expect(await staking.totalSupply())
              .to.be.equal(1008);
            });
      
      
            it('should have earnings',async ()=>{
              await staking.getReward();
      
              const earning1=await staking.earned(account1.address);
              earnings=Number(earning1);
              await expect(earnings)
              .to.be.equal(333333333333);
      
                          
            });
      
           
        });
      });
   



});

