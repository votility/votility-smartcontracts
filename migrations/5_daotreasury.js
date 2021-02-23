const DAOTreasury = artifacts.require("DAOTreasury");

module.exports = function(deployer) {
  deployer.deploy(DAOTreasury);
};
