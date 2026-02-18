import { sanitizeEmail, sanitizeString, checkRateLimit, isValidEmail } from './utils.js';

// Form submission handler with Firebase integration
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const rawEmail = emailInput.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Sanitize email
    const email = sanitizeEmail(rawEmail);
    
    // Enhanced validation
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
    }
    
    // Rate limiting
    const identifier = email;
    if (!checkRateLimit(identifier)) {
        showNotification('Too many submissions. Please wait a minute.', 'error');
        return;
    }
    
    // Disable button and show loading state
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    submitButton.style.opacity = '0.7';
    submitButton.style.cursor = 'not-allowed';
    
    try {
        // Check if Firebase modules are loaded
        
        if (!window.firebaseInitialized || !window.db || !window.firebaseModules) {
            throw new Error('Firebase is not initialized. Please refresh the page.');
        }
        
        const { collection, addDoc, serverTimestamp } = window.firebaseModules;
        
        // Add email to Firestore collection with better error handling
        try {
            const docRef = await addDoc(collection(window.db, 'emails'), {
                email: email,
                timestamp: serverTimestamp(),
                source: 'landing_page',
                userAgent: sanitizeString(navigator.userAgent.substring(0, 200)),
                createdAt: new Date().toISOString()
            });
        } catch (firestoreError) {
            throw firestoreError;
        }
        
        // Show success notification
        showNotification('🎉 You\'re on the list! We\'ll notify you as soon as access opens.', 'success');
        
        // Clear the input
        emailInput.value = '';
        
    } catch (error) {
        
        // Show error notification with helpful message
        let errorMessage = 'Something went wrong. Please try again.';
        
        if (error.message.includes('Firebase is not initialized')) {
            errorMessage = 'Configuration error. Please contact support.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please contact support.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Service temporarily unavailable. Please try again.';
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
    }
}


// Notification system - Premium design
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Create notification content with icon
    const icon = type === 'success' ? '✓' : '!';
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    // Premium styles with glassmorphism
    Object.assign(notification.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        padding: '20px 24px',
        borderRadius: '16px',
        background: type === 'success' 
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(231, 76, 60, 0.95) 0%, rgba(192, 57, 43, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: '15px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
        zIndex: '10000',
        animation: 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '420px',
        minWidth: '320px',
        border: type === 'success' 
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    });
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds with smooth animation
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}

// Add CSS animations and styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(450px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(450px);
            opacity: 0;
        }
    }
    
    .notification-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        flex-shrink: 0;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-message {
        line-height: 1.5;
        letter-spacing: 0.01em;
    }
    
    @media (max-width: 480px) {
        .notification {
            right: 16px !important;
            left: 16px !important;
            max-width: none !important;
            min-width: auto !important;
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Intersection Observer for scroll animations - Optimized for performance
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Unobserve after animation to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe pipeline image
    const pipelineImg = document.querySelector('.pipeline-image-container');
    if (pipelineImg) {
        pipelineImg.style.opacity = '0';
        pipelineImg.style.transform = 'translateY(30px)';
        pipelineImg.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(pipelineImg);
    }
    
    // Observe partner logos with stagger effect
    document.querySelectorAll('.partner-logo').forEach((logo, index) => {
        logo.style.opacity = '0';
        logo.style.transform = 'translateY(20px)';
        logo.style.transition = `opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`;
        observer.observe(logo);
    });
}

// CTA button scroll to form
function initCTAButtons() {
    const ctaButtons = document.querySelectorAll('#header-cta, #mockup-cta');
    const heroForm = document.querySelector('#hero-form');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            heroForm.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            // Focus on email input after scroll
            setTimeout(() => {
                document.querySelector('#hero-email').focus();
            }, 500);
        });
    });
}

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Attach form submission handlers
    const forms = document.querySelectorAll('.waitlist-form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Initialize features
    initSmoothScroll();
    initScrollAnimations();
    initCTAButtons();
    
    // Add hover effect to cards
    const cards = document.querySelectorAll('.pipeline-step, .app-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.3s ease';
        });
    });
    

});

// Handle window resize for responsive adjustments - Optimized with debouncing
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalculate any layout-dependent values if needed
        // Keeping this minimal for better performance
    }, 300);
}, { passive: true });

// Reduce motion for users who prefer it
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-fast', '0ms');
    document.documentElement.style.setProperty('--transition-base', '0ms');
    document.documentElement.style.setProperty('--transition-slow', '0ms');
}
