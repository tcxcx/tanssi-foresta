import { expect, describeSuite, beforeAll, ApiPromise } from "@moonwall/cli";
import { BN } from "@polkadot/util";
describeSuite({
  id: "ZTN",
  title: "Zombie Tanssi Test",
  foundationMethods: "zombie",
  testCases: function ({ it, context, log }) {
    let paraApi: ApiPromise;
    let relayApi: ApiPromise;
    let container2000Api: ApiPromise;
    let container2001Api: ApiPromise;

    beforeAll(async () => {
      
      paraApi = context.polkadotJs({ apiName: "Tanssi", type: "polkadotJs" });
      relayApi = context.polkadotJs({ apiName: "Relay", type: "polkadotJs" });
      container2000Api = context.polkadotJs({ apiName: "Container2000", type: "polkadotJs" });
      container2001Api = context.polkadotJs({ apiName: "Container2001", type: "polkadotJs" });

      const relayNetwork = relayApi.consts.system.version.specName.toString();
      expect(relayNetwork, "Relay API incorrect").to.contain("rococo");

      const paraNetwork = paraApi.consts.system.version.specName.toString();
      expect(paraNetwork, "Para API incorrect").to.contain("orchestrator-template-parachain");

      const container2000Network = container2000Api.consts.system.version.specName.toString();
      expect(container2000Network, "Container2000 API incorrect").to.contain("container-chain-template");

      const container2001Network = container2001Api.consts.system.version.specName.toString();
      expect(container2001Network, "Container2001 API incorrect").to.contain("container-chain-template");

    }, 120000);

    it({
      id: "T01",
      title: "Blocks are being produced on parachain",
      test: async function () {
        const blockNum = (await paraApi.rpc.chain.getBlock()).block.header.number.toNumber();
        expect(blockNum).to.be.greaterThan(0);
      },
    });

    it({
      id: "T02",
      title: "Blocks are being produced on container 2000",
      test: async function () {
        const blockNum = (await container2000Api.rpc.chain.getBlock()).block.header.number.toNumber();
        expect(blockNum).to.be.greaterThan(0);
      },
    });

    it({
      id: "T03",
      title: "Blocks are being produced on container 2001",
      test: async function () {
        const blockNum = (await container2001Api.rpc.chain.getBlock()).block.header.number.toNumber();
        expect(blockNum).to.be.greaterThan(0);
      },
    });
 
    it({
      id: "T04",
      title: "Test assignation is correct",
      test: async function () {
        const tanssiCollators = (await paraApi.query.collatorAssignment.collatorContainerChain()).orchestratorChain.map((v): string =>
        v.toString()
        );
        const authorities = (await paraApi.query.aura.authorities());

        let getKeyOwnersFromAuthorities = [];

        for (var authority of authorities) {
          const owner = (await paraApi.query.session.keyOwner([
            "aura",
             authority
          ]
          ));
          getKeyOwnersFromAuthorities.push(owner.toString());
        }

        for (let i = 0; i < tanssiCollators.length; i++) {
          expect(tanssiCollators[i]).to.be.equal(getKeyOwnersFromAuthorities[i]);
        }
      },
    });

    it({
      id: "T05",
      title: "Test container chain 2000 assignation is correct",
      test: async function () {
        let assignment = (await paraApi.query.collatorAssignment.collatorContainerChain());
        let paraId = (await container2000Api.query.parachainInfo.parachainId()).toString();

        let containerChainCollators = assignment.containerChains.toHuman()[paraId];

        let writtenCollators = (await container2000Api.query.authoritiesNoting.authorities()).toHuman();

        for (let i = 0; i < containerChainCollators.length; i++) {
          expect(containerChainCollators[i]).to.be.equal(writtenCollators[i]);
        }
      },
    });

    it({
      id: "T06",
      title: "Test container chain 2001 assignation is correct",
      test: async function () {
        let assignment = (await paraApi.query.collatorAssignment.collatorContainerChain());
        let paraId = (await container2001Api.query.parachainInfo.parachainId()).toString();

        let containerChainCollators = assignment.containerChains.toHuman()[paraId];

        let writtenCollators = (await container2001Api.query.authoritiesNoting.authorities()).toHuman();

        for (let i = 0; i < containerChainCollators.length; i++) {
          expect(containerChainCollators[i]).to.be.equal(writtenCollators[i]);
        }
      },
    });

    // Uncomment when waitBLock works
    /*it({
      id: "T07",
      title: "Test author noting is correct for both containers",
      test: async function () {
        let assignment = (await paraApi.query.collatorAssignment.collatorContainerChain());
        let paraId2000 = (await container2000Api.query.parachainInfo.parachainId());
        let paraId2001 = (await container2001Api.query.parachainInfo.parachainId());

        let containerChainCollators2000 = assignment.containerChains.toHuman()[paraId2000.toString()];
        let containerChainCollators2001 = assignment.containerChains.toHuman()[paraId2001.toString()];

        let author2000 = await paraApi.query.authorNoting.latestAuthor(paraId2000);

        context.waitBlock(3, "Tanssi")

        console.log("author", author2000.unwrap().toString())

        expect(containerChainCollators2000.includes(author2000.toString())).to.be.true;

        let author2001 = await paraApi.query.authorNoting.latestAuthor(paraId2001);
        expect(containerChainCollators2001.includes(author2001.toString())).to.be.true;
      },
    });*/

  },
});


function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}