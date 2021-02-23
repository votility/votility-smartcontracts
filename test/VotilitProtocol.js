const VotilityProtocol = artifacts.require('VotilityProtocol');
const SimpleToken = artifacts.require('SimpleToken');
const VotilityReceiverSample = artifacts.require('VotilityReceiverSample');

const decimals = '000000000000000000';
const supply = 1000000;

contract('VotilityProtocol > Should create proposals and check metadata', accounts => {
  it('should create proposals for different owners', async () => {
    let instance = await VotilityProtocol.deployed();
    const simpleToken = await SimpleToken.deployed();
    const receiver = await VotilityReceiverSample.deployed();

    const currentBlocNumber = await web3.eth.getBlockNumber();

    await instance.addProposal(
      [
        '0x000000000000000000000000eee28d484628d41a82d01e21d12e2e78d69920da',
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      ],
      'QmfZKFyDJEcTRJsHfEBq28rgnkvmwfu8Yk2GW5d74JFcBU',
      simpleToken.address,
      receiver.address,
      currentBlocNumber + 5,
      [
        '0x' + web3.utils.padLeft(new web3.utils.BN(1).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(2).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(3).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(4).toString(16), 64),
      ],
      true,
      0,
      1
      , { from: accounts[0] });

    await instance.addProposal(
      [
        '0x000000000000000000000000eee28d484628d41a82d01e21d12e2e78d69920da',
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      ],
      'QmfZKFyDJEcTRJsHfEBq28rgnkvmwfu8Yk2GW5d74JFcBU',
      simpleToken.address,
      receiver.address,
      currentBlocNumber + 5,
      [
        '0x' + web3.utils.padLeft(new web3.utils.BN(1).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(2).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(3).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(4).toString(16), 64),
      ],
      true,
      0,
      1
      , { from: accounts[1] });
    
    await instance.addProposal(
      [
        '0x000000000000000000000000eee28d484628d41a82d01e21d12e2e78d69920da',
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      ],
      'QmfZKFyDJEcTRJsHfEBq28rgnkvmwfu8Yk2GW5d74JFcBU',
      simpleToken.address,
      receiver.address,
      currentBlocNumber + 5,
      [
        '0x' + web3.utils.padLeft(new web3.utils.BN(1).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(2).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(3).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(4).toString(16), 64),
      ],
      true,
      0,
      1
    , {from: accounts[1]});

    const proposalsCount = await instance.getProposalsCount();
    const proposalsCountByERC20 = await instance.getProposalsCountByERC20(simpleToken.address);
    const proposalsCountByOwner1 = await instance.getProposalsCountByOwner(accounts[0]);
    const proposalsCountByOwner2 = await instance.getProposalsCountByOwner(accounts[1]);

    expect(proposalsCount.toNumber()).to.be.equal(3, 'fail to check proposalsCount');
    expect(proposalsCountByERC20.toNumber()).to.be.equal(3, 'fail to check proposalsCountByERC20');
    expect(proposalsCountByOwner1.toNumber()).to.be.equal(1, 'fail to check proposalsCountByOwner1');
    expect(proposalsCountByOwner2.toNumber()).to.be.equal(2, 'fail to check proposalsCountByOwner2');

    const proposalId = await instance.getProposalIdByOwner(accounts[0], proposalsCountByOwner1 - 1);
    const proposal = await instance.getProposal(proposalId);

    expect(proposal.id.toNumber()).to.be.equal(0, 'fail to check proposal.id');
    expect(proposal.ipfsData).to.be.equal('QmfZKFyDJEcTRJsHfEBq28rgnkvmwfu8Yk2GW5d74JFcBU', 'fail to check proposal.ipfsData');
    expect(proposal.erc20VotingPower).to.be.equal(simpleToken.address, 'fail to check proposal.erc20VotingPower');
    expect(proposal.targetContract).to.be.equal(receiver.address, 'fail to check proposal.targetContract');
    expect(proposal.blockLimit.toNumber()).to.be.equal(currentBlocNumber + 5, 'fail to check proposal.blockLimit');
    expect(proposal.options.length).to.be.equal(4, 'fail to check proposal.options.length');
    expect(web3.utils.hexToNumber(proposal.options[0])).to.be.equal(1, 'fail to check proposal.options[0]');
    expect(web3.utils.hexToNumber(proposal.options[1])).to.be.equal(2, 'fail to check proposal.options[1]');
    expect(web3.utils.hexToNumber(proposal.options[2])).to.be.equal(3, 'fail to check proposal.options[2]');
    expect(web3.utils.hexToNumber(proposal.options[3])).to.be.equal(4, 'fail to check proposal.options[3]');
    expect(proposal.onChain).to.be.equal(true, 'fail to check proposal.onChain');
    expect(proposal.snapshotId.toNumber()).to.be.equal(0, 'fail to check proposal.snapshotId');
    expect(proposal.minimumQuorum.toNumber()).to.be.equal(1, 'fail to check proposal.minimumQuorum');
  });

  it('should create a proposals and vote', async () => {
    const instance = await VotilityProtocol.deployed();
    const simpleToken = await SimpleToken.deployed();
    const receiver = await VotilityReceiverSample.deployed();

    simpleToken.snapshot();

    const currentBlocNumber = await web3.eth.getBlockNumber();

    await instance.addProposal(
      [
        '0x000000000000000000000000eee28d484628d41a82d01e21d12e2e78d69920da',
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      ],
      'QmfZKFyDJEcTRJsHfEBq28rgnkvmwfu8Yk2GW5d74JFcBU',
      simpleToken.address,
      receiver.address,
      currentBlocNumber + 5,
      [
        '0x' + web3.utils.padLeft(new web3.utils.BN(1).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(2).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(3).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(4).toString(16), 64),
      ],
      true,
      1,
      1
      , { from: accounts[0] });
    
    await instance.vote(3, '0x' + web3.utils.padLeft(new web3.utils.BN(2).toString(16), 64));

    const voteCount = await instance.getVoteCount(3);
    const vote = await instance.getVote(3, accounts[0]);

    expect(voteCount.toNumber()).to.be.equal(1, 'fail to check voteCount');
    expect(vote.hasVoted).to.be.equal(true, 'fail to check vote.hasVoted');
    expect(vote.optionIndex.toNumber()).to.be.equal(1, 'fail to check vote.option');
    expect(vote.weight.toString()).to.be.equal('1000000000000000000000000', 'fail to check vote.weight');
  });
});

