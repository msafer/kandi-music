const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EIP-2981 royalties", () => {
  it("returns correct receiver and amount", async () => {
    const [owner, receiver] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("ERC222NFT");
    const nft = await NFT.deploy(
      "TestSong",
      "TEST",
      "TestSong",
      10,
      "ipfs://base/",
      await receiver.getAddress(),
      500
    );
    await nft.waitForDeployment();

    const salePrice = ethers.parseEther("1");
    const [rcv, amount] = await nft.royaltyInfo(1, salePrice);
    expect(rcv).to.equal(await receiver.getAddress());
    expect(amount).to.equal(salePrice * 500n / 10000n);
  });
});