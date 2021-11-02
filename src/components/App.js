import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import TaterFaceNFT from '../abis/TaterFaceNFT.json';

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      contract: null,// to call methods & get events
      contractAddress: '',// gets paid
      contractOwner: '',// owner who deployed contract
      contractBalance: 0,
      tokenFee: 10000000000000000,// set from contract
      currentFee: 0.01,// wei, changable by owner
      baseURI: 'http://localhost:3000/_NFTimages/',
      // totalSupply: 10,// NA
      maxSupply: 10,// set from contract
      tokenName: '',// randomName
      tokenURI: '',// .json file path
      tokenId: 0,// faces[index]
      connectedAccount: '',// connected user
      connectedAccounts: [],// all connected users
      ownerBalance: 0,// # of tokens owned by connected
      faces: [],// Minted Faces Array of Objects
      lastNum: 0,// last randomNum()
      currentImage: '',// tokenURI
      jsonData: []// Array for .map, token metadata.json
    }
  }
  /*
    contract Face {
      string name;// user defined
      string tokenURI;// "https://ipfs.io/ipfs/IPFS_File_Hash"
      address tokenOwner;// purchaser
      uint256 id;// edition
      uint256 dna;
      uint8 rarity;
      uint8 level;
    }
  */
    // ToDo: use baseURI/_metadata.json to track sold tokens?
    // ToDo: withdraw()

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ connectedAccount: accounts[0] });
    this.setState({ connectedAccounts: accounts});

    const networkId = await web3.eth.net.getId();
    const networkData = TaterFaceNFT.networks[networkId];

    if (networkData) {
      const abi = TaterFaceNFT.abi;
      const address = networkData.address;
      const contract = new web3.eth.Contract(abi, address);
      this.setState({ contractAddress: address});
      this.setState({ contract });
      console.log('contract address:', address);// network.address

      const contractBalance = await contract.methods.contractBalance().call();
      this.setState({ contractBalance: web3.utils.fromWei(contractBalance, 'ether') });
      // const contractBalance = await web3.eth.getBalance(address);// 10000000000000000
      console.log('contractBalance:', contractBalance, this.state.contractBalance);
      // contractBalance: 18014298536113694000000000 18014298.536113694
      // const balance = await contract.methods.balanceOf(address).call();
      // console.log('BALANCE:', balance);// 0 tokens

      // By default, the owner account will be the one that deploys the contract. 
      // This can later be changed with transferOwnership(address newOwner).
      const owner = await contract.methods.owner().call();
      console.log('contractOwner:', owner);// contract owner address
      this.setState({contractOwner: owner});
      const ownerBalance = await contract.methods.balanceOf(owner).call();
      this.setState({ ownerBalance: ownerBalance});// # of tokens owned
      console.log('ownerBalance:', ownerBalance);

      console.log('connectedAccount:', this.state.connectedAccount);
      console.log('accounts:', accounts);// all connected users
      // const baseURI = await contract.methods.baseURI().call();
      // this.setState({ baseURI });

      // All Minted Faces
      const mintedFaces = await contract.methods.getFaces().call();
      console.log('Minted Faces:', mintedFaces);

      // faces owned by the connected account
      const ownedFaces = await contract.methods.getOwnerFaces(this.state.connectedAccount).call();
      console.log('Owned Faces:', ownedFaces);// connected account
      this.setState({faces: ownedFaces});
      if (ownedFaces.length > 0) {
        this.displayNFT(0);// on first load
      }

      const tokenFee = await contract.methods.fee().call();
      this.setState({tokenFee: tokenFee});
      const currentFee = web3.utils.fromWei(tokenFee, 'ether');
      console.log('tokenFee:', tokenFee, 'curentFee:', currentFee);
      this.setState({currentFee: currentFee});

      const maxSupply = await contract.methods.maxSupply().call();
      this.setState({ maxSupply: maxSupply });
      console.log('maxSupply:', maxSupply);

      // see data
      // console.log('web3.utils', web3);// web3.utils
      console.log('GasPrice:', await web3.eth.getGasPrice());
      console.log('networkId:', networkId);// 5777
      // console.log('networkData:', networkData);
      console.log('contract:', contract);
      // console.log('state:', this.state);
      
      /**
       * listen for contract FaceMinted event
       * FaceMinted(address owner, uint256 id, Face[] faces);
       * returnValues: owner, id, faces[]
       * https://web3js.readthedocs.io/en/v1.5.2/web3-eth-contract.html#contract-events
       */
      const comp = this;// App scope
      contract.events.FaceMinted({}, function(error, event) {
        // console.log('event owner:', event.returnValues.owner);
        console.log('FaceMinted: returnValues:', event.returnValues);

        // get this connectedAccount faces
        contract.methods.getOwnerFaces(event.returnValues.owner).call()
        .then(function(data) {
          console.log('ownedFaces data:', data);
          comp.setState({faces: data});
        }).catch(function(err) {
          console.log('error', err);
        });

        // get the tokenURI and load the json file
        contract.methods.getTokenUriById(event.returnValues.id).call()
        .then(function(url) {
          console.log('tokenURI:', url);// Ex: http://localhost:3000/_NFTimages/6.json
          let imagePath = url.substr(0, url.length-4) + 'png';
          comp.setState({currentImage: imagePath});// display the token image
          comp.fetchJsonData(url);// display the token metadata
          // ToDo: remove id from available to mint list
        }).catch(function(err) {
          console.log('error', err);
        });

        // ToDo: FIX & update contract balance
        // const contractBalance = await contract.methods.contractBalance().call();
        // this.setState({contractBalance: web3.utils.fromWei(contractBalance, 'ether')});
      })
      .on('connected', function(subscriptionId) {
        console.log('connected subscriptionId::', subscriptionId);
      })
      // .on('data', function(event) {
      //   console.log('data::', event);// same results as the callback above
      // })
      .on('changed', function(event) {
        console.log('changed::', event);// remove event from local database
      })
      .on('error', function(error, receipt) { 
        // If the transaction was rejected by the network, 
        // the second parameter will be the receipt.
        console.log('error::', error);
        // console.log('receipt::', receipt);
      });
      
    } else {
      window.alert('Smart contract not deployed to detected network.');
    }
  }
  
  // functions
  // Code sends a random name and tokenURI
  mint = () => {
    let name = this.randomName();// generate a token name
    let num = this.randomNum();// sets lastNum and large preview image
    let tokenURI = this.state.baseURI + num + '.json';
    this.setState({tokenName: name});// display token name
    this.setState({tokenURI: tokenURI});
    this.setState({tokenId: num});
    console.log('Minting:', name, num, tokenURI);

    this.state.contract.methods.createNewFace(name, tokenURI).send({
      from: this.state.connectedAccount,
      value: this.state.tokenFee
    })
    .once('receipt', (receipt) => {
      console.log('Minted receipt: from:', receipt.from);
      console.log('Minted receipt: to:', receipt.to);
      console.log('Minted receipt: gasUsed:', receipt.gasUsed);
      console.log('Minted receipt: receipt:', receipt);
      // comp.setState({faces: receipt.events.FaceMinted.returnValues.faces});
      // wait for FaceMinted event listener
    });
  }

  // generate a random name -Hashlips
  randomName = () => {
    const p1 = ["King of", "Duke of", "Knight of", "Master of", "Queen of", "Ace of"];
    const p2 = ["virtual", "space", "ocean", "desert", "mountain", "urban"];
    const p3 = ["citizens", "debris", "dwellings", "rocks", "junk piles", "history", "minions"];
    // as many as needed
    const format = [p1, p2, p3];

    let output = [];
    format.forEach((list) => {
      let word = list[Math.floor(Math.random() * list.length)];
      output.push(word);
    });

    let tokenName = output.join(" ");// Ex: Queen of virtual junk piles
    this.setState({tokenName: tokenName});// display token name
    return tokenName;
  }

  // pick a random number between 1 and max available
  randomNum = () => {
    let min = 1;// random range
    let max = this.state.maxSupply;// only 10 tokens
    let num = Math.round(Math.random() * (max - min) + min);

    if (num === this.state.lastNum) {
      this.randomNum();
    } else {
      this.setState({lastNum: num});
      return num;
    }
  }
  
  fetchJsonData = (path) => {
    let comp = this;// app scope
    fetch(path, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(function(result) {
      return result.json();
    }).then(function(data) {
      // adjust generated json metadata (for now)
      data.name = comp.state.tokenName;
      data.tokenURI = comp.state.tokenURI;
      data.image = comp.state.currentImage;
      comp.setState({jsonData: [data]});
      comp.setState({tokenId: data.edition});
      console.log('jsonData:', data);
    }).catch(
      function(err) {
        console.log('error', err);
      }
    );
  }

  getImagePath = (id) => {
    // replace tokenURI .json w/ .png
    let path = this.state.faces[parseInt(id)].tokenURI;// .json
    let imagePath = path.substr(0, path.length-4) + 'png';
    return imagePath;
  }

  displayNFT = (id) => {
    let imagePath = this.getImagePath(id);
    this.setState({currentImage: imagePath});
    //let path = this.state.faces[parseInt(id)].tokenURI;// .json
    let face = this.state.faces[parseInt(id)];
    this.setState({tokenId: id});
    this.setState({tokenName: face.name});
    this.setState({tokenURI: face.tokenURI});
    this.fetchJsonData(face.tokenURI);// path to metadata
    console.log('currentImage:', this.state.currentImage);
  }

  // https://web3js.readthedocs.io/en/v1.2.11/web3-utils.html
  // ToDo: FIX
  updateFee = (fee) => {
    let comp = this;
    let newFee = window.web3.utils.toWei(fee, 'ether');
    console.log('updateFee:', fee, newFee);// 0.22, 220000000000000000
    // fee throws Error: invalid BigNumber string (argument="value", value="0.22",
    this.state.contract.methods.setFee(newFee).call()
    .then(function(data) {
      // store Data in State Data Variable
      console.log('setFee::', data);// return t/f?
      comp.setState({ tokenFee: newFee });// 220000000000000000
      comp.setState({ currentFee: fee });//  0.22

      // confirm contract changed fee
      comp.state.contract.methods.fee().call()
      .then(function(data) {
        // store Data in State Data Variable for UI
        console.log('tokenFee::', data);
        // comp.setState({ currentFee: data });
      }).catch(function(err) {
          console.log('get error', err);
        }
      );

    }).catch(function(err) {
        console.log('error', err);
      }
    );
  }

  // html DOM elements
  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <div className="col-xs-12 col-md-4 text-left">
            <a className="navbar-brand ml-3"
              href="http://localhost:3000/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tater Face Tokens
            </a>
          </div>
          <div className="col-xs-12 col-md-8 mr-3 text-right">
            <ul className="navbar-nav px-3">
              <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
                <small className="text-white">
                  Contract: &nbsp;
                  <span id="contract">{this.state.contractAddress}</span>
                </small>
              </li>
            </ul>
          </div>
        </nav>

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-xs-3 ml-3 mr-3 d-flex text-center">
              Admin:
            </div>
            <div className="col-xs-3 mr-3 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h5>Update Fee</h5>
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const fee = this.fee.value;
                  this.updateFee(fee)
                }}>
                  <input type='text'
                    className='form-control mb-1'
                    placeholder='e.g. 1.11'
                    ref={(input) => { this.fee = input }}
                  />
                  <input type='submit'
                    className='btn btn-block btn-primary'
                    value='UPDATE FEE'
                  />
                </form>
              </div>
            </div>
            <div className="col-xs-6 text-left">
              <div>
                Current Fee: {this.state.currentFee}<br/>
                Max Supply: {this.state.maxSupply}<br/>
                Contract Bal: {this.state.contractBalance}<br/>
                Base URI: {this.state.baseURI}<br/>
              </div>
            </div>
          </div>
          <hr style={{borderWidth:"3px"}}/>

          <div className="row text-center">
            {this.state.faces.map((face, index) => {
              return(
                <div key={index} className="col-sm-3 col-md-2">
                  <div className="token-image" 
                    title={face.tokenURI}
                    style={{ backgroundImage:'url('+this.getImagePath(index)}}
                    onClick={() => {
                      // display the image and json of clicked thumbnail
                      this.displayNFT(index);
                    }}
                  >
                  </div>
                  <div>{face.name}</div>
                </div>
              )
            })}
          </div>
          <hr style={{borderWidth:"3px"}}/>

          <div className="row">
            <div className="col-sm-6 text-left">
              <div className="content mr-auto ml-auto">
                <input type='submit'
                  className='btn btn-block btn-primary'
                  value='MINT A TOKEN'
                  onClick={() => {
                    this.mint();
                  }}
                />
              </div>
              <hr/>
              <div>{
                this.state.jsonData ? this.state.jsonData.map(
                function(data) {
                  return (
                    <div key={9} className="card">
                      <div>Name: {data.name}</div>
                      <div>Edition: {data.edition}</div>
                      <div>DNA: {data.dna}</div>
                      <div>Image: {data.image}</div>
                      <div>Data: {data.tokenURI}</div>
                      <div>Compiler: {data.compiler}</div>
                      <div>Description: {data.description}</div>
                    </div>)
                  }
                ):""
              }</div>
              <hr/>
              <div>
                <input type='button'
                  className='btn btn-block btn-success'
                  value='Random Name'
                  onClick={() => {
                    this.randomName();
                  }}
                />
                <div>{this.state.tokenName}</div>
              </div>
            </div>
            <div className="col-sm-6 text-left">
              <div className="nft-image"
                style={{ backgroundImage:'url('+this.state.currentImage+')' }}
              ></div>
              <div>{this.state.currentImage}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
