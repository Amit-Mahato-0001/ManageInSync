# Updates

## 2026-06-13

- Added two new memory boxes – one to store the real image web addresses (imageUrls), another to know which images are still loading (loadingImages).

- Automatically fetch image URLs when file list loads – As soon as the page shows your files, it secretly calls the server to get the real image link for every picture file.

- Show the real image right away – Instead of a placeholder, the card now displays either a loading spinner (while fetching) or the actual image (once ready). No more clicking required.

- Clean up on delete – When you delete an image file, its stored URL is removed from memory so it doesn't cause problems.