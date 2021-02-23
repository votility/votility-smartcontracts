const VotilityProtocol = artifacts.require("VotilityProtocol");

module.exports = function(deployer) {
  deployer.deploy(VotilityProtocol);
};
