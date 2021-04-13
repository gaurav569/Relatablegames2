
// sleep time expects milliseconds
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
async function main(){

    const [caller]=await ethers.getSigners();
    console.log('caller acct: '+caller.address);
    
    const tokenAddress="0xd9F7B3B335a3361b67a245A82cdC63633A86bc31";
    Token=await ethers.getContractFactory('ERC20RG');
    const token = await Token.attach(tokenAddress);
    // owner = await token.owner();
    // console.log("Owner is", owner.toString());
    // await token.mint(caller.address,1,5,'0x');


    ERC1155=await ethers.getContractFactory('ERC1155RG');
    const erc1155 = await ERC1155.attach("0x964f7F97F40F4c5E6fCdfC6CA801377B1253c8FA");

    Game=await ethers.getContractFactory('ERC1155Game');

    const game = await Game.attach("0x292cF01d33705fd9a840E682ae3200bd186A3759");

    // await erc1155.setContract(game.address);

    // await game.addERC20Coin(tokenAddress, 1);

    // await token.approve(game.address,"20000000000000000000000000");

    tokenId = await game.createIngredientNFT(caller.address, 0, "initialURI", "0x" ,2);
    console.log("fix sale tokenid: ");
    console.log(tokenId.value);

    currID= await erc1155.totalIDs();
    console.log(currID)
    totalSupply= await erc1155.totalSupply(currID);
    console.log(totalSupply)
    await sleep(4000);


    await game.fixSale2NFT(currID, ["10","20000000000000000000"]);

    await sleep(4000);

    console.log("buy from sale");

    await game.buyIngredient2NFT(currID, 1);

    // balanceOf = await token.balanceOf(caller.address,1);
    // console.log("Token balance", balanceOf.toString());

    // await game.transferOwnership("");

}

main().then(()=>process.exit(0))
.catch(err=>{  
    console.error(err);
    process.exit(1);
})