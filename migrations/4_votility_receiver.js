const VotilityProtocol = artifacts.require("VotilityProtocol");
const VotilityReceiverSample = artifacts.require("VotilityReceiverSample");

module.exports = async function (deployer) {
  let instance = await VotilityProtocol.deployed();
  await deployer.deploy(VotilityReceiverSample, instance.address);
};
