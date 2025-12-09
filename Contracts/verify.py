#!/usr/bin/env python3
"""
Verify ColorDropPool contract on Blockscout using their verification API
"""

import json
import os
import sys
import requests
from pathlib import Path

def read_flattened_source():
    """Read the flattened contract source"""
    flattened_path = Path(__file__).parent / "flattened.sol"
    if not flattened_path.exists():
        print("❌ flattened.sol not found. Run: npm run flatten")
        sys.exit(1)

    with open(flattened_path, 'r') as f:
        return f.read()

def verify_contract(network, contract_address, source_code, constructor_args, api_key):
    """Submit contract verification to Blockscout"""

    if network == "sepolia":
        api_url = "https://celo-sepolia.blockscout.com/api/v2/smart-contracts/{}/verification/via/flattened-code".format(contract_address)
    elif network == "celo":
        api_url = "https://celo.blockscout.com/api/v2/smart-contracts/{}/verification/via/flattened-code".format(contract_address)
    else:
        print(f"❌ Unsupported network: {network}")
        sys.exit(1)

    print(f"\n🔍 Verifying on {network}")
    print(f"   API: {api_url}")
    print(f"   Contract: {contract_address}")

    # Blockscout API v2 verification payload
    payload = {
        "compiler": "v0.8.22+commit.4fc1097e",
        "sourceCode": source_code,
        "contractName": "ColorDropPool",
        "constructorArgs": constructor_args,
        "optimizationUsed": True,
        "runs": 200,
        "evmVersion": "default",
        "libraries": {}
    }

    headers = {
        "Content-Type": "application/json"
    }

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        response = requests.post(
            api_url,
            json=payload,
            headers=headers,
            timeout=60
        )

        result = response.text

        if response.status_code == 200:
            # Parse the response
            if "successfully" in result.lower() or "verified" in result.lower():
                print(f"✅ Verification successful!")
                print(f"   Response: {result[:200]}")
                return True
            else:
                print(f"⚠️  Verification submitted")
                print(f"   Response: {result[:500]}")
                return True
        else:
            print(f"❌ Verification failed")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {result[:500]}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 verify.py [sepolia|celo]")
        sys.exit(1)

    network = sys.argv[1]

    # Load environment variables
    admin = os.getenv("ADMIN_ADDRESS")
    upgrader = os.getenv("UPGRADER_ADDRESS")
    treasury1 = os.getenv("TREASURY_ADDRESS_1")
    treasury2 = os.getenv("TREASURY_ADDRESS_2")
    verifier = os.getenv("VERIFIER_ADDRESS")
    api_key = os.getenv("BLOCKSCOUT_API_KEY")

    if network == "sepolia":
        contract_address = os.getenv("SEPOLIA_IMPLEMENTATION_ADDRESS")
    else:
        contract_address = os.getenv("IMPLEMENTATION_ADDRESS")

    if not all([admin, upgrader, treasury1, treasury2, verifier, contract_address]):
        print("❌ Missing environment variables")
        sys.exit(1)

    print("\n📋 Configuration:")
    print(f"   Admin: {admin}")
    print(f"   Upgrader: {upgrader}")
    print(f"   Treasury 1: {treasury1}")
    print(f"   Treasury 2: {treasury2}")
    print(f"   Verifier: {verifier}")

    # Constructor arguments (ABI-encoded, without 0x prefix)
    constructor_args = (
        "000000000000000000000000" + admin[2:].lower() +
        "000000000000000000000000" + upgrader[2:].lower() +
        "000000000000000000000000" + treasury1[2:].lower() +
        "000000000000000000000000" + treasury2[2:].lower() +
        "000000000000000000000000" + verifier[2:].lower()
    )

    print(f"\n🔧 Constructor Args:")
    print(f"   {constructor_args}")

    # Read source code
    source_code = read_flattened_source()
    print(f"\n📄 Source loaded: {len(source_code)} characters")

    # Verify
    success = verify_contract(network, contract_address, source_code, constructor_args, api_key)

    if success:
        print(f"\n✅ Verification complete!")
        if network == "sepolia":
            print(f"   🔗 https://celo-sepolia.blockscout.com/address/{contract_address}")
        else:
            print(f"   🔗 https://celo.blockscout.com/address/{contract_address}")
    else:
        print(f"\n❌ Verification failed")
        print(f"\n💡 Try manual verification:")
        print(f"   1. Go to the contract page")
        print(f"   2. Click 'Verify & Publish'")
        print(f"   3. Use the constructor args above")
        sys.exit(1)

if __name__ == "__main__":
    main()
