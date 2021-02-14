// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "../math/Math.sol";
import "../math/SafeMath.sol";
import "../token/ERC20/IERC20.sol";
import "../utils/ReentrancyGuard.sol";

// Inheritance
import "./interfaces/IStakingRewards.sol";
import "./RewardsDistributionRecipient.sol";
import "./Pausable.sol";

import "../utils/Context.sol";
import "../RelatableGameContracts/IERC1155Game.sol";
import "../RelatableGameContracts/IERC1155RG.sol";
import "../token/ERC1155/ERC1155Holder.sol";

// https://docs.synthetix.io/contracts/source/contracts/stakingrewards
contract StakingRewards is IStakingRewards, RewardsDistributionRecipient, ReentrancyGuard, Pausable, Context, ERC1155Holder {
    using SafeMath for uint256;

    /* ========== STATE VARIABLES ========== */

    IERC20 public rewardsToken;
    IERC1155 public stakingToken;
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 60;// 1 weeks 
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // added mapping to hold balances of ERC1155 sent to contract
    // NFT owner -> TokenID -> Quantity
    mapping(address => mapping(uint256=>uint256)) private _tokenBalances;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    IERC1155Game ERC1155Game;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _owner,
        address _rewardsDistribution,
        address _rewardsToken,
        address _stakingToken,
        address gameContract)
         Owned(_owner) {
            rewardsToken = IERC20(_rewardsToken);
            stakingToken = IERC1155(_stakingToken);
            ERC1155Game = IERC1155Game(gameContract);
            rewardsDistribution = _rewardsDistribution;
        }

    /* ========== VIEWS ========== */

    function totalSupply() external override view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external override view returns (uint256) {
        return _balances[account];
    }

    function balanceOfNFT(address account, uint256 tokenId) external override view returns (uint256) {
        return _tokenBalances[account][tokenId];
    }


    function lastTimeRewardApplicable() public override view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public override view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable().sub(lastUpdateTime).mul(rewardRate).mul(1e18).div(_totalSupply)
            );
    }

    function earned(address account) public override view returns (uint256) {
        return _balances[account].mul(rewardPerToken().sub(userRewardPerTokenPaid[account])).div(1e18).add(rewards[account]);
    }

    function getRewardForDuration() external override view returns (uint256) {
        return rewardRate.mul(rewardsDuration);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 tokenId, uint256 quantity ) external override nonReentrant notPaused updateReward(_msgSender()) {
        
        uint8 tokenType=ERC1155Game.getTokenType(tokenId);
        uint256 amount;
    
        if(tokenType==1 || tokenType==2){
            
            amount=SafeMath.mul(1000,quantity);

        }else if(tokenType==3){

            uint256[] memory burnTokenIdRequired;
            uint256[] memory  burnTokenQtyRequired;
            (burnTokenIdRequired,burnTokenQtyRequired)  = ERC1155Game.getBurnTokensDish(tokenId);
            // no of ingredients
            uint256 ingredients=burnTokenIdRequired.length;

            // cube of no of ingredients
            uint256 cubeIngredients=SafeMath.mul(ingredients,SafeMath.mul(ingredients,ingredients));
            amount=SafeMath.add(1000,SafeMath.mul(cubeIngredients,quantity));

            //1000+x^3
        }

        require(amount > 0, "Cannot stake 0");

        _totalSupply = _totalSupply.add(amount);
        _balances[_msgSender()] = _balances[_msgSender()].add(amount);
                
        stakingToken.safeTransferFrom(_msgSender(), address(this), tokenId, quantity, "0x");
        _tokenBalances[_msgSender()][tokenId]=_tokenBalances[_msgSender()][tokenId].add(quantity);

        emit Staked(_msgSender(), tokenId, quantity, amount);
    }

    function withdraw(uint256 tokenId, uint256 quantity) public override nonReentrant updateReward(_msgSender()) {
        uint8 tokenType=ERC1155Game.getTokenType(tokenId);
        uint256 amount;
    
        if(tokenType==1 || tokenType==2){
            
            amount=SafeMath.mul(1000,quantity);

        }else if(tokenType==3){

        
            uint256[] memory burnTokenIdRequired;
            uint256[] memory  burnTokenQtyRequired;
            (burnTokenIdRequired,burnTokenQtyRequired)  = ERC1155Game.getBurnTokensDish(tokenId);
            // no of ingredients
            uint256 ingredients=burnTokenIdRequired.length;

            // cube of no of ingredients
            uint256 cubeIngredients=SafeMath.mul(ingredients,SafeMath.mul(ingredients,ingredients));
            amount=SafeMath.add(1000,SafeMath.mul(cubeIngredients,quantity));

        }

        require(amount > 0, "Cannot withdraw 0");
        _tokenBalances[_msgSender()][tokenId]=_tokenBalances[_msgSender()][tokenId].sub(quantity);

        _totalSupply = _totalSupply.sub(amount);
        _balances[_msgSender()] = _balances[_msgSender()].sub(amount);
        stakingToken.safeTransferFrom(address(this),_msgSender(), tokenId, quantity, "0x");
        emit Withdrawn(_msgSender(), tokenId, quantity, amount);
    }

    function getReward() public override nonReentrant updateReward(_msgSender()) {
        uint256 reward = rewards[_msgSender()];
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            rewardsToken.transfer(_msgSender(), reward);
            emit RewardPaid(_msgSender(), reward);
        }
    }

    function exit(uint256 tokenId) external override {
        withdraw(tokenId,_tokenBalances[_msgSender()][tokenId]);
        getReward();
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward) external override onlyRewardsDistribution updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(rewardsDuration);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint balance = rewardsToken.balanceOf(address(this));
        require(rewardRate <= balance.div(rewardsDuration), "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(rewardsDuration);
        emit RewardAdded(reward);
    }

    // End rewards emission earlier
    function updatePeriodFinish(uint timestamp) external onlyOwner updateReward(address(0)) {
        periodFinish = timestamp;
    }

    // Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {

        IERC20(tokenAddress).transfer(owner, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(
            block.timestamp > periodFinish,
            "Previous rewards period must be complete before changing the duration for the new period"
        );
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(rewardsDuration);
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 tokenId, uint256 quantity, uint256 valuation);
    event Withdrawn(address indexed user,  uint256 tokenId, uint256 quantity, uint256 valuation);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event Recovered(address token, uint256 amount);
}