// Main JavaScript file for GoCotano Food Delivery Platform

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Auto-hide alerts after 5 seconds
setTimeout(() => {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    alert.style.transition = 'opacity 0.5s';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 500);
  });
}, 5000);

// Form validation
const forms = document.querySelectorAll('form');
forms.forEach(form => {
  form.addEventListener('submit', function(e) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = '#F44336';
      } else {
        field.style.borderColor = '#E0E0E0';
      }
    });

    if (!isValid) {
      e.preventDefault();
      alert('Please fill in all required fields');
    }
  });
});

// Mobile menu toggle
const createMobileMenu = () => {
  const navbar = document.querySelector('.navbar-nav');
  if (navbar && window.innerWidth < 768) {
    navbar.style.display = navbar.style.display === 'none' ? 'flex' : 'none';
  }
};

// Back to top button
const createBackToTop = () => {
  const button = document.createElement('button');
  button.innerHTML = '↑';
  button.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: var(--primary-blue);
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
    cursor: pointer;
    display: none;
    box-shadow: var(--shadow-lg);
    z-index: 999;
  `;

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  document.body.appendChild(button);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      button.style.display = 'block';
    } else {
      button.style.display = 'none';
    }
  });
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  createBackToTop();
});

// Real-time clock for dashboard
const updateClock = () => {
  const clockElement = document.getElementById('live-clock');
  if (clockElement) {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
  }
};

setInterval(updateClock, 1000);
