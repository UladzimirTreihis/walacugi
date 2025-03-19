import { Router } from 'express';
import News from '../models/News.js';
import dotenv from 'dotenv';
import { checkAdminToken } from "../utils/middleware.js"

dotenv.config();
const router = Router();


// GET /api/news
router.get('/', async (req, res) => {
  try {
    console.log("Getting")
    const newsList = await News.find().sort({ createdAt: -1 });
    res.json(newsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/news (admin only)
router.post('/', checkAdminToken, async (req, res) => {
  try {
    const newNews = new News(req.body);
    const saved = await newNews.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/news/:id (admin only)
router.put('/:id', checkAdminToken, async (req, res) => {
  try {
    const updated = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/news/:id (admin only)
router.delete('/:id', checkAdminToken, async (req, res) => {
  try {
    console.log(req.params)
    const deleted = await News.findByIdAndDelete(req.params.id);
    console.log(deleted)
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
