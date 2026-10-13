/**
 * floorplan-svg.js
 * Comprehensive Floor Plan Renderer
 * Supports 🍼 Baby Chair (Pink) and 🥗 Vegetarian Meal (Green) attributes for backup seat 11.
 */

const FLOORPLAN_TABLES = [
  { id: 'vip', defaultLabel: '主桌', defaultName: '主桌 (VIP)', cx: 215, cy: 490, radius: 44, isVip: true, baseSeatCount: 12 },
  
  // Upper Rows (1 ~ 9)
  { id: '1', defaultLabel: '1', defaultName: '第 1 桌', cx: 320, cy: 345, radius: 31, baseSeatCount: 10 },
  { id: '2', defaultLabel: '2', defaultName: '第 2 桌', cx: 415, cy: 430, radius: 31, baseSeatCount: 10 },
  { id: '3', defaultLabel: '3', defaultName: '第 3 桌', cx: 510, cy: 345, radius: 31, baseSeatCount: 10 },
  { id: '4', defaultLabel: '4', defaultName: '第 4 桌', cx: 605, cy: 430, radius: 31, baseSeatCount: 10 },
  { id: '5', defaultLabel: '5', defaultName: '第 5 桌', cx: 700, cy: 345, radius: 31, baseSeatCount: 10 },
  { id: '6', defaultLabel: '6', defaultName: '第 6 桌', cx: 795, cy: 430, radius: 31, baseSeatCount: 10 },
  { id: '7', defaultLabel: '7', defaultName: '第 7 桌', cx: 890, cy: 345, radius: 31, baseSeatCount: 10 },
  { id: '8', defaultLabel: '8', defaultName: '第 8 桌', cx: 995, cy: 430, radius: 31, baseSeatCount: 10 },
  { id: '9', defaultLabel: '9', defaultName: '第 9 桌', cx: 1090, cy: 345, radius: 31, baseSeatCount: 10 },

  // Lower Rows (10 ~ 17)
  { id: '10', defaultLabel: '10', defaultName: '第 10 桌', cx: 320, cy: 645, radius: 31, baseSeatCount: 10 },
  { id: '11', defaultLabel: '11', defaultName: '第 11 桌', cx: 415, cy: 575, radius: 31, baseSeatCount: 10 },
  { id: '12', defaultLabel: '12', defaultName: '第 12 桌', cx: 510, cy: 645, radius: 31, baseSeatCount: 10 },
  { id: '13', defaultLabel: '13', defaultName: '第 13 桌', cx: 605, cy: 575, radius: 31, baseSeatCount: 10 },
  { id: '14', defaultLabel: '14', defaultName: '第 14 桌', cx: 700, cy: 645, radius: 31, baseSeatCount: 10 },
  { id: '15', defaultLabel: '15', defaultName: '第 15 桌', cx: 795, cy: 575, radius: 31, baseSeatCount: 10 },
  { id: '16', defaultLabel: '16', defaultName: '第 16 桌', cx: 890, cy: 645, radius: 31, baseSeatCount: 10 },
  { id: '17', defaultLabel: '17', defaultName: '第 17 桌', cx: 990, cy: 575, radius: 31, baseSeatCount: 10 },

  // Right Side Alcove (18 ~ 19)
  { id: '18', defaultLabel: '18', defaultName: '第 18 桌', cx: 1235, cy: 370, radius: 31, baseSeatCount: 10 },
  { id: '19', defaultLabel: '19', defaultName: '第 19 桌', cx: 1235, cy: 505, radius: 31, baseSeatCount: 10 }
];

class FloorPlanRenderer {
  constructor(svgElementId, graphicsGroupContainerId, tablesGroupContainerId) {
    this.svg = document.getElementById(svgElementId);
    this.graphicsGroup = document.getElementById(graphicsGroupContainerId);
    this.tablesGroup = document.getElementById(tablesGroupContainerId);
    this.nameMode = 'hovercard';
  }

