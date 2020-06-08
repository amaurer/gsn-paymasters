import {
    createHashcashAsyncApproval, calculateHashcashApproval, calculateHashcash
} from "../src/HashCashApproval"
import {HashcashPaymasterInstance, SampleRecipientInstance} from "../types/truffle-contracts";
import {GSNConfig} from "@opengsn/gsn";
import RelayRequest from "@opengsn/gsn/dist/src/common/EIP712/RelayRequest";

const {RelayProvider} = require("@opengsn/gsn")
const GsnTestEnvironment = require('@opengsn/gsn/dist/GsnTestEnvironment').default
const {expectRevert} = require('@openzeppelin/test-helpers')
// import {SampleRecipientInstance} from "../types/truffle-contracts";

require('source-map-support').install({errorFormatterForce: true})

const HashcashPaymaster = artifacts.require('HashcashPaymaster')
const SampleRecipient = artifacts.require('SampleRecipient')

// const relayHubAddress = require('../build/gsn/RelayHub').address
// const forwarderAddress = require('../build/gsn/Forwarder').address
// const stakeManagerAddress = require('../build/gsn/StakeManager').address

contract('HashcashPaymaster', ([from]) => {

    let pm: HashcashPaymasterInstance
    let s: SampleRecipientInstance
    let gsnConfig: Partial<GSNConfig>

    before(async () => {
        const {
            deploymentResult: {
                relayHubAddress,
                stakeManagerAddress,
                forwarderAddress
            }
        } = await GsnTestEnvironment.startGsn('localhost')

        s = await SampleRecipient.new()
        await s.setForwarder(forwarderAddress)

        // console.log('env=', GsnTestEnvironment)
        // @ts-ignore
        pm = await HashcashPaymaster.new(10)
        await pm.setRelayHub(relayHubAddress)
        await web3.eth.sendTransaction({from, to: pm.address, value: 1e18})

        gsnConfig = {
            relayHubAddress,
            forwarderAddress,
            stakeManagerAddress,
            paymasterAddress: pm.address
        };
        const p = new RelayProvider(web3.currentProvider, gsnConfig)

    })

    it("should fail to send without approvalData", async () => {

        const p = new RelayProvider(web3.currentProvider, gsnConfig)
        // @ts-ignore
        SampleRecipient.web3.setProvider(p)
        await expectRevert(s.something(), 'no hash in approvalData')
    })

    it("should fail with no wrong hash", async () => {

        const p = new RelayProvider(web3.currentProvider, gsnConfig, {
            asyncApprovalData: async () => '0x'.padEnd(2 + 64 * 2, '0')
        })
        // @ts-ignore
        SampleRecipient.web3.setProvider(p)

        await expectRevert(s.something(), 'wrong hash')
    })

    it("should fail low difficulty", async () => {

        const p = new RelayProvider(web3.currentProvider, gsnConfig, {
            asyncApprovalData: createHashcashAsyncApproval(1)
        })
        // @ts-ignore
        SampleRecipient.web3.setProvider(p)

        return expectRevert(s.something(), 'difficulty not met')
    })

    it('should succeed with proper difficulty difficulty', async function () {
        this.timeout(35000)
        const p = new RelayProvider(web3.currentProvider, gsnConfig, {
            asyncApprovalData: createHashcashAsyncApproval(15)
        })
        // @ts-ignore
        SampleRecipient.web3.setProvider(p)

        await s.something()
        await s.something()
        await s.something()
    })

    it('calculateHashCash should call periodically a callback', async () => {
        let counter = 0

        async function cb() {
            counter++;
            return true
        }

        //15 bit difficulty 2^12 =~ 4096. avg counter 2000
        const hash = await calculateHashcash('0x'.padEnd(42, '1'), 1, 12, 1000, cb)
        assert.isAtLeast(counter, 3)
    })

    it('should calculate approval in advance', async () => {
        const approval = await calculateHashcashApproval(web3, from, s.address, gsnConfig.forwarderAddress ?? '', pm.address)
        console.log('approval=', approval)
        const p = new RelayProvider(web3.currentProvider, gsnConfig, {
            asyncApprovalData: async (req: RelayRequest) => {
                console.log('req=', req)
                return approval
            }
        })
        // @ts-ignore
        SampleRecipient.web3.setProvider(p)

        await s.something()
    })
    it("should refuse to reuse the same approvalData", async function () {
        this.timeout(35000)
        //read next valid hashash approval data, and always return it.
        const approvalfunc = createHashcashAsyncApproval(15)
        let saveret: string
        const p = new RelayProvider(web3.currentProvider, gsnConfig, {
            asyncApprovalData: async (request: RelayRequest) => {
                saveret = await approvalfunc(request)
                return saveret
            }
        })
        // @ts-ignore
        SampleRecipient.web3.setProvider(p)
        await s.something()

        const p1 = new RelayProvider(web3.currentProvider, gsnConfig, {
            asyncApprovalData: async (req: RelayRequest) => Promise.resolve(saveret)
        })
        // @ts-ignore
        SampleRecipient.web3.setProvider(p1)
        return expectRevert(s.something(), "wrong hash")
    })
})
