const { ethers } = require("hardhat");

async function deployStack() {
  const [deployer, user, treasury, dev] = await ethers.getSigners();

  const GHO = await ethers.getContractFactory("MockERC20");
  const gho = await GHO.deploy("GHO", "GHO");
  await gho.waitForDeployment();

  const KANDI = await ethers.getContractFactory("KANDIToken");
  const kandi = await KANDI.deploy(await gho.getAddress(), await dev.getAddress(), ethers.ZeroAddress, ethers.ZeroAddress);
  await kandi.waitForDeployment();

  const NFT = await ethers.getContractFactory("ERC222NFT");
  const nft = await NFT.deploy(
    "TestSong",
    "TEST",
    "TestSong",
    100,
    "ipfs://base/",
    await deployer.getAddress(),
    500
  );
  await nft.waitForDeployment();

  const KToken = await ethers.getContractFactory("ERC222Token");
  const ktoken = await KToken.deploy("kTestSong","KTEST","TestSong", 1_000_000n * 10n ** 18n, await nft.getAddress());
  await ktoken.waitForDeployment();

  const Vault = await ethers.getContractFactory("ERC222Vault");
  const vault = await Vault.deploy(await nft.getAddress(), await ktoken.getAddress(), "TestSong", await deployer.getAddress());
  await vault.waitForDeployment();

  const Router = await ethers.getContractFactory("MintRouter");
  const router = await Router.deploy(await gho.getAddress(), await kandi.getAddress(), await dev.getAddress(), await treasury.getAddress(), 250);
  await router.waitForDeployment();

  return { deployer, user, treasury, dev, gho, kandi, nft, ktoken, vault, router };
}

module.exports = { deployStack };