  renderArchitecture() {
    let html = `
      <!-- Pink Entrance & Walkway Flow Arrows Aligned 1:1 with User's Drawing -->
      <g id="entrance-flow-arrows" opacity="0.88">
        <!-- Main Aisle Horizontal Flow Arrows Pointing Left (Y: 505) -->
        <g transform="translate(970, 505)">
          <path d="M 40 -12 L -20 -12 L -20 -25 L -55 0 L -20 25 L -20 12 L 40 12 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="1.5"/>
        </g>
        <g transform="translate(680, 505)">
          <path d="M 40 -12 L -20 -12 L -20 -25 L -55 0 L -20 25 L -20 12 L 40 12 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="1.5"/>
        </g>
        <g transform="translate(390, 505)">
          <path d="M 40 -12 L -20 -12 L -20 -25 L -55 0 L -20 25 L -20 12 L 40 12 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="1.5"/>
        </g>

        <!-- Vertical Downward Arrow in Right Entrance Hallway (X: 1155, Y: 370) -->
        <g transform="translate(1155, 370)">
          <path d="M -12 -35 L -12 15 L -25 15 L 0 50 L 25 15 L 12 15 L 12 -35 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="1.5"/>
        </g>
      </g>

      <!-- Main Hall Outer Perimeter & Wall Graphics -->
      <g stroke="#334155" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round">
        <path d="M 80 280 L 80 710" />
        <path d="M 80 280 L 250 280 L 250 70 L 530 70 L 530 280 L 580 280 L 580 250 L 610 250 L 610 280 L 1100 280 L 1100 70 L 1310 70 L 1310 280 L 1330 280 L 1330 710 L 1160 710 L 1160 680 L 1100 680 L 1100 710 L 80 710" />
        <rect x="380" y="70" width="24" height="24" fill="#ffffff" />
        
        <!-- Doors -->
        <path d="M 260 280 Q 280 260 290 280" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 320 280 Q 300 260 290 280" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 450 280 Q 470 260 480 280" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 510 280 Q 490 260 480 280" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 250 120 Q 230 135 250 150" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 250 180 Q 230 165 250 150" stroke="#64748b" stroke-dasharray="3,3"/>

        <!-- Bottom doors -->
        <path d="M 260 710 Q 280 730 290 710" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 320 710 Q 300 730 290 710" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 490 710 Q 510 730 520 710" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 550 710 Q 530 730 520 710" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 720 710 Q 740 730 750 710" stroke="#64748b" stroke-dasharray="3,3"/>
        <path d="M 780 710 Q 760 730 750 710" stroke="#64748b" stroke-dasharray="3,3"/>
      </g>

      <!-- Blue Bars -->
      <line x1="80" y1="360" x2="80" y2="600" stroke="#0088cc" stroke-width="6" stroke-linecap="round"/>
      <line x1="410" y1="710" x2="480" y2="710" stroke="#0088cc" stroke-width="6" stroke-linecap="round"/>

      <!-- Stage -->
      <g>
        <rect x="85" y="370" width="70" height="210" fill="#e2e8f0" stroke="#4a5568" stroke-width="1.5" rx="3"/>
        <g transform="translate(104, 455) scale(0.75)">
          <rect x="0" y="0" width="36" height="40" fill="none" stroke="#475569" stroke-width="2"/>
          <path d="M 0 0 Q 18 20 0 40 M 36 0 Q 18 20 36 40" fill="none" stroke="#475569" stroke-width="2"/>
          <line x1="0" y1="0" x2="36" y2="0" stroke="#475569" stroke-width="2"/>
        </g>
        <g transform="translate(85, 600)">
          <rect x="0" y="0" width="45" height="25" fill="#ffffff" stroke="#4a5568" stroke-width="1.5" rx="2"/>
          <line x1="12" y1="8" x2="12" y2="17" stroke="#475569" stroke-width="1.5"/>
          <line x1="33" y1="8" x2="33" y2="17" stroke="#475569" stroke-width="1.5"/>
          <text x="52" y="16" font-size="12" font-weight="700" fill="#1e293b" font-family="sans-serif">Podium</text>
        </g>
      </g>

      <!-- Pillar -->
      <rect x="1090" y="525" width="20" height="30" fill="#ffffff" stroke="#475569" stroke-width="1.5" rx="2"/>
    `;
    this.graphicsGroup.innerHTML = html;
  }

