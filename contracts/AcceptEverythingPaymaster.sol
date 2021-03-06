//SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import "@opengsn/gsn/contracts/BasePaymaster.sol";

// accept everything.
// this paymaster accepts any request.
contract AcceptEverythingPaymaster is BasePaymaster {

    function versionPaymaster() external view override virtual returns (string memory){
        return "2.0.0-alpha.1+opengsn.accepteverything.ipaymaster";
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
    external
    override
    virtual
    returns (bytes memory context, bool revertOnRecipientRevert) {
        (relayRequest, signature, approvalData, maxPossibleGas);
        return ("", false);
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external override virtual {
        (context, success, gasUseWithoutPost, relayData);
    }

}
