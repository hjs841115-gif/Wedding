/**
 * app.js
 * Main Seating Management Application Engine
 * Supports 🍼 嬰兒椅 (Pink) & 🥗 素食 (Green) options for Backup Seat 11 and all seats.
 */

class BanquetSeatingApp {
  constructor() {
    this.seatingData = this.loadData();
    this.selectedTableId = '1';
    this.selectedSeatNum = null;
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Multi-Card Pinning Engine
    this.pinnedTableIds = new Set();
    this.pinnedCardPositions = {};

    this.renderer = new FloorPlanRenderer('floorplan-svg', 'svg-graphics', 'svg-tables');
    this.init();
  }

  init() {
    this.renderer.renderArchitecture();
    this.renderFloorplan();
    this.updateStats();
    this.setupPanZoom();
    this.setupEventListeners();
    this.setupFloatingTooltipDrag();
    this.selectTable(this.selectedTableId);
    this.renderGuestLookupList('');

    window.addEventListener('load', () => {
      this.renderGuestLookupList('');
    });
  }

  cleanGarbledData(data) {
    if (!data) return data;
    Object.keys(data).forEach(tableId => {
      const tableData = data[tableId];
      if (tableData) {
        Object.keys(tableData).forEach(seatKey => {
          if (seatKey.startsWith('_')) {
            if (typeof tableData[seatKey] === 'string') {
              tableData[seatKey] = tableData[seatKey].replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
            }
          } else if (tableData[seatKey] && tableData[seatKey].name) {
            tableData[seatKey].name = String(tableData[seatKey].name).replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
          }
        });
      }
    });
    return data;
  }

  loadData() {
    const saved = localStorage.getItem('banquet_seating_data');
    let data = {};

    if (saved) {
      try { 
        data = JSON.parse(saved); 
        data = this.cleanGarbledData(data);
      } catch (e) { 
        console.error('Failed to parse saved seating data', e); 
      }
    }
    
    FLOORPLAN_TABLES.forEach(table => {
      if (!data[table.id]) {
        data[table.id] = {
          _tableName: table.defaultName,
          _tableLabel: table.defaultLabel
        };
      }
      const maxSeatCount = (table.baseSeatCount || 10) + 1;
      for (let s = 1; s <= maxSeatCount; s++) {
        if (!data[table.id][s]) {
          data[table.id][s] = { name: '', isVip: false, isBabyChair: false, isVegetarian: false, company: '', note: '' };
        }
      }
    });

    return data;
  }

  saveData() {
    this.seatingData = this.cleanGarbledData(this.seatingData);
    localStorage.setItem('banquet_seating_data', JSON.stringify(this.seatingData));
    this.updateStats();
    this.renderFloorplan();
    this.renderGuestLookupList('');
    this.updateAllPinnedCards();
  }

  // 100% Robust Dual-Key Seat Scanner for All Guests across seatingData
  getAllGuestsFromData(filterKeyword = '') {
    let kw = (typeof filterKeyword === 'string') ? filterKeyword.trim().toLowerCase() : '';
    let guests = [];

    if (!this.seatingData) return guests;

    Object.keys(this.seatingData).forEach(tableId => {
      const tableSeats = this.seatingData[tableId];
      if (!tableSeats) return;

      const tableDef = FLOORPLAN_TABLES.find(t => t.id === String(tableId));
      const tableName = (tableSeats && tableSeats._tableName) ? tableSeats._tableName : (tableDef ? tableDef.defaultName : (tableId === 'vip' ? '主桌' : `第 ${tableId} 桌`));

      for (let s = 1; s <= 15; s++) {
        const seat = tableSeats[s] || tableSeats[String(s)];
        if (seat) {
          let gName = '';
          let gVip = false;
          let gBaby = false;
          let gVeg = false;

          if (typeof seat === 'string') {
            gName = seat.trim();
          } else if (typeof seat === 'object' && seat !== null) {
            gName = seat.name ? String(seat.name).trim() : (seat.guestName ? String(seat.guestName).trim() : '');
            gVip = !!(seat.isVip || seat.vip);
            gBaby = !!(seat.isBabyChair || seat.baby);
            gVeg = !!(seat.isVegetarian || seat.veg);
          }

          if (gName && gName !== '' && gName !== 'undefined' && gName !== 'null') {
            if (!kw || gName.toLowerCase().includes(kw) || tableName.toLowerCase().includes(kw)) {
              guests.push({
                tableId: String(tableId),
                tableName: tableName,
                seatNum: s,
                name: gName,
                isVip: gVip,
                isBabyChair: gBaby,
                isVegetarian: gVeg
              });
            }
          }
        }
      }
    });

    guests.sort((a, b) => {
      if (a.tableId === 'vip') return -1;
      if (b.tableId === 'vip') return 1;
      const numA = parseInt(a.tableId, 10) || 99;
      const numB = parseInt(b.tableId, 10) || 99;
      if (numA !== numB) return numA - numB;
      return a.seatNum - b.seatNum;
    });

    return guests;
  }

