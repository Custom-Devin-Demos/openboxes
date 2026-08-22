// Reads the server-provided error payload injected into the React host page
// (window.ERROR_PAGE is a base64-encoded JSON string set from the
// errorPageBase64 request attribute by ErrorsController).
const getErrorPage = () => {
  const encoded = window.ERROR_PAGE;
  if (!encoded) {
    return null;
  }
  try {
    const binary = window.atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  } catch (e) {
    return null;
  }
};

export default getErrorPage;
