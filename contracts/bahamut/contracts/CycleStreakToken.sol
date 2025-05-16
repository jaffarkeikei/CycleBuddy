// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CycleStreakToken
 * @dev ERC-20 token for the CycleBuddy daily tracking rewards
 */
contract CycleStreakToken is ERC20, ERC20Burnable, Ownable {
    // Addresses authorized to mint tokens (reward contracts)
    mapping(address => bool) private _minters;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    /**
     * @dev Constructor - compatible with OpenZeppelin v4
     */
    constructor() ERC20("CycleStreak", "CSTRK") {
        // No initial supply - tokens will be minted as rewards
    }
    
    /**
     * @dev Add a new address to the list of authorized minters
     * @param minter The address to authorize for minting
     * Requirements:
     * - Only the contract owner can call this function
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Cannot add zero address as minter");
        require(!_minters[minter], "Address is already a minter");
        
        _minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove an address from the list of authorized minters
     * @param minter The address to remove authorization from
     * Requirements:
     * - Only the contract owner can call this function
     */
    function removeMinter(address minter) external onlyOwner {
        require(_minters[minter], "Address is not a minter");
        
        _minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Check if an address is an authorized minter
     * @param minter The address to check
     * @return bool True if the address is an authorized minter, false otherwise
     */
    function isMinter(address minter) external view returns (bool) {
        return _minters[minter];
    }
    
    /**
     * @dev Mint new tokens to the specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * Requirements:
     * - Only authorized minters can call this function
     */
    function mint(address to, uint256 amount) external {
        require(_minters[msg.sender], "Caller is not an authorized minter");
        require(to != address(0), "Cannot mint to zero address");
        
        _mint(to, amount);
    }
} 