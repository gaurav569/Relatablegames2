const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ether = require('@openzeppelin/test-helpers/src/ether');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');
const { ethers } = require('hardhat');

// const { shouldBehaveLikeERC1155 } = require('./ERC1155.behavior');

// contract('ERC1155', function (accounts) {

  const initialURI = 'https://token-cdn-domain/{id}.json';

  describe('ERC1155 contract',()=>{

    let Token,token,operator,tokenHolder,tokenBatchHolder,otherAccount,tokenHolderWallet;
  
    beforeEach(async ()=> {
      Token=await ethers.getContractFactory('ERC1155RG');

      [operator, tokenHolder, tokenBatchHolder, ...otherAccount] = await ethers.getSigners();
      token = await Token.deploy(initialURI,operator.address);

      await token.setContract(operator.address);
      tokenHolderWallet= token.connect(tokenHolder);

    });
  
    describe('#owner', () => {

      it('owner should be set correct',async()=>{
        expect(await token.owner()).to.equal(operator.address)
      })
    });

    describe('#create', () => {
      const mintAmount = 50;
      const data = '0x12345678';

      it('should create NFT for tokenholder',async()=>{
        var currtokenId= await token.create(tokenHolder.address,mintAmount, initialURI, data);
        var tokenId=(Number(currtokenId.value));
        tokenId++;
        expect(await token.balanceOf(tokenHolder.address,tokenId)).to.equal(mintAmount)
      })
   

      it('should not create to zero address',async()=>{
        await expect(token.create(ZERO_ADDRESS, mintAmount, initialURI, data)).to.be.revertedWith('ERC1155: mint to the zero address');

      })


      it('should not allow creation by non owner', async function () {
        await expect(tokenHolderWallet.create(tokenHolder.address,mintAmount, initialURI, data)).to.be.revertedWith("caller is not the Game contract");
      });


      it('emits a URI event', async ()=> {
        
        let tokenId=1;
        await expect(token.create(tokenHolder.address,mintAmount, initialURI, data))
                  .to.emit(token, 'URI')
                  .withArgs(
                     initialURI,
                     tokenId
                    );
                  });

      it('emits a TransferSingle event', async ()=> {
        let tokenId=1;

        await expect(token.create(tokenHolder.address,mintAmount, initialURI, data))
                  .to.emit(token, 'TransferSingle')
                  .withArgs(
                     operator.address,
                     ZERO_ADDRESS,
                     tokenHolder.address,
                     tokenId,
                     mintAmount
                  );

        
        });
  
    });
    

    describe('#mint', () => {
      var tokenId = 1;
      const mintAmount = 50;
      const data = '0x12345678';

      it('should mint by tokenholder',async()=>{
        await token.mint(tokenHolder.address, tokenId, mintAmount, data);
        expect(await token.balanceOf(tokenHolder.address,tokenId)).to.equal(mintAmount)
      })
   

      it('should not mint to zero address',async()=>{
        await expect(token.mint(ZERO_ADDRESS, tokenId, mintAmount, data)).to.be.revertedWith('ERC1155: mint to the zero address');

      })


      it('should not allow mint by non owner', async function () {
        await expect(tokenHolderWallet.mint(tokenHolder.address, tokenId, mintAmount, data)).to.be.revertedWith("caller is not the Game contract");
      });


      it('emits a TransferSingle event', async ()=> {
        
        await expect(token.mint(tokenHolder.address, tokenId, mintAmount, data))
                  .to.emit(token, 'TransferSingle')
                  .withArgs(
                     operator.address,
                     ZERO_ADDRESS,
                     tokenHolder.address,
                     tokenId,
                     mintAmount
                  );
        });
  
    });
    
    describe('#mintBatch', () => {

      const data = '0x12345678';
      const tokenBatchIds = [2000, 2010, 2020];
      const mintAmounts = [5000, 10000, 42195];

      it('should mint by tokenholder',async()=>{
        await token.mintBatch(tokenHolder.address, tokenBatchIds, mintAmounts, data);
        for(let i=0;i<tokenBatchIds.length;i++){
          expect(await token.balanceOf(tokenHolder.address,tokenBatchIds[i])).to.equal(mintAmounts[i])
        }
      })
   

      it('should not mintBatch',async()=>{
        await expect(token.mintBatch(ZERO_ADDRESS, tokenBatchIds, mintAmounts, data)).to.be.revertedWith('ERC1155: mint to the zero address');

      })

      it('should not allow mint by non owner', async function () {
        await expect(tokenHolderWallet.mintBatch(ZERO_ADDRESS, tokenBatchIds, mintAmounts, data)).to.be.revertedWith("caller is not the Game contract");
      });

      it('emits a TransferBatch event', async ()=> {
        
        await expect(token.mintBatch(tokenHolder.address, tokenBatchIds, mintAmounts, data))
                  .to.emit(token, 'TransferBatch')
                  .withArgs(
                     operator.address,
                     ZERO_ADDRESS,
                     tokenHolder.address,
                     tokenBatchIds,
                     mintAmounts
                  );
        });
  
    });
    

    describe('#transfer', () => {
      var tokenId = 1;
      const mintAmount = 100;
      const transferAmount = 40;
      
      const data = '0x12345678';

      it('should transfer by operator',async()=>{
        await token.mint(operator.address, tokenId, mintAmount, data);
        await token.safeTransferFrom(operator.address,tokenHolder.address, tokenId, transferAmount, data);
        expect(await token.balanceOf(operator.address,tokenId)).to.equal(60)
        expect(await token.balanceOf(tokenHolder.address,tokenId)).to.equal(40)
      })
      
   
      it('approve and transfer by tokenholder',async()=>{
        await token.mint(operator.address, tokenId, mintAmount, data);
        await token.setApprovalForAll(tokenHolder.address, true);

        await tokenHolderWallet.safeTransferFrom(operator.address,tokenHolder.address, tokenId, transferAmount, data);

        expect(await token.balanceOf(operator.address,tokenId)).to.equal(60)
        expect(await token.balanceOf(tokenHolder.address,tokenId)).to.equal(40)

      })

      it('should not transfer to Zero Address',async()=>{
        await token.mint(tokenHolder.address, tokenId, transferAmount, data);
        await expect(token.safeTransferFrom(tokenHolder.address,ZERO_ADDRESS, tokenId, transferAmount, data)).to.be.revertedWith('ERC1155: transfer to the zero address');
      })

      it('emits a TransferSingle event', async ()=> {
        
        await token.mint(operator.address, tokenId, transferAmount, data);
        await expect (token.safeTransferFrom(operator.address,tokenHolder.address, tokenId, transferAmount, data))
                  .to.emit(token, 'TransferSingle')
                  .withArgs(
                     operator.address,
                     operator.address,
                     tokenHolder.address,
                     tokenId,
                     transferAmount
                  );
        });
  
    });

    describe('#transferBatch', () => {

      const data = '0x12345678';
      const tokenBatchIds = [2000, 2010, 2020];
      const transferAmounts = [5000, 10000, 42195];

      it('should safeBatchTransferFrom by tokenHolder',async()=>{
        
        await token.mintBatch(operator.address, tokenBatchIds, transferAmounts, data);

        await token.safeBatchTransferFrom(operator.address,tokenBatchHolder.address, tokenBatchIds, transferAmounts, data);
        for(let i=0;i<tokenBatchIds.length;i++){
          expect(await token.balanceOf(tokenBatchHolder.address,tokenBatchIds[i])).to.equal(transferAmounts[i])
        }
      })
   

      it('should not transfer',async()=>{
        await token.mintBatch(operator.address, tokenBatchIds, transferAmounts, data);

        await expect(token.safeBatchTransferFrom(operator.address,ZERO_ADDRESS, tokenBatchIds, transferAmounts, data)).to.be.revertedWith('ERC1155: transfer to the zero address');

      })

      it('emits a TransferBatch event', async ()=> {
        await token.mintBatch(operator.address, tokenBatchIds, transferAmounts, data);

        await expect(token.safeBatchTransferFrom(operator.address,tokenBatchHolder.address, tokenBatchIds, transferAmounts, data))
                  .to.emit(token, 'TransferBatch')
                  .withArgs(
                     operator.address,
                     operator.address,
                     tokenBatchHolder.address,
                     tokenBatchIds,
                     transferAmounts
                  );
        });
    });
    



  describe('ERC1155MetadataURI', async ()=> {
    const firstTokenID = 42;
    const secondTokenID = 1337;

    // it('emits no URI event in constructor', async function () {
    //   await expectEvent.notEmitted.inConstruction(this.token, 'URI');
    // });

    it('sets the initial URI for all token types', async  ()=> {
      expect(await token.uri(firstTokenID)).to.be.equal(initialURI);
      expect(await token.uri(secondTokenID)).to.be.equal(initialURI);
    });

    describe('setURI', async ()=> {

      const newURI = 'https://token-cdn-domain/{locale}/{id}.json';

      it('sets the new URI for all token types', async function () {
        await token.setURI(newURI);

        expect(await token.uri(firstTokenID)).to.be.equal(newURI);
        expect(await token.uri(secondTokenID)).to.be.equal(newURI);
      });

      it('sets the new URI by non owner', async function () {
        await expect(tokenHolderWallet.setURI(newURI)).to.be.reverted;
      });


    });
  });
    
    

  describe('#burn', () => {
    var tokenId = 1;
    const mintAmount = 50;
    const burnAmount = 20;

    const data = '0x12345678';

    it('should burn by operator',async()=>{
      await token.mint(operator.address, tokenId, mintAmount, data);
      await token.burn(operator.address, tokenId, burnAmount);
      expect(await token.balanceOf(operator.address,tokenId)).to.equal(mintAmount-burnAmount)

    })
 
    it('shouldnot burn by tokenHolder (doesnot have tokens)',async()=>{
      
      await expect(token.burn(tokenHolder.address, tokenId, burnAmount)).to.be.revertedWith("ERC1155: caller is not owner nor approved");
   
    })

    it('approve and burn by tokenholder',async()=>{
      await token.mint(operator.address, tokenId, mintAmount, data);
      await token.setApprovalForAll(tokenHolder.address, true);

      await tokenHolderWallet.burn(operator.address, tokenId, burnAmount);

      expect(await token.balanceOf(operator.address,tokenId)).to.equal(mintAmount-burnAmount)

    })

    it('emits a TransferSingle event', async ()=> {
      
      await token.mint(operator.address, tokenId, mintAmount, data);
      await expect (token.burn(operator.address, tokenId, burnAmount))
                .to.emit(token, 'TransferSingle')
                .withArgs(
                   operator.address,
                   operator.address,
                   ZERO_ADDRESS,
                   tokenId,
                   burnAmount
                );
      });
  });



  describe('#burnBatch', () => {

    const data = '0x12345678';
    const tokenBatchIds = [2000, 2010, 2020];
    const mintAmounts = [10000, 20000, 84390];

    const transferAmounts = [5000, 10000, 42195];

    it('should burnbatch by operator',async()=>{
      
      await token.mintBatch(operator.address, tokenBatchIds, mintAmounts, data);

      await token.burnBatch(operator.address, tokenBatchIds, [5000, 10000, 42195]);
      for(let i=0;i<tokenBatchIds.length;i++){
        expect(await token.balanceOf(operator.address,tokenBatchIds[i])).to.equal(transferAmounts[i])
      }
    })
 
    it('shouldnot burnbatch by tokenHolder (doesnot have tokens)',async()=>{
      
      await expect(token.burnBatch(tokenHolder.address, tokenBatchIds, [5000, 10000, 42195])).to.be.revertedWith("ERC1155: caller is not owner nor approved");
   
    })


    it('approve and burnbatch by tokenholder',async()=>{
      await token.mintBatch(operator.address, tokenBatchIds, mintAmounts, data);

      await token.setApprovalForAll(tokenHolder.address, true);

      await tokenHolderWallet.burnBatch(operator.address, tokenBatchIds, [5000, 10000, 42195]);    

      for(let i=0;i<tokenBatchIds.length;i++){
        expect(await token.balanceOf(operator.address,tokenBatchIds[i])).to.equal(transferAmounts[i])
      }
    })

    it('emits a burnBatch event', async ()=> {
      await token.mintBatch(operator.address, tokenBatchIds, mintAmounts, data);

      await expect(token.burnBatch(operator.address, tokenBatchIds, transferAmounts))
                .to.emit(token, 'TransferBatch')
                .withArgs(
                   operator.address,
                   operator.address,
                   ZERO_ADDRESS,
                   tokenBatchIds,
                   transferAmounts
                );
      });

  });
  



  });



