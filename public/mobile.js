var searchInput = document.getElementById('phoneSearch');
var searchBtn = document.getElementById('searchBtn');
var googleLink = document.getElementById('googleLink');
var categoryGrid = document.getElementById('categoryGrid');
var loading = document.getElementById('loading');
var searchResults = document.getElementById('searchResults');
var phoneDetails = document.getElementById('phoneDetails');

var lastPhones = [];

// Update Google link as user types
searchInput.addEventListener('input', function () {
  var query = searchInput.value.trim();
  if (query) {
    googleLink.href = 'https://www.google.com/search?q=' + encodeURIComponent(query + ' full specifications');
    googleLink.style.display = 'inline-block';
  } else {
    googleLink.style.display = 'none';
  }
});

// Allow Enter key to search
searchInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    searchPhone();
  }
});

// Search button click
searchBtn.addEventListener('click', function () {
  searchPhone();
});

// Initialize Google link hidden
googleLink.style.display = 'none';

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function searchPhone() {
  var query = searchInput.value.trim();
  if (!query) return;

  // Update Google link
  googleLink.href = 'https://www.google.com/search?q=' + encodeURIComponent(query + ' full specifications');
  googleLink.style.display = 'inline-block';

  // Show loading, hide others
  categoryGrid.style.display = 'none';
  searchResults.style.display = 'none';
  phoneDetails.style.display = 'none';
  loading.style.display = 'block';
  searchBtn.disabled = true;

  try {
    var response = await fetch('/api/phone/search?q=' + encodeURIComponent(query));
    var data = await response.json();

    loading.style.display = 'none';
    searchBtn.disabled = false;

    if (data.status && data.data && data.data.phones && data.data.phones.length > 0) {
      lastPhones = data.data.phones;
      showResults(data.data.phones);
    } else {
      showError(query);
    }
  } catch (err) {
    loading.style.display = 'none';
    searchBtn.disabled = false;
    showError(query);
  }
}

function showResults(phones) {
  searchResults.style.display = 'block';

  var html = '<p class="results-title">FOUND ' + phones.length + ' RESULT' + (phones.length > 1 ? 'S' : '') + '</p>';

  phones.forEach(function (phone, index) {
    var slug = extractSlug(phone.detail || '');
    html += '<div class="phone-item" data-slug="' + escapeHtml(slug) + '">';
    if (phone.image) {
      html += '<img src="' + escapeHtml(phone.image) + '" alt="' + escapeHtml(phone.phone_name) + '" onerror="this.style.display=\'none\'">';
    }
    html += '<span class="phone-item-name">' + escapeHtml(phone.phone_name) + '</span>';
    html += '<span class="phone-item-arrow">&rarr;</span>';
    html += '</div>';
  });

  searchResults.innerHTML = html;
}

// Event delegation for phone item clicks
searchResults.addEventListener('click', function (e) {
  var item = e.target.closest('.phone-item');
  if (item && item.dataset.slug) {
    getDetails(item.dataset.slug);
  }
});

function extractSlug(detailUrl) {
  if (!detailUrl) return '';
  var parts = detailUrl.split('/');
  return parts[parts.length - 1] || '';
}

async function getDetails(slug) {
  if (!slug) return;

  searchResults.style.display = 'none';
  loading.style.display = 'block';

  try {
    var response = await fetch('/api/phone/details?slug=' + encodeURIComponent(slug));
    var data = await response.json();

    loading.style.display = 'none';

    if (data.status && data.data) {
      showDetails(data.data);
    } else {
      showError(searchInput.value.trim());
    }
  } catch (err) {
    loading.style.display = 'none';
    showError(searchInput.value.trim());
  }
}

function getSpecIcon(title) {
  var icons = {
    'Network': '&#128246;',
    'Launch': '&#128640;',
    'Body': '&#128208;',
    'Display': '&#128241;',
    'Platform': '&#129504;',
    'Memory': '&#128190;',
    'Main Camera': '&#128247;',
    'Selfie camera': '&#129331;',
    'Sound': '&#128266;',
    'Comms': '&#128225;',
    'Features': '&#11088;',
    'Battery': '&#128267;',
    'Misc': '&#128203;'
  };
  return icons[title] || '&#128204;';
}

function showDetails(phone) {
  phoneDetails.style.display = 'block';

  var html = '<button class="back-btn" id="backBtn">&larr; BACK TO RESULTS</button>';

  // Phone header
  html += '<div class="phone-header">';
  if (phone.thumbnail) {
    html += '<img class="phone-image" src="' + escapeHtml(phone.thumbnail) + '" alt="' + escapeHtml(phone.phone_name) + '" onerror="this.style.display=\'none\'">';
  }
  html += '<div class="phone-info">';
  html += '<div class="phone-name">' + escapeHtml(phone.phone_name || 'Unknown') + '</div>';
  if (phone.brand) {
    html += '<div class="phone-brand">' + escapeHtml(phone.brand) + '</div>';
  }
  if (phone.os) {
    html += '<div class="phone-os">OS: ' + escapeHtml(phone.os) + '</div>';
  }
  if (phone.dimension) {
    html += '<div class="phone-dimension">Dimensions: ' + escapeHtml(phone.dimension) + '</div>';
  }
  if (phone.release_date) {
    html += '<div class="phone-release">Released: ' + escapeHtml(phone.release_date) + '</div>';
  }
  html += '</div></div>';

  // Specifications
  if (phone.specifications && phone.specifications.length > 0) {
    html += '<div class="spec-grid">';
    phone.specifications.forEach(function (section) {
      html += '<div class="spec-section">';
      html += '<div class="spec-section-title">';
      html += '<span>' + getSpecIcon(section.title) + '</span>';
      html += '<span>' + escapeHtml(section.title || 'Other') + '</span>';
      html += '</div>';
      if (section.specs && section.specs.length > 0) {
        section.specs.forEach(function (spec) {
          html += '<div class="spec-row">';
          html += '<div class="spec-label">' + escapeHtml(spec.key || '') + '</div>';
          var valHtml = '';
          if (Array.isArray(spec.val)) {
            valHtml = spec.val.map(function (v) { return escapeHtml(v); }).join('<br>');
          } else {
            valHtml = escapeHtml(spec.val || '-');
          }
          html += '<div class="spec-value">' + valHtml + '</div>';
          html += '</div>';
        });
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Google search link
  var phoneName = phone.phone_name || searchInput.value.trim();
  html += '<div style="margin-top: 20px;">';
  html += '<a class="google-fallback" href="https://www.google.com/search?q=' + encodeURIComponent(phoneName + ' specifications') + '" target="_blank" rel="noopener noreferrer">&#127760; VIEW MORE ON GOOGLE</a>';
  html += '</div>';

  phoneDetails.innerHTML = html;

  // Add back button listener
  var backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      goBack();
    });
  }
}

function showError(query) {
  searchResults.style.display = 'block';
  var googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(query + ' full specifications');
  searchResults.innerHTML = '<div class="error-message">' +
    '<p>&#9888;&#65039; Could not fetch specifications from the database.</p>' +
    '<p style="color: #ffffff60; margin-top: 8px;">Try searching on Google instead:</p>' +
    '<a class="google-fallback" href="' + escapeHtml(googleUrl) + '" target="_blank" rel="noopener noreferrer">&#128269; SEARCH ON GOOGLE</a>' +
    '</div>';
}

function goBack() {
  phoneDetails.style.display = 'none';
  if (lastPhones.length > 0) {
    showResults(lastPhones);
  } else {
    categoryGrid.style.display = '';
  }
}
