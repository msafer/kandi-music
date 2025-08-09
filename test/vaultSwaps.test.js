const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployStack } = require("./helpers/deploy");

describe("Vault swaps", () => {
  it("swaps NFT to tokens and tokens to NFT with inventory checks", async () => {
    const { deployer, user, nft, ktoken, vault } = await deployStack();

    await nft.mint(await deployer.getAddress(), 5);

    await nft.setApprovalForAll(await vault.getAddress(), true);
    await ktoken.approve(await vault.getAddress(), ethers.parseUnits("1000000", 18));

    // Preload vault with 2 NFTs and matching tokens
    await vault.preloadVault([1,2], 20000n * 10n ** 18n);

    // User swaps tokens -> NFT (1 NFT)
    await ktoken.transfer(await user.getAddress(), 10000n * 10n ** 18n);
    await ktoken.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);
    await expect(vault.connect(user).depositTokens(10000n * 10n ** 18n)).to.emit(vault, "TokensDepositedToVault");

    // Now vault has 1 NFT left; user deposits an owned NFT -> tokens
    await nft.safeTransferFrom(await deployer.getAddress(), await user.getAddress(), 3);
    await nft.connect(user).setApprovalForAll(await vault.getAddress(), true);
    await expect(vault.connect(user).depositNFT(3)).to.emit(vault, "NFTDepositedToVault");
  });

  it("disables token->NFT when no NFTs in vault", async () => {
    const { user, vault, ktoken } = await deployStack();
    await ktoken.transfer(await user.getAddress(), 10000n * 10n ** 18n);
    await ktoken.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);

    await expect(vault.connect(user).depositTokens(10000n * 10n ** 18n)).to.be.revertedWith("No NFTs available in vault");
  });
});