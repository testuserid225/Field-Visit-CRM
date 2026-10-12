import nodemailer from 'nodemailer';

// Standard Test Company Information
export const TEST_COMPANY_INFO = {
  name: 'TEST COMPANY INDUSTRIAL SYSTEMS PVT. LTD.',
  division: 'Industrial Systems Division • Heavy Machinery & Automation',
  address: 'Plot No. 42-B, Peenya Industrial Area, 2nd Phase, Bengaluru, Karnataka - 560058, India',
  gstin: '29AABCT8844K1ZS',
  cin: 'U29253KA2018PTC114920',
  pan: 'AABCT8844K',
  phone: '+91 80 2839 4500 / +91 98801 23456',
  email: 'iqratareq@gmail.com',
  website: 'www.testcompany-industrial.com',
  bankDetails: {
    accountName: 'TEST COMPANY INDUSTRIAL SYSTEMS PVT. LTD.',
    bankName: 'HDFC Bank Ltd.',
    accountNumber: '50200088991122',
    ifscCode: 'HDFC0000128',
    branch: 'Peenya Industrial Branch, Bengaluru',
    accountType: 'Current Account'
  }
};

// Helper: Format INR currency
export const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(val) || 0);
};

// Helper: Convert Number to Words (Indian Numbering Format)
export const numberToWordsINR = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Rupees Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (val) => {
    let str = '';
    if (val > 19) {
      str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
    } else {
      str += a[val];
    }
    return str.trim();
  };

  let crore = Math.floor(n / 10000000);
  let remCrore = n % 10000000;
  let lakh = Math.floor(remCrore / 100000);
  let remLakh = remCrore % 100000;
  let thousand = Math.floor(remLakh / 1000);
  let remThousand = remLakh % 1000;
  let hundred = Math.floor(remThousand / 100);
  let remHundred = remThousand % 100;

  let words = 'Rupees ';
  if (crore > 0) words += `${inWords(crore)} Crore `;
  if (lakh > 0) words += `${inWords(lakh)} Lakh `;
  if (thousand > 0) words += `${inWords(thousand)} Thousand `;
  if (hundred > 0) words += `${inWords(hundred)} Hundred `;
  if (remHundred > 0) words += `${inWords(remHundred)} `;

  return `${words.trim()} Only`;
};