  updateStats() {
    const guests = this.getAllGuestsFromData('');
    let vipCount = 0;
    guests.forEach(g => { if (g.isVip) vipCount++; });

    const totalOccupied = guests.length;

    document.getElementById('stat-tables').textContent = '20';
    document.getElementById('stat-occupied').textContent = totalOccupied;
    document.getElementById('stat-available').textContent = 202 - totalOccupied;
    document.getElementById('stat-vip').textContent = vipCount;
  }

  renderGuestLookupList(filterKeyword = '') {
    try {
      const listEl = document.getElementById('guest-lookup-list');
      if (!listEl) return;

      const kw = (typeof filterKeyword === 'string') ? filterKeyword.trim() : '';
      const guests = this.getAllGuestsFromData(kw);

      const countEl = document.getElementById('guest-lookup-count');
      if (countEl) countEl.textContent = `${guests.length} 人`;

      if (guests.length === 0) {
        listEl.innerHTML = `<div style="font-size:12px; color:#94a3b8; text-align:center; padding:16px;">尚無輸入賓客名單${kw ? '（搜尋無結果）' : ''}</div>`;
        return;
      }

      let html = '';
      guests.forEach(g => {
        let tagHtml = '';
        if (g.isBabyChair) {
          tagHtml += `<span class="badge" style="font-size:10px; margin-left:4px; background:#fce7f3; color:#ec4899;">🍼 嬰兒椅</span>`;
        }
        if (g.isVegetarian) {
          tagHtml += `<span class="badge" style="font-size:10px; margin-left:4px; background:#d1fae5; color:#10b981;">🥗 素食</span>`;
        }
        if (g.isVip) {
          tagHtml += `<span class="badge badge-warning" style="font-size:10px; margin-left:4px; background:#fef3c7; color:#d97706;">VIP</span>`;
        }

        html += `
          <div class="guest-mini-item" data-table-id="${g.tableId}" data-seat-num="${g.seatNum}">
            <div style="display:flex; align-items:center;">
              <strong style="color:var(--text-main); font-size:13px;">${g.name}</strong>
              ${tagHtml}
            </div>
            <span class="text-muted" style="font-size:12px; font-weight:600; color:#2563eb;">${g.tableName} - 座位 ${g.seatNum}</span>
          </div>
        `;
      });

      listEl.innerHTML = html;

      listEl.querySelectorAll('.guest-mini-item').forEach(div => {
        div.addEventListener('click', () => {
          const tId = div.getAttribute('data-table-id');
          const sNum = div.getAttribute('data-seat-num');
          this.selectTable(tId, sNum);
        });
      });
    } catch (err) {
      console.error('Error rendering guest lookup list:', err);
    }
  }

  renderFloorplan() {
    this.renderer.renderTables(this.seatingData, this.selectedTableId, this.selectedSeatNum);
    this.attachTableClickListeners();
    this.updateConnectorLines();
  }