// const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
// const { ZERO_ADDRESS } = constants;

// const { expect } = require('chai');

// // const { shouldBehaveLikeERC1155 } = require('./ERC1155.behavior');
//       // console.log(token)
//       //  [operator, tokenHolder, tokenBatchHolder] = await ethers.getSigners();

// // const ERC1155Mock = artifacts.require('ERC1155Mock');

//   describe('contract',()=>{
  
//     let operator,tokenHolder,tokenBatchHolder,otherAccounts,token,Token,ERC1155Mock;

//   const initialURI = 'https://token-cdn-domain/{id}.json';

//   beforeEach(async function () {
//     let [operatorAcc, tokenHolderAcc, tokenBatchHolderAcc, ...otherAccountsAcc] = await ethers.getSigners();

//       operator=operatorAcc.address;
//       tokenHolder=tokenHolderAcc.address;
//       tokenBatchHolder=tokenBatchHolderAcc.address;
//       otherAccounts=otherAccountsAcc.address;

//      Token=await ethers.getContractFactory('ERC1155Mock');
//      this.token = await Token.deploy(initialURI);

//     // this.token = await ERC1155Mock.new(initialURI);
//   });

//   // shouldBehaveLikeERC1155(otherAccounts);

//   describe('internal functions', function () {
//     const tokenId = new BN(1990);
//     const mintAmount = new BN(9001);
//     const burnAmount = new BN(3000);

