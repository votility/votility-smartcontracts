// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Snapshot.sol";

import "./IVotilityReceiver.sol";

contract VotilityProtocol {
    struct Proposal {
        uint256 id;
        bytes32[] data;
        string ipfsData;
        address erc20VotingPower;
        address targetContract;
        address votingOwner;
        uint256 blockLimit;
        bytes32[] options;
        bool onChain;
        uint256 snapshotId;
        bool isFinished;
        uint256 minimumQuorum;
    }

    struct Vote {
        uint256 proposalId;
        address voter;
        uint256 optionIndex;
        bytes32 optionValue;
        uint256 weight;
        bool hasVoted;
    }

    Proposal[] private proposals;
    mapping(address => Proposal[]) private proposalsByERC20;
    mapping(address => Proposal[]) private proposalsByOwner;
    uint256[] private finishedProposals;

    mapping(address => mapping(uint256 => Vote)) private votesByAddress;
    mapping(uint256 => Vote[]) private votesByProposals;
    mapping(uint256 => mapping(uint256 => uint256)) private votesByOptions;
    uint256 private votes = 0;

    address private owner;

    uint256 private burntTokens = 0;

    event NewProposal(
        uint256 indexed proposalId,
        address indexed erc20VotingPower,
        address indexed owner
    );

    event ProposalFinished(
        uint256 indexed proposalId,
        address indexed finisher,
        uint256 winnerOptionIndex,
        bytes32 winnerOptionValue
    );

    event ProposalOwnerChanged(
        uint256 indexed proposalId,
        address indexed oldOwner,
        address indexed newOwner
    );
    event NewVote(
        address indexed voter,
        uint256 indexed proposalId,
        uint256 optionIndex,
        bytes32 optionValue,
        uint256 weight
    );

    constructor() {
        owner = msg.sender;
    }

    function verifySupply(address erc20VotingPower, uint256 minimumQuorum)
        private
        view
    {
        IERC20 token = IERC20(erc20VotingPower);
        require(token.totalSupply() >= minimumQuorum, "INVALID_MINIMUM_QUORUM");
    }

    function verityBlockLimit(address targetContract, uint256 blockLimit)
        private
        view
    {
        IVotilityReceiver target = IVotilityReceiver(targetContract);
        require(
            block.number + target.getMinimumBlockLimitInterval() <= blockLimit,
            "INVALID_BLOCK_LIMIT"
        );
    }

    function addProposal(
        bytes32[] calldata data,
        string calldata ipfsData,
        address erc20VotingPower,
        address targetContract,
        uint256 blockLimit,
        bytes32[] calldata options,
        bool onChain,
        uint256 snapshotId,
        uint256 minimumQuorum
    ) public {
        verifySupply(erc20VotingPower, minimumQuorum);
        verityBlockLimit(targetContract, blockLimit);

        Proposal memory proposal =
            Proposal(
                proposals.length,
                data,
                ipfsData,
                erc20VotingPower,
                targetContract,
                msg.sender,
                blockLimit,
                options,
                onChain,
                snapshotId,
                false,
                minimumQuorum
            );

        proposals.push(proposal);
        proposalsByERC20[erc20VotingPower].push(proposal);
        proposalsByOwner[msg.sender].push(proposal);

        emit NewProposal(proposal.id, proposal.erc20VotingPower, msg.sender);
    }

    function getProposalsCount() public view returns (uint256) {
        return proposals.length;
    }

    function getFinishedProposalId(uint256 index)
        public
        view
        returns (uint256)
    {
        return finishedProposals[index];
    }

    function getFinishedProposalsCount() public view returns (uint256) {
        return finishedProposals.length;
    }

    function getProposalsCountByERC20(address token)
        public
        view
        returns (uint256)
    {
        return proposalsByERC20[token].length;
    }

    function getProposalsCountByOwner(address o) public view returns (uint256) {
        return proposalsByOwner[o].length;
    }

    function getProposalIdByERC20(address token, uint256 index)
        public
        view
        returns (uint256)
    {
        return proposalsByERC20[token][index].id;
    }

    function getProposalIdByOwner(address ownerAddress, uint256 index)
        public
        view
        returns (uint256)
    {
        return proposalsByOwner[ownerAddress][index].id;
    }

    function getProposal(uint256 proposalId)
        public
        view
        returns (
            uint256 id,
            bytes32[] memory data,
            string memory ipfsData,
            address erc20VotingPower,
            address targetContract,
            address votingOwner,
            uint256 blockLimit,
            bytes32[] memory options,
            bool onChain,
            uint256 snapshotId,
            bool isFinished,
            uint256 minimumQuorum
        )
    {
        Proposal storage proposal = proposals[proposalId];

        return (
            proposal.id,
            proposal.data,
            proposal.ipfsData,
            proposal.erc20VotingPower,
            proposal.targetContract,
            proposal.votingOwner,
            proposal.blockLimit,
            proposal.options,
            proposal.onChain,
            proposal.snapshotId,
            proposal.isFinished,
            proposal.minimumQuorum
        );
    }

    function changeProposalOwner(uint256 proposalId, address newOwner) public {
        Proposal storage p = proposals[proposalId];
        address oldOwner = p.votingOwner;
        p.votingOwner = newOwner;

        emit ProposalOwnerChanged(proposalId, oldOwner, newOwner);
    }

    function _getOptionsIndex(uint256 proposalId, bytes32 option)
        private
        view
        returns (uint256, bool)
    {
        Proposal storage proposal = proposals[proposalId];

        for (uint256 i = 0; i < proposal.options.length; i++) {
            if (proposal.options[i] == option) {
                return (i, true);
            }
        }

        return (0, false);
    }

    function vote(uint256 proposalId, bytes32 option) public {
        require(proposalId < proposals.length, "INVALID_PROPOSAL");
        require(!votesByAddress[msg.sender][proposalId].hasVoted, "HAS_VOTED");
        require(proposals[proposalId].onChain, "OFF_CHAIN");
        require(
            block.number <= proposals[proposalId].blockLimit,
            "INVALID_BLOCK_LIMIT"
        );

        uint256 optionIndex = 0;
        bool found = false;

        (optionIndex, found) = _getOptionsIndex(proposalId, option);

        require(found, "OPTION_NOT_FOUND");

        uint256 weight = 0;
        Proposal storage proposal = proposals[proposalId];

        ERC20Snapshot token = ERC20Snapshot(proposal.erc20VotingPower);
        weight = token.balanceOfAt(msg.sender, proposal.snapshotId);

        Vote memory newVote =
            Vote(proposalId, msg.sender, optionIndex, option, weight, true);

        votesByAddress[msg.sender][proposalId] = newVote;
        votesByProposals[proposalId].push(newVote);
        votesByOptions[proposalId][optionIndex] += weight;

        votes++;

        emit NewVote(msg.sender, proposalId, optionIndex, option, weight);
    }

    function getVotesWeight(uint256 proposalId, uint256 option)
        public
        view
        returns (uint256)
    {
        Proposal storage proposal = proposals[proposalId];
        IERC20 token = IERC20(proposal.erc20VotingPower);
        ERC20Snapshot snapshotedToken =
            ERC20Snapshot(proposal.erc20VotingPower);

        uint256 weight = 0;

        for (uint256 i = 0; i < votesByProposals[proposalId].length; i++) {
            if (votesByProposals[proposalId][i].optionIndex == option) {
                weight += snapshotedToken.balanceOfAt(
                    votesByProposals[proposalId][i].voter,
                    proposal.snapshotId
                );
            }
        }

        return weight;
    }

    function getBurntTokens() public view returns (uint256) {
        return burntTokens;
    }

    function getVotes() public view returns (uint256) {
        return votes;
    }

    function getProposalWeight(uint256 proposalId)
        public
        view
        returns (uint256)
    {
        Proposal storage proposal = proposals[proposalId];
        IERC20 token = IERC20(proposal.erc20VotingPower);
        ERC20Snapshot snapshotedToken =
            ERC20Snapshot(proposal.erc20VotingPower);

        uint256 weight = 0;

        for (uint256 i = 0; i < votesByProposals[proposalId].length; i++) {
            weight += snapshotedToken.balanceOfAt(
                votesByProposals[proposalId][i].voter,
                proposal.snapshotId
            );
        }

        return weight;
    }

    function finish(uint256 proposalId) public {
        require(
            block.number >= proposals[proposalId].blockLimit,
            "INVALID_BLOCK_LIMIT"
        );

        (uint256 winnerOptionIndex, bytes32 winnerOptionData) =
            getWinnerOption(proposalId);

        proposals[proposalId].isFinished = true;
        finishedProposals.push(proposalId);

        if (proposals[proposalId].targetContract != address(0x0)) {
            IVotilityReceiver target =
                IVotilityReceiver(proposals[proposalId].targetContract);
            target.onProposalFinished(
                msg.sender,
                proposalId,
                proposals[proposalId].data,
                winnerOptionIndex,
                winnerOptionData
            );
        }

        ProposalFinished(
            proposalId,
            msg.sender,
            winnerOptionIndex,
            winnerOptionData
        );
    }

    function getWinnerOption(uint256 proposalId)
        public
        view
        returns (uint256 optionIndex, bytes32 optionValue)
    {
        Proposal storage proposal = proposals[proposalId];
        uint256 winnerOption = 0;
        bytes32 winnerOptionData = 0;
        uint256 winningVoteWeight = 0;

        for (uint256 i = 0; i < proposal.options.length; i++) {
            if (votesByOptions[proposalId][i] > winningVoteWeight) {
                winningVoteWeight = votesByOptions[proposalId][i];
                winnerOption = i;
                winnerOptionData = proposal.options[i];
            }
        }

        return (winnerOption, winnerOptionData);
    }

    function getOptionIndex(uint256 proposalId, bytes32 optionValue)
        public
        view
        returns (uint256)
    {
        uint256 optionIndex = 0;
        bool found = false;

        (optionIndex, found) = _getOptionsIndex(proposalId, optionValue);

        return optionIndex;
    }

    function getVote(uint256 proposalId, address voter)
        public
        view
        returns (
            uint256 optionIndex,
            bytes32 optionValue,
            uint256 weight,
            bool hasVoted
        )
    {
        Vote storage v = votesByAddress[voter][proposalId];

        return (v.optionIndex, v.optionValue, v.weight, v.hasVoted);
    }

    function getVoteCount(uint256 proposalId) public view returns (uint256) {
        return votesByProposals[proposalId].length;
    }

    function getBytes32() public view returns (bytes32 result) {
        return bytes32(uint256(address(this)) << 96);
    }

    function getAddress(bytes32 input) public pure returns (address result) {
        return address(uint160(uint256(input)));
    }

    function getInt(bytes32 input) public pure returns (uint256 result) {
        return uint256(input);
    }
}
