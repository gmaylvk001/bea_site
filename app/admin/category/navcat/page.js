// app/admin/category/navcat/page.js
"use client";

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function CategoryNavPage() {
  // ── Parent category ordering state ──────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [originalCategories, setOriginalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Subcategory ordering state ───────────────────────────────────────────────
  const [allCategories, setAllCategories] = useState([]); // full list (all statuses)
  const [selectedParentId, setSelectedParentId] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [originalSubcategories, setOriginalSubcategories] = useState([]);
  const [subHasChanges, setSubHasChanges] = useState(false);
  const [subSaving, setSubSaving] = useState(false);
  const [showSubConfirmModal, setShowSubConfirmModal] = useState(false);
  const [subSaveSuccess, setSubSaveSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories/get');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();

      // Store ALL categories for parent selector
      setAllCategories(data);

      // Filter only active main categories (parentid is "none" and status is "Active") and sort by position
      const activeMainCategories = data
        .filter(cat => cat.parentid === "none" && cat.status === "Active")
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      setCategories(activeMainCategories);
      setOriginalCategories(JSON.parse(JSON.stringify(activeMainCategories))); // Deep copy
      setHasChanges(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  // ── When admin selects a parent, load its subcategories ──────────────────────
  // NOTE: depends only on selectedParentId — NOT allCategories.
  // allCategories changes after a save (optimistic update) and must NOT re-sort
  // the already-saved subcategory order back to the old default.
  useEffect(() => {
    if (!selectedParentId) {
      setSubcategories([]);
      setOriginalSubcategories([]);
      setSubHasChanges(false);
      return;
    }

    const subs = allCategories
      .filter(cat => cat.parentid === selectedParentId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    setSubcategories(subs);
    setOriginalSubcategories(JSON.parse(JSON.stringify(subs)));
    setSubHasChanges(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParentId]);

  // ── Parent drag-and-drop ─────────────────────────────────────────────────────
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));

    setCategories(updatedItems);
    setHasChanges(true);
  };

  const saveCategoryOrder = async () => {
    try {
      setSaving(true);
      setShowConfirmModal(false);

      const categoriesToUpdate = categories.map((category, index) => ({
        _id: category._id,
        position: index
      }));

      const response = await fetch('/api/categories/update-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: categoriesToUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category positions');
      }

      setOriginalCategories(JSON.parse(JSON.stringify(categories)));
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category order:", error);
      alert("Failed to save category order: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetOrder = () => {
    setCategories(JSON.parse(JSON.stringify(originalCategories)));
    setHasChanges(false);
  };

  // ── Subcategory drag-and-drop ────────────────────────────────────────────────
  const handleSubDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(subcategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));

    setSubcategories(updatedItems);
    setSubHasChanges(true);
  };

  const saveSubcategoryOrder = async () => {
    try {
      setSubSaving(true);
      setShowSubConfirmModal(false);

      const subcategoriesToUpdate = subcategories.map((cat, index) => ({
        _id: cat._id,
        position: index
      }));

      const response = await fetch('/api/categories/update-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: subcategoriesToUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subcategory positions');
      }

      setOriginalSubcategories(JSON.parse(JSON.stringify(subcategories)));
      setSubHasChanges(false);
      setSubSaveSuccess(true);
      setTimeout(() => setSubSaveSuccess(false), 3000);

      // Update allCategories optimistically with the new positions so the
      // dropdown stays in sync — without re-fetching from DB (a re-fetch would
      // re-trigger the parent-selector useEffect and overwrite the saved order).
      const positionMap = {};
      subcategories.forEach((cat, index) => { positionMap[cat._id] = index; });
      setAllCategories(prev =>
        prev.map(cat =>
          positionMap.hasOwnProperty(cat._id)
            ? { ...cat, position: positionMap[cat._id] }
            : cat
        )
      );
    } catch (error) {
      console.error("Error saving subcategory order:", error);
      alert("Failed to save subcategory order: " + error.message);
    } finally {
      setSubSaving(false);
    }
  };

  const resetSubOrder = () => {
    setSubcategories(JSON.parse(JSON.stringify(originalSubcategories)));
    setSubHasChanges(false);
  };

  // ── Active parent categories for the selector dropdown ──────────────────────
  const parentOptions = allCategories
    .filter(cat => cat.parentid === "none" && cat.status === "Active")
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // ── Shared styles ────────────────────────────────────────────────────────────
  const sectionStyle = {
    marginTop: '40px',
    paddingTop: '30px',
    borderTop: '2px solid #e0e0e0'
  };

  const listContainerStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    margin: '20px 0'
  };

  const rowStyle = {
    padding: '15px',
    background: 'white',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  };

  const badgeStyle = (color) => ({
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.8em',
    fontWeight: '500',
    backgroundColor: color === 'green' ? '#e8f5e9' : '#fff3e0',
    color: color === 'green' ? '#2e7d32' : '#e65100'
  });

  const indexBadgeStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0
  };

  const btnStyle = (color, disabled) => ({
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    backgroundColor: disabled ? '#ccc' : color,
    color: 'white'
  });

  const successBannerStyle = {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: '#e8f5e9',
    border: '1px solid #a5d6a7',
    borderRadius: '4px',
    color: '#2e7d32',
    fontWeight: '500'
  };

  const warningBannerStyle = {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#fff8e1',
    border: '1px solid #ffd54f',
    borderRadius: '4px'
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>Category Navigation Management</h1>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading categories...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

      {/* ── SECTION 1: Parent Category Order ───────────────────────────────── */}
      <h1 style={{ color: '#333', marginBottom: '4px' }}>Category Navigation Management</h1>
      <p style={{ color: '#888', marginBottom: '10px', fontSize: '0.9em' }}>
        Drag and drop to reorder <strong>parent categories</strong> in the navigation menu.
      </p>

      {categories.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          No active categories found. Please activate some categories first.
        </div>
      ) : (
        <>
          <div style={listContainerStyle}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ backgroundColor: '#f9f9f9' }}
                  >
                    {categories.map((category, index) => (
                      <Draggable
                        key={category._id}
                        draggableId={category._id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...rowStyle,
                              ...provided.draggableProps.style
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={indexBadgeStyle}>{index + 1}</span>
                              <span style={{ fontWeight: '500' }}>{category.category_name}</span>
                              <span style={badgeStyle('green')}>Active</span>
                            </div>
                            <div style={{ color: '#888', fontSize: '0.9em' }}>
                              Position: {category.position}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={saving || !hasChanges}
              style={btnStyle('#4caf50', saving || !hasChanges)}
            >
              {saving ? 'Saving...' : 'Save Order'}
            </button>
            <button
              onClick={resetOrder}
              disabled={!hasChanges}
              style={btnStyle('#ff9800', !hasChanges)}
            >
              Reset
            </button>
            <button
              onClick={fetchCategories}
              style={btnStyle('#2196f3', false)}
            >
              Refresh
            </button>
          </div>

          {saveSuccess && (
            <div style={successBannerStyle}>✓ Parent category order saved successfully!</div>
          )}

          {hasChanges && !saveSuccess && (
            <div style={warningBannerStyle}>
              You have unsaved changes. Click "Save Order" to save them.
            </div>
          )}
        </>
      )}

      {/* ── SECTION 2: Subcategory Order ───────────────────────────────────── */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#333', marginBottom: '4px' }}>Subcategory Order</h2>
        <p style={{ color: '#888', marginBottom: '16px', fontSize: '0.9em' }}>
          Select a parent category, then drag and drop its <strong>subcategories</strong> to set their order.
        </p>

        {/* Parent selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#555' }}>
            Select Parent Category
          </label>
          <select
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '0.95em',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Select a parent category --</option>
            {parentOptions.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory list */}
        {selectedParentId && (
          subcategories.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '8px',
              color: '#888'
            }}>
              No subcategories found for this parent category.
            </div>
          ) : (
            <>
              <div style={listContainerStyle}>
                <DragDropContext onDragEnd={handleSubDragEnd}>
                  <Droppable droppableId="subcategories">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{ backgroundColor: '#f9f9f9' }}
                      >
                        {subcategories.map((sub, index) => (
                          <Draggable
                            key={sub._id}
                            draggableId={sub._id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...rowStyle,
                                  ...provided.draggableProps.style
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={indexBadgeStyle}>{index + 1}</span>
                                  <span style={{ fontWeight: '500' }}>{sub.category_name}</span>
                                  <span style={badgeStyle(sub.status === 'Active' ? 'green' : 'orange')}>
                                    {sub.status}
                                  </span>
                                </div>
                                <div style={{ color: '#888', fontSize: '0.9em' }}>
                                  Position: {sub.position || 0}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowSubConfirmModal(true)}
                  disabled={subSaving || !subHasChanges}
                  style={btnStyle('#4caf50', subSaving || !subHasChanges)}
                >
                  {subSaving ? 'Saving...' : 'Save Order'}
                </button>
                <button
                  onClick={resetSubOrder}
                  disabled={!subHasChanges}
                  style={btnStyle('#ff9800', !subHasChanges)}
                >
                  Reset
                </button>
              </div>

              {subSaveSuccess && (
                <div style={successBannerStyle}>✓ Subcategory order saved successfully!</div>
              )}

              {subHasChanges && !subSaveSuccess && (
                <div style={warningBannerStyle}>
                  You have unsaved changes. Click "Save Order" to save them.
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* ── Confirm modal: Parent ───────────────────────────────────────────── */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '90%', maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Confirm Save</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>Save the new parent category order?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{
                padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px',
                backgroundColor: 'white', color: '#333', cursor: 'pointer'
              }}>No</button>
              <button onClick={saveCategoryOrder} style={{
                padding: '8px 16px', border: 'none', borderRadius: '4px',
                backgroundColor: '#4caf50', color: 'white', cursor: 'pointer'
              }}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm modal: Subcategory ──────────────────────────────────────── */}
      {showSubConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '90%', maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Confirm Save</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>Save the new subcategory order?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSubConfirmModal(false)} style={{
                padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px',
                backgroundColor: 'white', color: '#333', cursor: 'pointer'
              }}>No</button>
              <button onClick={saveSubcategoryOrder} style={{
                padding: '8px 16px', border: 'none', borderRadius: '4px',
                backgroundColor: '#4caf50', color: 'white', cursor: 'pointer'
              }}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