//     const tokenBatchIds = [new BN(2000), new BN(2010), new BN(2020)];
//     const mintAmounts = [new BN(5000), new BN(10000), new BN(42195)];
//     const burnAmounts = [new BN(5000), new BN(9001), new BN(195)];

//     const data = '0x12345678';

//     describe('_mint', function () {
//       it('reverts with a zero destination address', async function () {
//         await expectRevert(
//           this.token.mint(tokenHolder, tokenId, mintAmount, data),
//           'ERC1155: mint to the zero address',
//         );
//       });

//       context('with minted tokens', function () {
//         beforeEach(async function () {
//           ({ logs: this.logs } = await this.token.mint(tokenHolder, tokenId, mintAmount, data, { from: operator }));
//         });

//         it('emits a TransferSingle event', function () {
//           expectEvent.inLogs(this.logs, 'TransferSingle', {
//             operator,
//             from: ZERO_ADDRESS,
//             to: tokenHolder,
//             id: tokenId,
//             value: mintAmount,
//           });
//         });

//         it('credits the minted amount of tokens', async function () {
//           expect(await this.token.balanceOf(tokenHolder, tokenId)).to.be.bignumber.equal(mintAmount);
//         });
//       });
//     });

//     describe('_mintBatch', function () {
//       it('reverts with a zero destination address', async function () {
//         await expectRevert(
//           this.token.mintBatch(ZERO_ADDRESS, tokenBatchIds, mintAmounts, data),
//           'ERC1155: mint to the zero address',
//         );
//       });

