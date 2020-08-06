var Token = artifacts.require("./Token.sol");
var TokenSale = artifacts.require("./TokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(Token, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(TokenSale, Token.address, tokenPrice);
  });
};
