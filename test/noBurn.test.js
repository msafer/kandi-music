const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("No-burn negative tests", () => {
  it("ERC222Token exposes no burn function", async () => {
    const Token = await ethers.getContractFactory("ERC222Token");
    const [owner] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("ERC222NFT");
    const nft = await NFT.deploy("N","N","N",1,"ipfs://", await owner.getAddress(), 500);
    await nft.waitForDeployment();
    const token = await Token.deploy("T","T","N", 1000n, await nft.getAddress());
    await token.waitForDeployment();
    expect(typeof token.burn).to.equal("undefined");
  });

  it("ERC222NFT exposes no burn function", async () => {
    const [owner] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("ERC222NFT");
    const nft = await NFT.deploy("N","N","N",10,"ipfs://", await owner.getAddress(), 500);
    await nft.waitForDeployment();
    expect(typeof nft.burn).to.equal("undefined");
  });
});