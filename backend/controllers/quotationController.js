import fs from 'fs';
import path from 'path';
import Quotation from '../models/Quotation.js';
import Opportunity from '../models/Opportunity.js';
import Employee from '../models/Employee.js';
import Customer from '../models/Customer.js';
import ContactPerson from '../models/ContactPerson.js';
import { sendQuotationEmail, verifySmtpCredentials } from '../services/quotationEmailService.js';

// Helper to persist SMTP_PASS into backend/.env file
const persistSmtpPasswordToEnv = (password) => {
  const clean = String(password || '').trim().replace(/\s+/g, '');
  if (!clean) return;
  process.env.SMTP_PASS = clean;
  process.env.SMTP_USER = 'iqratareq@gmail.com';
  process.env.SMTP_FROM_EMAIL = 'iqratareq@gmail.com';

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('SMTP_PASS=')) {
        content = content.replace(/SMTP_PASS=.*/g, `SMTP_PASS=${clean}`);
      } else {
        content += `\nSMTP_PASS=${clean}\n`;
      }
      if (!content.includes('SMTP_USER=')) {
        content += `SMTP_USER=iqratareq@gmail.com\n`;
      }
      if (!content.includes('SMTP_FROM_EMAIL=')) {
        content += `SMTP_FROM_EMAIL=iqratareq@gmail.com\n`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
      console.log('[SMTP Config] Saved SMTP_PASS to .env');
    }
  } catch (err) {
    console.warn('[SMTP Config Warning] Could not write to .env:', err.message);
  }
};

// Helper to resolve client contact information and email from database
export const resolveClientDetails = async (quote) => {
  let email = (quote.clientEmail || '').trim();
  let address = '';
  let phone = '';
  let designation = '';
  let gstin = '';
  let contactPersonName = quote.contactPerson || '';
  let orgName = quote.customerClient || '';

  // 1. Check ContactPerson model
  if (quote.contactPerson) {
    try {
      const cp = await ContactPerson.findOne({
        name: new RegExp(`^${quote.contactPerson.trim()}$`, 'i'),
        ...(quote.customerClient ? { customerOrganizationName: new RegExp(`^${quote.customerClient.trim()}$`, 'i') } : {})
      });
      if (cp) {
        if (!email && cp.email) email = cp.email.trim();
        if (cp.mobileNumber) phone = cp.mobileNumber;
        if (cp.designation) designation = cp.designation;
      }
    } catch (e) {
      console.warn('Error fetching ContactPerson:', e.message);
    }
  }

  // 2. Check Customer model
  if (quote.customerClient) {
    try {
      const cust = await Customer.findOne({
        organizationName: new RegExp(`^${quote.customerClient.trim()}$`, 'i')
      });
      if (cust) {
        if (!email && cust.email) email = cust.email.trim();
        if (cust.fullAddress) {
          address = `${cust.fullAddress}, ${cust.city || ''}, ${cust.state || ''}`.replace(/^, |, $/g, '').trim();
        } else if (cust.city || cust.state) {
          address = `${cust.city || ''}, ${cust.state || ''}`.trim();
        }
        if (!contactPersonName && cust.primaryContactPerson) contactPersonName = cust.primaryContactPerson;
      }
    } catch (e) {
      console.warn('Error fetching Customer:', e.message);
    }
  }

  // 3. Fallback: check any Customer matching by primary contact person
  if (!email && quote.contactPerson) {
    try {
      const cust = await Customer.findOne({
        primaryContactPerson: new RegExp(`^${quote.contactPerson.trim()}$`, 'i')
      });
      if (cust && cust.email) email = cust.email.trim();
    } catch (e) {
      // ignore
    }
  }

  return {
    customerName: orgName || 'Valued Customer',
    contactPerson: contactPersonName || 'Authorized Signatory',
    designation: designation || 'Procurement / Engineering Lead',
    address: address || 'Industrial Area, Bengaluru, Karnataka, India',
    gstin: gstin || '29AAACD9988E1Z4',
    phone: phone || '+91 98450 12345',
    email: email || 'client@customer.com'
  };
};

