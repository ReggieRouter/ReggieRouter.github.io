/**
 * LendPaper Calculator Shared App Logic
 * Handles global behaviors like select-on-focus for numeric inputs.
 */

(function() {
  /**
   * Selects the entire content of an input field.
   * Optimized for cross-browser and mobile (iOS) compatibility.
   */
  function selectAll(el) {
    if (!el || typeof el.select !== 'function') return;
    
    // Check if it's already selected to avoid redundant flickering
    if (el.dataset.isSelecting === "true") return;
    el.dataset.isSelecting = "true";

    // Standard select
    el.select();
    
    // iOS Safari / Mobile Chrome fallback
    // setTimeout is required because the focus event is followed by a mouse/touch event 
    // that can collapse the selection.
    setTimeout(function() {
      el.select();
      
      // Additional fallback for specific types that support selection range
      try {
        if (el.setSelectionRange && el.type !== 'number') {
          el.setSelectionRange(0, el.value.length || 999);
        }
      } catch (e) {}
      
      el.dataset.isSelecting = "false";
    }, 50); // Increased delay slightly for better mobile reliability
  }

  function isNumericInput(el) {
    if (el.tagName !== 'INPUT') return false;
    if (el.readOnly || el.disabled) return false;
    
    return el.type === 'number' || 
           el.inputMode === 'decimal' || 
           el.inputMode === 'numeric' ||
           el.classList.contains('input-field') ||
           el.classList.contains('inp') ||
           el.classList.contains('lp-input') ||
           el.id.toLowerCase().indexOf('amount') !== -1 ||
           el.id.toLowerCase().indexOf('amt') !== -1;
  }

  // Handle focus (for tabbing)
  document.addEventListener('focus', function(e) {
    if (isNumericInput(e.target)) {
      selectAll(e.target);
    }
  }, true);

  // Handle click (for mouse/touch)
  // We use click instead of mousedown to ensure we catch the final state
  document.addEventListener('click', function(e) {
    if (isNumericInput(e.target)) {
      // Only select if it's the initial click that gave focus
      // Or if the user hasn't made a manual selection yet
      selectAll(e.target);
    }
  }, true);

})();
