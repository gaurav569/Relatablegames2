// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;


// https://docs.synthetix.io/contracts/source/interfaces/istakingrewards
interface IStakingRewards {
    // Views
    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function earned(address account) external view returns (uint256);

    function getRewardForDuration() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);
    
    function balanceOfNFT(address account, uint256 tokenId) external returns (uint256);

    // Mutative

    function stake(uint256 tokenId, uint256 quantity) external;

    function withdraw(uint256 tokenId, uint256 quantity) external;

    function getReward() external;

    function exit(uint256 tokenId) external;
}