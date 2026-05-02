export async function createUploadPlaceholder(req, res) {
  const { fileName, fileType, context } = req.body;

  res.status(501).json({
    message: 'Upload provider is not connected yet',
    providerStatus: 'PENDING_CONFIGURATION',
    recommendedProvider: 'Supabase Storage',
    received: { fileName, fileType, context },
    nextStep: 'Connect Supabase Storage, Cloudinary, or S3 and return a stored file URL.'
  });
}
