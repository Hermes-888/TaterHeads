// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// https://github.com/HashLips/solidity_smart_contracts/blob/main/contracts/NFT/NFT_FULL_COMMISSION.sol

/* 
  tokenURI is a path (string) that should resolve to a JSON document 
  that describes the NFT's metadata and contains a path to an image.
  Store the NFT images on https://ipfs.io/ to make it immutable
  Javascript api https://js.ipfs.io/
*/


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ZenWarriorNFT is ERC721, ERC721URIStorage, Pausable, Ownable {
  using Strings for uint256;
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  // events
  event FaceMinted(address indexed owner, uint256 id, Face[] faces);

  uint256 public fee = 0.01 ether;
  uint256 public maxSupply = 10;

  // uint256 public totalSupply; 
  // 20 for the team, 76 for those that minted early
  // uint256 private constant TOKENS_RESERVED = 96;

  uint8 level = 1;

  bool public paused = false;
  // string public blindURI = "";// not revealed yet
  // string public baseURI = "";
  // all token URI's map
  // mapping(uint256 => string) private _tokenURIs;
  // multiple?
  // address payable commissions = payable(0x57d5f07f545a88680db136dff37627f6ed942b6b);
  
  struct Face {
    string name;// random
    string tokenURI;// baseURI + random # + .json
    address tokenOwner;// purchaser
    uint256 id;// incremental edition/maxSupply
    uint256 dna;// random (?)
    uint8 rarity;// random (0~100)
    uint8 level;// series
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

  constructor() ERC721("Zen Warrior", "ZENWARRIORNFT") {
    /* 
    for (uint256 i = 1; i <= TOKENS_RESERVED; i++) {
      _safeMint(msg.sender, i);
    }
    totalSupply = TOKENS_RESERVED;
    */
  }

  function _createRandomNum(uint256 _mod) internal view returns (uint256) {
    uint256 randomNum = uint256(
      keccak256(abi.encodePacked(block.timestamp, msg.sender))
    );
    return randomNum % _mod;
  }

  function _createFace(string memory _name, address recipient, string memory _tokenURI) internal {
    uint8 randRarity = uint8(_createRandomNum(100));
    uint256 randDna = _createRandomNum(10**16);

    _tokenIds.increment();// 1 to maxSupply
    uint256 itemId = _tokenIds.current();
    // _tokenIds.increment();// 0 to maxSupply?

    _safeMint(recipient, itemId);
    _setTokenURI(itemId, _tokenURI);

    Face memory newFace = Face(_name, _tokenURI, recipient, itemId, randDna, randRarity, level);
    require(newFace.level >= 0, "A new Face was not created.");
    faces.push(newFace);

    // pause minting if all tokens have been sold
    // if (itemId == maxSupply) { paused = true; }

    emit FaceMinted(msg.sender, itemId, faces);
  }

  // Buyer enters the name. Code sends tokenURI, account, value
  // rename: mintNewToken
  function createNewFace(string memory _name, string memory _tokenURI) public payable {
    require(!paused, "the contract is paused");
    require(msg.value >= fee, "Not enough ether to mint token.");

    /* 
      // mint multiple tokens:
      // drop random _name? or send array?
      // _tokenURI becomes array of random numbers to construct the URI with
      for(uint i = 0; i < _numOfTokens; i++) {
        string memory tokenURI = baseURI + array[i] + .json
        _createFace(_name[i], msg.sender, _tokenURI);
      }
    */
    _createFace(_name, msg.sender, _tokenURI);
    // the commission should be paid from the mint price not added to it
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

  function withdraw() external payable onlyOwner() {
    address payable _owner = payable(owner());
    _owner.transfer(address(this).balance);
  }

  function setMaxSupply(uint256 _newMaxSupply) public onlyOwner() {
    maxSupply = _newMaxSupply;
  }

  function pause(bool _state) public onlyOwner {
    paused = _state;// set by contract
  }
  /*
  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }
 
  function whitelistUser(address _user) public onlyOwner {
    whitelisted[_user] = true;
  }
 
  function removeWhitelistUser(address _user) public onlyOwner {
    whitelisted[_user] = false;
  }
  */

  /*
   * Function to get token URI of given token ID
   * URI will be blank until totalSupply reaches MAX_NFT_PUBLIC
  
  function tokenURI(uint256 _tokenId) 
    public 
    view 
    virtual 
    override 
    returns (string memory) 
  {
    require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");
    if (!revealed) {
      return string(abi.encodePacked(blindURI));
    } else {
      return string(abi.encodePacked(baseURI, _tokenId.toString()));
    }
  }

  function setURIs(
    string memory _blindURI, 
    string memory _URI
  ) 
    external 
    onlyOwner 
  {
    blindURI = _blindURI;
    baseURI = _URI;
  }

  // replaces Storage?
  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
    return bytes(baseTokenURI).length > 0 ? string(abi.encodePacked(baseTokenURI, tokenId.toString(), ".json")) : "";
  }

  mapping(address => bool) whitelistedAddresses;
  mapping(address => uint256) public addressMintedBalance;
  function gift(uint256 _mintAmount, address destination) public onlyOwner {
    require(_mintAmount > 0, "need to mint at least 1 NFT");
    uint256 supply = totalSupply();
    require(supply + _mintAmount <= maxSupply, "max NFT limit exceeded");

    for (uint256 i = 1; i <= _mintAmount; i++) {
      addressMintedBalance[destination]++;// like .push()?
      _safeMint(destination, supply + i);
    }
  }
  */
}
