import SiteContent from '../models/siteContent.model.js';

// Get content by title
export const getContent = async (req, res) => {
  try {
    const content = await SiteContent.findOne({ title: req.params.title });
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update content
export const updateContent = async (req, res) => {
  const { title, content } = req.body;

  try {
    let siteContent = await SiteContent.findOne({ title });

    if (siteContent) {
      // Update existing content
      siteContent.content = content;
    } else {
      // Create new content
      siteContent = new SiteContent({ title, content });
    }

    const updatedContent = await siteContent.save();
    res.json(updatedContent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};