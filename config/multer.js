import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'profilePic') {
      uploadPath = path.join('uploads', 'profile-pics');
    } else if (file.fieldname === 'serviceImage') {
      uploadPath = path.join('uploads', 'service-images');
    } else if (file.fieldname === 'nid' || file.fieldname === 'license' || file.fieldname === 'addressprof') {
      uploadPath = path.join('uploads', 'documents');
    } else if (file.fieldname === 'categoryImage') {
      uploadPath = path.join('uploads', 'category-images');
    } else {
      cb(new Error('Invalid fieldname'), false);
      return;
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    let filenamePrefix;
    if (file.fieldname === 'profilePic') {
      filenamePrefix = 'profile-';
    } else if (file.fieldname === 'serviceImage') {
      filenamePrefix = 'service-';
    } else if (file.fieldname === 'nid' || file.fieldname === 'license' || file.fieldname === 'addressprof') {
      filenamePrefix = 'document-';
    } else if (file.fieldname === 'categoryImage') {
      filenamePrefix = 'category-';
    } else {
      filenamePrefix = ''; // Default or handle error
    }
    cb(null, filenamePrefix + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedPdfTypes = ['application/pdf'];

  if (file.fieldname === 'profilePic' || file.fieldname === 'serviceImage' || file.fieldname === 'categoryImage') {
    allowedImageTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPEG/PNG/WEBP images allowed!'), false);
  } else if (file.fieldname === 'nid' || file.fieldname === 'license' || file.fieldname === 'addressprof') {
    (allowedImageTypes.includes(file.mimetype) || allowedPdfTypes.includes(file.mimetype))
      ? cb(null, true)
      : cb(new Error('Only JPEG/PNG/WEBP images or PDF files allowed for documents!'), false);
  } else {
    cb(new Error('Invalid fieldname'), false);
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});