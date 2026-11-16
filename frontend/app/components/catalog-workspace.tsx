"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import ConfirmDialog from "./confirm-dialog";
import { WorkspaceIcon } from "./workspace-icons";

import styles from "../workspace/catalog/catalog.module.css";

type Category = {
  id: string;
  name: string;
  parent?: {
    id: string;
    name: string;
  } | null;
};

type Unit = {
  id: string;
  name: string;
  code: string;
};

type Item = {
  id: string;
  name: string;
  sku?: string | null;
  itemType: string;
  isActive: boolean;
  isStockable: boolean;
  category?: Category | null;
  unitOfMeasure?: Unit | null;
};

type Props = {
  items: Item[];
  categories: Category[];
  units: Unit[];
};

const pageSize = 5;

export default function CatalogWorkspace({ items, categories, units }: Props) {
  const router = useRouter();

  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [addItem, setAddItem] = useState(false);
  const [addCategory, setAddCategory] = useState(false);

  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageAction, setMessageAction] = useState("");

  const [selected, setSelected] = useState<Item | null>(null);

  const matchedCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()),
  );

  const categoryPages = Math.max(
    1,
    Math.ceil(matchedCategories.length / pageSize),
  );

  const safeCategoryPage = Math.min(categoryPage, categoryPages);

  const visibleCategories = matchedCategories.slice(
    (safeCategoryPage - 1) * pageSize,
    safeCategoryPage * pageSize,
  );

  const filtered = items.filter(
    (item) =>
      [item.name, item.sku, item.category?.name].some((value) =>
        value?.toLowerCase().includes(query.trim().toLowerCase()),
      ) &&
      (status === "all" ||
        (status === "active" ? item.isActive : !item.isActive)),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  async function save(action: string, data: Record<string, unknown>) {
    setPending(true);
    setMessage("");
    setMessageAction(action);

    try {
      const response = await fetch("/api/catalog", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action,
          data,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          Array.isArray(result?.message)
            ? result.message.join(" ")
            : result?.message || "The action could not be completed.",
        );

        router.refresh();
        return false;
      }

      setMessage(
        action === "createItem"
          ? "Item added."
          : action === "createCategory"
            ? "Category added."
            : "Item status updated.",
      );

      router.refresh();
      return true;
    } catch {
      setMessage(
        "Connection interrupted. Refresh the page to check the result before trying again.",
      );

      router.refresh();
      return false;
    } finally {
      setPending(false);
    }
  }

  async function itemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const saved = await save("createItem", {
      name: data.get("name"),
      sku: data.get("sku"),
      categoryId: data.get("categoryId"),
      unitOfMeasureId: data.get("unitOfMeasureId"),
      itemType: data.get("itemType"),
      isStockable: data.get("isStockable") === "on",
    });

    if (saved) {
      form.reset();
      setAddItem(false);
    }
  }

  async function categorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const saved = await save("createCategory", {
      name: data.get("name"),
      parentId: data.get("parentId"),
    });

    if (saved) {
      form.reset();
      setAddCategory(false);
    }
  }

  return (
    <>
      {/* Item and status messages remain at the top of the catalog. */}

      {message && messageAction !== "createCategory" && (
        <p className={styles.feedback} role="status">
          {message}
        </p>
      )}

      <div className={styles.layout}>
        <div className={styles.stack}>
          {/* Items */}

          <section className={styles.card} aria-labelledby="items-heading">
            <div className={styles.heading}>
              <h2 id="items-heading">
                <span className={styles.icon}>
                  <WorkspaceIcon name="catalog" />
                </span>
                Items
              </h2>

              <button
                type="button"
                className={styles.primary}
                onClick={() => setAddItem(!addItem)}
                aria-expanded={addItem}
              >
                + Add item
              </button>
            </div>

            <div className={styles.filters}>
              <label>
                Search items
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, SKU or category"
                />
              </label>

              <label>
                Status
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div
              className={styles.tableScroll}
              tabIndex={0}
              aria-label="Catalog items"
            >
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>

                      <td>{item.sku || "—"}</td>

                      <td>{item.category?.name || "—"}</td>

                      <td>{item.unitOfMeasure?.name || "—"}</td>

                      <td className={styles.capitalize}>{item.itemType}</td>

                      <td>
                        <span
                          className={
                            item.isActive ? styles.active : styles.inactive
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={pending}
                          onClick={() => setSelected(item)}
                        >
                          {item.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visible.length === 0 && (
                <p className={styles.empty}>
                  {items.length
                    ? "No items match your search."
                    : "No items have been added yet."}
                </p>
              )}
            </div>

            <div className={styles.pagination}>
              <span>
                {filtered.length
                  ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(
                      currentPage * pageSize,
                      filtered.length,
                    )} of ${filtered.length}`
                  : "0 items"}
              </span>

              <div>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className={styles.secondary}
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {/* Categories */}

          <section className={styles.card}>
            <div className={styles.heading}>
              <h2>Categories</h2>

              <button
                className={styles.primary}
                type="button"
                aria-expanded={addCategory}
                onClick={() => setAddCategory(!addCategory)}
              >
                + Add category
              </button>
            </div>

            <details className={styles.details}>
              <summary>View categories</summary>

              <div className={styles.form}>
                <label>
                  Search categories
                  <input
                    type="search"
                    value={categoryQuery}
                    onChange={(event) => {
                      setCategoryQuery(event.target.value);
                      setCategoryPage(1);
                    }}
                  />
                </label>
              </div>

              <div className={styles.categoryList}>
                {matchedCategories.length ? (
                  visibleCategories.map((category) => (
                    <p key={category.id}>
                      {category.name}

                      {category.parent?.name
                        ? ` — under ${category.parent.name}`
                        : ""}
                    </p>
                  ))
                ) : (
                  <p>
                    {categories.length
                      ? "No categories match your search."
                      : "No categories have been added yet."}
                  </p>
                )}
              </div>

              <div className={styles.pagination}>
                <span>
                  Page {safeCategoryPage} of {categoryPages}
                </span>

                <div>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={safeCategoryPage === 1}
                    onClick={() => setCategoryPage(safeCategoryPage - 1)}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={safeCategoryPage === categoryPages}
                    onClick={() => setCategoryPage(safeCategoryPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </details>

            {addCategory && (
              <form className={styles.form} onSubmit={categorySubmit}>
                <label>
                  Category name *
                  <input name="name" required maxLength={150} />
                </label>

                <label>
                  Parent category (optional)
                  <select name="parentId">
                    <option value="">No parent category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={styles.actions}>
                  <button
                    className={styles.primary}
                    type="submit"
                    disabled={pending}
                  >
                    {pending ? "Saving…" : "Add category"}
                  </button>

                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={pending}
                    onClick={() => setAddCategory(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Category messages appear beside the category form. */}

            {message && messageAction === "createCategory" && (
              <p className={styles.feedback} role="status">
                {message}
              </p>
            )}
          </section>
        </div>

        {/* Add item form */}

        {addItem && (
          <section className={styles.card}>
            <h2>Add item</h2>

            <form className={styles.form} onSubmit={itemSubmit}>
              <label>
                Item name *
                <input name="name" required maxLength={255} />
              </label>

              <label>
                SKU (optional)
                <input name="sku" maxLength={100} />
              </label>

              <label>
                Category (optional)
                <select name="categoryId">
                  <option value="">No category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Unit of measure *
                <select name="unitOfMeasureId" required defaultValue="">
                  <option value="" disabled>
                    Select unit of measure
                  </option>

                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </select>
              </label>

              {units.length === 0 && (
                <p>
                  No shared units are available. Contact your platform
                  administrator.
                </p>
              )}

              <label>
                Type
                <select name="itemType" defaultValue="material">
                  <option value="material">Material</option>
                  <option value="service">Service</option>
                  <option value="asset">Asset</option>
                </select>
              </label>

              <label className={styles.checkbox}>
                <input type="checkbox" name="isStockable" defaultChecked />
                Stockable
              </label>

              <div className={styles.actions}>
                <button
                  className={styles.primary}
                  type="submit"
                  disabled={pending || units.length === 0}
                >
                  {pending ? "Saving…" : "Add item"}
                </button>

                <button
                  type="button"
                  className={styles.secondary}
                  disabled={pending}
                  onClick={() => setAddItem(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </div>

      {/* Confirm item activation or deactivation. */}

      <ConfirmDialog
        open={Boolean(selected)}
        title={selected?.isActive ? "Deactivate item?" : "Reactivate item?"}
        description={`You are about to ${
          selected?.isActive ? "deactivate" : "reactivate"
        } “${selected?.name ?? ""}”.`}
        confirmLabel={selected?.isActive ? "Deactivate" : "Reactivate"}
        danger={selected?.isActive}
        pending={pending}
        onCancel={() => setSelected(null)}
        onConfirm={async () => {
          if (
            selected &&
            (await save("setStatus", {
              id: selected.id,
              isActive: !selected.isActive,
            }))
          ) {
            setSelected(null);
          }
        }}
      />
    </>
  );
}
