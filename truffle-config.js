require('babel-register');
require('babel-polyfill');

/**
 * 3nterTh3Bl0ck Metamask
 * truffle develop
 * url: 'ws://127.0.0.1:9545'
 * truffle console + Ganache
 * url: 'ws://127.0.0.1:7545'
 */

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,// truffle develop
      // port: 7545,// Ganache 
      network_id: "*" // Match any network id 5777
    },
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      version: "0.8.4",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
