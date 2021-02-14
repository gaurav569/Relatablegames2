// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
import "../token/ERC1155/ERC1155Pausable.sol";
import "../synthetix/Owned.sol";

/**
 * @title ERC1155RG- ERC1155 contract for relatable games
 */

contract ERC1155RG is ERC1155Pausable, Owned {
    using SafeMath for uint256;

    mapping (uint256 => uint256) private tokenSupply;

    uint256 private _currentTokenID = 0;

    address GameContract;

    constructor (string memory uri, address owner) ERC1155(uri) Owned(owner){

    }

     function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

  /**
    * @dev Creates a new token type and assigns _initialSupply to an address
    * NOTE: remove onlyOwner if you want third parties to create new tokens on your contract (which may change your IDs)
    * @param _to which account NFT to be minted
    * @param _initialSupply amount to supply the first owner
    * @param _Uri Optional URI for this token type
    * @param _data Data to pass if receiver is contract
    
    * @return The newly created token ID
    */
  function create(
    address _to,
    uint256 _initialSupply,
    string calldata _Uri,
    bytes calldata _data
  ) external onlyGameContract returns (uint256) {

    uint256 _id = _getNextTokenID();
    _incrementTokenTypeId();

    if (bytes(_Uri).length > 0) {
      emit URI(_Uri, _id);
    }
    
    _mint(_to, _id, _initialSupply, _data);
    tokenSupply[_id] = _initialSupply;

    return _id;
  }
  
      //set contract account that can mint & burn
    function setContract(address _GameContract) external onlyOwner returns (bool){
        GameContract=_GameContract;
        return true;
    }

    function mint(address to, uint256 id, uint256 value, bytes memory data) public onlyGameContract returns (bool){
        _mint(to, id, value, data);
        tokenSupply[id] = tokenSupply[id].add(value);
        return true;

    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory values, bytes memory data) public onlyGameContract returns (bool){
        _mintBatch(to, ids, values, data);
        for (uint i = 0; i < ids.length; i++) {
            tokenSupply[ids[i]] = tokenSupply[ids[i]].add(values[i]);
        }
        return true;

    }

    function burn(address owner, uint256 id, uint256 value) public returns (bool){
        require(
            owner == _msgSender() || isApprovedForAll(owner, _msgSender()),
            "ERC1155: caller is not owner nor approved"
        );
        _burn(owner, id, value);
        tokenSupply[id] = tokenSupply[id].sub(value);

        return true;

    }

    function burnBatch(address owner, uint256[] memory ids, uint256[] memory values) public returns (bool){
        require(
            owner == _msgSender() || isApprovedForAll(owner, _msgSender()),
            "ERC1155: caller is not owner nor approved"
        );
        _burnBatch(owner, ids, values);        

        for (uint i = 0; i < ids.length; i++) {
            tokenSupply[ids[i]] = tokenSupply[ids[i]].sub(values[i]);
        }
        return true;

    }

    function _getNextTokenID() private view returns (uint256) {
            return _currentTokenID.add(1);
        }

    /**
    * @dev increments the value of _currentTokenID
    */
   function _incrementTokenTypeId() private  {
     _currentTokenID++;
   }
   

    /**
     * @dev Throws if called by any account other than the minter.
     */
    modifier onlyGameContract() {
        require(isGameContract(), "caller is not the Game contract");
        _;
    }

    /**
     * @dev Returns true if the caller is the current minter.
     */
    function isGameContract() private view returns (bool) {
        return _msgSender() == GameContract;
    }

    /**
    * @dev Returns the total quantity for a token ID
    * @param _id uint256 ID of the token to query
    * @return amount of token in existence
    */
    function totalSupply(
        uint256 _id
    ) public view returns (uint256) {
        return tokenSupply[_id];
    }
    
    
}
