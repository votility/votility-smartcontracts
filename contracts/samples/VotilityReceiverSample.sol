// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "../IVotilityReceiver.sol";

contract VotilityReceiverSample is IVotilityReceiver {
    uint256 id;

    function onProposalFinished(
        address sender,
        uint256 proposalId,
        bytes32[] calldata data,
        uint256 winnerOptionIndex,
        bytes32 winnerOptionData
    ) external override returns (bool) {
        id = proposalId;
    }

    function getProposalId() public view returns (uint256) {
        return id;
    }

    function checkProposer(address proposer)
        external
        pure
        override
        returns (bool)
    {
        return true;
    }

    function checkERC20VotingPower(address erc20VotingPower)
        external
        pure
        override
        returns (bool)
    {
        return true;
    }

    function getMininimumQuorum() external pure override returns (uint256) {
        return 0;
    }

    function getMinimumBlockLimitInterval()
        external
        pure
        override
        returns (uint8)
    {
        return 0;
    }
}
