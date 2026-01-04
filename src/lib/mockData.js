// Mock data initializer for demo purposes
export function initializeMockOrders() {
  const existingOrders = localStorage.getItem("orders");

  // Only initialize if no orders exist
  if (!existingOrders || JSON.parse(existingOrders).length === 0) {
    const mockOrders = [
      {
        id: "ORD1234567890",
        customerName: "Ahmed Ali",
        phone: "0300-1234567",
        items: [
          {
            service: { id: "1", name: "Wheat Grinding", price: 10, unit: "kg" },
            quantity: 5,
          },
          {
            service: {
              id: "4",
              name: "Besan (Gram Flour)",
              price: 12,
              unit: "kg",
            },
            quantity: 2,
          },
        ],
        total: 74,
        type: "pickup",
        status: "pending",
        paymentMethod: "cash",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ORD1234567891",
        customerName: "Fatima Khan",
        phone: "0321-9876543",
        items: [
          {
            service: {
              id: "2",
              name: "10kg Atta Bag",
              price: 950,
              unit: "bag",
            },
            quantity: 1,
          },
        ],
        total: 950,
        type: "delivery",
        deliveryAddress: "House # 123, Street 5, DHA Phase 2, Lahore",
        status: "pending",
        paymentMethod: "jazzcash",
        paymentStatus: "paid",
        transactionId: "TXN1234567890",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ORD1234567892",
        customerName: "Hassan Malik",
        phone: "0333-4567890",
        items: [
          {
            service: {
              id: "3",
              name: "Multigrain Atta",
              price: 15,
              unit: "kg",
            },
            quantity: 3,
          },
          {
            service: {
              id: "6",
              name: "Sooji (Semolina)",
              price: 10,
              unit: "kg",
            },
            quantity: 2,
          },
        ],
        total: 65,
        type: "delivery",
        deliveryAddress:
          "Flat 201, Gulberg Heights, Block C, Gulberg, Islamabad",
        status: "processing",
        paymentMethod: "cash",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ORD1234567893",
        customerName: "Ayesha Siddiqui",
        phone: "0345-7890123",
        items: [
          {
            service: {
              id: "5",
              name: "Maida (All Purpose)",
              price: 8,
              unit: "kg",
            },
            quantity: 4,
          },
        ],
        total: 32,
        type: "pickup",
        status: "scheduled-tomorrow",
        paymentMethod: "easypaisa",
        paymentStatus: "paid",
        transactionId: "TXN9876543210",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem("orders", JSON.stringify(mockOrders));
  }
}
