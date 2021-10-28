// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contract based on https://docs.openzeppelin.com/contracts/3.x/erc721
// https://ethereum.org/en/developers/tutorials/how-to-write-and-deploy-an-nft/
// https://github.com/dappuniversity/nft

// https://github.com/HashLips/solidity_smart_contracts/blob/main/contracts/NFT/NFT_FULL_COMMISSION.sol

/* 
  tokenURI is a path (string) that should resolve to a JSON document 
  that describes the NFT's metadata and contains a path to an image.
  Store the NFT images on https://ipfs.io/ to make it immutable
  Javascript api https://js.ipfs.io/
*/


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TaterFaceNFT is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  // events
  event FaceMinted(address indexed owner, uint256 id, Face[] faces);

  uint256 public fee = 0.01 ether;
  uint256 public maxSupply = 10;
  uint8 level = 1;

  // string public baseURI = "";
  // address payable commissions = payable(0x57d5f07f545a88680db136dff37627f6ed942b6b);
  
  struct Face {
    string name;// user defined
    string tokenURI;// "https://ipfs.io/ipfs/IPFS_File_Hash"
    address tokenOwner;// purchaser
    uint256 id;// edition
    uint256 dna;
    uint8 rarity;
    uint8 level;
  }

  Face[] public faces;
  /* art_engine metadata id = edition# 
  let tempMetadata = {
    dna: _dna.join(""),
    name: `#${_edition}`,
    description: description,
    image: `${baseUri}/${_edition}.png`,// "https://ipfs.io/ipfs/IPFS_File_Hash"
    edition: _edition,                  // id: tie block item to metadata?
    date: dateTime,
    attributes: attributesList,         // [Objects{}]
    compiler: "HashLips Art Engine",
  };*/

  constructor() ERC721("Tater Face", "TFNFT") {}

  function _createRandomNum(uint256 _mod) internal view returns (uint256) {
    uint256 randomNum = uint256(
      keccak256(abi.encodePacked(block.timestamp, msg.sender))
    );
    return randomNum % _mod;
  }

  function _createFace(string memory _name, address recipient, string memory _tokenURI) internal {
    uint8 randRarity = uint8(_createRandomNum(100));
    uint256 randDna = _createRandomNum(10**16);

    _tokenIds.increment();
    uint256 itemId = _tokenIds.current();
    require(itemId >= 0, "itemId failed, it is not >= 0.");
    _safeMint(recipient, itemId);
    _setTokenURI(itemId, _tokenURI);

    Face memory newFace = Face(_name, _tokenURI, recipient, itemId, randDna, randRarity, level);
    require(newFace.level >= 0, "A new Face was not created.");
    faces.push(newFace);

    emit FaceMinted(msg.sender, itemId, faces);
  }

  // Buyer enters the name. Code sends tokenURI, account, value
  function createNewFace(string memory _name, string memory _tokenURI) public payable {
    // require(!paused, "the contract is paused");
    require(msg.value >= fee, "Not enough ether to mint token.");
    _createFace(_name, msg.sender, _tokenURI);
    // (bool success, ) = payable(commissions).call{value: msg.value * 6 / 100}("");
    // require(success);
  }

  // Getters
  function getFaces() public view returns (Face[] memory) {
    return faces;
  }

  function getTokenUriById(uint256 _tokenId) public view returns (string memory) {
    return tokenURI(_tokenId);
  }

  function getOwnerFaces(address _owner) public view returns (Face[] memory) {
    Face[] memory result = new Face[](balanceOf(_owner));
    uint256 counter = 0;
    for (uint256 i = 0; i < faces.length; i++) {
      if (faces[i].tokenOwner == _owner) {
        result[counter] = faces[i];
        counter++;
      }
    }
    return result;// Array of Face structs
  }

  // Actions
  function levelUp(uint256 _faceId) public {
    require(ownerOf(_faceId) == msg.sender);
    Face storage face = faces[_faceId];
    face.level++;
  }

  function setFee(uint256 _fee) public {
    fee = _fee;
  }

  // only owner functions
  function contractBalance() public view onlyOwner returns (uint256) {
    return owner().balance;
  }

  // function withdraw() public payable onlyOwner {
  //   require(payable(msg.sender).send(address(this).balance));
  // }
  function withdraw() external payable onlyOwner() {
    address payable _owner = payable(owner());
    _owner.transfer(address(this).balance);
  }
  /*
  function setMaxMintAmount(uint256 _newMaxMintAmount) public onlyOwner() {
    maxMintAmount = _newMaxMintAmount;
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }

  function setBaseExtension(string memory _newBaseExtension) public onlyOwner {
    baseExtension = _newBaseExtension;
  }
  
  function pause(bool _state) public onlyOwner {
    paused = _state;
  }
 
 function whitelistUser(address _user) public onlyOwner {
    whitelisted[_user] = true;
  }
 
  function removeWhitelistUser(address _user) public onlyOwner {
    whitelisted[_user] = false;
  }
  */
}
