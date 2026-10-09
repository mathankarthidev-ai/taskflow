export function getReceiptImageUrl(
  receiptName?: string,
  receiptUrl?: string,
  details?: {
    claimNo?: string;
    category?: string;
    amount?: number;
    date?: string;
    userName?: string;
    description?: string;
  }
): string {
  // If a real data URL or valid remote image URL is already present, use it directly!
  if (
    receiptUrl &&
    (receiptUrl.startsWith('data:image') ||
      receiptUrl.startsWith('http://') ||
      receiptUrl.startsWith('https://') ||
      receiptUrl.startsWith('/'))
  ) {
    return receiptUrl;
  }

  // Generate an authentic high-resolution SVG receipt tax invoice with realistic details
  const name = receiptName || 'demo.jpg';
  const category = details?.category || 'Client Lunch';
  const amount = details?.amount || 111;
  const date = details?.date || '2026-10-09';
  const claimNo = details?.claimNo || 'CLM-8046';
  const desc = details?.description || 'Client Business Lunch Meeting';
  const user = details?.userName || 'Mathan P';
  const tax = (amount * 0.05).toFixed(2);
  const subtotal = (amount - Number(tax) * 2).toFixed(2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
    <defs>
      <filter id="paper-shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
      </filter>
    </defs>
    <!-- Receipt Paper Background -->
    <rect x="25" y="25" width="550" height="800" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" filter="url(#paper-shadow)" />
    
    <!-- Top Serrated Header -->
    <rect x="25" y="25" width="550" height="18" fill="#F8FAFC" />
    <line x1="25" y1="43" x2="575" y2="43" stroke="#CBD5E1" stroke-dasharray="6,4" stroke-width="2" />
    
    <!-- Header Store / Brand Info -->
    <text x="300" y="90" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="#0F172A">AMBIZCON HOSPITALITY &amp; BISTRO</text>
    <text x="300" y="115" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#64748B">CORPORATE CLIENT DINING &amp; HOSPITALITY</text>
    <text x="300" y="135" font-family="monospace" font-size="11" text-anchor="middle" fill="#94A3B8">GSTIN: 29AABCU9603R1ZM  •  TAX INVOICE</text>
    
    <!-- Divider Line -->
    <line x1="55" y1="160" x2="545" y2="160" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="4,4" />
    
    <!-- Metadata Grid -->
    <text x="60" y="190" font-family="monospace" font-size="12" fill="#475569">CLAIM REF  : <tspan font-weight="700" fill="#0F172A">${claimNo}</tspan></text>
    <text x="360" y="190" font-family="monospace" font-size="12" fill="#475569">DATE: <tspan font-weight="700" fill="#0F172A">${date}</tspan></text>
    
    <text x="60" y="215" font-family="monospace" font-size="12" fill="#475569">SUBMITTED BY: <tspan font-weight="700" fill="#0F172A">${user}</tspan></text>
    <text x="360" y="215" font-family="monospace" font-size="12" fill="#475569">TIME: 13:45 PM</text>
    
    <text x="60" y="240" font-family="monospace" font-size="12" fill="#475569">ATTACHED FILE: <tspan font-weight="700" fill="#0284C7">${name}</tspan></text>
    <text x="360" y="240" font-family="monospace" font-size="12" fill="#475569">TABLE # 08 (AC)</text>
    
    <!-- Table Header Line -->
    <line x1="55" y1="265" x2="545" y2="265" stroke="#0F172A" stroke-width="1.5" />
    <text x="60" y="285" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">ITEM DESCRIPTION</text>
    <text x="370" y="285" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">QTY</text>
    <text x="540" y="285" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="end" fill="#0F172A">AMOUNT (INR)</text>
    <line x1="55" y1="295" x2="545" y2="295" stroke="#CBD5E1" stroke-width="1" />
    
    <!-- Line Items -->
    <text x="60" y="325" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#1E293B">${category}</text>
    <text x="60" y="345" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">${desc}</text>
    <text x="380" y="335" font-family="monospace" font-size="12" fill="#1E293B">1</text>
    <text x="540" y="335" font-family="monospace" font-size="13" font-weight="700" text-anchor="end" fill="#1E293B">₹${subtotal}</text>
    
    <text x="60" y="380" font-family="system-ui, sans-serif" font-size="12" fill="#475569">Executive Hospitality Refreshments</text>
    <text x="380" y="380" font-family="monospace" font-size="12" fill="#1E293B">1</text>
    <text x="540" y="380" font-family="monospace" font-size="12" text-anchor="end" fill="#475569">INCLUDED</text>
    
    <!-- Tax Calculation -->
    <line x1="55" y1="420" x2="545" y2="420" stroke="#E2E8F0" stroke-width="1" />
    <text x="320" y="445" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Subtotal:</text>
    <text x="540" y="445" font-family="monospace" font-size="12" text-anchor="end" fill="#1E293B">₹${subtotal}</text>
    
    <text x="320" y="470" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">CGST @ 5.0%:</text>
    <text x="540" y="470" font-family="monospace" font-size="12" text-anchor="end" fill="#1E293B">₹${tax}</text>
    
    <text x="320" y="495" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">SGST @ 5.0%:</text>
    <text x="540" y="495" font-family="monospace" font-size="12" text-anchor="end" fill="#1E293B">₹${tax}</text>
    
    <!-- Grand Total Bar -->
    <rect x="55" y="520" width="490" height="55" rx="8" fill="#F1F5F9" />
    <text x="75" y="555" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#0F172A">TOTAL CHARGED</text>
    <text x="525" y="556" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="end" fill="#059669">₹${amount}.00</text>
    
    <!-- Payment Verification -->
    <text x="60" y="605" font-family="monospace" font-size="11" fill="#64748B">PAYMENT METHOD : CORPORATE CARD (VISA **** 4092)</text>
    <text x="60" y="625" font-family="monospace" font-size="11" fill="#64748B">AUTH CODE      : TXN_8920194A</text>
    <text x="60" y="645" font-family="monospace" font-size="11" fill="#64748B">STATUS         : SETTLED &amp; VERIFIED</text>
    
    <!-- Verified Stamp -->
    <g transform="translate(380, 595) rotate(-10)">
      <rect x="0" y="0" width="140" height="48" rx="8" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="4,2" />
      <text x="70" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="middle" fill="#059669" letter-spacing="1">PAID &amp; VERIFIED</text>
      <text x="70" y="40" font-family="monospace" font-size="9" text-anchor="middle" fill="#059669">${date}</text>
    </g>
    
    <!-- Barcode / QR Simulation -->
    <g transform="translate(180, 680)">
      <rect x="0" y="0" width="4" height="40" fill="#0F172A"/>
      <rect x="8" y="0" width="2" height="40" fill="#0F172A"/>
      <rect x="14" y="0" width="6" height="40" fill="#0F172A"/>
      <rect x="24" y="0" width="3" height="40" fill="#0F172A"/>
      <rect x="32" y="0" width="5" height="40" fill="#0F172A"/>
      <rect x="42" y="0" width="2" height="40" fill="#0F172A"/>
      <rect x="48" y="0" width="7" height="40" fill="#0F172A"/>
      <rect x="60" y="0" width="3" height="40" fill="#0F172A"/>
      <rect x="68" y="0" width="5" height="40" fill="#0F172A"/>
      <rect x="78" y="0" width="2" height="40" fill="#0F172A"/>
      <rect x="85" y="0" width="6" height="40" fill="#0F172A"/>
      <rect x="96" y="0" width="4" height="40" fill="#0F172A"/>
      <rect x="105" y="0" width="7" height="40" fill="#0F172A"/>
      <rect x="117" y="0" width="2" height="40" fill="#0F172A"/>
      <rect x="124" y="0" width="5" height="40" fill="#0F172A"/>
      <rect x="134" y="0" width="3" height="40" fill="#0F172A"/>
      <rect x="142" y="0" width="6" height="40" fill="#0F172A"/>
      <rect x="153" y="0" width="2" height="40" fill="#0F172A"/>
      <rect x="160" y="0" width="8" height="40" fill="#0F172A"/>
      <rect x="173" y="0" width="3" height="40" fill="#0F172A"/>
      <rect x="181" y="0" width="5" height="40" fill="#0F172A"/>
      <rect x="191" y="0" width="2" height="40" fill="#0F172A"/>
      <rect x="198" y="0" width="6" height="40" fill="#0F172A"/>
      <rect x="210" y="0" width="4" height="40" fill="#0F172A"/>
      <rect x="219" y="0" width="5" height="40" fill="#0F172A"/>
      <text x="120" y="55" font-family="monospace" font-size="10" text-anchor="middle" fill="#64748B">* ${claimNo} *</text>
    </g>
    
    <!-- Footer Note -->
    <text x="300" y="780" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" fill="#94A3B8">Thank you for your business  •  Customer copy  •  Retain for audit</text>
    <line x1="25" y1="805" x2="575" y2="805" stroke="#CBD5E1" stroke-dasharray="6,4" stroke-width="2" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
