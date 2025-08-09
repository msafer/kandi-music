const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployStack } = require("./helpers/deploy");

describe("MintRouter price floor", () => {
  it("rejects song release with price below 0.40 GHO", async () => {
    const { router, nft, ktoken, vault } = await deployStack();
    await expect(
      router.addSongRelease(
        "TestSong",
        await nft.getAddress(),
        await ktoken.getAddress(),
        await vault.getAddress(),
        ethers.parseEther("0.39"),
        10
      )
    ).to.be.revertedWith("Mint price below minimum");
  });

  it("accepts song release with price >= 0.40 GHO and enforces setMintPrice >= 0.40", async () => {
    const { router, nft, ktoken, vault } = await deployStack();
    await router.addSongRelease(
      "TestSong",
      await nft.getAddress(),
      await ktoken.getAddress(),
      await vault.getAddress(),
      ethers.parseEther("0.40"),
      10
    );
    await expect(router.setMintPrice("TestSong", ethers.parseEther("0.39"))).to.be.revertedWith(
      "Mint price below minimum"
    );
  });
});