contract('VotilityProtocol > Voting using different balances', accounts => {
  it('should send tokens to accounts', async () => {
    let simpleToken = await SimpleToken.deployed();

    const toAccount1 = 1000;
    const toAccount2 = 2500;
    const toAccount3 = 1000;
    const toAccount4 = 9800;
    const remainingBalance = supply - toAccount1 - toAccount2 - toAccount3 - toAccount4;

    const transferToAccount1 = `${toAccount1}${decimals}`;
    const transferToAccount2 = `${toAccount2}${decimals}`;
    const transferToAccount3 = `${toAccount3}${decimals}`;
    const transferToAccount4 = `${toAccount4}${decimals}`;

    await simpleToken.transfer(accounts[1], transferToAccount1);
    await simpleToken.transfer(accounts[2], transferToAccount2);
    await simpleToken.transfer(accounts[3], transferToAccount3);
    await simpleToken.transfer(accounts[4], transferToAccount4);

    expect((await simpleToken.balanceOf(accounts[0])).toString()).to.be.equal(`${remainingBalance}${decimals}`, 'fail to check remainingBalance');
    expect((await simpleToken.balanceOf(accounts[1])).toString()).to.be.equal(transferToAccount1, 'fail to check #1 balance');
    expect((await simpleToken.balanceOf(accounts[2])).toString()).to.be.equal(transferToAccount2, 'fail to check #2 balance');
    expect((await simpleToken.balanceOf(accounts[3])).toString()).to.be.equal(transferToAccount3, 'fail to check #3 balance');
    expect((await simpleToken.balanceOf(accounts[4])).toString()).to.be.equal(transferToAccount4, 'fail to check #4 balance');
  });

  it('should create a new proposal', async () => {
    const instance = await VotilityProtocol.deployed();
    const simpleToken = await SimpleToken.deployed();
    const receiver = await VotilityReceiverSample.deployed();

    const currentBlocNumber = await web3.eth.getBlockNumber();

    simpleToken.snapshot();
    
    await instance.addProposal(
      [
        '0x000000000000000000000000eee28d484628d41a82d01e21d12e2e78d69920da',
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      ],
      'QmfZKFyDJEcTRJsHfEBq28rgnkvmwfu8Yk2GW5d74JFcBU',
      simpleToken.address,
      receiver.address,
      currentBlocNumber + 6,
      [
        '0x' + web3.utils.padLeft(new web3.utils.BN(10).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(20).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(30).toString(16), 64),
        '0x' + web3.utils.padLeft(new web3.utils.BN(40).toString(16), 64),
      ],
      true,
      1,
      1
      , { from: accounts[0] });
  });

  it('each account should vote and compute weight', async () => {
    const instance = await VotilityProtocol.deployed();

    await instance.vote(0, '0x' + web3.utils.padLeft(new web3.utils.BN(20).toString(16), 64), { from: accounts[1] });
    await instance.vote(0, '0x' + web3.utils.padLeft(new web3.utils.BN(20).toString(16), 64), { from: accounts[2] });
    await instance.vote(0, '0x' + web3.utils.padLeft(new web3.utils.BN(10).toString(16), 64), { from: accounts[3] });
    await instance.vote(0, '0x' + web3.utils.padLeft(new web3.utils.BN(40).toString(16), 64), { from: accounts[4] });
    
    const votesWeight0 = await instance.getVotesWeight(0, 0);
    const votesWeight1 = await instance.getVotesWeight(0, 1);
    const votesWeight2 = await instance.getVotesWeight(0, 2);
    const votesWeight3 = await instance.getVotesWeight(0, 3);

    expect(votesWeight0.toString()).to.be.equal('1000000000000000000000', 'fail to check votesWeight0');
    expect(votesWeight1.toString()).to.be.equal('3500000000000000000000', 'fail to check votesWeight1');
    expect(votesWeight2.toString()).to.be.equal('0', 'fail to check votesWeight2');
    expect(votesWeight3.toString()).to.be.equal('9800000000000000000000', 'fail to check votesWeight3');
  });

  it('should fail to vote in a invalid proposal', async () => {
    const instance = await VotilityProtocol.deployed();

    try {
      await instance.vote(1, '0x' + web3.utils.padLeft(new web3.utils.BN(20).toString(16), 64), { from: accounts[1] });
      throw {};
    } catch (e) {
      expect(e.reason).to.be.equal('INVALID_PROPOSAL');
    }
  });

  it('should fail to vote again', async () => {
    const instance = await VotilityProtocol.deployed();

    try {
      await instance.vote(0, '0x' + web3.utils.padLeft(new web3.utils.BN(20).toString(16), 64), { from: accounts[1] });
      throw {};
    } catch (e) {
      expect(e.reason).to.be.equal('HAS_VOTED');
    }
  });

  contract('VotilityProtocol > Finishing a proposal', accounts => {
    it('should create a new proposal, vote and finish it', async () => {
      const instance = await VotilityProtocol.deployed();
      const simpleToken = await SimpleToken.deployed();
      const receiver = await VotilityReceiverSample.deployed();

      await simpleToken.snapshot();

      const currentBlocNumber = await web3.eth.getBlockNumber();
      
      await instance.addProposal(
        [
          '0x000000000000000000000000eee28d484628d41a82d01e21d12e2e78d69920da',
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        ],
        'QmfZKFyDJEcTRJsHfEBq28rgnkvmwfu8Yk2GW5d74JFcBU',
        simpleToken.address,
        receiver.address,
        currentBlocNumber + 5,
        [
          '0x' + web3.utils.padLeft(new web3.utils.BN(10).toString(16), 64),
          '0x' + web3.utils.padLeft(new web3.utils.BN(20).toString(16), 64),
          '0x' + web3.utils.padLeft(new web3.utils.BN(30).toString(16), 64),
          '0x' + web3.utils.padLeft(new web3.utils.BN(40).toString(16), 64),
        ],
        true,
        1,
        1
        , { from: accounts[0] });
  
      await instance.vote(0, '0x' + web3.utils.padLeft(new web3.utils.BN(20).toString(16), 64));

      const winner = await instance.getWinnerOption(0);

      expect(winner.optionIndex.toNumber()).to.be.equal(1);
      expect(web3.utils.hexToNumber(winner.optionValue)).to.be.equal(20);

      //making this transfer to create a new block allowing to finish the proposal
      await simpleToken.transfer(accounts[1], 1);

      await instance.vote(0, '0x' + web3.utils.padLeft(new web3.utils.BN(30).toString(16), 64), { from: accounts[1] });

      await instance.finish(0);

      const proposalId = await receiver.getProposalId();

      expect(proposalId.toNumber()).to.be.equal(0);
    });
  });
});
