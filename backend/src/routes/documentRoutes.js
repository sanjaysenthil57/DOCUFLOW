const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { Document, DocumentVersion, StudentEnrollment } = require('../models');
const { getDocumentDetails } = require('../controllers/facultyController');

router.use(protect);

// 1. Complete Document Details (metadata, versions, reviews, approvals)
router.get('/:id', getDocumentDetails);

// 2. Safe version-specific document download & stream
router.get('/:documentId/versions/:versionNumber/download', async (req, res) => {
  try {
    const { documentId, versionNumber } = req.params;

    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    // Role-based download authorization
    if (req.user.role === 'student') {
      if (!document.isPublished) {
        return res.status(403).json({ success: false, message: 'Students cannot download unapproved or pending documents.' });
      }
      const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id });
      if (!enrollment || String(enrollment.batchId) !== String(document.batchId)) {
        return res.status(403).json({ success: false, message: 'This document does not belong to your academic batch.' });
      }
    }

    const version = await DocumentVersion.findOne({
      documentId,
      versionNumber: Number(versionNumber)
    });

    if (!version || !fs.existsSync(version.filePath)) {
      return res.status(404).json({ success: false, message: 'File version not found on server' });
    }

    res.download(version.filePath, version.originalFilename);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Download latest version of a document directly
router.get('/:documentId/download', async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId).populate('currentVersionId');
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    // Role-based download authorization
    if (req.user.role === 'student' && !document.isPublished) {
      return res.status(403).json({ success: false, message: 'Students cannot download unapproved documents.' });
    }

    const version = document.currentVersionId || await DocumentVersion.findOne({ documentId }).sort({ versionNumber: -1 });
    if (!version || !fs.existsSync(version.filePath)) {
      return res.status(404).json({ success: false, message: 'File not available on disk' });
    }

    res.download(version.filePath, version.originalFilename);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper for streaming previews
const streamPreview = async (req, res, documentId, versionNumber = null) => {
  try {
    const document = await Document.findById(documentId).populate('currentVersionId');
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    if (req.user.role === 'student' && !document.isPublished) {
      return res.status(403).json({ success: false, message: 'Access denied: document is not published' });
    }

    let version;
    if (versionNumber) {
      version = await DocumentVersion.findOne({
        documentId,
        versionNumber: Number(versionNumber)
      });
    } else {
      version = document.currentVersionId || await DocumentVersion.findOne({ documentId }).sort({ versionNumber: -1 });
    }

    if (!version || !fs.existsSync(version.filePath)) {
      return res.status(404).json({ success: false, message: 'File not available on disk' });
    }

    // If text file, send content directly as JSON
    if (version.fileExtension === '.txt') {
      const text = fs.readFileSync(version.filePath, 'utf-8');
      return res.status(200).json({
        success: true,
        previewType: 'text',
        content: text,
        filename: version.originalFilename
      });
    }

    // For PDF, stream inline with proper headers so browser iframe renders natively
    if (version.fileExtension === '.pdf' || version.mimeType === 'application/pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(version.originalFilename)}"`);
      return res.sendFile(path.resolve(version.filePath));
    }

    // For other formats, stream the file
    res.sendFile(path.resolve(version.filePath));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Document Preview endpoint (returns text content or streams file)
router.get('/:documentId/preview', async (req, res) => {
  await streamPreview(req, res, req.params.documentId);
});

router.get('/:documentId/versions/:versionNumber/preview', async (req, res) => {
  await streamPreview(req, res, req.params.documentId, req.params.versionNumber);
});

module.exports = router;