//       it('reverts if length of inputs do not match', async function () {
//         await expectRevert(
//           this.token.mintBatch(tokenBatchHolder, tokenBatchIds, mintAmounts.slice(1), data),
//           'ERC1155: ids and amounts length mismatch',
//         );

//         await expectRevert(
//           this.token.mintBatch(tokenBatchHolder, tokenBatchIds.slice(1), mintAmounts, data),
//           'ERC1155: ids and amounts length mismatch',
//         );
//       });

//       context('with minted batch of tokens', function () {
//         beforeEach(async function () {
//           ({ logs: this.logs } = await this.token.mintBatch(
//             tokenBatchHolder,
//             tokenBatchIds,
//             mintAmounts,
//             data,
//             { from: operator },
//           ));
//         });

//         it('emits a TransferBatch event', function () {
//           expectEvent.inLogs(this.logs, 'TransferBatch', {
//             operator,
//             from: ZERO_ADDRESS,
//             to: tokenBatchHolder,
//           });
//         });

//         it('credits the minted batch of tokens', async function () {
//           const holderBatchBalances = await this.token.balanceOfBatch(
//             new Array(tokenBatchIds.length).fill(tokenBatchHolder),
//             tokenBatchIds,
//           );

//           for (let i = 0; i < holderBatchBalances.length; i++) {
//             expect(holderBatchBalances[i]).to.be.bignumber.equal(mintAmounts[i]);
//           }
//         });
//       });
//     });

//     describe('_burn', function () {
//       it('reverts when burning the zero account\'s tokens', async function () {
//         await expectRevert(
//           this.token.burn(ZERO_ADDRESS, tokenId, mintAmount),
//           'ERC1155: burn from the zero address',
//         );
//       });

//       it('reverts when burning a non-existent token id', async function () {
//         await expectRevert(
//           this.token.burn(tokenHolder, tokenId, mintAmount),
//           'ERC1155: burn amount exceeds balance',
//         );
//       });

