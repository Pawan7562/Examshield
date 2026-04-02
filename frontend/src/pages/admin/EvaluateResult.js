// src/pages/admin/EvaluateResult.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EvaluateResult() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Manual Evaluation — Result #{id?.slice(0,8)}</h1>
        <button onClick={() => navigate('/admin/results')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#a0aec0', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13 }}>
          ← Back to Results
        </button>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(233,69,96,0.2)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Evaluation Interface</h3>
        <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 16px' }}>
          Grade subjective and coding answers manually. For each answer, assign marks and add evaluator remarks, then save to update the result.
        </p>
        <div style={{ padding: 14, background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: '#4a5568', textAlign: 'left' }}>
          POST /api/admin/results/:id/evaluate with evaluations: [{"{"}answerId, marksObtained, remarks{"}"}]
        </div>
      </div>
    </div>
  );
}
