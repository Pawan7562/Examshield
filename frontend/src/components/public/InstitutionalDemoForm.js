import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, Building2, User, Mail, Phone, Users, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function InstitutionalDemoForm({ sourcePage = '/', title = 'Request Institutional Demo & Proposal', subtitle = 'Get a live personalized walkthrough and 14-day campus pilot trial.' }) {
  const [formData, setFormData] = useState({
    institution_name: '',
    institution_type: 'College',
    contact_person: '',
    email: '',
    phone: '',
    student_count: '500 - 2,000 Students',
    exam_frequency: 'Semester & Internal Exams',
    requirements: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.institution_name.trim() || !formData.contact_person.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMsg('Please fill in all required fields (Institution name, your name, email, and phone).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        source_page: sourcePage
      };

      const res = await axios.post('/api/public/enquiries', payload);
      if (res.data?.success) {
        setSubmitted(true);
        toast.success('Inquiry submitted! Our academic specialist will contact you.');
      } else {
        throw new Error(res.data?.message || 'Failed to submit inquiry');
      }
    } catch (err) {
      console.error('Demo inquiry submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Unable to submit enquiry. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="demo-form-card submitted-state" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(7, 21, 17, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '36px',
        textAlign: 'center',
        color: '#f8fafc'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: '#10b981'
        }}>
          <CheckCircle2 size={36} />
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#10b981' }}>
          Demo Request Confirmed!
        </h3>
        <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '480px', margin: '0 auto 20px' }}>
          Thank you, <strong>{formData.contact_person}</strong>. We have logged your request for <strong>{formData.institution_name}</strong>. An examination specialist will reach out within 24 hours to coordinate your custom walkthrough and campus pilot setup.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#cbd5e1'
        }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Priority response queued for {formData.email}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-form-card" style={{
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(7, 21, 17, 0.95) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      position: 'relative'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '10px'
        }}>
          <ShieldCheck size={14} /> Institution Demo & Proposal
        </div>
        <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#f8fafc', margin: '0 0 6px 0' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
          {subtitle}
        </p>
      </div>

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '18px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Institution Name *
            </label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="text"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                placeholder="e.g. Chandigarh Group of Colleges"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Institution Type *
            </label>
            <select
              name="institution_type"
              value={formData.institution_type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#091319',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="College">Engineering / Degree College</option>
              <option value="University">State / Deemed / Private University</option>
              <option value="School">K-12 School (CBSE / ICSE / State)</option>
              <option value="Coaching Institute">Coaching Institute (JEE/NEET/Competitive)</option>
              <option value="Certification Board">Examination / Certification Board</option>
              <option value="Corporate">Corporate / Recruitment Academy</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Your Name & Designation *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Dr. Rajesh Sharma, Exam Controller"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Official / Institutional Email *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="dean.exams@college.edu.in"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Direct Phone / WhatsApp *
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Student Count for Testing
            </label>
            <div style={{ position: 'relative' }}>
              <Users size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <select
                name="student_count"
                value={formData.student_count}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: '#091319',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Under 200 Students">Under 200 Students</option>
                <option value="200 - 500 Students">200 - 500 Students</option>
                <option value="500 - 2,000 Students">500 - 2,000 Students (Cluster Verified)</option>
                <option value="2,000 - 10,000 Students">2,000 - 10,000 Students (Multi-Department)</option>
                <option value="10,000+ Students">10,000+ Students (University Scale)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
            Specific Examination Requirements (Optional)
          </label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. Need coding tests with Python & Java compilers for campus placements, AI webcam proctoring, and MCQ semester evaluations."
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            marginTop: '6px'
          }}
        >
          {loading ? (
            <span>Transmitting Request...</span>
          ) : (
            <>
              <span>Schedule Live Walkthrough & Free Pilot</span>
              <Send size={16} />
            </>
          )}
        </button>

        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '4px 0 0 0' }}>
          🔒 Non-disclosure protected. Instant verification with 0 installation required for students.
        </p>
      </form>
    </div>
  );
}
