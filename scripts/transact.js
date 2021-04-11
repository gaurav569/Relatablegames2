
async function main(){

    const [caller]=await ethers.getSigners();
    console.log('caller acct: '+caller.address);
    
    // const tokenAddress="0x3C128346A6B03060B179fc417afE0ED0ff4865D4";
    // Token=await ethers.getContractFactory('ERC1155RG');
    // const token = await Token.attach(tokenAddress);
    // owner = await token.owner();
    // console.log("Owner is", owner.toString());
    // await token.mint(caller.address,1,5,'0x');

    Game=await ethers.getContractFactory('ERC1155Game');

    const game = await Game.attach("0xb1aa8A251e61085796ED2FFDC8421Fe62212ff39");

    await game.transferOwnership("0x57Ac4E60a3fDaDec7e6b51b28488B392447801F4");

    // balanceOf = await token.balanceOf(caller.address,1);
    // console.log("Token balance", balanceOf.toString());


}

main().then(()=>process.exit(0))
.catch(err=>{  
    console.error(err);
    process.exit(1);
})