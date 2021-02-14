// uncomment time check in auctions contract in Game Contract

async function main(){

    const initialURI = 'https://token-cdn-domain/{id}.json';

    const [deployer]=await ethers.getSigners();
    console.log('deploy by acct: '+deployer.address);
    
    const bal=await deployer.getBalance();
    console.log('bal: '+bal);
        
    ERC20RG=await ethers.getContractFactory('ERC20RG');
    erc20 = await ERC20RG.deploy("RelatableGames GOV Token", "RG");
    console.log(`governance token address: ${erc20.address}`);



    ERC1155Token=await ethers.getContractFactory('ERC1155RG');
    erc1155 = await ERC1155Token.deploy(initialURI,deployer.address);
    console.log(`erc1155 token address: ${erc1155.address}`);



    Game=await ethers.getContractFactory('ERC1155Game');
    game = await Game.deploy();
    console.log(`game contract address: ${game.address}`);
    beneficiary=deployer.address;

    //_tokenAddress, address _beneficiary, address USDCToken
    await game.initialize(erc1155.address, beneficiary, "0xdA5289fCAAF71d52a80A254da614a192b693e977");
    


    Staking=await ethers.getContractFactory('StakingRewards');
    //_owner,
    // address _rewardsDistribution,
    // address _rewardsToken,
    // address _stakingToken,
    // address gameContract
    staking = await Staking.deploy(deployer.address,deployer.address,erc20.address, erc1155.address, game.address);
    console.log(`staking contract address: ${staking.address}`);
    
    // set contract on erc1155 token as game contract
    await erc1155.setContract(game.address);

    // changing to 1 week 
    await staking.setRewardsDuration(604800);

    
}

main().then(()=>process.exit(0))
.catch(err=>{  
    console.error(err);
    process.exit(1);
})