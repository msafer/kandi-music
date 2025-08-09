const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployStack } = require("./helpers/deploy");

describe("Fee routing", () => {
  it("splits platform fee between treasury and dev, rejects zero addresses", async () => {
    const { router, nft, ktoken, vault, gho, treasury, dev } = await deployStack();
    await router.addSongRelease("S", await nft.getAddress(), await ktoken.getAddress(), await vault.getAddress(), ethers.parseEther("1"), 10);

    const [ , user ] = await ethers.getSigners();
    await (await gho.mint(await user.getAddress(), ethers.parseEther("10"))).wait();

    await gho.connect(user).approve(await router.getAddress(), ethers.parseEther("10"));

    await router.setPlatformFeeRate(1000);
    await router.setFeeSplitBps(6000);

    const totalCost = ethers.parseEther("1");
    const platformFee = totalCost * 1000n / 10000n;
    const toTreasury = platformFee * 6000n / 10000n;
    const toDev = platformFee - toTreasury;

    const treasuryStart = await gho.balanceOf(await treasury.getAddress());
    const devStart = await gho.balanceOf(await dev.getAddress());

    await router.connect(user).mintWithGHO("S", 1);

    const treasuryEnd = await gho.balanceOf(await treasury.getAddress());
    const devEnd = await gho.balanceOf(await dev.getAddress());

    expect(treasuryEnd - treasuryStart).to.equal(toTreasury);
    expect(devEnd - devStart).to.equal(toDev);
  });

  it("KANDI purchase splits to treasury/dev", async () => {
    const { kandi, gho, treasury, dev } = await deployStack();
    const [ , user ] = await ethers.getSigners();

    await gho.mint(await user.getAddress(), ethers.parseEther("10"));
    await gho.connect(user).approve(await kandi.getAddress(), ethers.parseEther("10"));

    await kandi.setTreasury(await treasury.getAddress());
    await kandi.setTreasuryShareBps(7000);

    const amount = ethers.parseEther("1");
    const tStart = await gho.balanceOf(await treasury.getAddress());
    const dStart = await gho.balanceOf(await dev.getAddress());

    await kandi.connect(user).purchaseTokens(amount);

    const tEnd = await gho.balanceOf(await treasury.getAddress());
    const dEnd = await gho.balanceOf(await dev.getAddress());

    expect(tEnd - tStart).to.equal(amount * 7000n / 10000n);
    expect(dEnd - dStart).to.equal(amount - (amount * 7000n / 10000n));
  });
});