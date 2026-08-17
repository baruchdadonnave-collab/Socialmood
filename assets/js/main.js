(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header + mobile CTA bar ---------- */

  var header = document.getElementById('siteHeader');
  var mobileCta = document.getElementById('mobileCta');
  var hero = document.getElementById('hero');
  var registerSection = document.getElementById('register');

  /* הסרגל הדביק נעלם כשסקשן ההרשמה על המסך, כדי לא להסתיר את
     כפתור התשלום ולא להתחרות בו */
  var registerInView = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 24);
    if (mobileCta) {
      var heroBottom = hero ? hero.offsetHeight - 120 : 400;
      mobileCta.classList.toggle('is-visible', y > heroBottom && !registerInView);
    }
  }

  if (registerSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      registerInView = entries[0].isIntersecting;
      onScroll();
    }, { threshold: 0.15 }).observe(registerSection);
  }

  /* ---------- Section 1: scroll pin + sequential cards ---------- */

  var workshopScroll = document.getElementById('workshopScroll');
  var workshopCards = workshopScroll
    ? workshopScroll.querySelectorAll('.workshop-card[data-step]')
    : [];
  var workshopTrack = workshopScroll
    ? workshopScroll.querySelector('.workshop-scroll__track')
    : null;
  var workshopStage = workshopScroll
    ? workshopScroll.querySelector('.workshop-stage')
    : null;
  var workshopMobile = workshopScroll
    ? workshopScroll.querySelector('.workshop-stage__img')
    : null;

  function isWorkshopMobileLayout() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function updateWorkshopGenieOrigins() {
    if (!workshopStage || !workshopMobile || !workshopCards.length) return;
    if (isWorkshopMobileLayout()) return;

    workshopCards.forEach(function (card) {
      card.classList.add('is-genie-measure');
    });

    var mobileRect = workshopMobile.getBoundingClientRect();
    var originX = mobileRect.left + mobileRect.width / 2;
    var originY = mobileRect.top + mobileRect.height * 0.56;

    workshopCards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var anchorX = rect.left + rect.width / 2;
      var anchorY = rect.bottom;
      var dx = originX - anchorX;
      var dy = originY - anchorY;
      var skewSign = dx >= 0 ? 1 : -1;

      card.style.setProperty('--genie-x', dx + 'px');
      card.style.setProperty('--genie-y', dy + 'px');
      card.style.setProperty('--genie-x-mid', (dx * 0.4) + 'px');
      card.style.setProperty('--genie-y-mid', (dy * 0.4) + 'px');
      card.style.setProperty('--genie-x-out-mid', (dx * 0.45) + 'px');
      card.style.setProperty('--genie-y-out-mid', (dy * 0.45) + 'px');
      card.style.setProperty('--genie-x-early', (dx * 0.08) + 'px');
      card.style.setProperty('--genie-y-early', (dy * 0.1) + 'px');
      card.style.setProperty('--genie-x-overshoot', (-dx * 0.04) + 'px');
      card.style.setProperty('--genie-y-overshoot', (-dy * 0.04) + 'px');
      card.style.setProperty('--genie-skew', (skewSign * 7) + 'deg');
      card.style.setProperty('--genie-skew-mid', (skewSign * 4) + 'deg');
      card.style.setProperty('--genie-skew-early', (skewSign * 1) + 'deg');
      card.style.setProperty('--genie-skew-over', (skewSign * -0.6) + 'deg');
      card.classList.remove('is-genie-measure');
    });
  }

  function getWorkshopProgress() {
    if (!workshopTrack) return 0;

    var rect = workshopTrack.getBoundingClientRect();
    var scrollRange = workshopTrack.offsetHeight - window.innerHeight;

    if (scrollRange <= 0) return 1;

    /* rect.top יורד מ-0 ל-scrollRange- שלילי בזמן הגלילה בתוך הסקשן הדביק */
    var progress = (-rect.top) / scrollRange;
    return Math.max(0, Math.min(1, progress));
  }

  function updateWorkshopCards() {
    if (!workshopScroll || !workshopCards.length || !workshopTrack) return;

    if (reduceMotion) {
      workshopCards.forEach(function (card) { card.classList.add('is-visible'); });
      return;
    }

    var progress = getWorkshopProgress();

    if (isWorkshopMobileLayout()) {
      updateWorkshopMobilePairs(progress);
      return;
    }

    var total = workshopCards.length;
    var activeStep = progress <= 0.01
      ? 0
      : Math.min(total, Math.ceil(progress * total));

    setWorkshopCardVisibility(function (index) {
      return index < activeStep;
    });
  }

  function updateWorkshopMobilePairs(progress) {
    var pairCount = Math.ceil(workshopCards.length / 2);
    var activePair = progress <= 0.01
      ? 0
      : Math.min(pairCount, Math.ceil(progress * pairCount));

    setWorkshopCardVisibility(function (index) {
      if (activePair <= 0) return false;
      return Math.floor(index / 2) === activePair - 1;
    });
  }

  function setWorkshopCardVisibility(isVisibleFn) {
    workshopCards.forEach(function (card, index) {
      var visible = isVisibleFn(index);
      card.setAttribute('aria-hidden', visible ? 'false' : 'true');

      if (visible) {
        if (card.classList.contains('is-visible') &&
            !card.classList.contains('is-genie-out')) {
          return;
        }

        card.classList.remove('is-genie-out');
        card.classList.add('is-visible');
        void card.offsetWidth;
        card.classList.add('is-genie-in');
        return;
      }

      if (card.classList.contains('is-visible') &&
          !card.classList.contains('is-genie-out')) {
        card.classList.remove('is-genie-in');
        void card.offsetWidth;
        card.classList.add('is-genie-out');
      }
    });
  }

  workshopCards.forEach(function (card) {
    card.addEventListener('animationend', function (event) {
      if (event.animationName === 'workshop-genie-in' ||
          event.animationName === 'workshop-slide-in') {
        card.classList.remove('is-genie-in');
      }

      if (event.animationName === 'workshop-genie-out' ||
          event.animationName === 'workshop-slide-out') {
        card.classList.remove('is-genie-out', 'is-visible');
      }
    });
  });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      updateWorkshopCards();
      ticking = false;
    });
  }, { passive: true });
  updateWorkshopGenieOrigins();
  onScroll();
  updateWorkshopCards();

  window.addEventListener('resize', function () {
    updateWorkshopGenieOrigins();
    updateWorkshopCards();
  }, { passive: true });
  window.addEventListener('load', function () {
    updateWorkshopGenieOrigins();
    updateWorkshopCards();
  });

  /* ---------- Testimonials: tap to focus card ---------- */

  var testimonialCards = document.querySelectorAll('.testimonials-showcase__card');

  testimonialCards.forEach(function (card) {
    card.addEventListener('click', function () {
      var isActive = card.classList.contains('is-active');

      testimonialCards.forEach(function (other) {
        other.classList.remove('is-active');
        other.setAttribute('aria-pressed', 'false');
      });

      if (!isActive) {
        card.classList.add('is-active');
        card.setAttribute('aria-pressed', 'true');
      }
    });
  });

  /* ---------- Scroll reveal ---------- */

  var revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    revealables.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- FAQ: accordion behaviour (one open at a time) ---------- */

  var faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- Toast ---------- */

  var toast = document.getElementById('toast');
  var toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 5000);
  }

  /* ---------- Registration form ---------- */

  var form = document.getElementById('registerForm');

  var validators = {
    fullName: function (value) {
      if (!value.trim()) return 'נא למלא שם מלא';
      if (value.trim().length < 2) return 'השם קצר מדי';
      return '';
    },
    phone: function (value) {
      var digits = value.replace(/\D/g, '');
      if (!digits) return 'נא למלא מספר טלפון';
      if (digits.length < 9 || digits.length > 15) return 'מספר הטלפון אינו תקין';
      return '';
    },
    email: function (value) {
      if (!value.trim()) return 'נא למלא כתובת אימייל';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return 'כתובת האימייל אינה תקינה';
      return '';
    }
  };

  function setFieldError(input, message) {
    var wrapper = input.closest('.field');
    var slot = document.querySelector('[data-error-for="' + input.name + '"]');
    if (wrapper) wrapper.classList.toggle('is-invalid', Boolean(message));
    if (slot) slot.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateField(input) {
    var validate = validators[input.name];
    if (!validate) return true;
    var message = validate(input.value);
    setFieldError(input, message);
    return !message;
  }

  if (form) {
    Object.keys(validators).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('is-invalid')) validateField(input);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var valid = true;
      var firstInvalid = null;

      Object.keys(validators).forEach(function (name) {
        var input = form.elements[name];
        if (!input) return;
        if (!validateField(input)) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      var terms = form.elements.terms;
      var termsSlot = document.querySelector('[data-error-for="terms"]');
      if (terms && !terms.checked) {
        valid = false;
        if (termsSlot) termsSlot.textContent = 'יש לאשר את תנאי ההרשמה';
        if (!firstInvalid) firstInvalid = terms;
      } else if (termsSlot) {
        termsSlot.textContent = '';
      }

      if (!valid) {
        if (firstInvalid) firstInvalid.focus({ preventScroll: false });
        showToast('בדקי את הפרטים המסומנים ונסי שוב');
        return;
      }

      /* נקודת החיבור לספק הסליקה: כאן יש להפנות לעמוד התשלום
         או לפתוח את ה-widget עם פרטי הנרשמת. */
      var payload = {
        fullName: form.elements.fullName.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        business: form.elements.business.value.trim()
      };

      console.info('[registration] ready for checkout', payload);
      showToast('הפרטים נקלטו. מעבירה אותך לעמוד התשלום המאובטח…');
    });
  }

  /* ---------- Footer year ---------- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
