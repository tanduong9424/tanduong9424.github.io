const fullscreenImages = document.querySelectorAll('img[data-fullscreen-image]');

if (fullscreenImages.length > 0) {
  const isVietnamese = document.documentElement.lang === 'vi';
  const lightbox = document.createElement('dialog');
  const lightboxImage = document.createElement('img');
  const closeButton = document.createElement('button');

  lightbox.className = 'image-lightbox';
  lightbox.setAttribute('aria-label', isVietnamese ? 'Ảnh toàn màn hình' : 'Full-screen image');
  closeButton.type = 'button';
  closeButton.className = 'image-lightbox-close';
  closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
  closeButton.setAttribute('aria-label', isVietnamese ? 'Đóng ảnh' : 'Close image');
  lightbox.append(closeButton, lightboxImage);
  document.body.append(lightbox);

  const openImage = image => {
    image.focus();
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightbox.showModal();
  };

  fullscreenImages.forEach(image => {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute(
      'aria-label',
      isVietnamese ? `Mở ảnh toàn màn hình: ${image.alt}` : `Open image full screen: ${image.alt}`
    );
    image.addEventListener('click', () => openImage(image));
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openImage(image);
      }
    });
  });

  closeButton.addEventListener('click', () => lightbox.close());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox.open) lightbox.close();
  });
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
}
