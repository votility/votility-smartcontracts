// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "../IVotilityReceiver.sol";

contract DAOTreasury is IVotilityReceiver {
    receive() external payable {}

    function onProposalFinished(
        address sender,
        uint256 proposalId,
        bytes32[] calldata data,
        uint256 winnerOptionIndex,
        bytes32 winnerOptionData
    ) external override returns (bool) {
        uint256 amount = uint256(data[0]);
        address payable target = address(uint160(uint256(data[1])));

        if (winnerOptionIndex == 0) {
            target.transfer(amount);
        }

        return true;
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
