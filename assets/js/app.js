/**
 * NHỮNG NGÀY XƯA THƯƠNG NHỚ — KÝ ỨC TRƯỜNG ĐẠI HỌC KHOA HỌC HUẾ (1957 – 1986 – 2017 – 2027)
 * Interactive Archival Reader, Watercolor Exhibition, Colleagues Directory & Print Engine
 */

(function () {
  'use strict';

  const DATA = window.DHKH_DATA;
  if (!DATA) {
    console.error('Không tìm thấy dữ liệu window.DHKH_DATA');
    return;
  }

  // Application State
  const state = {
    activeTab: 'overview',
    activePeopleFilter: 'all',
    peopleSearchQuery: '',
    activeKtmxCategory: 'all',
    ktmxSearchQuery: '',
    activeKtmxId: DATA.ktmx.works[0] ? DATA.ktmx.works[0].id : 'ktmx-authors-colophon',
    activeS60Id: DATA.sach60.sections[0] ? DATA.sach60.sections[0].id : 's60-bia-muc-luc',
    s60SearchQuery: ''
  };

  // Map each watercolor ID to its primary reading destination
  const WATERCOLOR_DESTINATIONS = {
    'wc-01': { tab: 'sach60', id: 's60-c1-1-1', label: 'Đọc Chương 1 (1957–1975) & Truyện «Bạn cũ» →' },
    'wc-02': { tab: 'ktmx', id: 'ktmx-y-nghi-tren-duong', label: 'Đọc Hồi ký GS. Hoàng Đức Đạt (Tr. 7–12) →' },
    'wc-03': { tab: 'ktmx', id: 'ktmx-nhung-ngay-dau-kho-quen', label: 'Đọc Hồi ký GS. Nguyễn Quốc Lộc (Tr. 13–18) →' },
    'wc-04': { tab: 'ktmx', id: 'ktmx-nguoi-dua-do', label: 'Đọc bài thơ «Người đưa đò» & «Trang giáo án» →' },
    'wc-05': { tab: 'ktmx', id: 'ktmx-khoang-troi-mau-xanh', label: 'Đọc truyện ngắn «Khoảng trời màu xanh» (Tr. 73–78) →' },
    'wc-06': { tab: 'sach60', id: 's60-c2-2-2-6', label: 'Đọc tư liệu Lao động Tân Lâm & Nhập ngũ (Tr. 118–121) →' },
    'wc-07': { tab: 'ktmx', id: 'ktmx-gap-lai-nhung-sinh-vien-cu-cua-khoa-ngu-van-tren-dai-dat-mien-trung', label: 'Đọc Ghi chép Thầy Nguyễn Xuân Hòa (Tr. 19–22) →' },
    'wc-08': { tab: 'ktmx', id: 'ktmx-nguoi-quen', label: 'Đọc truyện ngắn «Người quen» – Phạm Khắc Liệu →' },
    'wc-09': { tab: 'sach60', id: 's60-loi-gioi-thieu', label: 'Đọc Lời giới thiệu & Lịch sử 60 năm ĐHKH Huế →' },
    'wc-10': { tab: 'ktmx', id: 'ktmx-gap-hue-tren-cao-nguyen', label: 'Đọc «Gặp Huế trên cao nguyên» & «Biển quê» →' },
    'wc-11': { tab: 'ktmx', id: 'ktmx-ho-tinh-tam', label: 'Đọc «Hồ Tịnh Tâm», «Ngã ba Tuần» & «Dương» →' },
    'wc-12': { tab: 'ktmx', id: 'ktmx_45_lum_dong_tien', label: 'Đọc «Những người hát bè trầm» & «Lúm đồng tiền» →' }
  };

  // Map Sách 60 Năm chapters to thematic watercolor illustrations
  const S60_CHAPTER_WATERCOLORS = {
    'Mở đầu': 'wc_09_70_nam_dhkh_hue_2026.jpg',
    'Chương 1: Trường ĐH Khoa học và Trường ĐH Văn khoa – Viện Đại học Huế (1957–1975)': 'wc_01_morin_ao_dai.jpg',
    'Chương 2: Trường Đại học Tổng hợp Huế (1975–1994)': 'wc_03_dem_mua_ha_noi_1976.jpg',
    'Chương 3: Trường Đại học Khoa học – Đại học Huế (1994–2017)': 'wc_09_70_nam_dhkh_hue_2026.jpg',
    'Kết luận': 'wc_07_chuyen_xe_mien_trung_tay_nguyen.jpg',
    'Phụ lục': 'wc_04_nguoi_dua_do_giao_an.jpg'
  };

  /* ========================================================================
     UTILITY FUNCTIONS
     ======================================================================== */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeVi(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getInitials(name) {
    if (!name) return 'ĐH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function padPage3(num) {
    return String(num).padStart(3, '0');
  }

  /* ========================================================================
     NAVIGATION & TAB SWITCHING
     ======================================================================== */
  function switchTab(tabName, options = {}) {
    state.activeTab = tabName;

    document.querySelectorAll('.nav-tab').forEach((btn) => {
      const isMatch = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const isMatch = panel.id === `tab-${tabName}`;
      panel.classList.toggle('active', isMatch);
      if (isMatch) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    if (!options.skipScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ========================================================================
     TAB 1: 12 WATERCOLOR ILLUSTRATIONS GALLERY & QUICK SEARCH
     ======================================================================== */
  function renderWatercolorGallery() {
    const grid = document.getElementById('watercolor-gallery-grid');
    if (!grid) return;

    const html = DATA.watercolors.map((wc, idx) => {
      const dest = WATERCOLOR_DESTINATIONS[wc.id] || {
        tab: 'ktmx',
        id: 'ktmx-loi-gioi-thieu',
        label: 'Đọc tư liệu gốc →'
      };

      const peopleButtons = (wc.relatedPeople || [])
        .map(
          (pName) =>
            `<button type="button" class="chip-person-jump" data-person="${escapeHtml(pName)}">${escapeHtml(pName)}</button>`
        )
        .join('');

      const archivalBtn = wc.archivalPhoto
        ? `<button type="button" class="wc-archival-thumb-btn" data-lightbox-src="assets/sach60_images/${escapeHtml(wc.archivalPhoto)}" data-lightbox-caption="${escapeHtml(wc.archivalCaption || wc.title)}">
             <img src="assets/sach60_images/${escapeHtml(wc.archivalPhoto)}" alt="${escapeHtml(wc.archivalCaption || '')}" class="wc-archival-thumb" loading="lazy" />
             <span>Đối chiếu ảnh tư liệu gốc</span>
           </button>`
        : '';

      return `
        <article class="wc-card" id="watercolor-card-${escapeHtml(wc.id)}">
          <div class="wc-artwork-wrap">
            <span class="wc-period-badge">Tranh ${idx + 1}/12 • ${escapeHtml(wc.period)}</span>
            <img
              src="assets/watercolors/${escapeHtml(wc.file)}"
              alt="Tranh màu nước: ${escapeHtml(wc.title)}"
              class="wc-artwork-img"
              loading="lazy"
              data-lightbox-src="assets/watercolors/${escapeHtml(wc.file)}"
              data-lightbox-caption="Tranh màu nước: ${escapeHtml(wc.title)} — ${escapeHtml(wc.sourceBook)}"
            />
          </div>
          <div class="wc-body">
            <div class="wc-source-tag">${escapeHtml(wc.sourceBook)}</div>
            <h3 class="wc-title">${escapeHtml(wc.title)}</h3>
            <blockquote class="wc-quote-box">
              ${escapeHtml(wc.quote)}
              <span class="wc-quote-author">— ${escapeHtml(wc.quoteAuthor)}</span>
            </blockquote>
            <div class="wc-people-row">
              <span class="wc-people-label">Bóng dáng thầy cô &amp; tác giả:</span>
              ${peopleButtons}
            </div>
            <div class="wc-archival-strip">
              ${archivalBtn}
              <button type="button" class="btn-text-link" data-wc-goto-tab="${escapeHtml(dest.tab)}" data-wc-goto-id="${escapeHtml(dest.id)}">
                ${escapeHtml(dest.label)}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    grid.innerHTML = html;
  }

  function handleQuickSearch(rawQuery) {
    const dropdown = document.getElementById('quick-search-results');
    if (!dropdown) return;

    const q = normalizeVi(rawQuery);
    if (!q || q.length < 2) {
      dropdown.setAttribute('hidden', '');
      dropdown.innerHTML = '';
      return;
    }

    const matchedPeople = DATA.people
      .filter((p) => {
        const hay = normalizeVi(p.name + ' ' + (p.units || []).join(' ') + ' ' + (p.roles || []).join(' '));
        return hay.includes(q);
      })
      .slice(0, 6);

    const matchedKtmx = DATA.ktmx.works
      .filter((w) => {
        const hay = normalizeVi(w.title + ' ' + w.author + ' ' + w.content);
        return hay.includes(q);
      })
      .slice(0, 4);

    const matchedS60 = DATA.sach60.sections
      .filter((s) => normalizeVi(s.title + ' ' + s.chapter).includes(q))
      .slice(0, 3);

    const items = [];

    matchedPeople.forEach((p) => {
      const totalRefs = (p.ktmxRefs ? p.ktmxRefs.length : 0) + (p.s60Refs ? p.s60Refs.length : 0);
      items.push(`
        <button type="button" class="quick-result-item" data-quick-type="person" data-person="${escapeHtml(p.name)}">
          <div>
            <span class="quick-result-name">Thầy/Cô / Tác giả: ${escapeHtml(p.name)}</span>
            <span class="quick-result-sub">${escapeHtml((p.units || []).slice(0, 3).join(' • '))}</span>
          </div>
          <span class="quick-result-badge">${totalRefs} tư liệu</span>
        </button>
      `);
    });

    matchedKtmx.forEach((w) => {
      items.push(`
        <button type="button" class="quick-result-item" data-quick-type="ktmx" data-work-id="${escapeHtml(w.id)}">
          <div>
            <span class="quick-result-name">«${escapeHtml(w.title)}» — ${escapeHtml(w.author)}</span>
            <span class="quick-result-sub">Khoảng trời màu xanh (1986) • ${escapeHtml(w.genre)} • Trang ${escapeHtml(w.bookPages)}</span>
          </div>
          <span class="quick-result-badge">Đọc bài</span>
        </button>
      `);
    });

    matchedS60.forEach((s) => {
      items.push(`
        <button type="button" class="quick-result-item" data-quick-type="s60" data-sec-id="${escapeHtml(s.id)}">
          <div>
            <span class="quick-result-name">${escapeHtml(s.title)}</span>
            <span class="quick-result-sub">Sách 60 năm ĐHKH Huế • Trang ${s.startPage}–${s.endPage}</span>
          </div>
          <span class="quick-result-badge">Mở chương</span>
        </button>
      `);
    });

    if (items.length === 0) {
      dropdown.innerHTML = `<div style="padding:14px 16px;color:var(--ink-muted);font-size:0.9rem;">Không tìm thấy kết quả khớp với “${escapeHtml(rawQuery)}”. Hãy thử gõ họ tên hoặc chuyển sang tab Tìm Bóng Dáng Thầy Cô.</div>`;
      dropdown.removeAttribute('hidden');
      return;
    }

    dropdown.innerHTML = items.join('');
    dropdown.removeAttribute('hidden');
  }

  /* ========================================================================
     TAB 2: PEOPLE & COLLEAGUES DIRECTORY (379 PEOPLE)
     ======================================================================== */
  function matchesPersonCategory(person, filterKey) {
    if (filterKey === 'all') return true;
    const units = person.units || [];
    const unitsNorm = normalizeVi(units.join(' | '));
    const hasKtmx = person.ktmxRefs && person.ktmxRefs.length > 0;
    const hasS60 = person.s60Refs && person.s60Refs.length > 0;

    if (filterKey === 'both') return hasKtmx && hasS60;
    if (filterKey === 'ktmx') return hasKtmx;
    if (filterKey === 'leaders') {
      return (
        unitsNorm.includes('hieu truong') ||
        unitsNorm.includes('ban giam hieu') ||
        unitsNorm.includes('bi thu') ||
        unitsNorm.includes('hoi dong truong') ||
        unitsNorm.includes('chu tich cong doan') ||
        unitsNorm.includes('dai hoc khoa hoc') ||
        unitsNorm.includes('dai hoc van khoa')
      );
    }
    if (filterKey === 'gspgs') {
      return unitsNorm.includes('giao su') || unitsNorm.includes('nha giao');
    }
    if (filterKey === 'khoa-van-su') {
      return (
        unitsNorm.includes('ngu van') ||
        unitsNorm.includes('lich su') ||
        unitsNorm.includes('van khoa') ||
        unitsNorm.includes('han nom')
      );
    }
    if (filterKey === 'khoa-tu-nhien') {
      return (
        unitsNorm.includes('toan') ||
        unitsNorm.includes('vat ly') ||
        unitsNorm.includes('hoa hoc') ||
        unitsNorm.includes('sinh hoc') ||
        unitsNorm.includes('dia ly') ||
        unitsNorm.includes('dia chat') ||
        unitsNorm.includes('cong nghe thong tin') ||
        unitsNorm.includes('dien tu') ||
        unitsNorm.includes('moi truong') ||
        unitsNorm.includes('kien truc')
      );
    }
    return true;
  }

  function updatePeopleFilterCounts() {
    const counts = {
      all: DATA.people.length,
      both: DATA.people.filter((p) => matchesPersonCategory(p, 'both')).length,
      ktmx: DATA.people.filter((p) => matchesPersonCategory(p, 'ktmx')).length,
      leaders: DATA.people.filter((p) => matchesPersonCategory(p, 'leaders')).length,
      gspgs: DATA.people.filter((p) => matchesPersonCategory(p, 'gspgs')).length,
      'khoa-van-su': DATA.people.filter((p) => matchesPersonCategory(p, 'khoa-van-su')).length,
      'khoa-tu-nhien': DATA.people.filter((p) => matchesPersonCategory(p, 'khoa-tu-nhien')).length
    };

    const labels = {
      all: `Tất cả (${counts.all})`,
      both: `Xuất hiện ở cả 2 sách (${counts.both})`,
      ktmx: `Trong «Khoảng trời màu xanh» (${counts.ktmx})`,
      leaders: `Lãnh đạo Trường qua các thời kỳ (${counts.leaders})`,
      gspgs: `GS / PGS / NGND / NGƯT (${counts.gspgs})`,
      'khoa-van-su': `Khoa Ngữ văn & Lịch sử (${counts['khoa-van-su']})`,
      'khoa-tu-nhien': `Các Khoa Tự nhiên & Kỹ thuật (${counts['khoa-tu-nhien']})`
    };

    document.querySelectorAll('.filter-pill[data-pfilter]').forEach((btn) => {
      const k = btn.getAttribute('data-pfilter');
      if (labels[k]) btn.textContent = labels[k];
    });
  }

  function renderPeopleDirectory() {
    const grid = document.getElementById('people-list-grid');
    if (!grid) return;

    const q = normalizeVi(state.peopleSearchQuery);

    const filtered = DATA.people.filter((p) => {
      if (!matchesPersonCategory(p, state.activePeopleFilter)) return false;
      if (!q) return true;
      const hay = normalizeVi(
        p.name + ' ' + (p.units || []).join(' ') + ' ' + (p.roles || []).join(' ')
      );
      return hay.includes(q);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px; text-align: center; background: var(--bg-paper-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
          <p style="margin:0; font-family: var(--font-serif); font-size: 1.1rem; color: var(--ink-secondary);">
            Không tìm thấy thầy cô hoặc tác giả nào khớp với bộ lọc hiện tại.
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((p) => {
        const avatarHtml = p.portrait
          ? `<img src="assets/sach60_images/${escapeHtml(p.portrait)}" alt="Chân dung ${escapeHtml(p.name)}" class="person-avatar" loading="lazy" />`
          : `<div class="person-avatar-placeholder" aria-hidden="true">${escapeHtml(getInitials(p.name))}</div>`;

        const unitBadges = (p.units || [])
          .slice(0, 3)
          .map((u) => `<span class="unit-tag">${escapeHtml(u)}</span>`)
          .join('');

        const roleText = (p.roles || [])[0] || '';
        const ktmxCount = p.ktmxRefs ? p.ktmxRefs.length : 0;
        const s60Count = p.s60Refs ? p.s60Refs.length : 0;

        return `
          <button type="button" class="person-card" data-person="${escapeHtml(p.name)}" role="listitem">
            <div class="person-card-top">
              ${avatarHtml}
              <div>
                <h3 class="person-name">${escapeHtml(p.name)}</h3>
                <div class="person-units">${unitBadges}</div>
                <p class="person-role-preview">${escapeHtml(roleText)}</p>
              </div>
            </div>
            <div class="person-card-footer">
              <span>
                ${ktmxCount > 0 ? `<span class="ref-pill-ktmx">Khoảng trời màu xanh (${ktmxCount})</span>` : ''}
                ${s60Count > 0 ? `<span class="ref-pill-s60">Sách 60 năm (${s60Count})</span>` : ''}
              </span>
              <span style="color:var(--accent-sky);">Xem hồ sơ →</span>
            </div>
          </button>
        `;
      })
      .join('');
  }

  function openPersonModal(personName) {
    const modal = document.getElementById('person-modal');
    const titleEl = document.getElementById('person-modal-title');
    const bodyEl = document.getElementById('person-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    const targetNorm = normalizeVi(personName);
    const person =
      DATA.people.find((p) => normalizeVi(p.name) === targetNorm) ||
      DATA.people.find((p) => normalizeVi(p.name).includes(targetNorm));

    if (!person) {
      // Fallback: open people tab and search
      state.peopleSearchQuery = personName;
      const input = document.getElementById('people-filter-input');
      if (input) input.value = personName;
      renderPeopleDirectory();
      switchTab('people');
      return;
    }

    titleEl.textContent = person.name;

    const portraitHtml = person.portrait
      ? `<img src="assets/sach60_images/${escapeHtml(person.portrait)}" alt="Chân dung ${escapeHtml(person.name)}" class="person-modal-portrait" />`
      : `<div class="person-avatar-placeholder" style="width:72px;height:72px;font-size:1.35rem;">${escapeHtml(getInitials(person.name))}</div>`;

    const unitsHtml = (person.units || [])
      .map((u) => `<span class="unit-tag">${escapeHtml(u)}</span>`)
      .join(' ');

    const rolesListHtml = (person.roles || [])
      .map((r) => `<li style="margin-bottom:6px;">${escapeHtml(r)}</li>`)
      .join('');

    const ktmxSectionHtml =
      person.ktmxRefs && person.ktmxRefs.length > 0
        ? `
          <div class="person-ref-section">
            <h4>Trong ấn phẩm «Khoảng trời màu xanh (1976–1986)» (${person.ktmxRefs.length} mục)</h4>
            <div class="person-ref-list">
              ${person.ktmxRefs
                .map(
                  (ref) => `
                  <button type="button" class="person-ref-btn" data-modal-ktmx="${escapeHtml(ref.workId)}">
                    <div>
                      <strong>${escapeHtml(ref.title)}</strong>
                      <div style="font-size:0.82rem;color:var(--ink-muted);">${escapeHtml(ref.relation)} • Trang sách gốc: ${escapeHtml(ref.bookPages)}</div>
                    </div>
                    <span style="color:var(--accent-sky);font-weight:700;font-size:0.84rem;">Đọc tác phẩm →</span>
                  </button>
                `
                )
                .join('')}
            </div>
          </div>
        `
        : '';

    const s60SectionHtml =
      person.s60Refs && person.s60Refs.length > 0
        ? `
          <div class="person-ref-section">
            <h4>Trong «Sách Lịch sử 60 năm Trường ĐHKH Huế (1957–2017)» (${person.s60Refs.length} trang tư liệu)</h4>
            <div class="person-ref-list">
              ${person.s60Refs
                .map(
                  (ref) => `
                  <button type="button" class="person-ref-btn" data-modal-s60-sec="${escapeHtml(ref.sectionId)}" data-modal-s60-page="${ref.page}">
                    <div>
                      <strong>Trang ${ref.page} — Sách Lịch sử 60 năm ĐHKH Huế</strong>
                      <div style="font-size:0.83rem;color:var(--ink-secondary);margin-top:2px;">${escapeHtml(ref.context)}</div>
                    </div>
                    <span style="color:var(--accent-terracotta);font-weight:700;font-size:0.84rem;white-space:nowrap;">Mở trang ${ref.page} →</span>
                  </button>
                `
                )
                .join('')}
            </div>
          </div>
        `
        : '';

    bodyEl.innerHTML = `
      <div class="person-modal-hero">
        ${portraitHtml}
        <div>
          <div class="person-units" style="margin-bottom:10px;">${unitsHtml}</div>
          <ul style="margin:0;padding-left:18px;font-size:0.92rem;color:var(--ink-secondary);line-height:1.55;">
            ${rolesListHtml}
          </ul>
        </div>
      </div>
      ${ktmxSectionHtml}
      ${s60SectionHtml}
    `;

    modal.removeAttribute('hidden');
  }

  /* ========================================================================
     TAB 3: KHOẢNG TRỜI MÀU XANH (1976–1986) FULL READER
     ======================================================================== */
  function renderKtmxToc() {
    const tocEl = document.getElementById('ktmx-toc-list');
    if (!tocEl) return;

    const q = normalizeVi(state.ktmxSearchQuery);
    const cat = state.activeKtmxCategory;

    if (cat === 'authors') {
      tocEl.innerHTML = `
        <div class="toc-group-heading">Chú thích Tác giả &amp; Xuất bản</div>
        <button type="button" class="toc-item-btn ${state.activeKtmxId === 'ktmx-authors-colophon' ? 'active' : ''}" data-ktmx-id="ktmx-authors-colophon">
          <span class="toc-item-title">47. Chú thích 45 Tác giả &amp; Thông tin Xuất bản (1986)</span>
          <span class="toc-item-meta">Trang 138–146 • Tiểu sử 45 tác giả &amp; Mục lục gốc</span>
        </button>
      `;
      return;
    }

    const filteredWorks = DATA.ktmx.works.filter((w) => {
      if (cat !== 'all' && w.category !== cat) return false;
      if (!q) return true;
      const hay = normalizeVi(w.title + ' ' + w.author + ' ' + w.content + ' ' + (w.authorBio || ''));
      return hay.includes(q);
    });

    let currentGroup = '';
    const htmlParts = [];

    filteredWorks.forEach((w) => {
      if (w.category !== currentGroup) {
        currentGroup = w.category;
        htmlParts.push(`<div class="toc-group-heading">${escapeHtml(currentGroup)}</div>`);
      }
      const isActive = state.activeKtmxId === w.id;
      htmlParts.push(`
        <button type="button" class="toc-item-btn ${isActive ? 'active' : ''}" data-ktmx-id="${escapeHtml(w.id)}">
          <span class="toc-item-title">${w.index}. ${escapeHtml(w.title)}</span>
          <span class="toc-item-meta">${escapeHtml(w.author)} • Tr. ${escapeHtml(w.bookPages)}</span>
        </button>
      `);
    });

    if (cat === 'all' && (!q || normalizeVi('Chú thích 45 tác giả thông tin xuất bản').includes(q))) {
      htmlParts.push(`<div class="toc-group-heading">Phụ lục Tiểu sử Tác giả (Tr. 138–146)</div>`);
      htmlParts.push(`
        <button type="button" class="toc-item-btn ${state.activeKtmxId === 'ktmx-authors-colophon' ? 'active' : ''}" data-ktmx-id="ktmx-authors-colophon">
          <span class="toc-item-title">47. Chú thích 45 Tác giả &amp; Lưu chiểu (9/1986)</span>
          <span class="toc-item-meta">Ban Biên tập • Tr. 138–146</span>
        </button>
      `);
    }

    tocEl.innerHTML =
      htmlParts.join('') ||
      `<div style="padding:12px;color:var(--ink-muted);font-size:0.86rem;">Không tìm thấy bài viết nào khớp từ khóa.</div>`;
  }

  function formatKtmxBodyContent(work) {
    const raw = (work.content || '').trim();
    if (!raw) return '';

    if (work.genre === 'Thơ') {
      const stanzas = raw.split(/\n\s*\n/);
      const stanzasHtml = stanzas
        .map((stanza) => {
          const lines = stanza
            .split('\n')
            .map((l) => `<span class="poem-line">${escapeHtml(l.trim())}</span>`)
            .join('');
          return `<div class="poem-stanza">${lines}</div>`;
        })
        .join('');
      return `<div class="literary-poem-body">${stanzasHtml}</div>`;
    }

    const paragraphs = raw.split(/\n\s*\n/);
    const parasHtml = paragraphs
      .map((p) => {
        const cleaned = p
          .split('\n')
          .map((line) => escapeHtml(line.trim()))
          .join('<br/>');
        return `<p>${cleaned}</p>`;
      })
      .join('');
    return `<div class="literary-prose-body">${parasHtml}</div>`;
  }

  function renderKtmxAuthorsAndColophon(articleEl) {
    const col = DATA.ktmx.colophon;
    const notesHtml = DATA.ktmx.authorNotes
      .map(
        (n) => `
        <div style="padding:12px 14px;background:var(--bg-paper);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);margin-bottom:10px;">
          <strong style="color:var(--accent-terracotta);font-family:var(--font-serif);">${n.number}. ${escapeHtml(n.name)}:</strong>
          <span style="color:var(--ink-primary);margin-left:4px;">${escapeHtml(n.bio)}</span>
        </div>
      `
      )
      .join('');

    const scanPages = [139, 140, 141, 142, 143, 144, 145, 146, 147];
    const scansHtml = scanPages
      .map((pNum) => {
        const file = `assets/ktmx_pages/page_${padPage3(pNum)}.jpg`;
        return `
          <div class="scan-page-card" data-lightbox-src="${file}" data-lightbox-caption="Khoảng trời màu xanh (1986) — Trang scan gốc (PDF trang ${pNum})">
            <img src="${file}" alt="Trang scan gốc ${pNum}" loading="lazy" />
            <div class="scan-page-label">Bản gốc PDF Tr. ${pNum}</div>
          </div>
        `;
      })
      .join('');

    articleEl.innerHTML = `
      <div class="article-meta-bar">
        <span class="article-cat-badge">Tư liệu Gốc Năm 1986 • Tiểu sử 45 Tác giả</span>
        <span class="article-page-badge">Trang sách gốc: 138 – 146</span>
      </div>
      <h2 class="article-title">Chú Thích 45 Tác Giả &amp; Thông Tin Xuất Bản (Tháng 9/1986)</h2>
      <div class="article-author-line">Khoa Ngữ văn &amp; Đoàn TNCS Hồ Chí Minh Trường Đại học Tổng hợp Huế</div>

      <div class="article-author-bio-box">
        <p style="margin:0 0 6px;"><strong>${escapeHtml(col.dedicationBanner)}</strong></p>
        <p style="margin:0;">
          Chịu trách nhiệm xuất bản: <strong>${escapeHtml(col.publisherResponsible)}</strong> •
          Biên tập: <strong>${escapeHtml((col.editors || []).join(' – '))}</strong> •
          Sửa bản in: <strong>${escapeHtml(col.proofreader)}</strong> •
          Bìa: <strong>${escapeHtml(col.coverArtist)}</strong> •
          Trình bày: <strong>${escapeHtml(col.layoutArtist)}</strong>.<br/>
          <em>${escapeHtml(col.printInfo)}</em>
        </p>
      </div>

      <div class="literary-prose-body">
        ${notesHtml}
      </div>

      <div class="original-scans-box">
        <div class="original-scans-header">
          <h4>Xem trang in gốc năm 1986 (Trang 138–147)</h4>
          <span style="font-size:0.82rem;color:var(--ink-muted);">Bấm vào trang sách để phóng to bản in năm 1986</span>
        </div>
        <div class="scans-strip-grid">
          ${scansHtml}
        </div>
      </div>

      <div class="reader-nav-footer">
        <button type="button" class="btn-secondary" data-ktmx-id="${escapeHtml(DATA.ktmx.works[DATA.ktmx.works.length - 1].id)}">
          ← Quay lại bài trước: «${escapeHtml(DATA.ktmx.works[DATA.ktmx.works.length - 1].title)}»
        </button>
        <button type="button" class="btn-primary" data-ktmx-id="${escapeHtml(DATA.ktmx.works[0].id)}">
          Về bài mở đầu: «${escapeHtml(DATA.ktmx.works[0].title)}» →
        </button>
      </div>
    `;
  }

  function renderKtmxArticle(workId) {
    state.activeKtmxId = workId;
    renderKtmxToc();

    const articleEl = document.getElementById('ktmx-article-view');
    if (!articleEl) return;

    if (workId === 'ktmx-authors-colophon') {
      renderKtmxAuthorsAndColophon(articleEl);
      return;
    }

    const workIndex = DATA.ktmx.works.findIndex((w) => w.id === workId);
    const work = workIndex >= 0 ? DATA.ktmx.works[workIndex] : DATA.ktmx.works[0];
    if (!work) return;

    const prevWork = workIndex > 0 ? DATA.ktmx.works[workIndex - 1] : null;
    const nextWork = workIndex < DATA.ktmx.works.length - 1 ? DATA.ktmx.works[workIndex + 1] : null;

    const wcObj = DATA.watercolors.find((wc) => wc.file === work.watercolorImage) || DATA.watercolors[0];

    const dedicationHtml = work.dedication
      ? `<div class="article-dedication">${escapeHtml(work.dedication)}</div>`
      : '';

    const authorBioHtml = work.authorBio
      ? `<div class="article-author-bio-box">
           <strong>Chú thích tác giả (1986):</strong> ${escapeHtml(work.authorBio)}
         </div>`
      : '';

    const dateNoteHtml = work.dateNote
      ? `<div class="article-date-signature">${escapeHtml(work.dateNote)}</div>`
      : '';

    const mentionedHtml =
      work.mentionedPeople && work.mentionedPeople.length > 0
        ? `
          <div style="margin-top:22px;padding:12px 16px;background:var(--bg-paper);border-radius:var(--radius-sm);display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
            <span style="font-size:0.82rem;font-weight:700;color:var(--ink-secondary);">Thầy cô &amp; tác giả gắn với tác phẩm:</span>
            ${work.mentionedPeople
              .map(
                (pName) =>
                  `<button type="button" class="chip-person-jump" data-person="${escapeHtml(pName)}">${escapeHtml(pName)}</button>`
              )
              .join('')}
          </div>
        `
        : '';

    const scansHtml = (work.pdfPages || [])
      .map((pNum) => {
        const file = `assets/ktmx_pages/page_${padPage3(pNum)}.jpg`;
        return `
          <div class="scan-page-card" data-lightbox-src="${file}" data-lightbox-caption="«${escapeHtml(work.title)}» (${escapeHtml(work.author)}) — Bản in gốc năm 1986 (PDF trang ${pNum})">
            <img src="${file}" alt="Trang sách gốc ${pNum}" loading="lazy" />
            <div class="scan-page-label">Trang in gốc (PDF Tr. ${pNum})</div>
          </div>
        `;
      })
      .join('');

    articleEl.innerHTML = `
      <div class="article-meta-bar">
        <span class="article-cat-badge">${escapeHtml(work.category)} • ${escapeHtml(work.genre)}</span>
        <span class="article-page-badge">Khoảng trời màu xanh (1986) • Trang ${escapeHtml(work.bookPages)}</span>
      </div>

      <h2 class="article-title">${escapeHtml(work.title)}</h2>
      <div class="article-author-line">
        Tác giả:
        <button type="button" class="btn-text-link" style="font-size:1.08rem;color:var(--accent-terracotta);" data-person="${escapeHtml(work.author)}">
          ${escapeHtml(work.author)}
        </button>
      </div>

      ${dedicationHtml}
      ${authorBioHtml}

      <figure class="article-watercolor-figure">
        <img
          src="assets/watercolors/${escapeHtml(work.watercolorImage)}"
          alt="Tranh minh họa màu nước cho tác phẩm ${escapeHtml(work.title)}"
          loading="lazy"
          data-lightbox-src="assets/watercolors/${escapeHtml(work.watercolorImage)}"
          data-lightbox-caption="Minh họa màu nước: ${escapeHtml(wcObj.title)}"
        />
        <figcaption>
          Tranh màu nước minh họa: <strong>${escapeHtml(wcObj.title)}</strong>
        </figcaption>
      </figure>

      ${formatKtmxBodyContent(work)}
      ${dateNoteHtml}
      ${mentionedHtml}

      <div class="original-scans-box">
        <div class="original-scans-header">
          <h4>Đối chiếu Trang Sách In Gốc Năm 1986 (Trang ${escapeHtml(work.bookPages)})</h4>
          <span style="font-size:0.82rem;color:var(--ink-muted);">Bấm vào hình để phóng to trang sách gốc năm 1986</span>
        </div>
        <div class="scans-strip-grid">
          ${scansHtml}
        </div>
      </div>

      <div class="reader-nav-footer">
        ${
          prevWork
            ? `<button type="button" class="btn-secondary" data-ktmx-id="${escapeHtml(prevWork.id)}">← Bài trước: «${escapeHtml(prevWork.title)}»</button>`
            : `<span></span>`
        }
        ${
          nextWork
            ? `<button type="button" class="btn-primary" data-ktmx-id="${escapeHtml(nextWork.id)}">Bài tiếp theo: «${escapeHtml(nextWork.title)}» →</button>`
            : `<button type="button" class="btn-primary" data-ktmx-id="ktmx-authors-colophon">Xem Chú thích 45 Tác giả (Tr. 138–146) →</button>`
        }
      </div>
    `;
  }

  /* ========================================================================
     TAB 4: SÁCH 60 NĂM ĐHKH HUẾ (1957–2017) FULL READER
     ======================================================================== */
  function renderS60Toc() {
    const tocEl = document.getElementById('s60-toc-list');
    if (!tocEl) return;

    let currentChap = '';
    const htmlParts = [];

    DATA.sach60.sections.forEach((sec) => {
      if (sec.chapter !== currentChap) {
        currentChap = sec.chapter;
        htmlParts.push(`<div class="toc-group-heading">${escapeHtml(currentChap)}</div>`);
      }
      const isActive = state.activeS60Id === sec.id;
      htmlParts.push(`
        <button type="button" class="toc-item-btn ${isActive ? 'active' : ''}" data-s60-id="${escapeHtml(sec.id)}">
          <span class="toc-item-title">${escapeHtml(sec.title)}</span>
          <span class="toc-item-meta">Trang ${sec.startPage} – ${sec.endPage}</span>
        </button>
      `);
    });

    tocEl.innerHTML = htmlParts.join('');
  }

  function renderS60PageBlock(block, pageNum) {
    if (block.type === 'image') {
      const src = `assets/sach60_images/${escapeHtml(block.file)}`;
      const cap = block.caption || `Ảnh tư liệu lịch sử — Sách 60 năm Trường ĐHKH Huế (Trang ${pageNum})`;
      return `
        <figure class="s60-photo-figure">
          <img
            src="${src}"
            alt="${escapeHtml(cap)}"
            loading="lazy"
            data-lightbox-src="${src}"
            data-lightbox-caption="${escapeHtml(cap)} (Trang ${pageNum})"
          />
          <figcaption>${escapeHtml(cap)}</figcaption>
        </figure>
      `;
    }

    if (block.type === 'table') {
      const rows = block.rows || [];
      if (rows.length === 0) return '';
      const unitHeader = block.unit
        ? `<div class="table-unit-banner">${escapeHtml(block.unit)}</div>`
        : '';
      const rowsHtml = rows
        .map((row, rIdx) => {
          const cellTag = rIdx === 0 ? 'th' : 'td';
          const cells = row
            .map((cell) => `<${cellTag}>${escapeHtml(cell || '')}</${cellTag}>`)
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      return `
        <div class="table-scroll-container">
          ${unitHeader}
          <table class="archival-table">
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;
    }

    if (block.type === 'text') {
      const rawText = (block.text || '').trim();
      if (!rawText) return '';

      // Split into logical lines and group into paragraphs / headings / footnotes
      const lines = rawText.split('\n');
      const paras = [];
      let buf = [];

      const flushBuf = () => {
        if (buf.length === 0) return;
        const joined = buf.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) {
          if (/^\d+\.\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(joined) && joined.length < 220) {
            paras.push(`<div class="s60-footnote-block">${escapeHtml(joined)}</div>`);
          } else {
            paras.push(`<p>${escapeHtml(joined)}</p>`);
          }
        }
        buf = [];
      };

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          flushBuf();
          return;
        }
        // Check if heading line (e.g. CHƯƠNG 1, 1.1., PHỤ LỤC, I., II.)
        if (
          /^(CHƯƠNG\s+\d+|PHỤ LỤC\s*\d*|KẾT LUẬN|LỜI GIỚI THIỆU|LỜI NÓI ĐẦU|TÀI LIỆU THAM KHẢO|\d+\.\d+(\.\d+)?\.\s+)/i.test(
            trimmed
          ) &&
          trimmed.length < 130
        ) {
          flushBuf();
          paras.push(`<h3 class="s60-heading-block">${escapeHtml(trimmed)}</h3>`);
          return;
        }

        buf.push(trimmed);
        if (/[.!?:;”"]$/.test(trimmed) && buf.join(' ').length > 260) {
          flushBuf();
        }
      });
      flushBuf();

      return `<div class="literary-prose-body">${paras.join('')}</div>`;
    }

    return '';
  }

  function renderS60Section(sectionId, targetPageNum) {
    state.activeS60Id = sectionId;
    renderS60Toc();

    const articleEl = document.getElementById('s60-article-view');
    if (!articleEl) return;

    const secIndex = DATA.sach60.sections.findIndex((s) => s.id === sectionId);
    const sec = secIndex >= 0 ? DATA.sach60.sections[secIndex] : DATA.sach60.sections[0];
    if (!sec) return;

    const prevSec = secIndex > 0 ? DATA.sach60.sections[secIndex - 1] : null;
    const nextSec = secIndex < DATA.sach60.sections.length - 1 ? DATA.sach60.sections[secIndex + 1] : null;

    const wcFile = S60_CHAPTER_WATERCOLORS[sec.chapter] || 'wc_09_70_nam_dhkh_hue_2026.jpg';
    const wcObj = DATA.watercolors.find((w) => w.file === wcFile) || DATA.watercolors[0];

    const pagesInSec = DATA.sach60.pages.filter(
      (p) => p.page >= sec.startPage && p.page <= sec.endPage
    );

    const pagesHtml = pagesInSec
      .map((pageObj) => {
        const blocksHtml = (pageObj.blocks || [])
          .map((b) => renderS60PageBlock(b, pageObj.page))
          .join('');
        return `
          <div class="s60-page-container" id="s60-page-${pageObj.page}">
            <div class="s60-page-marker">Trang ${pageObj.page} / 233 (Bản gốc năm 2017)</div>
            ${blocksHtml}
          </div>
        `;
      })
      .join('');

    articleEl.innerHTML = `
      <div class="article-meta-bar">
        <span class="article-cat-badge">${escapeHtml(sec.chapter)}</span>
        <span class="article-page-badge">Sách 60 năm ĐHKH Huế (2017) • Trang ${sec.startPage} – ${sec.endPage}</span>
      </div>

      <h2 class="article-title">${escapeHtml(sec.title)}</h2>
      <div class="article-author-line">Trường Đại học Khoa học – Đại học Huế: 60 năm xây dựng và phát triển (1957 – 2017)</div>

      <figure class="article-watercolor-figure">
        <img
          src="assets/watercolors/${escapeHtml(wcFile)}"
          alt="Minh họa màu nước ${escapeHtml(sec.title)}"
          loading="lazy"
          data-lightbox-src="assets/watercolors/${escapeHtml(wcFile)}"
          data-lightbox-caption="Minh họa màu nước: ${escapeHtml(wcObj.title)}"
        />
        <figcaption>Tranh màu nước minh họa giai đoạn: <strong>${escapeHtml(wcObj.title)}</strong></figcaption>
      </figure>

      ${pagesHtml}

      <div class="reader-nav-footer">
        ${
          prevSec
            ? `<button type="button" class="btn-secondary" data-s60-id="${escapeHtml(prevSec.id)}">← Phần trước: ${escapeHtml(prevSec.title)}</button>`
            : `<span></span>`
        }
        ${
          nextSec
            ? `<button type="button" class="btn-primary" data-s60-id="${escapeHtml(nextSec.id)}">Phần tiếp theo: ${escapeHtml(nextSec.title)} →</button>`
            : `<span></span>`
        }
      </div>
    `;

    if (targetPageNum) {
      setTimeout(() => {
        const pageEl = document.getElementById(`s60-page-${targetPageNum}`);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  }

  function jumpToS60Page(pageNumber) {
    const pNum = parseInt(pageNumber, 10);
    if (isNaN(pNum) || pNum < 1 || pNum > 233) return;
    const targetSec =
      DATA.sach60.sections.find((s) => pNum >= s.startPage && pNum <= s.endPage) ||
      DATA.sach60.sections[0];
    switchTab('sach60', { skipScroll: true });
    renderS60Section(targetSec.id, pNum);
  }

  function handleS60Search(rawQuery) {
    const hitsEl = document.getElementById('s60-search-hits');
    if (!hitsEl) return;

    const q = normalizeVi(rawQuery);
    if (!q || q.length < 2) {
      hitsEl.setAttribute('hidden', '');
      hitsEl.innerHTML = '';
      return;
    }

    const hits = [];
    for (const p of DATA.sach60.pages) {
      const normPage = normalizeVi(p.fullText || '');
      const idx = normPage.indexOf(q);
      if (idx !== -1) {
        const rawClean = (p.fullText || '').replace(/\s+/g, ' ');
        const start = Math.max(0, idx - 45);
        const snippet = rawClean.slice(start, start + 140);
        const sec = DATA.sach60.sections.find((s) => p.page >= s.startPage && p.page <= s.endPage);
        hits.push({
          page: p.page,
          secId: sec ? sec.id : 's60-bia-muc-luc',
          secTitle: sec ? sec.title : '',
          snippet
        });
        if (hits.length >= 25) break;
      }
    }

    if (hits.length === 0) {
      hitsEl.innerHTML = `<div style="padding:8px 10px;font-size:0.82rem;color:var(--ink-muted);">Không tìm thấy trang nào khớp với “${escapeHtml(rawQuery)}”.</div>`;
      hitsEl.removeAttribute('hidden');
      return;
    }

    hitsEl.innerHTML = hits
      .map(
        (h) => `
        <button type="button" class="toc-item-btn" data-s60-jump-page="${h.page}">
          <span class="toc-item-title" style="color:var(--accent-terracotta);">Trang ${h.page} — ${escapeHtml(h.secTitle)}</span>
          <span class="toc-item-meta">...${escapeHtml(h.snippet)}...</span>
        </button>
      `
      )
      .join('');
    hitsEl.removeAttribute('hidden');
  }

  /* ========================================================================
     LIGHTBOX MODAL
     ======================================================================== */
  function openLightbox(src, caption) {
    const modal = document.getElementById('image-lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (!modal || !img || !cap) return;

    img.src = src;
    img.alt = caption || 'Ảnh tư liệu';
    cap.textContent = caption || '';
    modal.removeAttribute('hidden');
  }

  /* ========================================================================
     PRINT & PDF EXPORT ENGINE
     ======================================================================== */
  function buildPrintStageHtml(mode) {
    const coverHtml = (subtitleText) => `
      <div class="print-cover-page">
        <div class="print-cover-kicker">Tri ân Ngày Nhà giáo Việt Nam 20/11/2026 &amp; Hướng tới Kỷ niệm 70 năm Trường ĐHKH Huế (1957 – 2027)</div>
        <h1 class="print-cover-title">Những Ngày Xưa Thương Nhớ</h1>
        <div class="print-cover-subtitle">${escapeHtml(subtitleText)}</div>
        <img src="assets/watercolors/wc_09_70_nam_dhkh_hue_2026.jpg" alt="Mái trường Đại học Khoa học Huế" style="max-height:260px;margin:16pt auto;border-radius:6px;" />
        <p style="max-width:520px;margin:16pt auto 0;font-size:10.5pt;line-height:1.6;">
          ${escapeHtml(DATA.meta.dedicationMessage)}
        </p>
      </div>
    `;

    if (mode === 'commemorative') {
      const wcPages = DATA.watercolors
        .map(
          (wc, i) => `
          <div class="print-book-section">
            <h3 style="margin:0 0 6pt;color:#1B5A85;">Tranh màu nước ${i + 1}/12: ${escapeHtml(wc.title)} (${escapeHtml(wc.period)})</h3>
            <img src="assets/watercolors/${escapeHtml(wc.file)}" alt="${escapeHtml(wc.title)}" style="max-height:240px;margin:0 0 8pt;border-radius:4px;" />
            <blockquote style="margin:0 0 8pt;padding-left:10pt;border-left:2pt solid #8C2D19;font-style:italic;">
              ${escapeHtml(wc.quote)} — <strong>${escapeHtml(wc.quoteAuthor)}</strong>
            </blockquote>
          </div>
        `
        )
        .join('');

      const memoirs = DATA.ktmx.works
        .slice(0, 4)
        .map(
          (w) => `
          <div class="print-page-break">
            <h2 style="margin:0 0 4pt;">${escapeHtml(w.title)}</h2>
            <p style="margin:0 0 12pt;font-weight:bold;color:#8C2D19;">Tác giả: ${escapeHtml(w.author)} (Khoảng trời màu xanh, 1986, tr. ${escapeHtml(w.bookPages)})</p>
            ${formatKtmxBodyContent(w)}
          </div>
        `
        )
        .join('');

      return coverHtml('Ấn phẩm Kỷ niệm: 12 Tranh Màu Nước & Hồi Ức Những Ngày Đầu Thành Lập Trường') + wcPages + memoirs;
    }

    if (mode === 'ktmx-full') {
      const worksHtml = DATA.ktmx.works
        .map(
          (w) => `
          <div class="print-page-break">
            <div style="font-size:9.5pt;color:#555;">${escapeHtml(w.category)} • Trang sách gốc: ${escapeHtml(w.bookPages)}</div>
            <h2 style="margin:2pt 0 4pt;">${w.index}. ${escapeHtml(w.title)}</h2>
            <div style="font-weight:bold;color:#8C2D19;margin-bottom:8pt;">${escapeHtml(w.author)}</div>
            ${w.dedication ? `<p style="font-style:italic;margin:0 0 8pt;">${escapeHtml(w.dedication)}</p>` : ''}
            ${formatKtmxBodyContent(w)}
            ${w.dateNote ? `<p style="text-align:right;font-style:italic;">${escapeHtml(w.dateNote)}</p>` : ''}
          </div>
        `
        )
        .join('');

      const notesHtml = `
        <div class="print-page-break">
          <h2>Chú thích 45 Tác giả (Trang 138–141)</h2>
          ${DATA.ktmx.authorNotes
            .map((n) => `<p><strong>${n.number}. ${escapeHtml(n.name)}:</strong> ${escapeHtml(n.bio)}</p>`)
            .join('')}
        </div>
      `;

      return coverHtml('Trọn bộ Ấn phẩm «Khoảng Trời Màu Xanh» — Kỷ niệm 10 năm Trường ĐH Tổng hợp Huế (1976–1986)') + worksHtml + notesHtml;
    }

    if (mode === 'sach60-full') {
      const allPagesHtml = DATA.sach60.pages
        .map((pageObj) => {
          const blocksHtml = (pageObj.blocks || [])
            .map((b) => renderS60PageBlock(b, pageObj.page))
            .join('');
          return `
            <div class="s60-page-container">
              <div class="s60-page-marker">Trang ${pageObj.page} / 233</div>
              ${blocksHtml}
            </div>
          `;
        })
        .join('');

      return coverHtml('Trọn bộ «Trường Đại học Khoa học – Đại học Huế: 60 năm xây dựng và phát triển (1957–2017)»') + allPagesHtml;
    }

    // Default: current-view
    if (state.activeTab === 'ktmx') {
      const el = document.getElementById('ktmx-article-view');
      return el ? el.innerHTML : '';
    }
    if (state.activeTab === 'sach60') {
      const el = document.getElementById('s60-article-view');
      return el ? el.innerHTML : '';
    }
    const wcGrid = document.getElementById('watercolor-gallery-grid');
    return coverHtml('Bộ sưu tập 12 Tranh Màu Nước Ký Ức Trường Đại học Khoa học Huế') + (wcGrid ? wcGrid.innerHTML : '');
  }

  function triggerPrintMode(mode) {
    const printModal = document.getElementById('print-modal');
    if (printModal) printModal.setAttribute('hidden', '');

    const stage = document.getElementById('print-stage');
    if (!stage) {
      window.print();
      return;
    }

    stage.innerHTML = buildPrintStageHtml(mode);
    document.body.classList.add('printing-custom-stage');

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-custom-stage');
        stage.innerHTML = '';
      }, 500);
    }, 250);
  }

  /* ========================================================================
     EVENT LISTENERS & INITIALIZATION
     ======================================================================== */
  function bindEvents() {
    // Primary Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Brand Home Trigger
    const brandHome = document.getElementById('brand-home-trigger');
    if (brandHome) {
      brandHome.addEventListener('click', () => switchTab('overview'));
      brandHome.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchTab('overview');
        }
      });
    }

    // Font Size Scaling (A- / A / A+ / A++)
    document.querySelectorAll('.btn-font-scale').forEach((btn) => {
      btn.addEventListener('click', () => {
        const scale = btn.getAttribute('data-scale') || 'normal';
        document.body.className = document.body.className
          .replace(/\bfont-scale-\S+/g, '')
          .trim();
        document.body.classList.add(`font-scale-${scale}`);
        document.querySelectorAll('.btn-font-scale').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
      });
    });

    // Quick Search Input in Hero
    const quickInput = document.getElementById('quick-person-search');
    const quickBtn = document.getElementById('btn-hero-search');
    if (quickInput) {
      quickInput.addEventListener('input', (e) => handleQuickSearch(e.target.value));
      quickInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleQuickSearch(quickInput.value);
        }
      });
    }
    if (quickBtn && quickInput) {
      quickBtn.addEventListener('click', () => {
        if (quickInput.value.trim()) {
          handleQuickSearch(quickInput.value);
        } else {
          switchTab('people');
        }
      });
    }

    // People Directory Filter Input & Pills
    const peopleInput = document.getElementById('people-filter-input');
    if (peopleInput) {
      peopleInput.addEventListener('input', (e) => {
        state.peopleSearchQuery = e.target.value;
        renderPeopleDirectory();
      });
    }

    document.querySelectorAll('.filter-pill[data-pfilter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activePeopleFilter = btn.getAttribute('data-pfilter') || 'all';
        document.querySelectorAll('.filter-pill[data-pfilter]').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
        renderPeopleDirectory();
      });
    });

    // KTMX Category Chips & Search Input
    document.querySelectorAll('.cat-chip[data-kcat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-kcat') || 'all';
        state.activeKtmxCategory = cat;
        document.querySelectorAll('.cat-chip[data-kcat]').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
        if (cat === 'authors') {
          renderKtmxArticle('ktmx-authors-colophon');
        } else {
          renderKtmxToc();
        }
      });
    });

    const ktmxSearchInput = document.getElementById('ktmx-search-input');
    if (ktmxSearchInput) {
      ktmxSearchInput.addEventListener('input', (e) => {
        state.ktmxSearchQuery = e.target.value;
        renderKtmxToc();
      });
    }

    // S60 Search & Page Jump
    const s60SearchInput = document.getElementById('s60-search-input');
    if (s60SearchInput) {
      s60SearchInput.addEventListener('input', (e) => handleS60Search(e.target.value));
    }

    const s60JumpBtn = document.getElementById('btn-s60-page-jump');
    const s60JumpInput = document.getElementById('s60-page-jump-input');
    if (s60JumpBtn && s60JumpInput) {
      s60JumpBtn.addEventListener('click', () => jumpToS60Page(s60JumpInput.value));
      s60JumpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          jumpToS60Page(s60JumpInput.value);
        }
      });
    }

    // Mobile TOC toggles
    const btnToggleKtmxToc = document.getElementById('btn-toggle-ktmx-toc');
    if (btnToggleKtmxToc) {
      btnToggleKtmxToc.addEventListener('click', () => {
        const toc = document.getElementById('ktmx-toc-list');
        if (toc) toc.classList.toggle('collapsed-mobile');
      });
    }

    const btnToggleS60Toc = document.getElementById('btn-toggle-s60-toc');
    if (btnToggleS60Toc) {
      btnToggleS60Toc.addEventListener('click', () => {
        const toc = document.getElementById('s60-toc-list');
        if (toc) toc.classList.toggle('collapsed-mobile');
      });
    }

    // Quick Buttons in Book Banners & Modals
    const btnViewKtmxAuthors = document.getElementById('btn-view-ktmx-authors');
    if (btnViewKtmxAuthors) {
      btnViewKtmxAuthors.addEventListener('click', () => {
        renderKtmxArticle('ktmx-authors-colophon');
      });
    }

    const printModal = document.getElementById('print-modal');
    const openPrintBtn = document.getElementById('btn-open-print-modal');
    const footerPrintBtn = document.getElementById('btn-footer-print');
    if (openPrintBtn && printModal) {
      openPrintBtn.addEventListener('click', () => printModal.removeAttribute('hidden'));
    }
    if (footerPrintBtn && printModal) {
      footerPrintBtn.addEventListener('click', () => printModal.removeAttribute('hidden'));
    }

    const btnPrintWatercolors = document.getElementById('btn-print-watercolors');
    if (btnPrintWatercolors) {
      btnPrintWatercolors.addEventListener('click', () => triggerPrintMode('commemorative'));
    }

    const btnPrintKtmxCurrent = document.getElementById('btn-print-ktmx-current');
    if (btnPrintKtmxCurrent) {
      btnPrintKtmxCurrent.addEventListener('click', () => triggerPrintMode('current-view'));
    }

    const btnPrintKtmxAll = document.getElementById('btn-print-ktmx-all');
    if (btnPrintKtmxAll) {
      btnPrintKtmxAll.addEventListener('click', () => triggerPrintMode('ktmx-full'));
    }

    const btnPrintS60Current = document.getElementById('btn-print-s60-current');
    if (btnPrintS60Current) {
      btnPrintS60Current.addEventListener('click', () => triggerPrintMode('current-view'));
    }

    // Close Modal Buttons
    document.getElementById('btn-close-person-modal')?.addEventListener('click', () => {
      document.getElementById('person-modal')?.setAttribute('hidden', '');
    });
    document.getElementById('btn-close-lightbox')?.addEventListener('click', () => {
      document.getElementById('image-lightbox-modal')?.setAttribute('hidden', '');
    });
    document.getElementById('btn-close-print-modal')?.addEventListener('click', () => {
      document.getElementById('print-modal')?.setAttribute('hidden', '');
    });

    // Global Delegated Click Handler for Dynamic Elements
    document.addEventListener('click', (e) => {
      const target = e.target;

      // Close modal when clicking backdrop
      if (target.classList && target.classList.contains('modal-backdrop')) {
        target.setAttribute('hidden', '');
        return;
      }

      // 1. Lightbox trigger
      const lbEl = target.closest('[data-lightbox-src]');
      if (lbEl) {
        openLightbox(
          lbEl.getAttribute('data-lightbox-src'),
          lbEl.getAttribute('data-lightbox-caption')
        );
        return;
      }

      // 2. Person Modal trigger
      const personEl = target.closest('[data-person]');
      if (personEl) {
        const pName = personEl.getAttribute('data-person');
        const dropdown = document.getElementById('quick-search-results');
        if (dropdown) dropdown.setAttribute('hidden', '');
        openPersonModal(pName);
        return;
      }

      // 3. Quick Search result clicks
      const quickItem = target.closest('[data-quick-type]');
      if (quickItem) {
        const qType = quickItem.getAttribute('data-quick-type');
        const dropdown = document.getElementById('quick-search-results');
        if (dropdown) dropdown.setAttribute('hidden', '');

        if (qType === 'ktmx') {
          const wId = quickItem.getAttribute('data-work-id');
          switchTab('ktmx');
          renderKtmxArticle(wId);
        } else if (qType === 's60') {
          const sId = quickItem.getAttribute('data-sec-id');
          switchTab('sach60');
          renderS60Section(sId);
        }
        return;
      }

      // 4. Goto Tab shortcut
      const gotoTabEl = target.closest('[data-goto-tab]');
      if (gotoTabEl) {
        switchTab(gotoTabEl.getAttribute('data-goto-tab'));
        return;
      }

      // 5. Open S60 Section from Timeline
      const openS60El = target.closest('[data-open-s60-sec]');
      if (openS60El) {
        const secId = openS60El.getAttribute('data-open-s60-sec');
        switchTab('sach60');
        renderS60Section(secId);
        return;
      }

      // 6. Watercolor Card destination link
      const wcGotoEl = target.closest('[data-wc-goto-tab]');
      if (wcGotoEl) {
        const destTab = wcGotoEl.getAttribute('data-wc-goto-tab');
        const destId = wcGotoEl.getAttribute('data-wc-goto-id');
        switchTab(destTab);
        if (destTab === 'ktmx') {
          renderKtmxArticle(destId);
        } else if (destTab === 'sach60') {
          renderS60Section(destId);
        }
        return;
      }

      // 7. KTMX TOC or Prev/Next item click
      const ktmxBtn = target.closest('[data-ktmx-id]');
      if (ktmxBtn) {
        const wId = ktmxBtn.getAttribute('data-ktmx-id');
        renderKtmxArticle(wId);
        const pane = document.getElementById('ktmx-article-view');
        if (pane) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // 8. S60 TOC or Prev/Next item click
      const s60Btn = target.closest('[data-s60-id]');
      if (s60Btn) {
        const sId = s60Btn.getAttribute('data-s60-id');
        renderS60Section(sId);
        const pane = document.getElementById('s60-article-view');
        if (pane) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // 9. S60 Search Hit Page Jump
      const s60HitBtn = target.closest('[data-s60-jump-page]');
      if (s60HitBtn) {
        const pNum = parseInt(s60HitBtn.getAttribute('data-s60-jump-page'), 10);
        jumpToS60Page(pNum);
        return;
      }

      // 10. Person Modal -> Jump to KTMX Work
      const modalKtmxBtn = target.closest('[data-modal-ktmx]');
      if (modalKtmxBtn) {
        let wId = modalKtmxBtn.getAttribute('data-modal-ktmx');
        if (wId === 'ktmx-chu-thich') wId = 'ktmx-authors-colophon';
        document.getElementById('person-modal')?.setAttribute('hidden', '');
        switchTab('ktmx');
        renderKtmxArticle(wId);
        return;
      }

      // 11. Person Modal -> Jump to S60 Page
      const modalS60Btn = target.closest('[data-modal-s60-sec]');
      if (modalS60Btn) {
        const secId = modalS60Btn.getAttribute('data-modal-s60-sec');
        const pageNum = parseInt(modalS60Btn.getAttribute('data-modal-s60-page'), 10);
        document.getElementById('person-modal')?.setAttribute('hidden', '');
        switchTab('sach60', { skipScroll: true });
        renderS60Section(secId, pageNum);
        return;
      }

      // 12. Print Mode Buttons inside Print Modal
      const printModeBtn = target.closest('[data-print-mode]');
      if (printModeBtn) {
        triggerPrintMode(printModeBtn.getAttribute('data-print-mode'));
        return;
      }
    });

    // Escape key closes open modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('person-modal')?.setAttribute('hidden', '');
        document.getElementById('image-lightbox-modal')?.setAttribute('hidden', '');
        document.getElementById('print-modal')?.setAttribute('hidden', '');
        document.getElementById('quick-search-results')?.setAttribute('hidden', '');
      }
    });
  }

  function init() {
    const badge = document.getElementById('people-count-badge');
    if (badge) badge.textContent = String(DATA.people.length);

    renderWatercolorGallery();
    updatePeopleFilterCounts();
    renderPeopleDirectory();
    renderKtmxArticle(state.activeKtmxId);
    renderS60Section(state.activeS60Id);
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
