// This is a placeholder for the util.js file.
// In a real application, you would download this from the FFmpeg.wasm website.

export async function fetchFile(file) {
  return new Response(await file.arrayBuffer());
}

export function toBlobURL(url, type) {
  const script = `
    self.addEventListener('message', async (e) => {
      const url = e.data;
      const response = await fetch(url);
      const data = await response.blob();
      self.postMessage(URL.createObjectURL(data));
    });
  `;
  const blob = new Blob([script], { type });
  const blobUrl = URL.createObjectURL(blob);
  const worker = new Worker(blobUrl);
  worker.postMessage(url);

  return new Promise((resolve) => {
    worker.addEventListener('message', (e) => {
      resolve(e.data);
    });
  });
}
