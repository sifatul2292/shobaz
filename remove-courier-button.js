// Remove Send to Courier buttons from Angular admin
// Run in browser console on http://localhost:3007/sales/all-orders

(function() {
    // Find all buttons with "Send to Courier" text
    var buttons = document.querySelectorAll('button, a, mat-button, button[mat-button]');
    
    buttons.forEach(function(btn) {
        var text = btn.textContent || btn.innerText || '';
        if (text && text.includes('Send to Courier')) {
            btn.style.display = 'none';
            console.log('Hidden:', text);
        }
    });
    
    // Also check for any elements with this text
    var allElements = document.querySelectorAll('*');
    allElements.forEach(function(el) {
        var text = el.textContent || '';
        if (text === 'Send to Courier' || text.trim() === 'Send to Courier') {
            el.style.display = 'none';
            console.log('Hidden element:', el.tagName);
        }
    });
    
    // Watch for dynamically added elements
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element
                    var text = node.textContent || '';
                    if (text.includes('Send to Courier')) {
                        node.style.display = 'none';
                        console.log('Hidden new element');
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('✅ Send to Courier buttons removed!');
})();