// GET: All Quotations with Search, Filter & Stats
export const getQuotations = async (req, res) => {
  try {
    const { status, opportunityId, search } = req.query;
    const query = {};

    if (status && status !== 'ALL' && status !== 'All Statuses') {
      query.status = status;
    }

    if (opportunityId) {
      query.opportunityId = opportunityId;
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { quotationNumber: reg },
        { opportunityName: reg },
        { opportunityCode: reg },
        { customerClient: reg },
        { contactPerson: reg },
        { salesRepresentative: reg },
        { revision: reg }
      ];
    }

    const quotations = await Quotation.find(query).sort({ createdAt: -1 });

    // Quotation Analytics & Stats
    const allQuotes = await Quotation.find();
    let totalGrossValue = 0;
    let totalGrandTotal = 0;
    let wonOrdersValue = 0;
    let wonCount = 0;
    let sentCount = 0;
    let draftCount = 0;
    let rejectedCount = 0;
    let totalDiscountSum = 0;

    allQuotes.forEach(q => {
      const gTotal = Number(q.grandTotal) || 0;
      totalGrossValue += (Number(q.grossSubtotal) || 0);
      totalGrandTotal += gTotal;
      totalDiscountSum += (Number(q.discountPercent) || 0);

      if (q.status === 'ACCEPTED (ORDER WON)') {
        wonOrdersValue += gTotal;
        wonCount++;
      } else if (q.status === 'SENT TO CLIENT') {
        sentCount++;
      } else if (q.status === 'DRAFT') {
        draftCount++;
      } else if (q.status === 'REJECTED') {
        rejectedCount++;
      }
    });

    const stats = {
      totalQuotesCount: allQuotes.length,
      totalGrossValue,
      totalGrandTotal,
      wonOrdersValue,
      wonCount,
      sentCount,
      draftCount,
      rejectedCount,
      avgDiscount: allQuotes.length > 0 ? (totalDiscountSum / allQuotes.length).toFixed(1) : 0,
      winRate: allQuotes.length > 0 ? Math.round((wonCount / allQuotes.length) * 100) : 0
    };

    res.json({
      success: true,
      count: quotations.length,
      quotations,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Single Quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Create New Quotation (Rev 0)
export const createQuotation = async (req, res) => {
  try {
    const data = req.body;

    // Check if linked Opportunity exists to auto-populate if missing
    let opp = null;
    if (data.opportunityId) {
      opp = await Opportunity.findById(data.opportunityId);
    } else if (data.opportunityCode) {
      opp = await Opportunity.findOne({ opportunityCode: data.opportunityCode });
    }

    const opportunityCode = opp ? opp.opportunityCode : (data.opportunityCode || 'OPP-GEN');
    const opportunityName = data.opportunityName || (opp ? opp.opportunityName : 'Custom Machinery Proposal');
    const customerClient = data.customerClient || (opp ? opp.customerClient : '');
    const contactPerson = data.contactPerson || (opp ? opp.contactPerson : '');
    const salesRepresentative = data.salesRepresentative || (opp ? opp.assignedSalesperson : '');

    // Format line items
    const lineItems = (data.lineItems || []).map(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      return {
        productId: item.productId || '',
        productCode: item.productCode || '',
        productName: item.productName || 'Machine Model',
        modelNumber: item.modelNumber || '',
        category: item.category || '',
        principal: item.principal || (opp ? opp.principalBrand : ''),
        unitPrice: price,
        quantity: qty,
        totalPrice: qty * price,
        specifications: item.specifications || '',
        notes: item.notes || ''
      };
    });

    const revision = data.revision || 'Rev 0';
    const oppClean = opportunityCode.replace(/[^a-zA-Z0-9]/g, '');
    const totalExisting = await Quotation.countDocuments();
    const quotationNumber = data.quotationNumber || `QTN-${oppClean}-R0-${totalExisting + 1001}`;

    // Resolve client email if not explicitly provided
    let clientEmail = (data.clientEmail || '').trim();
    if (!clientEmail) {
      const resolved = await resolveClientDetails({ customerClient, contactPerson });
      if (resolved.email && resolved.email !== 'client@customer.com') {
        clientEmail = resolved.email;
      }
    }

    const newQuotation = new Quotation({
      ...data,
      quotationNumber,
      revision,
      opportunityId: opp ? opp._id : data.opportunityId,
      opportunityCode,
      opportunityName,
      customerClient,
      contactPerson,
      clientEmail,
      salesRepresentative,
      lineItems,
      discountPercent: Number(data.discountPercent) || 0,
      validityDays: Number(data.validityDays) || 30,
      status: data.status || 'DRAFT'
    });

    const saved = await newQuotation.save();

    // If initial status is SENT TO CLIENT, send quotation report email from iqratareq@gmail.com
    if (saved.status === 'SENT TO CLIENT') {
      try {
        const clientDetails = await resolveClientDetails(saved);
        const targetEmail = (clientEmail || clientDetails.email || '').trim();
        const emailResult = await sendQuotationEmail({
          quote: saved,
          recipientEmail: targetEmail,
          senderEmail: 'iqratareq@gmail.com',
          clientDetails,
          customNote: data.customNote || ''
        });
        saved.emailSentAt = new Date();
        saved.emailSentTo = targetEmail;
        saved.emailSentFrom = 'iqratareq@gmail.com';
        saved.emailStatus = emailResult?.success ? 'SENT' : 'FAILED';
        await saved.save();
      } catch (emErr) {
        console.warn('[Quotation Email Error on Create]:', emErr.message);
      }
    }

    // Link quotation to Opportunity
    if (opp) {
      if (!opp.quotations) opp.quotations = [];
      opp.quotations.unshift({
        quoteNumber: saved.quotationNumber,
        revision: saved.revision,
        quoteDate: saved.quotationDate,
        subtotal: saved.grossSubtotal,
        gstRate: saved.gstRate,
        gstAmount: saved.gstAmount,
        grandTotal: saved.grandTotal,
        status: saved.status === 'ACCEPTED (ORDER WON)' ? 'Accepted' : (saved.status === 'SENT TO CLIENT' ? 'Official Sent' : 'Draft'),
        items: saved.lineItems.map(li => ({
          productName: li.productName,
          unitPrice: li.unitPrice,
          quantity: li.quantity,
          totalPrice: li.totalPrice
        }))
      });

      // Update opportunity stage if accepted or proposal sent
      if (saved.status === 'ACCEPTED (ORDER WON)') {
        opp.stage = 'Won Deals';
      } else if (saved.status === 'SENT TO CLIENT' && (opp.stage === 'New Leads' || opp.stage === 'Qualified')) {
        opp.stage = 'Proposal Sent';
      }
      await opp.save();
    }

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully!',
      quotation: saved
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT: Update Quotation
export const updateQuotation = async (req, res) => {
  try {
    const quote = await Quotation.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const data = req.body;

    if (data.lineItems) {
      quote.lineItems = data.lineItems.map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        return {
          productId: item.productId || '',
          productCode: item.productCode || '',
          productName: item.productName || 'Machine Model',
          modelNumber: item.modelNumber || '',
          category: item.category || '',
          principal: item.principal || quote.principal || '',
          unitPrice: price,
          quantity: qty,
          totalPrice: qty * price,
          specifications: item.specifications || '',
          notes: item.notes || ''
        };
      });
    }

    if (data.opportunityName !== undefined) quote.opportunityName = data.opportunityName;
    if (data.customerClient !== undefined) quote.customerClient = data.customerClient;
    if (data.contactPerson !== undefined) quote.contactPerson = data.contactPerson;
    if (data.clientEmail !== undefined) quote.clientEmail = data.clientEmail;
    if (data.validityDays !== undefined) quote.validityDays = Number(data.validityDays) || 30;
    
    const oldStatus = quote.status;
    if (data.status !== undefined) quote.status = data.status;
    if (data.salesRepresentative !== undefined) quote.salesRepresentative = data.salesRepresentative;
    if (data.discountPercent !== undefined) quote.discountPercent = Number(data.discountPercent) || 0;
    if (data.commercialTerms !== undefined) quote.commercialTerms = data.commercialTerms;
    if (data.revisionNotes !== undefined) quote.revisionNotes = data.revisionNotes;

    // If status changed to SENT TO CLIENT in update, send email report
    if (data.status === 'SENT TO CLIENT' && oldStatus !== 'SENT TO CLIENT') {
      try {
        const clientDetails = await resolveClientDetails(quote);
        const targetEmail = (data.recipientEmail || quote.clientEmail || clientDetails.email || '').trim();
        if (targetEmail) {
          quote.clientEmail = targetEmail;
          clientDetails.email = targetEmail;
        }
        const emailResult = await sendQuotationEmail({
          quote,
          recipientEmail: targetEmail,
          senderEmail: 'iqratareq@gmail.com',
          clientDetails,
          customNote: data.customNote || ''
        });
        quote.emailSentAt = new Date();
        quote.emailSentTo = targetEmail;
        quote.emailSentFrom = 'iqratareq@gmail.com';
        quote.emailStatus = emailResult?.success ? 'SENT' : 'FAILED';
      } catch (emErr) {
        console.warn('[Quotation Email Error on Update]:', emErr.message);
      }
    }

    const saved = await quote.save();

    // Sync to Opportunity if linked
    if (quote.opportunityId) {
      const opp = await Opportunity.findById(quote.opportunityId);
      if (opp) {
        if (saved.status === 'ACCEPTED (ORDER WON)') {
          opp.stage = 'Won Deals';
        } else if (saved.status === 'SENT TO CLIENT' && (opp.stage === 'New Leads' || opp.stage === 'Qualified')) {
          opp.stage = 'Proposal Sent';
        } else if (saved.status === 'REJECTED') {
          opp.stage = 'Lost Deals';
        }
        await opp.save();
      }
    }

    res.json({
      success: true,
      message: 'Quotation updated successfully!',
      quotation: saved
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST: Create New Quotation Revision (Rev 1, Rev 2, etc.)
export const createRevision = async (req, res) => {
  try {
    const originalQuote = await Quotation.findById(req.params.id);
    if (!originalQuote) {
      return res.status(404).json({ success: false, message: 'Original quotation not found' });
    }

    const { revisionNotes, discountPercent, lineItems, validityDays } = req.body;

    // Calculate next revision
    const existingRevsCount = await Quotation.countDocuments({
      $or: [
        { _id: originalQuote._id },
        { parentQuotationId: originalQuote._id },
        { parentQuotationId: originalQuote.parentQuotationId || originalQuote._id }
      ]
    });

    const nextRevNum = existingRevsCount;
    const nextRevStr = `Rev ${nextRevNum}`;
    const oppClean = (originalQuote.opportunityCode || 'DEAL').replace(/[^a-zA-Z0-9]/g, '');
    const newQuoteNum = `QTN-${oppClean}-R${nextRevNum}-${Date.now().toString().slice(-4)}`;

    // Mark previous quote as not latest
    originalQuote.isLatestRevision = false;
    await originalQuote.save();

    const revisedItems = (lineItems || originalQuote.lineItems).map(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      return {
        productId: item.productId || '',
        productCode: item.productCode || '',
        productName: item.productName || 'Machine Model',
        modelNumber: item.modelNumber || '',
        category: item.category || '',
        principal: item.principal || '',
        unitPrice: price,
        quantity: qty,
        totalPrice: qty * price,
        specifications: item.specifications || '',
        notes: item.notes || ''
      };
    });

    const newQuotation = new Quotation({
      quotationNumber: newQuoteNum,
      revision: nextRevStr,
      quotationDate: new Date().toISOString().split('T')[0],
      opportunityId: originalQuote.opportunityId,
      opportunityCode: originalQuote.opportunityCode,
      opportunityName: originalQuote.opportunityName,
      customerClient: originalQuote.customerClient,
      contactPerson: originalQuote.contactPerson,
      validityDays: validityDays !== undefined ? Number(validityDays) : originalQuote.validityDays,
      status: 'DRAFT',
      salesRepresentative: originalQuote.salesRepresentative,
      lineItems: revisedItems,
      commercialTerms: originalQuote.commercialTerms,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : originalQuote.discountPercent,
      revisionNotes: revisionNotes || `Revision created from ${originalQuote.revision}`,
      isLatestRevision: true,
      parentQuotationId: originalQuote.parentQuotationId || originalQuote._id
    });

    const saved = await newQuotation.save();

    // Also sync to Opportunity's revision history
    if (originalQuote.opportunityId) {
      const opp = await Opportunity.findById(originalQuote.opportunityId);
      if (opp) {
        if (!opp.quotations) opp.quotations = [];
        opp.quotations.unshift({
          quoteNumber: saved.quotationNumber,
          revision: saved.revision,
          quoteDate: saved.quotationDate,
          subtotal: saved.grossSubtotal,
          gstRate: saved.gstRate,
          gstAmount: saved.gstAmount,
          grandTotal: saved.grandTotal,
          status: 'Draft',
          notes: saved.revisionNotes
        });
        await opp.save();
      }
    }

    res.status(201).json({
      success: true,
      message: `Quotation ${nextRevStr} generated successfully!`,
      quotation: saved
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH: Quick Status Update (DRAFT, SENT TO CLIENT, ACCEPTED, REJECTED)
// When status changes to SENT TO CLIENT: generates report & emails to client using sender iqratareq@gmail.com
export const updateQuotationStatus = async (req, res) => {
  try {
    const { status, recipientEmail, customNote, appPassword } = req.body;
    const allowed = ['DRAFT', 'SENT TO CLIENT', 'ACCEPTED (ORDER WON)', 'REJECTED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const quote = await Quotation.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    quote.status = status;
    let emailResult = null;

    // Automatic dispatch when status is changed to SENT TO CLIENT
    if (status === 'SENT TO CLIENT') {
      const clientDetails = await resolveClientDetails(quote);
      const targetEmail = (recipientEmail || quote.clientEmail || clientDetails.email || '').trim();

      if (targetEmail) {
        quote.clientEmail = targetEmail;
        clientDetails.email = targetEmail;
      }

      if (appPassword) {
        persistSmtpPasswordToEnv(appPassword);
      }

      emailResult = await sendQuotationEmail({
        quote,
        recipientEmail: targetEmail,
        senderEmail: 'iqratareq@gmail.com',
        smtpPass: appPassword || process.env.SMTP_PASS,
        clientDetails,
        customNote: customNote || ''
      });

      quote.emailSentAt = new Date();
      quote.emailSentTo = targetEmail || clientDetails.email;
      quote.emailSentFrom = 'iqratareq@gmail.com';
      quote.emailStatus = emailResult?.isLive ? 'SENT' : 'FAILED';
    }

    const saved = await quote.save();

    // Auto-sync linked Opportunity stage
    if (quote.opportunityId) {
      const opp = await Opportunity.findById(quote.opportunityId);
      if (opp) {
        if (status === 'ACCEPTED (ORDER WON)') {
          opp.stage = 'Won Deals';
        } else if (status === 'SENT TO CLIENT' && (opp.stage === 'New Leads' || opp.stage === 'Qualified')) {
          opp.stage = 'Proposal Sent';
        } else if (status === 'REJECTED') {
          opp.stage = 'Lost Deals';
        }
        await opp.save();
      }
    }

    let message;
    if (status === 'SENT TO CLIENT') {
      if (emailResult?.isLive) {
        message = `Official quotation report delivered live to ${quote.emailSentTo} via iqratareq@gmail.com!`;
      } else {
        message = emailResult?.message || `Status updated to SENT TO CLIENT. Note: Gmail App Password required to deliver to real inboxes.`;
      }
    } else {
      message = `Quotation status updated to "${status}"`;
    }

    res.json({
      success: emailResult ? Boolean(emailResult.isLive) : true,
      statusUpdated: true,
      message,
      quotation: saved,
      emailResult
    });
  } catch (error) {
    console.error('Update quotation status error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST: Explicitly Send Quotation Report Email to Client
export const sendQuotationEmailHandler = async (req, res) => {
  try {
    const quote = await Quotation.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const { recipientEmail, customNote, appPassword } = req.body;
    const clientDetails = await resolveClientDetails(quote);
    const targetEmail = (recipientEmail || quote.clientEmail || clientDetails.email || '').trim();

    if (targetEmail) {
      quote.clientEmail = targetEmail;
      clientDetails.email = targetEmail;
    }

    if (appPassword) {
      persistSmtpPasswordToEnv(appPassword);
    }

    const emailResult = await sendQuotationEmail({
      quote,
      recipientEmail: targetEmail,
      senderEmail: 'iqratareq@gmail.com',
      smtpPass: appPassword || process.env.SMTP_PASS,
      clientDetails,
      customNote: customNote || ''
    });

    quote.status = 'SENT TO CLIENT';
    quote.emailSentAt = new Date();
    quote.emailSentTo = targetEmail || clientDetails.email;
    quote.emailSentFrom = 'iqratareq@gmail.com';
    quote.emailStatus = emailResult?.isLive ? 'SENT' : 'FAILED';

    const saved = await quote.save();

    // Sync opportunity stage
    if (quote.opportunityId) {
      const opp = await Opportunity.findById(quote.opportunityId);
      if (opp && (opp.stage === 'New Leads' || opp.stage === 'Qualified')) {
        opp.stage = 'Proposal Sent';
        await opp.save();
      }
    }

    const message = emailResult?.isLive
      ? `Quotation report delivered live to ${quote.emailSentTo} from iqratareq@gmail.com!`
      : (emailResult?.message || 'Quotation updated to SENT TO CLIENT. Google App Password required for live delivery.');

    res.json({
      success: Boolean(emailResult?.isLive),
      message,
      quotation: saved,
      emailResult
    });
  } catch (error) {
    console.error('Send quotation email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Current SMTP Status
export const getSmtpStatus = async (req, res) => {
  try {
    const cleanPass = (process.env.SMTP_PASS || '').trim();
    const isConfigured = cleanPass.length > 0;
    res.json({
      success: true,
      isConfigured,
      smtpUser: 'iqratareq@gmail.com',
      fromEmail: 'iqratareq@gmail.com'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST: Save & Validate Google App Password
export const configureSmtp = async (req, res) => {
  try {
    const { appPassword } = req.body;
    const cleanPass = String(appPassword || '').trim().replace(/\s+/g, '');

    if (!cleanPass) {
      return res.status(400).json({ success: false, message: 'Please enter a 16-character Google App Password.' });
    }

    const test = await verifySmtpCredentials('iqratareq@gmail.com', cleanPass);
    if (!test.valid) {
      return res.status(400).json({
        success: false,
        message: `Gmail Connection Failed: ${test.message}. Please check that 2-Step Verification is enabled on iqratareq@gmail.com and the 16-character App Password is correct.`
      });
    }

    persistSmtpPasswordToEnv(cleanPass);

    res.json({
      success: true,
      message: 'Google App Password successfully verified with Gmail! Live email delivery is active.',
      smtpUser: 'iqratareq@gmail.com'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// DELETE: Delete Quotation
export const deleteQuotation = async (req, res) => {
  try {
    const quote = await Quotation.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({
      success: true,
      message: `Quotation ${quote.quotationNumber} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
