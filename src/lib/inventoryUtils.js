// Utility functions for inventory management

/**
 * Deduct order items from inventory when order is completed
 */
export function deductFromInventory(order, performedBy = "System") {
  const inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
  const transactions = JSON.parse(
    localStorage.getItem("inventoryTransactions") || "[]"
  );

  let updatedInventory = [...inventory];
  const newTransactions = [];

  // Deduct each item from inventory
  for (const item of order.items) {
    if (item.isWeightPending) {
      continue;
    }

    const productId = item.service.id;
    const quantity = item.quantity;

    updatedInventory = updatedInventory.map((invItem) => {
      if (invItem.id === productId) {
        const newStock = invItem.currentStock - quantity;

        // Create transaction record
        const transaction = {
          id: `TXN${Date.now()}_${productId}`,
          productId: productId,
          productName: invItem.productName,
          type: "remove",
          quantity: quantity,
          previousStock: invItem.currentStock,
          newStock: newStock,
          notes: `Order #${order.id} - ${order.customerName}`,
          createdBy: performedBy,
          createdAt: new Date(),
        };
        newTransactions.push(transaction);

        return {
          ...invItem,
          currentStock: newStock,
          lastUpdated: new Date(),
        };
      }
      return invItem;
    });
  }

  // Save updated inventory and transactions
  localStorage.setItem("inventory", JSON.stringify(updatedInventory));
  localStorage.setItem(
    "inventoryTransactions",
    JSON.stringify([...newTransactions, ...transactions])
  );

  return {
    updatedInventory,
    newTransactions,
  };
}

/**
 * Restore order items to inventory when order is cancelled
 */
export function restoreToInventory(
  order,
  performedBy = "System",
  cancellationReason
) {
  const inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
  const transactions = JSON.parse(
    localStorage.getItem("inventoryTransactions") || "[]"
  );

  let updatedInventory = [...inventory];
  const newTransactions = [];

  // Restore each item to inventory
  for (const item of order.items) {
    if (item.isWeightPending) {
      continue;
    }

    const productId = item.service.id;
    const quantity = item.quantity;

    updatedInventory = updatedInventory.map((invItem) => {
      if (invItem.id === productId) {
        const newStock = invItem.currentStock + quantity;

        // Create transaction record
        const transaction = {
          id: `TXN${Date.now()}_${productId}`,
          productId: productId,
          productName: invItem.productName,
          type: "add",
          quantity: quantity,
          previousStock: invItem.currentStock,
          newStock: newStock,
          notes: `Order #${order.id} cancelled. Reason: ${
            cancellationReason || "No reason provided"
          }`,
          createdBy: performedBy,
          createdAt: new Date(),
        };
        newTransactions.push(transaction);

        return {
          ...invItem,
          currentStock: newStock,
          lastUpdated: new Date(),
        };
      }
      return invItem;
    });
  }

  // Save updated inventory and transactions
  localStorage.setItem("inventory", JSON.stringify(updatedInventory));
  localStorage.setItem(
    "inventoryTransactions",
    JSON.stringify([...newTransactions, ...transactions])
  );

  return {
    updatedInventory,
    newTransactions,
  };
}

/**
 * Check if there's enough inventory for an order
 */
export function checkInventoryAvailability(order) {
  const inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
  const shortages = [];

  for (const item of order.items) {
    if (item.isWeightPending) {
      continue;
    }

    const inventoryItem = inventory.find((inv) => inv.id === item.service.id);

    if (!inventoryItem) {
      shortages.push({
        productName: item.service.name,
        required: item.quantity,
        available: 0,
      });
    } else if (inventoryItem.currentStock < item.quantity) {
      shortages.push({
        productName: inventoryItem.productName,
        required: item.quantity,
        available: inventoryItem.currentStock,
      });
    }
  }

  return {
    available: shortages.length === 0,
    shortages,
  };
}
