"use client";

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../page";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type TableProps = {
  data: Transaction[];
  loading: boolean;
  fetchData: () => Promise<void>;
};

type FormState = {
  date: Date;
  type: string;
  description: string;
  amount: number;
  category: string;
  status: string;
};

export default function Table({ data, loading, fetchData }: TableProps) {
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState<FormState>({
    date: new Date(),
    type: "Income",
    description: "",
    amount: 0,
    category: "",
    status: "Pending",
  });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 5;

  const filteredData = useMemo(() => {
    const text = search.toLowerCase();

    return data.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(text) ||
        item.category.toLowerCase().includes(text);

      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const resetForm = () => {
    setForm({
      date: new Date(),
      type: "Income",
      description: "",
      amount: 0,
      category: "",
      status: "Pending",
    });
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!editingItem) return;

    const { name, value } = event.target;

    setEditingItem({
      ...editingItem,
      [name]: name === "amount" ? Number(value) : value,
    });
  };

  const handleEditClick = (item: Transaction) => {
    setEditingItem(item);
    setEditingDate(new Date(item.date));
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingDate(null);
  };

  const handleAdd = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const { error } = await supabase.from("transactions").insert([
      {
        ...form,
        date: form.date.toISOString().split("T")[0],
        user_id: user.id,
      },
    ]);

    if (error) {
      toast.error("Failed to add transaction");
      return;
    }

    toast.success("Transaction added successfully");
    setShowAddForm(false);
    resetForm();
    await fetchData();
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    const { id, ...updatedFields } = editingItem;

    const payload = {
      ...updatedFields,
      date: editingDate
        ? editingDate.toISOString().split("T")[0]
        : editingItem.date,
    };

    const { error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update transaction");
      return;
    }

    toast.success("Transaction updated successfully");
    setEditingItem(null);
    setEditingDate(null);
    await fetchData();
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deleteId);

    setIsDeleting(false);

    if (error) {
      toast.error("Failed to delete transaction");
      return;
    }

    toast.success("Transaction deleted successfully");
    setDeleteId(null);
    await fetchData();
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Description",
      "Amount",
      "Category",
      "Status",
    ];

    const rows = filteredData.map((item) => [
      item.date,
      item.type,
      item.description,
      item.amount,
      item.category,
      item.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  };

  return (
    <div className="tabularWrapper">
      <h3 className="mainTitle">Transactions</h3>

      <div className="tableTopBar">
        <div className="filtersGroup">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="searchInput"
          />

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="filterSelect"
          >
            <option value="All">All Types</option>
            <option value="Income">Income</option>
            <option value="Expenses">Expenses</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="filterSelect"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="topActions">
          <button className="exportBtn" onClick={handleExportCSV}>
            Export CSV
          </button>

          <button className="addBtn" onClick={() => setShowAddForm(true)}>
            Add Transaction
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="modalOverlay" onClick={() => setShowAddForm(false)}>
          <div className="modalBox" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <h4>Add Transaction</h4>
              <button className="closeBtn" onClick={() => setShowAddForm(false)}>
                ✕
              </button>
            </div>

            <div className="editForm">
              <div className="formGrid">
                <DatePicker
                  selected={form.date}
                  onChange={(date: Date | null) =>
  setForm((prev) => ({
    ...prev,
    date: date || new Date(),
  }))
}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select date"
                />

                <select name="type" value={form.type} onChange={handleFormChange}>
                  <option value="Income">Income</option>
                  <option value="Expenses">Expenses</option>
                </select>

                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleFormChange}
                />

                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={handleFormChange}
                />

                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  value={form.category}
                  onChange={handleFormChange}
                />

                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="formActions">
                <button className="saveBtn" onClick={handleAdd}>
                  Save
                </button>
                <button
                  className="cancelBtn"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="modalOverlay" onClick={handleCancelEdit}>
          <div className="modalBox" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <h4>Edit Transaction</h4>
              <button className="closeBtn" onClick={handleCancelEdit}>
                ✕
              </button>
            </div>

            <div className="editForm">
              <div className="formGrid">
                <DatePicker
                  selected={editingDate}
                  onChange={(date) => setEditingDate(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select date"
                />

                <select
                  name="type"
                  value={editingItem.type}
                  onChange={handleEditChange}
                >
                  <option value="Income">Income</option>
                  <option value="Expenses">Expenses</option>
                </select>

                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={editingItem.description}
                  onChange={handleEditChange}
                />

                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={editingItem.amount}
                  onChange={handleEditChange}
                />

                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  value={editingItem.category}
                  onChange={handleEditChange}
                />

                <select
                  name="status"
                  value={editingItem.status}
                  onChange={handleEditChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="formActions">
                <button className="saveBtn" onClick={handleUpdate}>
                  Save Changes
                </button>
                <button className="cancelBtn" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="deleteModalOverlay" onClick={() => setDeleteId(null)}>
          <div
            className="deleteModalBox"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="deleteModalIcon">🗑️</div>

            <h4>Delete Transaction</h4>
            <p>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </p>

            <div className="deleteModalActions">
              <button
                className="cancelBtn"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                className="deleteBtn"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p style={{ marginBottom: "1rem" }}>Loading transactions...</p>}

      <div className="tableContainer">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.id}>
                <td className="dateCell">{item.date}</td>
                <td>{item.type}</td>
                <td>{item.description}</td>
                <td>${item.amount}</td>
                <td>{item.category}</td>
                <td>{item.status}</td>
                <td className="actionCell">
                  <button
                    className="editBtn"
                    onClick={() => handleEditClick(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="deleteBtn"
                    onClick={() => setDeleteId(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {!loading && filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "1.5rem" }}>
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pageBtn"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={`pageBtn ${currentPage === index + 1 ? "activePage" : ""}`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="pageBtn"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
