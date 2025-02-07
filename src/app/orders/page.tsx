"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { client } from "@/sanity/lib/client";

// Order interface matching your Sanity schema.
export interface Order {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  createdAt: string;
  cartItems: string[];
}

// For form inputs we use a simplified type.
// For cartItems, the form will handle a comma‑separated string.
export type OrderInput = {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  amount?: number;
  createdAt?: string;
  cartItems?: string; // comma‑separated items
};

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formState, setFormState] = useState<OrderInput>({});

  // Fetch orders from Sanity.
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await client.fetch<Order[]>(`
        *[_type=="order"]{
          _id,
          fullName,
          email,
          phone,
          address,
          city,
          postalCode,
          country,
          paymentMethod,
          paymentStatus,
          amount,
          createdAt,
          cartItems
        }
      `);
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Delete an order.
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        await client.delete(id);
        setOrders((prev) => prev.filter((order) => order._id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete order");
      }
    }
  };

  // Open edit mode for an order.
  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    setFormState({
      _id: order._id,
      fullName: order.fullName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      postalCode: order.postalCode,
      country: order.country,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      amount: order.amount,
      createdAt: order.createdAt,
      cartItems: order.cartItems.join(", "),
    });
    setShowAddForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel adding or editing.
  const handleCancel = () => {
    setEditingOrder(null);
    setShowAddForm(false);
    setFormState({});
  };

  // Update an existing order.
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (editingOrder && editingOrder._id) {
      try {
        // Convert cartItems to an array.
        const cartItemsArray = formState.cartItems
          ? formState.cartItems.split(",").map((item) => item.trim())
          : [];
        const updateData = {
          ...formState,
          cartItems: cartItemsArray,
        };
        const updated = await client.patch(editingOrder._id).set(updateData).commit();
        const updatedOrder: Order = {
          _id: updated._id,
          fullName: updated.fullName,
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
          city: updated.city,
          postalCode: updated.postalCode,
          country: updated.country,
          paymentMethod: updated.paymentMethod,
          paymentStatus: updated.paymentStatus,
          amount: updated.amount,
          createdAt: updated.createdAt,
          cartItems: updated.cartItems,
        };
        setOrders((prev) =>
          prev.map((ord) => (ord._id === editingOrder._id ? updatedOrder : ord))
        );
        handleCancel();
      } catch (err) {
        console.error(err);
        alert("Failed to update order");
      }
    }
  };

  // Create a new order.
  const handleAddNew = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Convert cartItems to an array.
      const cartItemsArray = formState.cartItems
        ? formState.cartItems.split(",").map((item) => item.trim())
        : [];
      // If createdAt is not set, use current date/time.
      const createdAt = formState.createdAt || new Date().toISOString();
      const newOrder = await client.create({
        _type: "order",
        ...formState,
        cartItems: cartItemsArray,
        createdAt,
      });
      const addedOrder: Order = {
        _id: newOrder._id,
        fullName: newOrder.fullName!,
        email: newOrder.email!,
        phone: newOrder.phone!,
        address: newOrder.address!,
        city: newOrder.city!,
        postalCode: newOrder.postalCode!,
        country: newOrder.country!,
        paymentMethod: newOrder.paymentMethod!,
        paymentStatus: newOrder.paymentStatus!,
        amount: newOrder.amount!,
        createdAt: newOrder.createdAt,
        cartItems: newOrder.cartItems,
      };
      setOrders((prev) => [...prev, addedOrder]);
      handleCancel();
    } catch (err) {
      console.error(err);
      alert("Failed to create order");
    }
  };

  // Handle form changes.
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement && type === "checkbox"
        ? e.target.checked
        : undefined;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const isEditing = Boolean(editingOrder);
  const isFormOpen = isEditing || showAddForm;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800 mb-4 md:mb-0">
            Orders Dashboard
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingOrder(null);
                setFormState({});
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Order
            </button>
            <button
              onClick={fetchOrders}
              className="bg-gray-600 text-white px-5 py-2 rounded-md hover:bg-gray-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Add / Edit Order Form */}
        {isFormOpen && (
          <form
            onSubmit={isEditing ? handleUpdate : handleAddNew}
            className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition hover:shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              {isEditing ? "Edit Order" : "Add New Order"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={formState.fullName || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formState.email || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={formState.phone || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={formState.address || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formState.city || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code"
                    value={formState.postalCode || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={formState.country || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formState.paymentMethod || "creditCard"}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    required
                  >
                    <option value="creditCard">Credit Card</option>
                    <option value="cash">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formState.paymentStatus || "paid"}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    required
                  >
                    <option value="paid">Paid</option>
                    <option value="cash on delivery">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={formState.amount || 0}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <input
                    type="datetime-local"
                    name="createdAt"
                    value={formState.createdAt ? formState.createdAt.substring(0, 16) : ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cart Items (comma separated)</label>
                  <input
                    type="text"
                    name="cartItems"
                    placeholder="Item1, Item2, Item3"
                    value={formState.cartItems || ""}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
              >
                {isEditing ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Orders List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-center text-gray-700">Loading...</div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition hover:shadow-2xl cursor-pointer"
                onClick={() => handleEditClick(order)}
              >
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-blue-700">{order.fullName}</h2>
                  <p className="text-gray-700">Email: {order.email}</p>
                  <p className="text-gray-700">Phone: {order.phone}</p>
                  <p className="text-gray-700">City: {order.city}</p>
                  <p className="text-gray-700">Amount: ${order.amount}</p>
                  <p className="text-gray-700">
                    Created At: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(order);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(order._id);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
