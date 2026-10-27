/* ---------------------------------------------------------------------------
   Avodah Contractors · Equestrian Build Guide signup
   Sends the signup to Mailchimp, adds the "Equestrian Guide" tag (which starts
   the email series), records the ad source/campaign, then sends the visitor to
   the thank-you page.

   Loaded with `defer` from equestrian.html, so the DOM is parsed before this
   runs. Kept out of script.js because nothing else on the site uses it.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var THANK_YOU_URL = '/equestrian-guide-thank-you.html';

  var form = document.getElementById('eqg-form');
  if (!form) { return; }

  var email = document.getElementById('eqg-email');
  var emailError = document.getElementById('eqg-email-error');
  var formError = document.getElementById('eqg-form-error');
  var button = document.getElementById('eqg-submit');

  /* Keep the ad source/campaign for the visit, so it still rides along if the
     visitor browses the page before signing up. */
  var params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_campaign'].forEach(function (key) {
    try {
      if (params.get(key)) { sessionStorage.setItem('eqg_' + key, params.get(key)); }
    } catch (e) { /* private mode / storage blocked — fall back to the URL */ }
  });
  function stored(key) {
    try { return sessionStorage.getItem('eqg_' + key) || ''; }
    catch (e) { return params.get(key) || ''; }
  }
  document.getElementById('eqg-adsource').value = stored('utm_source');
  document.getElementById('eqg-adcampaign').value = stored('utm_campaign');

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function showEmailError(msg) {
    emailError.textContent = msg;
    email.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function showFormError(msg) {
    formError.textContent = msg;
    formError.hidden = !msg;
  }
  function goToThankYou() { window.location.href = THANK_YOU_URL; }

  email.addEventListener('input', function () {
    if (emailError.textContent) { showEmailError(''); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showFormError('');

    var value = email.value.trim();
    if (!value) {
      showEmailError('Enter your email address so we can send the guide.');
      email.focus();
      return;
    }
    if (!validEmail(value)) {
      showEmailError('Check your email address. It should look like name@example.com.');
      email.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';

    /* Mailchimp's JSONP endpoint lets us submit without leaving the page. */
    var cb = 'eqgCallback' + Date.now();
    var query = new URLSearchParams(new FormData(form)).toString();
    var url = form.action.replace('/post?', '/post-json?') + '&' + query + '&c=' + cb;
    var script = document.createElement('script');
    var timer = setTimeout(function () {
      fail('The signup didn’t go through. Check your connection and try again.');
    }, 12000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      if (script.parentNode) { script.parentNode.removeChild(script); }
    }
    function fail(msg) {
      cleanup();
      button.disabled = false;
      button.textContent = 'Get the Free Guide';
      showFormError(msg);
    }

    window[cb] = function (res) {
      var msg = (res && res.msg) || '';
      if (res && res.result === 'success') { cleanup(); goToThankYou(); return; }
      /* Already on Avodah's list: still give them the guide. */
      if (/already subscribed/i.test(msg)) { cleanup(); goToThankYou(); return; }
      if (/too many/i.test(msg)) {
        fail('Too many signup attempts from this address. Try again in a few minutes.');
        return;
      }
      fail('The signup didn’t go through. Check your details and try again, or call 330-601-1324.');
    };
    script.onerror = function () {
      fail('The signup didn’t go through. Check your connection and try again.');
    };
    script.src = url;
    document.body.appendChild(script);
  });
})();
