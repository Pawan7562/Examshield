// backend/controllers/enquiryController.js
const { pool } = require('../config/database');
const emailService = require('../services/emailService');

/**
 * Public Endpoint: Capture Institutional Demo & Pricing Inquiry
 * POST /api/public/enquiries or /api/enquiries
 */
exports.createEnquiry = async (req, res) => {
  try {
    const {
      institution_name,
      institution_type = 'College',
      contact_person,
      email,
      phone,
      student_count,
      exam_frequency,
      requirements,
      source_page = '/'
    } = req.body;

    // Validation
    if (!institution_name || !contact_person || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Institution name, contact person, email, and phone number are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid institutional email address.'
      });
    }

    // Insert into database
    const insertQuery = `
      INSERT INTO institutional_enquiries (
        institution_name,
        institution_type,
        contact_person,
        email,
        phone,
        student_count,
        exam_frequency,
        requirements,
        source_page,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', NOW(), NOW())
      RETURNING *
    `;

    const values = [
      institution_name.trim(),
      institution_type.trim(),
      contact_person.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      student_count ? student_count.trim() : null,
      exam_frequency ? exam_frequency.trim() : null,
      requirements ? requirements.trim() : null,
      source_page ? source_page.trim() : '/'
    ];

    const result = await pool.query(insertQuery, values);
    const newEnquiry = result.rows[0];

    // Attempt to send confirmation email asynchronously
    try {
      if (emailService && typeof emailService.sendCustomEmail === 'function') {
        const subject = `Demo Request Received — Nexify Examina Examination Platform`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background: #071511; padding: 16px; border-radius: 6px; text-align: center;">
              <h2 style="color: #10b981; margin: 0;">Nexify Examina</h2>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Enterprise Online Examination & AI Proctoring Platform</p>
            </div>
            <div style="padding: 20px 0; color: #1e293b; line-height: 1.6;">
              <p>Dear <strong>${contact_person}</strong>,</p>
              <p>Thank you for expressing interest in <strong>Nexify Examina</strong> for <strong>${institution_name}</strong>.</p>
              <p>We have received your institutional enquiry and demo request. Our higher-education solutions team will review your requirements for <strong>${student_count || 'your student body'}</strong> and reach out to you within 24 business hours to schedule a live walkthrough and campus pilot.</p>
              <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 14px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">Summary of Your Request:</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                  <li><strong>Institution:</strong> ${institution_name} (${institution_type})</li>
                  <li><strong>Contact Phone:</strong> ${phone}</li>
                  <li><strong>Expected Student Count:</strong> ${student_count || 'Flexible'}</li>
                  <li><strong>Examination Type:</strong> ${requirements || 'Objective & Coding Assessments'}</li>
                </ul>
              </div>
              <p>If you need urgent assistance, you can also reach our academic support desk directly at <a href="mailto:support@nexifyforge.in" style="color: #0284c7;">support@nexifyforge.in</a>.</p>
              <p style="margin-top: 24px;">Warm regards,<br><strong>Institutional Partnerships Team</strong><br>Nexify Examina by Nexify Forge</p>
            </div>
          </div>
        `;
        emailService.sendCustomEmail(email.trim(), subject, html).catch(err => {
          console.warn('[Enquiry] Confirmation email warning:', err.message);
        });
      }
    } catch (emailErr) {
      console.warn('[Enquiry] Email dispatch failed silently:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your institutional demo request has been received. Our team will contact you shortly.',
      enquiryId: newEnquiry.id
    });
  } catch (error) {
    console.error('[Enquiry] Create enquiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process inquiry. Please try again or contact support@nexifyforge.in.',
      error: error.message
    });
  }
};

/**
 * Super Admin Endpoint: Get All Enquiries
 * GET /api/super-admin/enquiries
 */
exports.getAllEnquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT * FROM institutional_enquiries WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (institution_name ILIKE $${params.length} OR contact_person ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM institutional_enquiries WHERE 1=1`;
    const countParams = [];
    if (status && status !== 'all') {
      countParams.push(status);
      countQuery += ` AND status = $${countParams.length}`;
    }
    if (search) {
      countParams.push(`%${search.trim()}%`);
      countQuery += ` AND (institution_name ILIKE $${countParams.length} OR contact_person ILIKE $${countParams.length} OR email ILIKE $${countParams.length} OR phone ILIKE $${countParams.length})`;
    }
    const countRes = await pool.query(countQuery, countParams);
    const total = parseInt(countRes.rows[0].count);

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Enquiry] Get all enquiries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve enquiries',
      error: error.message
    });
  }
};

/**
 * Super Admin Endpoint: Update Enquiry Status
 * PATCH /api/super-admin/enquiries/:id/status
 */
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = [
      'new',
      'contacted',
      'demo_scheduled',
      'demo_completed',
      'pilot_started',
      'converted',
      'not_interested'
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    let updateQuery = `UPDATE institutional_enquiries SET updated_at = NOW()`;
    const params = [id];

    if (status) {
      params.push(status);
      updateQuery += `, status = $${params.length}`;
    }

    if (notes !== undefined) {
      params.push(notes);
      updateQuery += `, notes = $${params.length}`;
    }

    updateQuery += ` WHERE id = $1 RETURNING *`;

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    return res.json({
      success: true,
      message: 'Enquiry status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Enquiry] Update enquiry status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update enquiry status',
      error: error.message
    });
  }
};

/**
 * Super Admin Endpoint: Delete Enquiry
 * DELETE /api/super-admin/enquiries/:id
 */
exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM institutional_enquiries WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    return res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('[Enquiry] Delete enquiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete enquiry',
      error: error.message
    });
  }
};
