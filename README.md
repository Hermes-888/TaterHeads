# NFT minting dapp
Crypto Collectible NFT Tutorial with ERC-721 Tokens. 
Contract mints a Hashlips sample eye. 
App displays an NFT image for each token minted.

Based on: https://github.com/dappuniversity/nft

and https://github.com/HashLips?tab=repositories

## Dependencies
Install these prerequisites to build this dapp.

Node / NPM: https://nodejs.org<br/>
Truffle: https://github.com/trufflesuite/truffle<br/>
Ganache (optional): http://truffleframework.com/ganache/<br/>
Metamask: https://metamask.io/<br/>

## Step 1. Clone this project
```bash 
git clone https://github.com/dappuniversity/nft.git
```

## Step 2. Install dependencies
Open a bash terminal in the folder and install the dependencies.
```bash
npm install
```

https://react-bootstrap.github.io/getting-started/introduction/

https://react-bootstrap.github.io/components/alerts/

https://getbootstrap.com/docs/5.1/getting-started/download/#npm


## Step 3. Start a local test blockchain
```truffle develop```

OR :: 
Open the Ganache GUI client. 
This will start your local blockchain instance. 

Set truffle-config.js to the local development blockchain you have running.

```bash
networks: {
  development: {
    host: "127.0.0.1",
    port: 9545,// truffle develop
    // port: 7545,// Ganache 
    network_id: "*" // Match any network id 5777
  },
},
```

## Step 4. Compile & Deploy Smart Contract
```truffle migrate --reset``` Migrate the contract to deploy it to your local blockchain.

## Step 5. Configure Metamask
-Unlock Metamask <br/>
-Connect metamask to your local Etherum blockchain.<br/>
-Import an account provided by truffle or ganache.

## Step 6. Run the Front End Application
```
cd src
npm start
```
This Blockchain web-app is served on http://localhost:3000
