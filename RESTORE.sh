#!/bin/bash
# Restore script to revert to working iframe solution
# Created: October 1, 2025
# Restore point: a4e2341 (Stream buttons working with iframe)

echo "🔄 Restoring to working iframe solution (commit a4e2341)..."
echo ""
echo "This will:"
echo "  - Revert all changes to the last working state"
echo "  - Remove direct stream extraction implementation"
echo "  - Restore iframe embedding (with ads but working)"
echo ""
read -p "Are you sure you want to restore? (yes/no): " confirm

if [ "$confirm" == "yes" ]; then
    git reset --hard a4e2341
    npm run build
    sudo systemctl restart arsenal-streams
    echo ""
    echo "✅ Restored successfully!"
    echo "   Current state: Iframe embedding with stream buttons working"
    echo "   To see status: sudo systemctl status arsenal-streams"
else
    echo "❌ Restore cancelled"
fi
