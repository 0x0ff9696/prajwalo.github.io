const navHTML = `
    <style>
        /* This temporary class forcefully stops all animations during the page load */
        .nav.no-anim, .nav.no-anim:after, .nav.no-anim:before, .nav.no-anim ul:after, .nav.no-anim ul li:before {
            transition: none !important;
        }
    </style>
    <!-- Starts invisible and frozen -->
    <nav class="nav no-anim" style="opacity: 0;">
        <ul>
            <li><a href="index.html" id="home">Home</a></li>
            <li><a href="exp.html" id="experience">Experience</a></li>
            <li><a href="blog.html" id="blogs">Blogs</a></li>
            <li><a href="pics.html" id="picture">Pics</a></li>
        </ul>
    </nav>
`;

document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("afterbegin", navHTML);

    const nav = document.querySelector(".nav");
    const links = document.querySelectorAll(".nav ul li a");
    const listItems = document.querySelectorAll(".nav ul li");
    
    // 1. Identify current active page
    let currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "" || currentPage === "/") currentPage = "index.html";

    let activeItem = null;
    links.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.parentElement.classList.add("active");
            activeItem = link.parentElement;
        }
    });
    
    if (!activeItem && listItems.length > 0) activeItem = listItems[0];

    // Core positioning function
    function setBubblePos(item) {
        if (!item || !nav) return;
        const ul = nav.querySelector("ul");
        const itemRect = item.getBoundingClientRect();
        const ulRect = ul.getBoundingClientRect();
        
        const leftOffset = itemRect.left - ulRect.left;
        const width = itemRect.width;

        nav.style.setProperty('--after-bg-position', leftOffset);
        nav.style.setProperty('--after-radial-bg-position', leftOffset + (width / 2));
        nav.style.setProperty('--after-bg-width', width);
        nav.style.setProperty('--after-bg-opacity', '100'); 
    }

    // Wait for your custom Mona Sans font to load so measurements are accurate
    document.fonts.ready.then(() => {
        const lastTabId = sessionStorage.getItem('lastNavTab');
        let lastItem = null;
        
        if (lastTabId) {
            const lastLink = document.getElementById(lastTabId);
            if (lastLink) lastItem = lastLink.parentElement;
        }

        if (lastItem && lastItem !== activeItem) {
            // Step 1: Snap to the old tab instantly (animations are blocked by .no-anim)
            setBubblePos(lastItem);
            
            // Step 2: Force the browser to render this position instantly
            void nav.offsetWidth; 
            
            // Step 3: Make the nav visible and remove the animation block
            nav.style.opacity = '1';
            nav.classList.remove('no-anim');
            
            // Step 4: Tell the browser to slide to the new tab!
            requestAnimationFrame(() => {
                setBubblePos(activeItem);
            });

        } else {
            // Direct visit/refresh: just snap to current tab
            setBubblePos(activeItem);
            void nav.offsetWidth;
            nav.style.opacity = '1';
            nav.classList.remove('no-anim');
        }

        // Re-enable hover interactions
        listItems.forEach(item => {
            item.addEventListener("mouseenter", () => setBubblePos(item));
        });
        
        nav.addEventListener("mouseleave", () => setBubblePos(activeItem));
    });

    // Save the clicked tab to memory before navigating away
    links.forEach(link => {
        link.addEventListener("click", () => {
            sessionStorage.setItem('lastNavTab', link.id);
        });
    });
});