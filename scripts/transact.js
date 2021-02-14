
async function main(){

    const [caller]=await ethers.getSigners();
    console.log('caller acct: '+caller.address);
    
    const tokenAddress="0x3C128346A6B03060B179fc417afE0ED0ff4865D4";
    
    Token=await ethers.getContractFactory('ERC1155RG');

    const token = await Token.attach(tokenAddress);
    owner = await token.owner();
    console.log("Owner is", owner.toString());

    await token.mint(caller.address,1,5,'0x');

    // balanceOf = await token.balanceOf(caller.address,1);
    // console.log("Token balance", balanceOf.toString());


}

main().then(()=>process.exit(0))
.catch(err=>{  
    console.error(err);
    process.exit(1);
})