// Generate high-fidelity HTML email with Test Company Header, Customer Details, Line Items, Totals & Footer
export const generateQuotationHtmlEmail = (quote, clientDetails = {}, customNote = '') => {
  const custName = clientDetails.customerName || quote.customerClient || 'Valued Commercial Client';
  const contactPerson = clientDetails.contactPerson || quote.contactPerson || 'Authorized Representative';
  const designation = clientDetails.designation || 'Head of Engineering & Procurement';
  const address = clientDetails.address || 'Industrial Estate, Bengaluru, Karnataka';
  const gstin = clientDetails.gstin || '29AAACB1234F1Z1';
  const phone = clientDetails.phone || '+91 98450 12345';
  const clientEmail = clientDetails.email || 'client@customer.com';

  const items = quote.lineItems && quote.lineItems.length > 0 ? quote.lineItems : [
    {
      productName: quote.opportunityName || 'Industrial Automation Machinery',
      modelNumber: 'Standard Heavy Duty',
      principal: 'Test Company Engineering',
      hsnCode: '84798999',
      quantity: 1,
      unit: 'Set',
      unitPrice: quote.grossSubtotal || quote.grandTotal || 0,
      totalPrice: quote.grossSubtotal || quote.grandTotal || 0
    }
  ];

  const itemsRows = items.map((item, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
      <td style="padding: 10px 12px; border: 1px solid #cbd5e1;">
        <strong style="color: #0f172a; font-size: 14px;">${item.productName || 'Industrial Machinery Equipment'}</strong>
        ${item.modelNumber ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">Model: <strong>${item.modelNumber}</strong> ${item.category ? `&bull; Category: ${item.category}` : ''}</div>` : ''}
        ${item.specifications ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Specs: ${item.specifications}</div>` : ''}
      </td>
      <td style="padding: 10px 10px; border: 1px solid #cbd5e1; color: #334155; font-size: 13px;">${item.principal || 'Test Company OEM'}</td>
      <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center; color: #64748b; font-size: 12px; font-family: monospace;">${item.hsnCode || '8479'}</td>
      <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${item.quantity || 1}</td>
      <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center; color: #64748b; font-size: 12px;">${item.unit || 'Nos'}</td>
      <td style="padding: 10px 10px; border: 1px solid #cbd5e1; text-align: right; color: #334155; font-weight: 600;">${formatINR(item.unitPrice)}</td>
      <td style="padding: 10px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #0f172a;">${formatINR(item.totalPrice || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)))}</td>
    </tr>
  `).join('');

  const amountInWords = numberToWordsINR(quote.grandTotal);
  const halfGst = Math.round((quote.gstAmount || 0) / 2);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation ${quote.quotationNumber}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  
  <div style="max-width: 820px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">

    <!-- TOP COVER NOTE / INTRO BANNER -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 24px 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="background-color: #10b981; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
            OFFICIAL COMMERCIAL QUOTATION
          </span>
          <h2 style="margin: 10px 0 4px 0; font-size: 22px; font-weight: 900; letter-spacing: -0.02em;">
            Quotation & Proposal: ${quote.quotationNumber}
          </h2>
          <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
            Issued to <strong>${custName}</strong> &bull; Revision: <strong>${quote.revision || 'Rev 0'}</strong>
          </p>
        </div>
      </div>
      ${customNote ? `
      <div style="margin-top: 16px; padding: 12px 14px; background-color: rgba(255, 255, 255, 0.08); border-left: 4px solid #10b981; border-radius: 4px; font-size: 13px; color: #f8fafc;">
        <strong>Note from Sales Desk:</strong> ${customNote}
      </div>
      ` : ''}
    </div>

    <div style="padding: 28px;">

      <!-- ======================================================== -->
      <!-- 1. STANDARD HEADER FOR TEST COMPANY                       -->
      <!-- ======================================================== -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <tr>
          <td style="vertical-align: top; width: 65px;">
            <div style="width: 52px; height: 52px; border-radius: 10px; background-color: #0f172a; color: #10b981; text-align: center; line-height: 52px; font-size: 22px; font-weight: 900;">
              TC
            </div>
          </td>
          <td style="vertical-align: top;">
            <div style="background-color: #10b981; color: #ffffff; display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">
              ${TEST_COMPANY_INFO.division.toUpperCase()}
            </div>
            <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.01em;">
              ${TEST_COMPANY_INFO.name}
            </h1>
            <div style="font-size: 11px; color: #475569; line-height: 1.45;">
              <div>${TEST_COMPANY_INFO.address}</div>
              <div><strong>GSTIN:</strong> ${TEST_COMPANY_INFO.gstin} &bull; <strong>CIN:</strong> ${TEST_COMPANY_INFO.cin} &bull; <strong>PAN:</strong> ${TEST_COMPANY_INFO.pan}</div>
              <div><strong>Phone:</strong> ${TEST_COMPANY_INFO.phone} &bull; <strong>Email:</strong> ${TEST_COMPANY_INFO.email} &bull; <strong>Web:</strong> ${TEST_COMPANY_INFO.website}</div>
            </div>
          </td>
          <td style="vertical-align: top; text-align: right; width: 220px;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 11px; text-align: right;">
              <div style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase;">QUOTE REFERENCE</div>
              <div style="font-family: monospace; font-size: 16px; font-weight: 900; color: #0f172a; margin: 2px 0;">${quote.quotationNumber}</div>
              <div style="color: #475569;"><strong>Date:</strong> ${quote.quotationDate || new Date().toISOString().split('T')[0]}</div>
              <div style="color: #475569;"><strong>Validity:</strong> ${quote.validityDays || 30} Days</div>
              <div style="margin-top: 4px;">
                <span style="background-color: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 10px;">
                  SENT TO CLIENT
                </span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- ======================================================== -->
      <!-- 2. CUSTOMER DETAILS & PROPOSAL REFERENCE                 -->
      <!-- ======================================================== -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
        <tr>
          <!-- Bill To / Customer Details -->
          <td style="width: 50%; vertical-align: top; padding-right: 10px;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px;">
              <div style="font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                QUOTATION ISSUED TO (BUYER DETAILS)
              </div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 3px;">
                ${custName}
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 2px;">
                <strong>Attn:</strong> ${contactPerson} &bull; <span style="color: #64748b;">${designation}</span>
              </div>
              <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 2px;">
                <strong>Address:</strong> ${address}
              </div>
              <div style="font-size: 11px; color: #475569;">
                <strong>Phone:</strong> ${phone} &bull; <strong>Email:</strong> ${clientEmail}
              </div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                <strong>Client GSTIN:</strong> <span style="font-family: monospace; font-weight: bold;">${gstin}</span>
              </div>
            </div>
          </td>

          <!-- Project & Proposal Reference -->
          <td style="width: 50%; vertical-align: top; padding-left: 10px;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px;">
              <div style="font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                PROPOSAL & COMMERCIAL REFERENCE
              </div>
              <div style="font-size: 13px; color: #0f172a; margin-bottom: 3px;">
                <strong>Project / Opp:</strong> ${quote.opportunityName || 'Direct Industrial Machinery Supply'}
              </div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
                <strong>Ref Code:</strong> <span style="font-family: monospace;">${quote.opportunityCode || 'OPP-DIRECT'}</span>
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                <strong>Sales Engineer:</strong> ${quote.salesRepresentative || 'Commercial Sales Desk'}
              </div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                <strong>Place of Supply:</strong> Karnataka (State Code: 29) &bull; <strong>Currency:</strong> INR (₹)
              </div>
              <div style="font-size: 11px; color: #475569;">
                <strong>Payment Terms:</strong> 40% Adv, 50% proforma, 10% post-commissioning
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- ======================================================== -->
      <!-- 3. LINE DETAIL IN BODY (MACHINERY & CONFIGURATION)       -->
      <!-- ======================================================== -->
      <div style="margin-bottom: 22px;">
        <div style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">
          SECTION 2: MACHINERY SPECIFICATIONS & LINE ITEMS (${items.length} ITEM${items.length > 1 ? 'S' : ''})
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 10px 8px; border: 1px solid #334155; width: 30px; text-align: center;">#</th>
              <th style="padding: 10px 12px; border: 1px solid #334155; text-align: left;">Machine Model & Description</th>
              <th style="padding: 10px 10px; border: 1px solid #334155; text-align: left; width: 120px;">OEM</th>
              <th style="padding: 10px 8px; border: 1px solid #334155; text-align: center; width: 60px;">HSN</th>
              <th style="padding: 10px 8px; border: 1px solid #334155; text-align: center; width: 40px;">Qty</th>
              <th style="padding: 10px 8px; border: 1px solid #334155; text-align: center; width: 40px;">Unit</th>
              <th style="padding: 10px 10px; border: 1px solid #334155; text-align: right; width: 95px;">Rate (₹)</th>
              <th style="padding: 10px 10px; border: 1px solid #334155; text-align: right; width: 105px;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <!-- ======================================================== -->
      <!-- 4. BOTTOM TOTALS BREAKDOWN                               -->
      <!-- ======================================================== -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <!-- Left: Amount in Words & GST Note -->
          <td style="width: 55%; vertical-align: top; padding-right: 12px;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px;">
              <div style="font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; margin-bottom: 4px;">
                AMOUNT IN WORDS (INR):
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; background-color: #ffffff; padding: 10px 12px; border: 1px dashed #cbd5e1; border-radius: 6px; margin-bottom: 10px; line-height: 1.4;">
                ${amountInWords}
              </div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.45;">
                <div>&bull; <strong>Statutory GST:</strong> CGST 9% (${formatINR(halfGst)}) + SGST 9% (${formatINR(halfGst)}) = Total 18% (${formatINR(quote.gstAmount)})</div>
                <div>&bull; <strong>Validity:</strong> Quotation valid for ${quote.validityDays || 30} days from issuance date.</div>
              </div>
            </div>
          </td>

          <!-- Right: Itemized Financial Totals -->
          <td style="width: 45%; vertical-align: top; padding-left: 12px;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">Gross Subtotal:</td>
                  <td style="text-align: right; font-weight: bold; color: #0f172a; padding-bottom: 6px;">${formatINR(quote.grossSubtotal)}</td>
                </tr>
                <tr>
                  <td style="color: #b45309; padding-bottom: 6px;">Trade Discount (${quote.discountPercent || 0}%):</td>
                  <td style="text-align: right; font-weight: bold; color: #b45309; padding-bottom: 6px;">-${formatINR(quote.discountAmount)}</td>
                </tr>
                <tr style="border-top: 1px dashed #cbd5e1;">
                  <td style="color: #475569; padding: 6px 0;">Net Taxable Value:</td>
                  <td style="text-align: right; font-weight: bold; color: #0f172a; padding: 6px 0;">${formatINR(quote.taxableAmount)}</td>
                </tr>
                <tr>
                  <td style="color: #2563eb; padding-bottom: 4px;">CGST @ 9%:</td>
                  <td style="text-align: right; color: #2563eb; padding-bottom: 4px;">+${formatINR(halfGst)}</td>
                </tr>
                <tr>
                  <td style="color: #2563eb; padding-bottom: 6px;">SGST @ 9%:</td>
                  <td style="text-align: right; color: #2563eb; padding-bottom: 6px;">+${formatINR(halfGst)}</td>
                </tr>
                <tr style="border-top: 1px solid #cbd5e1;">
                  <td style="color: #1d4ed8; font-weight: bold; padding: 6px 0;">Total GST (18%):</td>
                  <td style="text-align: right; font-weight: bold; color: #1d4ed8; padding: 6px 0;">+${formatINR(quote.gstAmount)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 8px;">
                    <div style="background-color: #ecfdf5; border: 1.5px solid #10b981; border-radius: 6px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-size: 10px; font-weight: 900; color: #047857; text-transform: uppercase;">GRAND TOTAL (INR)</div>
                        <div style="font-size: 9px; color: #047857;">Inclusive of 18% GST</div>
                      </div>
                      <div style="font-size: 18px; font-weight: 900; color: #047857;">
                        ${formatINR(quote.grandTotal)}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- ======================================================== -->
      <!-- 5. FOOTER: TERMS, BANK DETAILS & SIGNATURES              -->
      <!-- ======================================================== -->
      <div style="border-top: 2px solid #0f172a; padding-top: 16px;">
        
        <!-- Commercial Terms -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;">
          <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 6px;">
            STANDARD COMMERCIAL TERMS & CONDITIONS
          </div>
          <div style="font-size: 11px; line-height: 1.5; color: #334155; white-space: pre-line;">
${quote.commercialTerms || `1. Price Basis: Ex-works warehouse Bengaluru, packaging & forwarding extra as applicable.
2. Applicable Taxes: Statutory GST @ 18% charged additionally on taxable value as per Indian GST law.
3. Commercial Payment Terms: 40% advance along with Purchase Order, 50% against proforma invoice dispatch readiness, 10% post-commissioning.
4. Delivery Period: 4 to 6 weeks from receipt of technically & commercially clear Purchase Order.
5. Warranty & Support: 12 months comprehensive warranty from date of commissioning or 18 months from supply date.
6. Legal Jurisdiction: All commercial transactions and disputes subject to Bengaluru, Karnataka jurisdiction only.`}
          </div>
        </div>

        <!-- Bank Remittance Details -->
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #1e293b; margin-bottom: 18px;">
          <strong style="color: #0f172a;">COMPANY BANK REMITTANCE DETAILS (RTGS / NEFT):</strong>
          <div style="margin-top: 3px; color: #475569;">
            Beneficiary: <strong>${TEST_COMPANY_INFO.bankDetails.accountName}</strong> &bull; Bank: <strong>${TEST_COMPANY_INFO.bankDetails.bankName}</strong>
          </div>
          <div style="margin-top: 2px;">
            A/C No: <strong style="font-family: monospace; color: #0f172a;">${TEST_COMPANY_INFO.bankDetails.accountNumber}</strong> &bull; 
            IFSC: <strong style="font-family: monospace; color: #0f172a;">${TEST_COMPANY_INFO.bankDetails.ifscCode}</strong> &bull; 
            Branch: ${TEST_COMPANY_INFO.bankDetails.branch} (${TEST_COMPANY_INFO.bankDetails.accountType})
          </div>
        </div>

        <!-- Dual Signature Blocks -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
          <tr>
            <td style="width: 50%; text-align: center; padding: 10px 20px;">
              <div style="height: 40px;"></div>
              <div style="border-top: 1px solid #0f172a; padding-top: 6px; font-size: 12px; font-weight: bold; color: #0f172a;">
                Customer Acceptance (Sign & Official Seal)
              </div>
              <div style="font-size: 10px; color: #64748b;">
                ${custName}
              </div>
            </td>
            <td style="width: 50%; text-align: center; padding: 10px 20px;">
              <div style="height: 40px; line-height: 40px; color: #10b981; font-weight: bold; font-size: 12px;">
                ${quote.salesRepresentative || 'Authorized Signatory'}
              </div>
              <div style="border-top: 1px solid #0f172a; padding-top: 6px; font-size: 12px; font-weight: bold; color: #0f172a;">
                For ${TEST_COMPANY_INFO.name}
              </div>
              <div style="font-size: 10px; color: #64748b;">
                Authorized Commercial Signatory
              </div>
            </td>
          </tr>
        </table>

        <!-- Corporate Disclaimer -->
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 10px; color: #94a3b8; text-align: center;">
          ${TEST_COMPANY_INFO.name} &bull; CIN: ${TEST_COMPANY_INFO.cin} &bull; Computer Generated Official Commercial Quotation Document
        </div>

      </div>

    </div>

  </div>

</body>
</html>
  `;
};

// Verify Gmail SMTP credentials with Google's servers
export const verifySmtpCredentials = async (user = 'iqratareq@gmail.com', pass = '') => {
  const cleanUser = (user || process.env.SMTP_USER || 'iqratareq@gmail.com').trim();
  const cleanPass = (pass || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');

  if (!cleanPass) {
    return { valid: false, message: 'Google App Password is missing.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass
      }
    });

    await transporter.verify();
    return { valid: true, user: cleanUser, message: 'Gmail SMTP connection verified successfully.' };
  } catch (err) {
    return { valid: false, user: cleanUser, message: err.message };
  }
};

// Send quotation report via email using nodemailer
export const sendQuotationEmail = async ({
  quote,
  recipientEmail,
  senderEmail = 'iqratareq@gmail.com',
  smtpPass = null,
  clientDetails = {},
  customNote = ''
}) => {
  const fromAddress = senderEmail || process.env.SMTP_FROM_EMAIL || 'iqratareq@gmail.com';
  const targetEmail = (recipientEmail || clientDetails.email || '').trim();
  const activeSmtpPass = (smtpPass || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
  const activeSmtpUser = (process.env.SMTP_USER || fromAddress).trim();

  if (!targetEmail) {
    return {
      success: false,
      isLive: false,
      error: 'NO_RECIPIENT',
      message: 'Client recipient email address is required.'
    };
  }

  // If no SMTP_PASS is configured, notify caller explicitly rather than silently simulating
  if (!activeSmtpPass) {
    console.warn(`[Quotation Email] Missing SMTP_PASS for ${activeSmtpUser}. Google App Password is required.`);
    return {
      success: false,
      isLive: false,
      requiresAppPassword: true,
      from: fromAddress,
      to: targetEmail,
      message: `Google App Password (16 characters) is required for "${activeSmtpUser}" to deliver real emails to client inboxes.`
    };
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: activeSmtpUser,
      pass: activeSmtpPass
    }
  });

  const htmlContent = generateQuotationHtmlEmail(quote, clientDetails, customNote);

  const mailOptions = {
    from: `"TEST COMPANY INDUSTRIAL SYSTEMS PVT. LTD." <${fromAddress}>`,
    replyTo: fromAddress,
    to: targetEmail,
    subject: `Commercial Quotation & Proposal ${quote.quotationNumber} (${quote.revision || 'Rev 0'}) - TEST COMPANY INDUSTRIAL SYSTEMS PVT. LTD.`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Quotation Email LIVE SUCCESS] Dispatched to ${targetEmail} from ${fromAddress}. MessageId: ${info.messageId}`);
    return {
      success: true,
      isLive: true,
      from: fromAddress,
      to: targetEmail,
      messageId: info.messageId,
      quotationNumber: quote.quotationNumber
    };
  } catch (err) {
    console.error(`[Quotation Email SMTP ERROR]: ${err.message}`);
    return {
      success: false,
      isLive: false,
      error: err.message,
      from: fromAddress,
      to: targetEmail,
      message: `Google SMTP Error: ${err.message}. Please check that the 16-character App Password for ${activeSmtpUser} is correct.`
    };
  }
};

