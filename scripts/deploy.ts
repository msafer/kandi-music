import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${await deployer.getAddress()}`);

  const GHO = await ethers.getContractFactory("MockERC20");
  const gho = await GHO.deploy("GHO", "GHO");
  await gho.waitForDeployment();

  const KANDI = await ethers.getContractFactory("KANDIToken");
  const kandi = await KANDI.deploy(await gho.getAddress(), await deployer.getAddress(), ethers.ZeroAddress, ethers.ZeroAddress);
  await kandi.waitForDeployment();

  const NFT = await ethers.getContractFactory("ERC222NFT");
  const nft = await NFT.deploy("PilotSong","PILOT","PilotSong", 10000000n, "ipfs://base/", await deployer.getAddress(), 500);
  await nft.waitForDeployment();

  const KToken = await ethers.getContractFactory("ERC222Token");
  const ktoken = await KToken.deploy("kPilotSong","KPILOT","PilotSong", 100000000000n * 10n ** 18n / 100n, await nft.getAddress());
  await ktoken.waitForDeployment();

  const Vault = await ethers.getContractFactory("ERC222Vault");
  const vault = await Vault.deploy(await nft.getAddress(), await ktoken.getAddress(), "PilotSong", await deployer.getAddress());
  await vault.waitForDeployment();

  const Router = await ethers.getContractFactory("MintRouter");
  const router = await Router.deploy(await gho.getAddress(), await kandi.getAddress(), await deployer.getAddress(), await deployer.getAddress(), 250);
  await router.waitForDeployment();

  // Save deployments
  const outDir = path.join(process.cwd(), "artifacts", "deployments");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${network.name}.json`);
  const addresses = {
    network: network.name,
    gho: await gho.getAddress(),
    kandi: await kandi.getAddress(),
    nft: await nft.getAddress(),
    ktoken: await ktoken.getAddress(),
    vault: await vault.getAddress(),
    router: await router.getAddress(),
  };
  writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`Saved deployments to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});