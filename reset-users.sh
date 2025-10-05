#!/bin/bash

# Script to reset all user accounts in XOS
# This will remove all user data and allow starting fresh

echo "Resetting all user accounts in XOS..."

# Confirm with user before proceeding
read -p "This will delete all user accounts and data. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Remove user JSON files
echo "Removing user account files..."
rm -f packages/backend/vfs/system/users/*.json

# Remove user home directories
echo "Removing user home directories..."
rm -rf packages/backend/vfs/home/*

# Remove current user file
echo "Removing current user session..."
rm -f packages/backend/vfs/system/user.json

echo "All user accounts have been reset!"
echo "You can now start fresh with the XOS system."