//       it('reverts when burning more than available tokens', async function () {
//         await this.token.mint(
//           tokenHolder,
//           tokenId,
//           mintAmount,
//           data,
//           { from: operator },
//         );

//         await expectRevert(
//           this.token.burn(tokenHolder, tokenId, mintAmount.addn(1)),
//           'ERC1155: burn amount exceeds balance',
//         );
//       });

//       context('with minted-then-burnt tokens', function () {
//         beforeEach(async function () {
//           await this.token.mint(tokenHolder, tokenId, mintAmount, data);
//           ({ logs: this.logs } = await this.token.burn(
//             tokenHolder,
//             tokenId,
//             burnAmount,
//             { from: operator },
//           ));
//         });

//         it('emits a TransferSingle event', function () {
//           expectEvent.inLogs(this.logs, 'TransferSingle', {
//             operator,
//             from: tokenHolder,
//             to: ZERO_ADDRESS,
//             id: tokenId,
//             value: burnAmount,
//           });
//         });

//         it('accounts for both minting and burning', async function () {
//           expect(await this.token.balanceOf(
//             tokenHolder,
//             tokenId,
//           )).to.be.bignumber.equal(mintAmount.sub(burnAmount));
//         });
//       });
//     });

//     describe('_burnBatch', function () {
//       it('reverts when burning the zero account\'s tokens', async function () {
//         await expectRevert(
//           this.token.burnBatch(ZERO_ADDRESS, tokenBatchIds, burnAmounts),
//           'ERC1155: burn from the zero address',
//         );
//       });

//       it('reverts if length of inputs do not match', async function () {
//         await expectRevert(
//           this.token.burnBatch(tokenBatchHolder, tokenBatchIds, burnAmounts.slice(1)),
//           'ERC1155: ids and amounts length mismatch',
//         );

//         await expectRevert(
//           this.token.burnBatch(tokenBatchHolder, tokenBatchIds.slice(1), burnAmounts),
//           'ERC1155: ids and amounts length mismatch',
//         );
//       });

//       it('reverts when burning a non-existent token id', async function () {
//         await expectRevert(
//           this.token.burnBatch(tokenBatchHolder, tokenBatchIds, burnAmounts),
//           'ERC1155: burn amount exceeds balance',
//         );
//       });

//       context('with minted-then-burnt tokens', function () {
//         beforeEach(async function () {
//           await this.token.mintBatch(tokenBatchHolder, tokenBatchIds, mintAmounts, data);
//           ({ logs: this.logs } = await this.token.burnBatch(
//             tokenBatchHolder,
//             tokenBatchIds,
//             burnAmounts,
//             { from: operator },
//           ));
//         });

//         it('emits a TransferBatch event', function () {
//           expectEvent.inLogs(this.logs, 'TransferBatch', {
//             operator,
//             from: tokenBatchHolder,
//             to: ZERO_ADDRESS,
//             // ids: tokenBatchIds,
//             // values: burnAmounts,
//           });
//         });

//         it('accounts for both minting and burning', async function () {
//           const holderBatchBalances = await this.token.balanceOfBatch(
//             new Array(tokenBatchIds.length).fill(tokenBatchHolder),
//             tokenBatchIds,
//           );

//           for (let i = 0; i < holderBatchBalances.length; i++) {
//             expect(holderBatchBalances[i]).to.be.bignumber.equal(mintAmounts[i].sub(burnAmounts[i]));
//           }
//         });
//       });
//     });
//   });

//   describe('ERC1155MetadataURI', function () {
//     const firstTokenID = new BN('42');
//     const secondTokenID = new BN('1337');

//     it('emits no URI event in constructor', async function () {
//       await expectEvent.notEmitted.inConstruction(this.token, 'URI');
//     });

//     it('sets the initial URI for all token types', async function () {
//       expect(await this.token.uri(firstTokenID)).to.be.equal(initialURI);
//       expect(await this.token.uri(secondTokenID)).to.be.equal(initialURI);
//     });

//     describe('_setURI', function () {
//       const newURI = 'https://token-cdn-domain/{locale}/{id}.json';

//       it('emits no URI event', async function () {
//         const receipt = await this.token.setURI(newURI);

//         expectEvent.notEmitted(receipt, 'URI');
//       });

//       it('sets the new URI for all token types', async function () {
//         await this.token.setURI(newURI);

//         expect(await this.token.uri(firstTokenID)).to.be.equal(newURI);
//         expect(await this.token.uri(secondTokenID)).to.be.equal(newURI);
//       });
//     });
//   });
// });