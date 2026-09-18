"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../lib/types";
import { addTransactions, deleteTransaction, updateTransaction } from "../lib/data";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ===================== */
/* Types */
/* ===================== */

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

type SortKey = "date" | "amount" | "description";
type SortDirection = "asc" | "desc";

/* ===================== */
/* Transactions Table */
/* Handles filtering, sorting, pagination, add, edit, delete, and CSV export.
 */
/* ===================== */

export default function Table({ data, loading, fetchData }: TableProps) {
  /* ===================== */
  /* State Management */
  /* ===================== */

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

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 5;

  /* ===================== */
  /* Filtering */
  /* Filters transactions by search text, type, and status.
   */
  /* ===================== */

  const filteredData = useMemo(() => {
    const text = search.toLowerCase();

    return data.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(text) ||
        item.category.toLowerCase().includes(text);

      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, typeFilter, statusFilter]);

  /* ===================== */
  /* Sorting */
  /* Sorts filtered transactions by date, amount, or description.
   */
  /* ===================== */

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortKey === "amount") {
        return sortDirection === "asc"
          ? Number(a.amount) - Number(b.amount)
          : Number(b.amount) - Number(a.amount);
      }

      if (sortKey === "date") {
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      return sortDirection === "asc"
        ? a.description.localeCompare(b.description)
        : b.description.localeCompare(a.description);
    });
  }, [filteredData, sortKey, sortDirection]);

  /* ===================== */
  /* Pagination */
  /* Keeps pagination safe when filters or sorting change.
   */
  /* ===================== */

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

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
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const visibleStart = sortedData.length === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + itemsPerPage, sortedData.length);

  /* ===================== */
  /* Form Helpers */
  /* ===================== */

  function resetForm() {
    setForm({
      date: new Date(),
      type: "Income",
      description: "",
      amount: 0,
      category: "",
      status: "Pending",
    });
  }

  function handleFormChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  }

  function handleEditChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    if (!editingItem) return;

    const { name, value } = event.target;

    setEditingItem({
      ...editingItem,
      [name]: name === "amount" ? Number(value) : value,
    });
  }

  /* ===================== */
  /* Sort Handler */
  /* Toggles sort direction when clicking the same field.
   */
  /* ===================== */

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("desc");
  }

  function getSortLabel(key: SortKey) {
    if (sortKey !== key) return "";

    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  /* ===================== */
  /* Edit Transaction */
  /* ===================== */

  function handleEditClick(item: Transaction) {
    setEditingItem(item);
    setEditingDate(new Date(item.date));
  }

  function handleCancelEdit() {
    setEditingItem(null);
    setEditingDate(null);
  }

  async function handleUpdate() {
    if (!editingItem) return;

    const { id, ...updatedFields } = editingItem;

    const payload = {
      ...updatedFields,
      date: editingDate
        ? editingDate.toISOString().split("T")[0]
        : editingItem.date,
    };

    const { error } = await updateTransaction(id, payload);

    if (error) {
      toast.error("Failed to update transaction");
      return;
    }

    toast.success("Transaction updated successfully");
    setEditingItem(null);
    setEditingDate(null);
    await fetchData();
  }

  /* ===================== */
  /* Add Transaction */
  /* ===================== */

  async function handleAdd() {
    const { error } = await addTransactions([
      {
        ...form,
        date: form.date.toISOString().split("T")[0],
      },
    ]);

    if (error === "not_authenticated") {
      toast.error("You must be logged in");
      return;
    }

    if (error) {
      toast.error("Failed to add transaction");
      return;
    }

    toast.success("Transaction added successfully");
    setShowAddForm(false);
    resetForm();
    await fetchData();
  }

  /* ===================== */
  /* Delete Transaction */
  /* ===================== */

  async function handleDelete() {
    if (deleteId === null) return;

    setIsDeleting(true);

    const { error } = await deleteTransaction(deleteId);

    setIsDeleting(false);

    if (error) {
      toast.error("Failed to delete transaction");
      return;
    }

    toast.success("Transaction deleted successfully");
    setDeleteId(null);
    await fetchData();
  }

  /* ===================== */
  /* CSV Export */
  /* Exports the currently filtered and sorted transactions.
   */
  /* ===================== */

  function handleExportCSV() {
    if (sortedData.length === 0) {
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

    const rows = sortedData.map((item) => [
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
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
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
  }

  /* ===================== */
  /* UI Rendering */
  /* ===================== */

  return (
    <div className="tabularWrapper">
      <div className="tableHeaderInfo">
        <div>
          <h3 className="mainTitle">Transactions</h3>
          <p className="tableInfo">
            Showing {visibleStart}-{visibleEnd} of {sortedData.length} results
          </p>
        </div>
      </div>

      {/* ===================== */}
      {/* Filters + Actions */}
      {/* ===================== */}

      <div className="tableTopBar">
        <div className="filtersGroup">
          <input
            type="text"
            placeholder="Search by description or category..."
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

      {/* ===================== */}
      {/* Add Transaction Modal */}
      {/* ===================== */}

      {showAddForm && (
        <div className="modalOverlay" onClick={() => setShowAddForm(false)}>
          <div
            className="modalBox"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modalHeader">
              <h4>Add Transaction</h4>

              <button
                className="closeBtn"
                onClick={() => setShowAddForm(false)}
              >
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

                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                >
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

      {/* ===================== */}
      {/* Edit Transaction Modal */}
      {/* ===================== */}

      {editingItem && (
        <div className="modalOverlay" onClick={handleCancelEdit}>
          <div
            className="modalBox"
            onClick={(event) => event.stopPropagation()}
          >
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
                  onChange={(date: Date | null) => setEditingDate(date)}
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

      {/* ===================== */}
      {/* Delete Confirmation Modal */}
      {/* ===================== */}

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

      {/* ===================== */}
      {/* Table */}
      {/* ===================== */}

      {loading && (
        <div className="tableLoadingState">Loading transactions...</div>
      )}

      <div className="tableContainer">
        <table>
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  className="tableSortButton"
                  onClick={() => handleSort("date")}
                >
                  Date{getSortLabel("date")}
                </button>
              </th>

              <th>Type</th>

              <th>
                <button
                  type="button"
                  className="tableSortButton"
                  onClick={() => handleSort("description")}
                >
                  Description{getSortLabel("description")}
                </button>
              </th>

              <th>
                <button
                  type="button"
                  className="tableSortButton"
                  onClick={() => handleSort("amount")}
                >
                  Amount{getSortLabel("amount")}
                </button>
              </th>

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

            {!loading && sortedData.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="tableEmptyState">
                    No transactions found. Try changing your filters or add a
                    new transaction.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== */}
      {/* Pagination */}
      {/* ===================== */}

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
              className={`pageBtn ${
                currentPage === index + 1 ? "activePage" : ""
              }`}
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
