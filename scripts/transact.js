
// sleep time expects milliseconds
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
async function main(){

    const [caller]=await ethers.getSigners();
    console.log('caller acct: '+caller.address);
    
    const tokenAddress="0xe1307F473b609E18037813D7F719677E7523f939";
    Token=await ethers.getContractFactory('ERC20RG');
    const token = await Token.attach(tokenAddress);
    // owner = await token.owner();
    // console.log("Owner is", owner.toString());
    // await token.mint(caller.address,1,5,'0x');


    ERC1155=await ethers.getContractFactory('ERC1155RG');
    const erc1155 = await ERC1155.attach("0x35198B2fDB374BFbf6b86194f660C8E266680e23");

    Game=await ethers.getContractFactory('ERC1155Game');

    const game = await Game.attach("0xc8bFC92eb4Aaf6d450cC7CD17dAd22B90b3aDb66");

    // await erc1155.setContract(game.address);

    // await game.addERC20Coin(tokenAddress, 1);

    // await token.approve(game.address,"20000000000000000000000000");

    // tokenId = await game.createIngredientNFT(caller.address, 0, "initialURI", "0x" ,2);
    // console.log("fix sale tokenid: ");
    // console.log(tokenId.value);

    // currID= await erc1155.totalIDs();
    // console.log(currID)
    // totalSupply= await erc1155.totalSupply(currID);
    // console.log(totalSupply)
    // await sleep(4000);


    // await game.fixSale2NFT(1, ["10","20000000000000000000"]);

    // await sleep(4000);

    console.log("buy from sale");

    await game.buyIngredient2NFT(1, 1);

    // balanceOf = await token.balanceOf(caller.address,1);
    // console.log("Token balance", balanceOf.toString());

    // await game.transferOwnership("");

}

main().then(()=>process.exit(0))
.catch(err=>{  
    console.error(err);
    process.exit(1);
})