  renderTables(seatingData, selectedTableId = null, selectedSeatKey = null) {
    let html = '';

    FLOORPLAN_TABLES.forEach(table => {
      const isSelected = selectedTableId === table.id;
      const tableSeats = seatingData[table.id] || {};
      
      const customName = tableSeats._tableName || table.defaultName;
      const baseSeatCount = table.baseSeatCount || 10;
      const backupSeatNum = baseSeatCount + 1;

      let occupiedCount = 0;
      for (let s = 1; s <= backupSeatNum; s++) {
        if (tableSeats[s] && tableSeats[s].name && String(tableSeats[s].name).trim() !== '') {
          occupiedCount++;
        }
      }

      let circleFill = table.isVip ? '#e2e8f0' : '#ffffff';
      let circleStroke = isSelected ? '#ef4444' : '#334155';
      let strokeWidth = isSelected ? '3.5' : '2';

      html += `<g class="table-group ${isSelected ? 'selected' : ''}" data-table-id="${table.id}">`;

      // Table Circle
      html += `
        <circle class="table-circle" cx="${table.cx}" cy="${table.cy}" r="${table.radius}" 
                fill="${circleFill}" stroke="${circleStroke}" stroke-width="${strokeWidth}" />
      `;

      // Clean Table Name & Occupied Count inside Table Circle
      const displayName = customName || table.defaultName;

      html += `
        <text x="${table.cx}" y="${occupiedCount > 0 ? table.cy - 3 : table.cy + 3}" font-size="${table.isVip ? '11.5' : '10.5'}" font-weight="800" 
              text-anchor="middle" fill="${customName && customName !== table.defaultName ? '#2563eb' : '#0f172a'}" pointer-events="none">${displayName}</text>
      `;

      if (occupiedCount > 0) {
        html += `
          <text x="${table.cx}" y="${table.cy + 10}" font-size="9" font-weight="800" 
                text-anchor="middle" fill="#2563eb" pointer-events="none">${occupiedCount} 人已坐</text>
        `;
      }

      const hasBackupSeat = tableSeats[backupSeatNum] && tableSeats[backupSeatNum].name && String(tableSeats[backupSeatNum].name).trim() !== '';
      const totalRenderChairs = hasBackupSeat ? backupSeatNum : baseSeatCount;

      const chairDist = table.isVip ? table.radius + 14 : table.radius + 13;

      for (let s = 1; s <= totalRenderChairs; s++) {
        const angleDeg = -90 + (s - 1) * (360 / totalRenderChairs);
        const angleRad = (angleDeg * Math.PI) / 180;

        const chairCx = table.cx + chairDist * Math.cos(angleRad);
        const chairCy = table.cy + chairDist * Math.sin(angleRad);

        const seatData = tableSeats[s] || {};
        const hasGuest = seatData.name && String(seatData.name).trim() !== '';
        const isVip = seatData.isVip;
        const isBabyChair = seatData.isBabyChair;
        const isVegetarian = seatData.isVegetarian;
        const isSeatSelected = selectedTableId === table.id && selectedSeatKey == s;
        const isBackupSeat = s === backupSeatNum;

        let chairFill = isBackupSeat ? '#fef3c7' : '#ffffff';
        let chairStroke = isBackupSeat ? '#d97706' : '#64748b';
        let numTextColor = '#1e293b';

        if (isSeatSelected) {
          chairFill = '#fee2e2';
          chairStroke = '#ef4444';
        } else if (isBabyChair) {
          chairFill = '#f472b6'; // Pink
          chairStroke = '#db2777';
          numTextColor = '#ffffff';
        } else if (isVegetarian) {
          chairFill = '#10b981'; // Green
          chairStroke = '#047857';
          numTextColor = '#ffffff';
        } else if (isVip) {
          chairFill = '#f59e0b'; // VIP Orange
          chairStroke = '#d97706';
          numTextColor = '#ffffff';
        } else if (hasGuest) {
          chairFill = isBackupSeat ? '#10b981' : '#3b82f6';
          chairStroke = isBackupSeat ? '#059669' : '#2563eb';
          numTextColor = '#ffffff';
        }

        const nodeRadius = 8.5;

        html += `
          <g class="seat-node ${isSeatSelected ? 'selected' : ''}" 
             data-table-id="${table.id}" data-seat-num="${s}" 
             transform="translate(${chairCx}, ${chairCy})">
        `;

        // If in Spoke Name Tag Mode and seat has a guest name: OVERLAY Name Badge directly over seat node!
        if (hasGuest && this.nameMode === 'spoke') {
          let badgeFill = isBabyChair ? '#fce7f3' : (isVegetarian ? '#d1fae5' : (isVip ? '#fef3c7' : (isBackupSeat ? '#ecfdf5' : '#eff6ff')));
          let badgeStroke = isBabyChair ? '#ec4899' : (isVegetarian ? '#10b981' : (isVip ? '#d97706' : (isBackupSeat ? '#10b981' : '#2563eb')));
          let textColor = isBabyChair ? '#be185d' : (isVegetarian ? '#047857' : (isVip ? '#b45309' : (isBackupSeat ? '#047857' : '#1e40af')));

          html += `
            <rect x="-21" y="-8.5" width="42" height="17" rx="5" 
                  fill="${badgeFill}" stroke="${badgeStroke}" stroke-width="1.2" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.15))" />
            <text x="0" y="3.5" font-size="9.5" font-weight="800" 
                  text-anchor="middle" fill="${textColor}">${this.truncateName(seatData.name)}</text>
          `;
        } else {
          // Standard Circular Seat Node
          html += `
            <circle cx="0" cy="0" r="${nodeRadius}" 
                    fill="${chairFill}" stroke="${chairStroke}" stroke-width="1.5" />
            <text x="0" y="3" font-size="${s >= 10 ? '8' : '8.5'}" font-weight="800" 
                  text-anchor="middle" fill="${hasGuest && !isSeatSelected ? '#ffffff' : numTextColor}">${s}</text>
          `;
        }

        html += `</g>`;
      }

      html += `</g>`;
    });

    this.tablesGroup.innerHTML = html;
  }

  truncateName(name) {
    if (!name) return '';
    return name.length > 4 ? name.slice(0, 4) : name;
  }
}