  attachTableClickListeners() {
    const tooltipEl = document.getElementById('floating-table-tooltip');
    const viewport = document.getElementById('svg-viewport');

    document.querySelectorAll('.table-group').forEach(group => {
      const tableId = group.getAttribute('data-table-id');

      // Single Click event
      group.addEventListener('click', (e) => {
        this.selectTable(tableId);
      });

      // Double-Click event to toggle pin
      group.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.togglePinTable(tableId);
      });

      // Hover event
      group.addEventListener('mouseenter', (e) => {
        if (this.renderer.nameMode !== 'hovercard') return;
        this.updateFloatingTooltip(tableId);
        tooltipEl.style.display = 'block';

        if (!tooltipEl.dataset.manuallyMoved) {
          const rect = viewport.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const posX = mouseX + 190 > rect.width ? mouseX - 200 : mouseX + 15;
          const posY = Math.max(15, mouseY - 30);
          tooltipEl.style.left = `${posX}px`;
          tooltipEl.style.top = `${posY}px`;
        }
      });
    });

    document.querySelectorAll('.seat-node').forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const tableId = node.getAttribute('data-table-id');
        const seatNum = node.getAttribute('data-seat-num');
        this.selectTable(tableId, seatNum);
      });
    });
  }

  setupFloatingTooltipDrag() {
    const tooltipEl = document.getElementById('floating-table-tooltip');
    const closeBtn = document.getElementById('floating-card-close');
    const pinBtn = document.getElementById('floating-card-pin-btn');

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      tooltipEl.style.display = 'none';
    });

    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (this.selectedTableId) {
        this.togglePinTable(this.selectedTableId);
      }
    });

    this.enableElementDrag(tooltipEl, null, () => {
      tooltipEl.dataset.manuallyMoved = "true";
      this.updateConnectorLines();
    });
  }

  enableElementDrag(cardEl, handleEl = null, onDragEndCallback = null) {
    const dragTarget = handleEl || cardEl;
    let isCardDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const startDrag = (clientX, clientY, e) => {
      if (e && e.target && e.target.closest('button')) {
        return; // Don't initiate card drag when clicking buttons!
      }

      if (e) e.stopPropagation();
      isCardDragging = true;
      window.isCardDraggingNow = true;

      document.querySelectorAll('.pinned-card').forEach(c => c.style.zIndex = '9998');
      cardEl.style.zIndex = '10005';

      const rect = cardEl.getBoundingClientRect();
      startX = clientX;
      startY = clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
    };

    const doDrag = (clientX, clientY, e) => {
      if (!isCardDragging) return;
      if (e) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
      }
      const dx = clientX - startX;
      const dy = clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      newLeft = Math.max(5, Math.min(window.innerWidth - 120, newLeft));
      newTop = Math.max(5, Math.min(window.innerHeight - 120, newTop));

      cardEl.style.left = `${newLeft}px`;
      cardEl.style.top = `${newTop}px`;

      this.updateConnectorLines();
    };

    const stopDrag = (e) => {
      if (isCardDragging) {
        if (e) e.stopPropagation();
        isCardDragging = false;
        window.isCardDraggingNow = false;
        if (onDragEndCallback) onDragEndCallback();
        this.updateConnectorLines();
      }
    };

    dragTarget.addEventListener('mousedown', (e) => {
      startDrag(e.clientX, e.clientY, e);
    });

    window.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY, e), true);
    window.addEventListener('mouseup', (e) => stopDrag(e), true);

    dragTarget.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY, e);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!isCardDragging) return;
      const touch = e.touches[0];
      doDrag(touch.clientX, touch.clientY, e);
    }, { passive: false });

    window.addEventListener('touchend', (e) => stopDrag(e));
  }

  updateConnectorLines() {
    const connectorSvg = document.getElementById('connector-lines-svg');
    if (!connectorSvg) return;

    const viewport = document.getElementById('svg-viewport');
    const viewportRect = viewport.getBoundingClientRect();

    const scaleX = viewportRect.width / 1400;
    const scaleY = viewportRect.height / 800;
    const zoom = this.zoomLevel;

    const svgCenterX = viewportRect.width / 2;
    const svgCenterY = viewportRect.height / 2;

    let html = '';

    this.pinnedTableIds.forEach(tableId => {
      const tableDef = FLOORPLAN_TABLES.find(t => t.id === tableId);
      const cardEl = document.getElementById(`pinned-card-${tableId}`);
      if (!tableDef || !cardEl) return;

      const tablePixelX = (tableDef.cx - 700) * scaleX * zoom + svgCenterX + this.panX;
      const tablePixelY = (tableDef.cy - 400) * scaleY * zoom + svgCenterY + this.panY;

      const cardRect = cardEl.getBoundingClientRect();
      const cardPixelX = cardRect.left - viewportRect.left + cardRect.width / 2;
      const cardPixelY = cardRect.top - viewportRect.top + cardRect.height / 2;

      const isVip = tableDef.isVip;
      const strokeColor = isVip ? '#d97706' : '#2563eb';

      html += `
        <g>
          <line x1="${tablePixelX}" y1="${tablePixelY}" x2="${cardPixelX}" y2="${cardPixelY}" 
                stroke="${strokeColor}" stroke-width="2" stroke-dasharray="6,4" opacity="0.85" />
          <circle cx="${tablePixelX}" cy="${tablePixelY}" r="4.5" fill="${strokeColor}" />
          <circle cx="${cardPixelX}" cy="${cardPixelY}" r="3.5" fill="${strokeColor}" />
        </g>
      `;
    });

    connectorSvg.innerHTML = html;
  }

  togglePinAllTables() {
    if (this.pinnedTableIds.size > 0) {
      this.unpinAllTables();
    } else {
      this.pinAllTables();
    }
  }

  pinAllTables() {
    FLOORPLAN_TABLES.forEach(table => {
      if (!this.pinnedTableIds.has(table.id)) {
        this.pinnedTableIds.add(table.id);
        this.createPinnedCard(table.id);
      }
    });
    this.updatePinButtonStates();
    this.updateConnectorLines();
  }

  unpinAllTables() {
    this.pinnedTableIds.clear();
    const container = document.getElementById('pinned-cards-container');
    container.innerHTML = '';
    this.updatePinButtonStates();
    this.updateConnectorLines();
  }

  togglePinTable(tableId) {
    if (this.pinnedTableIds.has(tableId)) {
      this.pinnedTableIds.delete(tableId);
      const cardEl = document.getElementById(`pinned-card-${tableId}`);
      if (cardEl) cardEl.remove();
    } else {
      this.pinnedTableIds.add(tableId);
      this.createPinnedCard(tableId);
    }
    this.updatePinButtonStates();
    this.updateConnectorLines();
  }

  createPinnedCard(tableId) {
    const tableDef = FLOORPLAN_TABLES.find(t => t.id === tableId);
    if (!tableDef) return;

    const container = document.getElementById('pinned-cards-container');
    const viewport = document.getElementById('svg-viewport');
    const viewportRect = viewport.getBoundingClientRect();

    const cardEl = document.createElement('div');
    cardEl.className = `pinned-card ${tableDef.isVip ? 'is-vip' : ''}`;
    cardEl.id = `pinned-card-${tableId}`;

    let posX = this.pinnedCardPositions[tableId]?.left;
    let posY = this.pinnedCardPositions[tableId]?.top;

    if (posX === undefined || posY === undefined) {
      const scaleX = viewportRect.width / 1400;
      const scaleY = viewportRect.height / 800;
      posX = Math.max(10, Math.min(window.innerWidth - 220, viewportRect.left + tableDef.cx * scaleX - 80));
      posY = Math.max(10, Math.min(window.innerHeight - 240, viewportRect.top + tableDef.cy * scaleY - 130));
    }

    cardEl.style.left = `${posX}px`;
    cardEl.style.top = `${posY}px`;

    cardEl.innerHTML = `
      <div class="pinned-card-header" id="pinned-drag-handle-${tableId}">
        <span><i class="fa-solid fa-up-down-left-right" style="color:var(--primary); font-size:11px;"></i> <strong class="pinned-title">${tableDef.defaultName}</strong></span>
        <div class="pinned-card-actions">
          <button class="btn-pin is-pinned btn-unpin-card" data-table="${tableId}" title="取消釘選">&times;</button>
        </div>
      </div>
      <div class="pinned-card-body" id="pinned-body-${tableId}"></div>
    `;

    container.appendChild(cardEl);

    cardEl.querySelector('.btn-unpin-card').addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePinTable(tableId);
    });

    this.enableElementDrag(cardEl, null, () => {
      this.pinnedCardPositions[tableId] = {
        left: parseFloat(cardEl.style.left),
        top: parseFloat(cardEl.style.top)
      };
      this.updateConnectorLines();
    });

    this.renderPinnedCardBody(tableId);
    this.updateConnectorLines();
  }

  renderPinnedCardBody(tableId) {
    const tableDef = FLOORPLAN_TABLES.find(t => t.id === tableId);
    if (!tableDef) return;

    const cardEl = document.getElementById(`pinned-card-${tableId}`);
    if (!cardEl) return;

    const tableSeats = this.seatingData[tableId] || {};
    const tableName = tableSeats._tableName || tableDef.defaultName;
    const baseSeatCount = tableDef.baseSeatCount || 10;
    const backupSeatNum = baseSeatCount + 1;

    cardEl.querySelector('.pinned-title').textContent = tableName;

    let guests = [];
    for (let s = 1; s <= backupSeatNum; s++) {
      if (tableSeats[s] && tableSeats[s].name && String(tableSeats[s].name).trim() !== '') {
        guests.push({ num: s, name: String(tableSeats[s].name).trim(), isVip: tableSeats[s].isVip, isBabyChair: tableSeats[s].isBabyChair, isVegetarian: tableSeats[s].isVegetarian });
      }
    }

    const bodyEl = cardEl.querySelector(`#pinned-body-${tableId}`);

    if (guests.length === 0) {
      bodyEl.innerHTML = `<div style="color:#94a3b8; font-size:11px; text-align:center; padding:10px;">尚無排入賓客</div>`;
      return;
    }

    let gridHtml = `<div class="guest-grid">`;
    guests.forEach(g => {
      let colorStyle = '';
      if (g.isBabyChair) colorStyle = 'color:#ec4899;';
      else if (g.isVegetarian) colorStyle = 'color:#10b981;';
      else if (g.isVip) colorStyle = 'color:#d97706;';

      gridHtml += `
        <div class="guest-seat-item">
          <span class="seat-no">${g.num}:</span>
          <strong style="${colorStyle}">${g.name}</strong>
        </div>
      `;
    });
    gridHtml += `</div>`;

    bodyEl.innerHTML = gridHtml;
  }

  updateAllPinnedCards() {
    this.pinnedTableIds.forEach(tableId => {
      this.renderPinnedCardBody(tableId);
    });
    this.updatePinButtonStates();
    this.updateConnectorLines();
  }

  updatePinButtonStates() {
    const isCurrentPinned = this.pinnedTableIds.has(this.selectedTableId);
    const pinBtnSidebar = document.getElementById('btn-pin-current-table');
    if (pinBtnSidebar) {
      pinBtnSidebar.innerHTML = isCurrentPinned ? `<i class="fa-solid fa-thumbtack" style="color:var(--warning);"></i> 取消釘選` : `<i class="fa-solid fa-thumbtack"></i> 釘選桌卡`;
      pinBtnSidebar.className = isCurrentPinned ? `btn btn-sm btn-primary` : `btn btn-sm btn-outline`;
    }

    const pinBtnFloat = document.getElementById('floating-card-pin-btn');
    if (pinBtnFloat) {
      pinBtnFloat.innerHTML = isCurrentPinned ? `<i class="fa-solid fa-thumbtack" style="color:var(--warning);"></i> 已釘選` : `<i class="fa-solid fa-thumbtack"></i> 釘選`;
    }

    const btnPinAll = document.getElementById('btn-pin-all-tables');
    if (btnPinAll) {
      if (this.pinnedTableIds.size > 0) {
        btnPinAll.innerHTML = `<i class="fa-solid fa-xmark" style="color:var(--danger);"></i> 取消全場釘選`;
        btnPinAll.className = `btn btn-outline btn-danger-outline`;
      } else {
        btnPinAll.innerHTML = `<i class="fa-solid fa-thumbtack" style="color:var(--warning);"></i> 釘選全場卡片`;
        btnPinAll.className = `btn btn-outline`;
      }
    }
  }

  updateFloatingTooltip(tableId) {
    const tableDef = FLOORPLAN_TABLES.find(t => t.id === tableId);
    if (!tableDef) return;

    const tableSeats = this.seatingData[tableId] || {};
    const tableName = tableSeats._tableName || tableDef.defaultName;
    const baseSeatCount = tableDef.baseSeatCount || 10;
    const backupSeatNum = baseSeatCount + 1;

    let guests = [];
    for (let s = 1; s <= backupSeatNum; s++) {
      if (tableSeats[s] && tableSeats[s].name && String(tableSeats[s].name).trim() !== '') {
        guests.push({ num: s, name: String(tableSeats[s].name).trim(), isVip: tableSeats[s].isVip, isBabyChair: tableSeats[s].isBabyChair, isVegetarian: tableSeats[s].isVegetarian });
      }
    }

    document.getElementById('floating-card-title').innerHTML = `<i class="fa-solid fa-up-down-left-right"></i> ${tableName}`;
    const bodyEl = document.getElementById('floating-card-body');

    if (guests.length === 0) {
      bodyEl.innerHTML = `<div style="color:#94a3b8; font-size:11px; text-align:center; padding:10px;">尚無排入賓客</div>`;
      return;
    }

    let gridHtml = `<div class="guest-grid">`;
    guests.forEach(g => {
      let colorStyle = '';
      if (g.isBabyChair) colorStyle = 'color:#ec4899;';
      else if (g.isVegetarian) colorStyle = 'color:#10b981;';
      else if (g.isVip) colorStyle = 'color:#d97706;';

      gridHtml += `
        <div class="guest-seat-item">
          <span class="seat-no">${g.num}:</span>
          <strong style="${colorStyle}">${g.name}</strong>
        </div>
      `;
    });
    gridHtml += `</div>`;

    bodyEl.innerHTML = gridHtml;
    this.updatePinButtonStates();
  }

  selectTable(tableId, seatNum = null) {
    this.selectedTableId = tableId;
    this.selectedSeatNum = seatNum;

    const tableDef = FLOORPLAN_TABLES.find(t => t.id === tableId);
    if (!tableDef) return;

    const baseSeatCount = tableDef.baseSeatCount || 10;
    const backupSeatNum = baseSeatCount + 1;

    const tableSeats = this.seatingData[tableId] || {};
    const tableNameInput = document.getElementById('table-name-input');
    tableNameInput.value = tableSeats._tableName || tableDef.defaultName;

    document.getElementById('current-table-badge').textContent = `${this.getTableOccupiedCount(tableId)} / ${baseSeatCount}+1 席`;

    if (this.renderer.nameMode === 'hovercard') {
      this.updateFloatingTooltip(tableId);
      document.getElementById('floating-table-tooltip').style.display = 'block';
    }

    document.getElementById('empty-state').style.display = 'none';
    const seatListEl = document.getElementById('seat-list');
    seatListEl.style.display = 'flex';
    seatListEl.innerHTML = '';

    for (let s = 1; s <= backupSeatNum; s++) {
      const seat = tableSeats[s] || { name: '', isVip: false, isBabyChair: false, isVegetarian: false };
      const isSelected = this.selectedSeatNum == s;
      const isBackupSeat = s === backupSeatNum;

      const itemEl = document.createElement('div');
      itemEl.className = `seat-item ${seat.name ? 'has-guest' : ''} ${seat.isVip ? 'is-vip' : ''} ${isSelected ? 'is-selected' : ''} ${isBackupSeat ? 'is-backup-seat' : ''}`;
      if (isBackupSeat) itemEl.style.borderLeft = '3px solid #10b981';

      if (isBackupSeat) {
        // Seat 11 Backup Seat: Special 🍼 嬰兒椅 (Pink) & 🥗 素食 (Green) option toggles!
        itemEl.innerHTML = `
          <div class="seat-badge" style="background:#10b981; color:#fff;">${s}</div>
          <div class="seat-inputs">
            <input type="text" class="input-name" data-seat="${s}" value="${seat.name || ''}" placeholder="備用 ${s} 號位 (如: 嬰兒椅 / 素食)">
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <label class="seat-tag-toggle" style="font-size:11px; color:#ec4899; cursor:pointer;" title="粉色：嬰兒椅">
              <input type="checkbox" class="chk-baby" data-seat="${s}" ${seat.isBabyChair ? 'checked' : ''}> 🍼 嬰兒椅
            </label>
            <label class="seat-tag-toggle" style="font-size:11px; color:#059669; cursor:pointer;" title="綠色：素食">
              <input type="checkbox" class="chk-veg" data-seat="${s}" ${seat.isVegetarian ? 'checked' : ''}> 🥗 素食
            </label>
          </div>
          ${seat.name ? `<button class="seat-action btn-clear-seat" data-seat="${s}" title="清空座位"><i class="fa-solid fa-xmark"></i></button>` : ''}
        `;
      } else {
        // Standard Seats 1..10: VIP Checkbox
        itemEl.innerHTML = `
          <div class="seat-badge">${s}</div>
          <div class="seat-inputs">
            <input type="text" class="input-name" data-seat="${s}" value="${seat.name || ''}" placeholder="輸入姓名 (座位 ${s})">
          </div>
          <label class="seat-vip-toggle" title="標記為 VIP">
            <input type="checkbox" class="chk-vip" data-seat="${s}" ${seat.isVip || (tableDef.isVip && !seat.name) ? 'checked' : (seat.isVip ? 'checked' : '')}> VIP
          </label>
          ${seat.name ? `<button class="seat-action btn-clear-seat" data-seat="${s}" title="清空座位"><i class="fa-solid fa-xmark"></i></button>` : ''}
        `;
      }

      seatListEl.appendChild(itemEl);
    }

    seatListEl.querySelectorAll('.input-name').forEach(input => {
      input.addEventListener('input', (e) => {
        const s = e.target.getAttribute('data-seat');
        if (!this.seatingData[tableId][s]) this.seatingData[tableId][s] = { name: '', isVip: false };
        this.seatingData[tableId][s].name = e.target.value.trim();
        this.saveData();
      });
    });

    seatListEl.querySelectorAll('.chk-vip').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const s = e.target.getAttribute('data-seat');
        if (!this.seatingData[tableId][s]) this.seatingData[tableId][s] = { name: '', isVip: false };
        this.seatingData[tableId][s].isVip = e.target.checked;
        this.saveData();
        this.selectTable(tableId, this.selectedSeatNum);
      });
    });

    seatListEl.querySelectorAll('.chk-baby').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const s = e.target.getAttribute('data-seat');
        if (!this.seatingData[tableId][s]) this.seatingData[tableId][s] = { name: '', isVip: false };
        this.seatingData[tableId][s].isBabyChair = e.target.checked;
        if (e.target.checked) this.seatingData[tableId][s].isVegetarian = false; // mutually exclusive default
        this.saveData();
        this.selectTable(tableId, this.selectedSeatNum);
      });
    });

    seatListEl.querySelectorAll('.chk-veg').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const s = e.target.getAttribute('data-seat');
        if (!this.seatingData[tableId][s]) this.seatingData[tableId][s] = { name: '', isVip: false };
        this.seatingData[tableId][s].isVegetarian = e.target.checked;
        if (e.target.checked) this.seatingData[tableId][s].isBabyChair = false; // mutually exclusive default
        this.saveData();
        this.selectTable(tableId, this.selectedSeatNum);
      });
    });

    seatListEl.querySelectorAll('.btn-clear-seat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const s = btn.getAttribute('data-seat');
        if (this.seatingData[tableId][s]) {
          this.seatingData[tableId][s].name = '';
          this.seatingData[tableId][s].isVip = false;
          this.seatingData[tableId][s].isBabyChair = false;
          this.seatingData[tableId][s].isVegetarian = false;
        }
        this.saveData();
        this.selectTable(tableId, this.selectedSeatNum);
      });
    });

    this.updatePinButtonStates();
    this.renderFloorplan();
  }

  getTableOccupiedCount(tableId) {
    const tableDef = FLOORPLAN_TABLES.find(t => t.id === tableId);
    const maxSeatCount = ((tableDef ? tableDef.baseSeatCount : 10) || 10) + 1;
    const tableSeats = this.seatingData[tableId] || {};
    let count = 0;
    for (let s = 1; s <= maxSeatCount; s++) {
      if (tableSeats[s] && tableSeats[s].name && String(tableSeats[s].name).trim() !== '') count++;
    }
    return count;
  }

  setupPanZoom() {
    const viewport = document.getElementById('svg-viewport');
    const wrapper = document.getElementById('svg-wrapper');

    const updateTransform = () => {
      wrapper.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
      this.updateConnectorLines();
    };

    document.getElementById('zoom-in').addEventListener('click', () => {
      this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3.0);
      updateTransform();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
      updateTransform();
    });

    document.getElementById('zoom-reset').addEventListener('click', () => {
      this.zoomLevel = 1.0;
      this.panX = 0;
      this.panY = 0;
      updateTransform();
    });

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoomLevel = Math.max(0.5, Math.min(3.0, this.zoomLevel * zoomFactor));
      updateTransform();
    }, { passive: false });

    viewport.addEventListener('mousedown', (e) => {
      if (window.isCardDraggingNow) return;
      if (e.target.closest('.table-group') || e.target.closest('.seat-node') || e.target.closest('.floating-tooltip') || e.target.closest('.pinned-card')) return;
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (window.isCardDraggingNow || !this.isDragging) return;
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  setupEventListeners() {
    const tableNameInput = document.getElementById('table-name-input');
    tableNameInput.addEventListener('input', (e) => {
      if (!this.selectedTableId) return;
      const newName = e.target.value.trim();
      this.seatingData[this.selectedTableId]._tableName = newName;
      if (newName.length <= 4) {
        this.seatingData[this.selectedTableId]._tableLabel = newName;
      }
      this.saveData();
    });

    document.getElementById('btn-pin-all-tables').addEventListener('click', () => {
      this.togglePinAllTables();
    });

    document.getElementById('btn-unpin-all-tables').addEventListener('click', () => {
      this.unpinAllTables();
    });

    document.getElementById('btn-pin-current-table').addEventListener('click', () => {
      if (this.selectedTableId) {
        this.togglePinTable(this.selectedTableId);
      }
    });

    const btnRefresh = document.getElementById('btn-refresh-guest-list');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        this.renderGuestLookupList('');
      });
    }

    const selectNameMode = document.getElementById('select-name-mode');
    selectNameMode.addEventListener('change', (e) => {
      this.renderer.nameMode = e.target.value;
      const tooltipEl = document.getElementById('floating-table-tooltip');
      if (e.target.value !== 'hovercard') {
        tooltipEl.style.display = 'none';
      } else {
        this.updateFloatingTooltip(this.selectedTableId);
        tooltipEl.style.display = 'block';
      }
      this.renderFloorplan();
    });

    const toggleOverlay = document.getElementById('toggle-overlay');
    const opacityInput = document.getElementById('overlay-opacity');
    const opacityVal = document.getElementById('opacity-val');
    const bgImg = document.getElementById('svg-bg-image');

    toggleOverlay.addEventListener('change', (e) => {
      bgImg.setAttribute('visibility', e.target.checked ? 'visible' : 'hidden');
    });

    opacityInput.addEventListener('input', (e) => {
      const val = e.target.value;
      bgImg.setAttribute('opacity', val);
      opacityVal.textContent = `${Math.round(val * 100)}%`;
    });

    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');

    searchInput.addEventListener('input', (e) => {
      const kw = e.target.value.trim();
      clearSearch.style.display = kw ? 'block' : 'none';
      this.renderGuestLookupList(kw);
    });

    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      clearSearch.style.display = 'none';
      this.renderGuestLookupList('');
    });

    document.getElementById('btn-clear-table').addEventListener('click', () => {
      if (!this.selectedTableId) return;
      const curName = this.seatingData[this.selectedTableId]._tableName || '本桌';
      const tableDef = FLOORPLAN_TABLES.find(t => t.id === this.selectedTableId);
      const maxSeatCount = ((tableDef ? tableDef.baseSeatCount : 10) || 10) + 1;

      if (confirm(`確定要清空 ${curName} 的所有賓客名單嗎？`)) {
        for (let s = 1; s <= maxSeatCount; s++) {
          this.seatingData[this.selectedTableId][s] = { name: '', isVip: false, isBabyChair: false, isVegetarian: false };
        }
        this.saveData();
        this.selectTable(this.selectedTableId);
      }
    });

    const modalBatch = document.getElementById('modal-batch-import');
    document.getElementById('btn-quick-fill').addEventListener('click', () => {
      modalBatch.style.display = 'flex';
      document.getElementById('batch-names-input').value = '';
    });

    document.getElementById('btn-confirm-batch').addEventListener('click', () => {
      const rawText = document.getElementById('batch-names-input').value;
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
      const tableDef = FLOORPLAN_TABLES.find(t => t.id === this.selectedTableId);
      const baseSeatCount = (tableDef ? tableDef.baseSeatCount : 10) || 10;

      let lineIdx = 0;
      for (let s = 1; s <= baseSeatCount && lineIdx < lines.length; s++) {
        if (!this.seatingData[this.selectedTableId][s].name) {
          const line = lines[lineIdx++];
          const isVip = line.includes('VIP') || line.includes('貴賓');
          const isBabyChair = line.includes('嬰兒') || line.includes('寶寶');
          const isVegetarian = line.includes('素');
          const cleanName = line.replace(/VIP|貴賓|嬰兒|寶寶|素食|素|\(|\)/g, '').trim();
          this.seatingData[this.selectedTableId][s] = { name: cleanName, isVip: isVip, isBabyChair: isBabyChair, isVegetarian: isVegetarian };
        }
      }

      this.saveData();
      this.selectTable(this.selectedTableId);
      modalBatch.style.display = 'none';
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId).style.display = 'none';
      });
    });

    const modalBackup = document.getElementById('modal-backup');
    document.getElementById('btn-save-load').addEventListener('click', () => {
      modalBackup.style.display = 'flex';
    });

    document.getElementById('btn-download-json').addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.seatingData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `宴會廳座位表備份_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    document.getElementById('json-file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const loadedData = JSON.parse(evt.target.result);
          this.seatingData = loadedData;
          this.saveData();
          this.selectTable('vip');
          modalBackup.style.display = 'none';
          alert('座位備份資料已成功還原！');
        } catch (err) {
          alert('讀取失敗，請確認檔案格式是否為合法的 JSON。');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-export-image').addEventListener('click', () => {
      this.exportAsPNG();
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
      this.exportAsCSV();
    });
  }

  exportAsPNG() {
    const svgEl = document.getElementById('floorplan-svg');
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgEl);

    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `宴會廳平面圖_PPT簡報專用_${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    };
    img.src = url;
  }

  exportAsCSV() {
    let csvContent = "\uFEFF";
    csvContent += "桌號,桌次名稱,座位號碼,賓客姓名,特殊標記,備註\n";

    FLOORPLAN_TABLES.forEach(table => {
      const tableSeats = this.seatingData[table.id] || {};
      const tableName = tableSeats._tableName || table.defaultName;
      const baseSeatCount = table.baseSeatCount || 10;
      const maxSeatCount = baseSeatCount + 1;

      for (let s = 1; s <= maxSeatCount; s++) {
        const seat = tableSeats[s] || {};
        if (seat.name && String(seat.name).trim() !== '') {
          let tagStr = '';
          if (seat.isBabyChair) tagStr = '嬰兒椅';
          else if (seat.isVegetarian) tagStr = '素食';
          else if (seat.isVip) tagStr = 'VIP';

          csvContent += `"${table.id}","${tableName}","${s}","${seat.name}","${tagStr}","${s === maxSeatCount ? '備用位' : ''}"\n`;
        }
      }
    });

    const csvUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute("href", csvUri);
    link.setAttribute("download", `宴會廳賓客名冊_WordExcel專用_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new BanquetSeatingApp();
});
