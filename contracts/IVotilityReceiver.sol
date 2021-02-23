// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

interface IVotilityReceiver {
    function onProposalFinished(
        address sender,
        uint256 proposalId,
        bytes32[] calldata data,
        uint256 winnerOptionIndex,
        bytes32 winnerOptionData
    ) external returns (bool);

    function checkProposer(address proposer) external view returns (bool);

    function checkERC20VotingPower(address erc20VotingPower)
        external
        view
        returns (bool);

    function getMininimumQuorum() external view returns (uint256);

    function getMinimumBlockLimitInterval() external view returns (uint8);
}
