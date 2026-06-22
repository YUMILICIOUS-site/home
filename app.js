// --- ADD TO THE TOP OF app.js ---
// Intersection Observer for Scroll Reveal
const revealOnScroll = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
    });
};

// --- UPDATE YOUR renderAllProducts function ---
// After the container.innerHTML line, add:
setTimeout(revealOnScroll, 100); 

// --- UPDATE YOUR renderProductCard function ---
// Ensure the div class includes "reveal" or starts with "card" 
// the CSS handles the transition.