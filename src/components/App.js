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
      contractBalance: 0,
      tokenFee: 10000000000000000,// set from contract
      currentFee: 0.01,// wei, changable by owner
      baseURI: 'http://localhost:3000/_NFTimages/',
      // totalSupply: 10,// NA
      maxSupply: 10,// set from contract
      tokenName: '',// randomName
      account: '',// connected buyer
      connectedAccounts: [],
      ownerBalance: 0,// # of tokens owned by connected
      faces: [],// Minted Faces Array of Objects
      tokenId: 0,
      lastNum: 0,// last randomNum()
      currentImage: '',// tokenURI
      jsonData: []// token metadata.json
    }
  }
  /*
    struct Face {
      string name;// user defined
      string tokenURI;// "https://ipfs.io/ipfs/IPFS_File_Hash"
      address tokenOwner;// purchaser
      uint256 id;// edition
      uint256 dna;
      uint8 rarity;
      uint8 level;
      bool exists;// require creation
    }
  */
    // use baseURI/_metadata.json to track sold tokens?

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
    // this.randomNum();// get first image
    this.randomName();// display first name
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
    this.setState({ account: accounts[0] });
    this.setState({ connectedAccounts: accounts});

    const networkId = await web3.eth.net.getId();
    const networkData = TaterFaceNFT.networks[networkId];

    if (networkData) {
      const abi = TaterFaceNFT.abi;
      const address = networkData.address;
      const contract = new web3.eth.Contract(abi, address);
      this.setState({ contractAddress: address});
      this.setState({ contract });
      //contractBalance
      // const balance = await contract.methods.balanceOf(address).call();// contract 0 Faces
    // console.log(contract);
      const contractBalance = await contract.methods.contractBalance().call();
      this.setState({ contractBalance: web3.utils.fromWei(contractBalance, 'ether') });
      // const contractBalance = await web3.eth.getBalance(address);// 10000000000000000
      console.log('contractBalance:', contractBalance, this.state.contractBalance);
      
      // By default, the owner account will be the one that deploys the contract. 
      // This can later be changed with transferOwnership(address newOwner).
      const owner = await contract.methods.owner().call();
      console.log('owner:', owner);// connected user
      const ownerBalance = await contract.methods.balanceOf(owner).call();
      this.setState({ ownerBalance: ownerBalance});// # of tokens owned
      console.log('ownerBalance:', ownerBalance);

      // Not Available. ADD ERC721Enumerable?
      // const totalSupply = await contract.methods.totalSupply().call();
      // this.setState({ totalSupply });// Error: not a function

      // const baseURI = await contract.methods.baseURI().call();
      // this.setState({ baseURI });
      // setBaseURI()

      const tokenFee = await contract.methods.fee().call();
      this.setState({tokenFee: tokenFee});
      const currentFee = web3.utils.fromWei(tokenFee, 'ether');
      console.log('tokenFee:', tokenFee, 'curentFee:', currentFee);
      this.setState({ currentFee: currentFee });

      const maxSupply = await contract.methods.maxSupply().call();
      this.setState({ maxSupply: maxSupply });

      // Load All Minted Faces
      const mintedFaces = await contract.methods.getFaces().call();
      console.log('Minted Faces:', mintedFaces);

      // faces for the connected account
      const ownedFaces = await contract.methods.getOwnerFaces(owner).call();
      // const ownedFaces = await contract.methods.getOwnerFaces(address).call();
      console.log('Owned Faces:', ownedFaces);// connected account
      this.setState({faces: ownedFaces});
      if (ownedFaces.length > 0) {
        this.displayNFT(0);// on first load
      }

      // see data
      console.log('web3.utils', web3);// web3.utils
      console.log('GasPrice:', await web3.eth.getGasPrice());
      console.log('networkId:', networkId);// 5777
      // console.log('networkData:', networkData);
      console.log('account:', this.state.account);
      // account: 0x19A0b9059e28B17E75c5D7827Ac2bd8Cb7ae4087
      // p: 3nterTh3Bl0ck
      // Idea: use the connected account to generate a random number

      console.log('accounts:', accounts);// connected users
      console.log('contract address:', address);// network.address
      console.log('contract:', contract);
      // contract address: 0xe10a7662D115CA416114B50Ad167CE8B1B167A7f
      // console.log('state:', this.state);
      
      // https://web3js.readthedocs.io/en/v1.2.9/web3-eth-contract.html#contract-events
      // myContract.events.allEvents([options][, callback]);
      // myContract.events.MyEvent([options][, callback])
      // Listen for event FaceMinted(address indexed owner, uint256 id, Face[] faces, exists);
      // returns owner, id, XX-faces
      const comp = this;
      contract.events.FaceMinted({}, function(error, event) {
        // console.log('FaceMinted: event:', event);
        console.log('FaceMinted: returnValues:', event.returnValues);
        // returnValues: owner, "id", faces[]

        // comp.setState({faces: event.returnValues.faces});
        // console.log('FaceMinted: faces:', event.returnValues.faces);
        // remove from available to mint list

        // get this owners faces
        contract.methods.getOwnerFaces(owner).call()
        .then(function(data) {
          console.log('ownedFaces data:', data);
          comp.setState({faces: data});
          // display the image and metadata.json
          // comp.displayNFT(parseInt(event.returnValues.id));
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
        }).catch(function(err) {
          console.log('error', err);
        });
      })
      .on('connected', function(subscriptionId) {
        console.log('connected subscriptionId::', subscriptionId);
      })
      .on('data', function(event) {
        console.log('data::', event);// same results as the optional callback above
      })
      .on('changed', function(event) {
        console.log('changed::', event);// remove event from local database
      })
      .on('error', function(error, receipt) { 
        // If the transaction was rejected by the network with a receipt, 
        // the second parameter will be the receipt.
        console.log('error::', error);
        console.log('receipt::', receipt);
      });
      
    } else {
      window.alert('Smart contract not deployed to detected network.');
    }
  }
  
  // functions
  // Buyer enters the name. Code sends tokenURI
  mint = (name) => {
    if (name === '') {
      name = this.randomName();// generate a token name
    }
    let num = this.randomNum();// sets lastNum and large preview image
    let tokenURI = this.state.baseURI + num + '.json';
    this.setState({tokenName: name});// display token name
    this.setState({tokenId: num});
    console.log('Minting:', name, num, tokenURI);
    // ToDo: add name to json file?

    this.state.contract.methods.createNewFace(name, tokenURI).send({
      from: this.state.account, 
      value: this.state.tokenFee
    })// currentFee for UI
    .once('receipt', (receipt) => {
      console.log('Minted receipt: from:', receipt.from);
      console.log('Minted receipt: to:', receipt.to);
      console.log('Minted receipt: gasUsed:', receipt.gasUsed);
      console.log('Minted receipt: receipt:', receipt);
      // comp.setState({faces: receipt.events.FaceMinted.returnValues.faces});
      // wait for FaceMinted event listener

      // update contract balance
      // const contractBalance = await contract.methods.contractBalance().call();
      // this.setState({ contractBalance: web3.utils.fromWei(contractBalance, 'ether') });
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
    let comp = this;
    fetch(path, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(function(result) {
      return result.json();
    }).then(function(data) {
      comp.setState({tokenId: data.edition});
      comp.setState({tokenName: data.name});
      comp.setState({jsonData: [data]});
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
    let path = this.state.faces[parseInt(id)].tokenURI;// .json
    this.fetchJsonData(path);
    console.log('currentImage:', id, this.state.currentImage);
  }

  // https://web3js.readthedocs.io/en/v1.2.11/web3-utils.html
  updateFee = (fee) => {
    let comp = this;
    let newFee = window.web3.utils.toWei(fee, 'ether');
    //const currentFee = web3.utils.fromWei(tokenFee, 'ether');
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
              href="http://www.dappuniversity.com/bootcamp"
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
                  Connected: &nbsp;
                  <span id="account"> {this.state.account}</span>
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
          <hr/>
          <div className="row">
            <div className="col-sm-4 col-md-5 text-left">
              <div className="content mr-auto ml-auto">
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const name = this.name.value;
                  this.mint(name)
                }}>
                  <input type='text'
                    className='form-control mb-1'
                    placeholder='e.g. Any Name'
                    ref={(input) => { this.name = input }}
                  />
                  <input type='submit'
                    className='btn btn-block btn-primary'
                    value='MINT TATER'
                  />
                </form>
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
            <div className="col-sm-8 col-md-7 text-left">
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
